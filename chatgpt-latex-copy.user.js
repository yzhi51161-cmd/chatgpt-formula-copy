// ==UserScript==
// @name         ChatGPT 公式一键复制
// @namespace    chatgpt-formula-copy.share
// @version      4.0.0
// @license      MIT
// @description  单击 ChatGPT 公式即可复制规整的 LaTeX，支持智能 Markdown 分隔符和原始源码模式。
// @match        https://chatgpt.com/*
// @match        https://*.chatgpt.com/*
// @match        https://chat.openai.com/*
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const INSTALL_KEY = "__chatgptFormulaCopyInstalled";
  if (globalThis[INSTALL_KEY]) return;
  globalThis[INSTALL_KEY] = true;

  const FORMULA_SELECTOR = [
    "span.katex",
    'math[alttext]',
    '[data-math-source]',
    '[data-math]',
    '[data-latex]',
    '[data-tex]'
  ].join(",");

  const STYLE = `
    span.katex,
    [data-math-source],
    [data-math],
    [data-latex],
    [data-tex] {
      cursor: copy !important;
    }

    span.katex:hover,
    [data-math-source]:hover,
    [data-math]:hover,
    [data-latex]:hover,
    [data-tex]:hover {
      outline: 1px dashed #10a37f !important;
      outline-offset: 3px !important;
      border-radius: 3px !important;
      background: rgba(16, 163, 127, 0.09) !important;
    }

    .gpt-latex-copy-flash {
      outline: 2px solid #10a37f !important;
      outline-offset: 3px !important;
      border-radius: 3px !important;
    }

    .gpt-latex-copy-flash-error {
      outline: 2px solid #ef4444 !important;
      outline-offset: 3px !important;
      border-radius: 3px !important;
    }

    #gpt-latex-copy-toast {
      position: fixed !important;
      left: 50% !important;
      bottom: 28px !important;
      z-index: 2147483647 !important;
      transform: translateX(-50%) translateY(8px) !important;
      max-width: min(720px, calc(100vw - 32px)) !important;
      padding: 9px 13px !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 9px !important;
      background: rgba(24, 24, 27, 0.94) !important;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.26) !important;
      color: #fff !important;
      font: 13px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 120ms ease, transform 120ms ease !important;
    }

    #gpt-latex-copy-toast[data-visible="true"] {
      opacity: 1 !important;
      transform: translateX(-50%) translateY(0) !important;
    }

    #gpt-latex-copy-toast[data-error="true"] {
      background: rgba(153, 27, 27, 0.96) !important;
    }
  `;

  const COPY_FORMAT_ORDER = ["smart", "inline", "raw"];
  const COPY_FORMAT_LABELS = {
    smart: "Markdown（自动 $ / $$）",
    inline: "始终 $...$",
    raw: "仅 LaTeX"
  };

  function loadCopyFormat() {
    try {
      const stored = typeof GM_getValue === "function"
        ? GM_getValue("copyFormat", "smart")
        : "smart";
      return COPY_FORMAT_ORDER.includes(stored) ? stored : "smart";
    } catch (error) {
      return "smart";
    }
  }

  function saveCopyFormat(value) {
    try {
      if (typeof GM_setValue === "function") GM_setValue("copyFormat", value);
    } catch (error) {
      console.warn("[ChatGPT LaTeX Copy] 无法保存复制格式", error);
    }
  }
  let toastTimer = 0;
  let copyEnabled = true;
  let copyFormat = loadCopyFormat();
  let controlShadow = null;
  let lastFormulaDiagnostic = "";

  function normalizeLatex(value) {
    let latex = String(value ?? "").trim();
    if (!latex) return "";

    const wrappers = [
      [/^\\\[([\s\S]*)\\\]$/, "$1"],
      [/^\\\(([\s\S]*)\\\)$/, "$1"],
      [/^\$\$([\s\S]*)\$\$$/, "$1"],
      [/^\$([^$][\s\S]*?)\$$/, "$1"]
    ];

    for (const [pattern, replacement] of wrappers) {
      if (pattern.test(latex)) {
        latex = latex.replace(pattern, replacement).trim();
        break;
      }
    }

    return latex;
  }

  function extractLatex(element) {
    if (!(element instanceof Element)) return "";

    const annotation = element.matches('annotation[encoding="application/x-tex"]')
      ? element
      : element.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation?.textContent?.trim()) {
      return normalizeLatex(annotation.textContent);
    }

    const math = element.matches("math") ? element : element.querySelector("math");
    const altText = math?.getAttribute("alttext");
    if (altText?.trim()) return normalizeLatex(altText);

    // 2026 年 ChatGPT 前端将原始 TeX 放在 KaTeX 外层的 data-math-source。
    const attributeNames = ["data-math-source", "data-math", "data-latex", "data-tex"];
    for (const name of attributeNames) {
      const ownValue = element.getAttribute(name);
      if (ownValue?.trim()) return normalizeLatex(ownValue);

      const owner = element.closest(`[${name}]`);
      const ancestorValue = owner?.getAttribute(name);
      if (ancestorValue?.trim()) return normalizeLatex(ancestorValue);
    }

    const labelledMath = element.closest('[role="math"][aria-label]');
    const ariaLatex = labelledMath?.getAttribute("aria-label");
    if (ariaLatex?.trim()) return normalizeLatex(ariaLatex);

    return "";
  }

  function isDisplayFormula(element) {
    if (!(element instanceof Element)) return false;
    if (element.closest(".katex-display")) return true;

    const holder = element.closest(
      '[data-math-source], [data-math], [data-latex], [data-tex], [role="math"]'
    );
    if (!holder) return false;
    if (holder.style?.display === "block") return true;
    try {
      return getComputedStyle(holder).display === "block";
    } catch (error) {
      return false;
    }
  }

  function compactLatexSource(latex) {
    const normalized = normalizeLatex(latex).replace(/\r\n?/g, "\n");
    if (!normalized) return "";

    // 未转义的 % 会注释该行后续内容，遇到它时保留原始换行。
    if (/(^|[^\\])%/.test(normalized)) return normalized.trim();

    return normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ");
  }
  function formatLatexForCopy(latex, element, mode = copyFormat) {
    const compact = compactLatexSource(latex);
    if (!compact || mode === "raw") return compact;
    if (mode === "inline") return `$${compact}$`;
    return isDisplayFormula(element)
      ? `$$${compact}$$`
      : `$${compact}$`;
  }
  function findFormulaTarget(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    for (const node of path) {
      if (node instanceof Element && node.matches(FORMULA_SELECTOR)) return node;
    }

    return event.target instanceof Element
      ? event.target.closest(FORMULA_SELECTOR)
      : null;
  }

  function copyWithExecCommand(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText = [
      "position:fixed",
      "left:-9999px",
      "top:0",
      "width:1px",
      "height:1px",
      "opacity:0"
    ].join(";");
    (document.body || document.documentElement).appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      textarea.remove();
    }
    return copied;
  }

  async function copyLatex(text) {
    // Tampermonkey / Violentmonkey 的扩展级 API 不受 ChatGPT 页面
    // Permissions Policy、document focus 或 navigator.clipboard 状态影响。
    if (typeof GM_setClipboard === "function") {
      GM_setClipboard(text, "text");
      return "GM_setClipboard";
    }

    // 兼容未通过 Userscript Manager 运行时的场景。
    if (copyWithExecCommand(text)) return "execCommand";

    if (globalThis.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "navigator.clipboard";
    }

    throw new Error("当前环境没有可用的剪贴板写入接口");
  }

  function installStyles() {
    if (document.getElementById("gpt-latex-copy-style")) return;
    const style = document.createElement("style");
    style.id = "gpt-latex-copy-style";
    style.textContent = STYLE;
    (document.head || document.documentElement).appendChild(style);
  }

  function showToast(message, isError = false) {
    let toast = document.getElementById("gpt-latex-copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "gpt-latex-copy-toast";
      toast.setAttribute("role", "status");
      (document.body || document.documentElement).appendChild(toast);
    }

    toast.textContent = message;
    toast.dataset.error = String(isError);
    toast.dataset.visible = "true";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.dataset.visible = "false";
    }, isError ? 3500 : 1800);
  }

  function flashFormula(element, isError = false) {
    const className = isError ? "gpt-latex-copy-flash-error" : "gpt-latex-copy-flash";
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), 700);
  }

  function formulaCount() {
    return document.querySelectorAll(FORMULA_SELECTOR).length;
  }

  function shorten(value, maxLength = 600) {
    const text = String(value ?? "");
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  function describeElement(element) {
    if (!(element instanceof Element)) return null;
    const attributes = {};
    for (const attribute of Array.from(element.attributes || [])) {
      attributes[attribute.name] = shorten(attribute.value, 800);
    }
    return {
      tag: element.tagName.toLowerCase(),
      attributes,
      text: shorten(element.textContent?.trim(), 500),
      reactPropertyKeys: Object.getOwnPropertyNames(element)
        .filter((key) => key.startsWith("__react"))
        .slice(0, 12)
    };
  }

  function buildFormulaDiagnostic(formula) {
    const ancestors = [];
    let current = formula;
    for (let depth = 0; current instanceof Element && depth < 7; depth += 1) {
      ancestors.push(describeElement(current));
      current = current.parentElement;
    }
    const descendants = Array.from(formula.querySelectorAll("*")).slice(0, 100);
    const payload = {
      scriptVersion: "4.0.0",
      page: `${location.origin}${location.pathname}`,
      userAgent: navigator.userAgent,
      formula: describeElement(formula),
      formulaOuterHTML: shorten(formula.outerHTML, 20000),
      annotationCount: formula.querySelectorAll('annotation[encoding="application/x-tex"]').length,
      mathCount: formula.querySelectorAll("math").length,
      descendantSummary: descendants.map(describeElement),
      ancestorSummary: ancestors
    };
    return [
      "ChatGPT LaTeX Copy diagnostic (narrow formula DOM only)",
      JSON.stringify(payload, null, 2)
    ].join("\n");
  }
  function refreshControlState(message = "") {
    if (!controlShadow) return;

    const launcher = controlShadow.getElementById("launcher");
    const status = controlShadow.getElementById("status");
    const toggle = controlShadow.getElementById("toggle");
    const format = controlShadow.getElementById("format");
    launcher.dataset.enabled = String(copyEnabled);
    launcher.title = copyEnabled
      ? "LaTeX 复制已启用；单击打开控制面板"
      : "LaTeX 复制已关闭；单击打开控制面板";
    status.textContent = message || (copyEnabled
      ? `已启用 · ${formulaCount()} 个公式 · ${COPY_FORMAT_LABELS[copyFormat]}`
      : "已关闭 · 单击公式不会复制");
    toggle.textContent = copyEnabled ? "暂时关闭单击复制" : "重新开启单击复制";
    format.value = copyFormat;
  }

  function mountControl() {
    if (!document.body || document.getElementById("gpt-formula-copy-control")) return;

    const host = document.createElement("div");
    host.id = "gpt-formula-copy-control";
    host.style.cssText = [
      "all:initial!important",
      "position:fixed!important",
      "right:18px!important",
      "bottom:18px!important",
      "z-index:2147483647!important",
      "display:block!important"
    ].join(";");
    controlShadow = host.attachShadow({ mode: "open" });
    controlShadow.innerHTML = `
      <style>
        :host { color-scheme: light dark; }
        * { box-sizing: border-box; }
        button, select { font: inherit; }
        #launcher {
          display: flex; align-items: center; gap: 7px; min-height: 38px;
          padding: 8px 12px; border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px; background: #13795b;
          box-shadow: 0 6px 22px rgba(0,0,0,.24); color: #fff; cursor: pointer;
          font: 600 13px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        #launcher:hover { background: #0f684e; }
        #launcher[data-enabled="false"] { background: #52525b; }
        #dot { width: 7px; height: 7px; border-radius: 50%; background: #86efac; box-shadow: 0 0 0 3px rgba(134,239,172,.16); }
        #launcher[data-enabled="false"] #dot { background: #d4d4d8; box-shadow: none; }
        #panel {
          position: absolute; right: 0; bottom: 48px; width: 268px; padding: 14px;
          border: 1px solid rgba(255,255,255,.14); border-radius: 12px;
          background: rgba(24,24,27,.97); box-shadow: 0 12px 36px rgba(0,0,0,.30);
          color: #fafafa; font: 13px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        #panel[hidden] { display: none; }
        #panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; font-weight: 700; }
        #close { border: 0; padding: 2px 5px; background: transparent; color: #a1a1aa; cursor: pointer; font-size: 18px; }
        #status { margin: 0 0 11px; color: #d4d4d8; }
        .action {
          width: 100%; margin-top: 7px; padding: 8px 10px; border: 1px solid #52525b;
          border-radius: 8px; background: #27272a; color: #fff; cursor: pointer; text-align: left;
        }
        .action:hover { background: #3f3f46; }
        .field { display: block; margin-top: 8px; color: #d4d4d8; font-size: 12px; }
        #format {
          width: 100%; margin-top: 4px; padding: 8px 9px; border: 1px solid #52525b;
          border-radius: 8px; background: #27272a; color: #fff; cursor: pointer;
        }
        #hint { margin: 10px 0 0; color: #a1a1aa; font-size: 12px; }
        #diagnostic-text {
          width: 100%; height: 116px; margin-top: 8px; padding: 7px;
          border: 1px solid #52525b; border-radius: 7px; resize: vertical;
          background: #09090b; color: #e4e4e7; font: 11px/1.35 Consolas, monospace;
        }
        #diagnostic-text[hidden] { display: none; }
      </style>
      <div id="panel" hidden>
        <div id="panel-head">
          <span>ChatGPT 公式一键复制</span>
          <button id="close" type="button" aria-label="关闭面板">×</button>
        </div>
        <p id="status"></p>
        <label class="field" for="format">复制格式
          <select id="format">
            <option value="smart">Markdown（自动 $ / $$）</option>
            <option value="inline">始终 $...$</option>
            <option value="raw">仅 LaTeX</option>
          </select>
        </label>
        <button id="test" class="action" type="button">复制示例公式</button>
        <button id="diagnostic" class="action" type="button">复制/显示上次失败诊断</button>
        <textarea id="diagnostic-text" readonly hidden aria-label="公式诊断信息"></textarea>
        <button id="toggle" class="action" type="button"></button>
        <p id="hint">直接单击公式即可复制；高级诊断仅在失败时使用。</p>
      </div>
      <button id="launcher" type="button" aria-expanded="false">
        <span id="dot"></span><span>公式复制</span>
      </button>
    `;

    const launcher = controlShadow.getElementById("launcher");
    const panel = controlShadow.getElementById("panel");
    const close = controlShadow.getElementById("close");
    const test = controlShadow.getElementById("test");
    const diagnostic = controlShadow.getElementById("diagnostic");
    const diagnosticText = controlShadow.getElementById("diagnostic-text");
    const toggle = controlShadow.getElementById("toggle");
    const format = controlShadow.getElementById("format");

    launcher.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      launcher.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) refreshControlState();
    });
    close.addEventListener("click", () => {
      panel.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
    });
    diagnostic.addEventListener("click", async () => {
      if (!lastFormulaDiagnostic) {
        refreshControlState("还没有失败记录：请先单击一个复制失败的公式");
        showToast("请先单击失败公式，再回来复制诊断", true);
        return;
      }
      diagnosticText.hidden = false;
      diagnosticText.value = lastFormulaDiagnostic;
      diagnosticText.focus();
      diagnosticText.select();
      try {
        await copyLatex(lastFormulaDiagnostic);
        refreshControlState("诊断信息已复制，请直接粘贴给 Codex");
        showToast("诊断信息已复制");
      } catch (error) {
        console.error("[ChatGPT LaTeX Copy] 诊断复制失败", error);
        refreshControlState("自动复制失败：请在文本框内 Ctrl+A、Ctrl+C");
        showToast("请在诊断文本框内手动 Ctrl+A、Ctrl+C", true);
      }
    });
    toggle.addEventListener("click", () => {
      copyEnabled = !copyEnabled;
      refreshControlState();
      showToast(copyEnabled ? "LaTeX 单击复制已开启" : "LaTeX 单击复制已关闭");
    });
    format.addEventListener("change", () => {
      const selected = format.value;
      copyFormat = COPY_FORMAT_ORDER.includes(selected) ? selected : "smart";
      saveCopyFormat(copyFormat);
      refreshControlState();
      showToast(`复制格式：${COPY_FORMAT_LABELS[copyFormat]}`);
    });
    test.addEventListener("click", async () => {
      try {
        const testOutput = formatLatexForCopy("\\frac{a}{b}", null);
        await copyLatex(testOutput);
        refreshControlState(`测试成功：${testOutput}`);
        showToast(`测试成功：已复制 ${testOutput}`);
      } catch (error) {
        console.error("[ChatGPT LaTeX Copy] 测试复制失败", error);
        refreshControlState("测试失败：请检查脚本管理器权限");
        showToast("测试失败：请检查脚本管理器权限", true);
      }
    });

    document.body.appendChild(host);
    refreshControlState();
  }

  async function handleFormulaPointerUp(event) {
    if (!copyEnabled || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const formula = findFormulaTarget(event);
    if (!formula) return;

    const latex = extractLatex(formula);
    if (!latex) {
      lastFormulaDiagnostic = buildFormulaDiagnostic(formula);
      flashFormula(formula, true);
      showToast("未找到原始 LaTeX；请点右下角复制诊断", true);
      refreshControlState("已记录失败公式：请复制/显示诊断信息");
      return;
    }

    // 在 window 的 pointerup capture 阶段拦截，先于 React 的 click handler。
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    try {
      const output = formatLatexForCopy(latex, formula);
      await copyLatex(output);
      flashFormula(formula);
      const preview = output.length > 90 ? `${output.slice(0, 87)}…` : output;
      showToast(`已复制：${preview}`);
    } catch (error) {
      console.error("[ChatGPT LaTeX Copy] 复制失败", error);
      showToast("复制失败：请确认脚本管理器已授予剪贴板权限", true);
    }
  }

  function ensureControl() {
    if (!document.body) return;
    if (!document.getElementById("gpt-formula-copy-control")) {
      controlShadow = null;
      mountControl();
    }
  }

  function boot() {
    installStyles();
    window.addEventListener("pointerup", handleFormulaPointerUp, true);
    if (document.body) {
      ensureControl();
    } else {
      document.addEventListener("DOMContentLoaded", ensureControl, { once: true });
    }
    // ChatGPT 的 SPA/hydration 若替换了 body 内容，自动把控制按钮挂回去。
    setInterval(ensureControl, 1200);
    console.info("[ChatGPT 公式一键复制] initialized", location.href);
  }

  if (document.documentElement) {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }

  // 只用于本地 smoke test；不修改 ChatGPT 页面数据。
  globalThis.__GPT_LATEX_COPY_API__ = Object.freeze({
    extractLatex,
    normalizeLatex,
    compactLatexSource,
    isDisplayFormula,
    formatLatexForCopy
  });
})();
