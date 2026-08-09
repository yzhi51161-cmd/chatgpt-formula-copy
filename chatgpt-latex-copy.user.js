// ==UserScript==
// @name         ChatGPT 公式复制
// @namespace    chatgpt-formula-copy.share
// @version      5.0.0
// @license      MIT
// @description  单击或框选 ChatGPT 公式，复制为规整 LaTeX；也可提取对话为 Markdown。
// @homepageURL  https://github.com/yzhi51161-cmd/chatgpt-formula-copy
// @supportURL   https://github.com/yzhi51161-cmd/chatgpt-formula-copy/issues
// @downloadURL  https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js
// @updateURL    https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js
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

  const CONTROL_ICON_DATA_URL = "data:image/png;base64,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";

  const FORMULA_SELECTOR = [
    "span.katex",
    'math[alttext]',
    '[data-math-source]',
    '[data-math]',
    '[data-latex]',
    '[data-tex]'
  ].join(",");
  const MESSAGE_SELECTOR = [
    '[data-message-author-role="user"]',
    '[data-message-author-role="assistant"]'
  ].join(",");
  const EXPORT_REMOVE_SELECTOR = [
    "button", "input", "textarea", "select", "script", "style", "noscript",
    "nav", "svg", '[role="button"]', '[contenteditable="true"]',
    "#gpt-formula-copy-control", "#gpt-latex-copy-toast"
  ].join(",");

  const STYLE = `
    html[data-gpt-formula-copy-enabled="true"] span.katex,
    html[data-gpt-formula-copy-enabled="true"] [data-math-source],
    html[data-gpt-formula-copy-enabled="true"] [data-math],
    html[data-gpt-formula-copy-enabled="true"] [data-latex],
    html[data-gpt-formula-copy-enabled="true"] [data-tex] {
      cursor: copy !important;
    }

    html[data-gpt-formula-copy-enabled="true"] span.katex:hover,
    html[data-gpt-formula-copy-enabled="true"] [data-math-source]:hover,
    html[data-gpt-formula-copy-enabled="true"] [data-math]:hover,
    html[data-gpt-formula-copy-enabled="true"] [data-latex]:hover,
    html[data-gpt-formula-copy-enabled="true"] [data-tex]:hover {
      outline: 2px solid #6f94e5 !important;
      outline-offset: 3px !important;
      border-radius: 7px !important;
      background: rgba(218, 231, 255, 0.66) !important;
    }

    .gpt-latex-copy-flash {
      outline: 2px solid #527bd6 !important;
      outline-offset: 3px !important;
      border-radius: 7px !important;
    }

    .gpt-latex-copy-flash-error {
      outline: 2px solid #dd7e91 !important;
      outline-offset: 3px !important;
      border-radius: 7px !important;
    }

    #gpt-latex-copy-toast {
      position: fixed !important;
      left: 50% !important;
      bottom: 28px !important;
      z-index: 2147483647 !important;
      transform: translateX(-50%) translateY(8px) !important;
      max-width: min(720px, calc(100vw - 32px)) !important;
      padding: 10px 15px !important;
      border: 1px solid rgba(113, 167, 145, 0.34) !important;
      border-radius: 999px !important;
      background: rgba(255, 253, 248, 0.97) !important;
      box-shadow: 0 10px 32px rgba(72, 95, 84, 0.18), 0 2px 8px rgba(72, 95, 84, 0.08) !important;
      color: #4d6259 !important;
      font: 600 13px/1.45 "Yu Gothic UI", "Hiragino Kaku Gothic ProN", "Microsoft YaHei", system-ui, sans-serif !important;
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
      border-color: rgba(210, 112, 133, 0.38) !important;
      background: rgba(255, 241, 244, 0.98) !important;
      color: #a94f65 !important;
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

  function loadSelectionCopyEnabled() {
    try {
      return typeof GM_getValue === "function"
        ? GM_getValue("selectionCopyEnabled", true) !== false
        : true;
    } catch (error) {
      return true;
    }
  }

  function saveSelectionCopyEnabled(value) {
    try {
      if (typeof GM_setValue === "function") GM_setValue("selectionCopyEnabled", value);
    } catch (error) {
      console.warn("[ChatGPT LaTeX Copy] 无法保存选区复制设置", error);
    }
  }

  function loadBooleanSetting(key, fallback) {
    try {
      return typeof GM_getValue === "function"
        ? GM_getValue(key, fallback) !== false
        : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveSetting(key, value) {
    try {
      if (typeof GM_setValue === "function") GM_setValue(key, value);
    } catch (error) {
      console.warn(`[ChatGPT Formula Copy] 无法保存设置：${key}`, error);
    }
  }

  let toastTimer = 0;
  let copyEnabled = loadBooleanSetting("copyEnabled", true);
  let selectionCopyEnabled = loadSelectionCopyEnabled();
  let copyFormat = loadCopyFormat();
  let exportMetadataEnabled = loadBooleanSetting("exportMetadataEnabled", true);
  let controlShadow = null;
  let controlHost = null;
  let rootObserver = null;
  let bodyObserver = null;
  let lastFormulaDiagnostic = "";
  let clipboardTextarea = null;
  let pendingPanelTab = null;
  let metricsRefreshTimer = 0;

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

    let latex = "";

    const annotation = element.matches('annotation[encoding="application/x-tex"]')
      ? element
      : element.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation?.textContent?.trim()) {
      latex = normalizeLatex(annotation.textContent);
    }

    if (!latex) {
      const math = element.matches("math") ? element : element.querySelector("math");
      const altText = math?.getAttribute("alttext");
      if (altText?.trim()) latex = normalizeLatex(altText);
    }

    // 2026 年 ChatGPT 前端将原始 TeX 放在 KaTeX 外层的 data-math-source。
    if (!latex) {
      const attributeNames = ["data-math-source", "data-math", "data-latex", "data-tex"];
      for (const name of attributeNames) {
        const ownValue = element.getAttribute(name);
        if (ownValue?.trim()) {
          latex = normalizeLatex(ownValue);
          break;
        }

        const owner = element.closest(`[${name}]`);
        const ancestorValue = owner?.getAttribute(name);
        if (ancestorValue?.trim()) {
          latex = normalizeLatex(ancestorValue);
          break;
        }
      }
    }

    if (!latex) {
      const labelledMath = element.closest('[role="math"][aria-label]');
      const ariaLatex = labelledMath?.getAttribute("aria-label");
      if (ariaLatex?.trim()) latex = normalizeLatex(ariaLatex);
    }

    return latex;
  }

  function isDisplayFormula(element) {
    if (!(element instanceof Element)) return false;

    let isDisplay = Boolean(element.closest(".katex-display"));

    if (!isDisplay) {
      const holder = element.closest(
        '[data-math-source], [data-math], [data-latex], [data-tex], [role="math"]'
      ) || element;
      if (holder?.style?.display === "block") {
        isDisplay = true;
      } else if (holder?.isConnected) {
        try {
          isDisplay = getComputedStyle(holder).display === "block";
        } catch (error) {
          isDisplay = false;
        }
      }
    }

    return isDisplay;
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

  const BLOCK_TAGS = new Set([
    "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DD", "DIV", "DL", "DT",
    "FIGCAPTION", "FIGURE", "FOOTER", "H1", "H2", "H3", "H4", "H5", "H6",
    "HEADER", "HR", "LI", "MAIN", "NAV", "OL", "P", "PRE", "SECTION",
    "TABLE", "TBODY", "TFOOT", "THEAD", "TR", "UL"
  ]);
  const SKIP_SELECTION_TAGS = new Set(["BUTTON", "NOSCRIPT", "SCRIPT", "STYLE"]);

  function serializeSelectionNode(node, preserveWhitespace = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.nodeValue || "";
      return preserveWhitespace ? value : value.replace(/[\t\r\n ]+/g, " ");
    }
    if (!(node instanceof Element)) {
      return Array.from(
        node.childNodes || [],
        (child) => serializeSelectionNode(child, preserveWhitespace)
      ).join("");
    }

    if (SKIP_SELECTION_TAGS.has(node.tagName)) return "";
    if (node.getAttribute("aria-hidden") === "true") return "";
    if (node.tagName === "BR") return "\n";
    if (node.tagName === "HR") return "\n---\n";

    const keepWhitespace = preserveWhitespace || node.tagName === "PRE";
    const content = Array.from(
      node.childNodes,
      (child) => serializeSelectionNode(child, keepWhitespace)
    ).join("");
    if (node.tagName === "TD" || node.tagName === "TH") return `${content}\t`;
    if (node.tagName === "LI") return `\n- ${content.trim()}\n`;
    return BLOCK_TAGS.has(node.tagName) ? `\n${content}\n` : content;
  }

  function normalizeSelectionText(value) {
    return String(value ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function closestFormula(node) {
    const element = node instanceof Element ? node : node?.parentElement;
    return element?.closest?.(FORMULA_SELECTOR) || null;
  }

  function topLevelFormulaEntries(root) {
    if (!root?.querySelectorAll) return [];
    const candidates = Array.from(root.querySelectorAll(FORMULA_SELECTOR))
      .map((element) => ({ element, latex: extractLatex(element) }))
      .filter((entry) => entry.latex);
    const candidateSet = new Set(candidates.map(({ element }) => element));

    return candidates.filter(({ element }) => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (candidateSet.has(parent)) return false;
        if (parent === root) break;
      }
      return true;
    });
  }

  function convertSelectionToLatex(selection = globalThis.getSelection?.()) {
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return null;

    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const formulaEntries = topLevelFormulaEntries(fragment);

    for (const { element, latex } of formulaEntries) {
      element.replaceWith(document.createTextNode(formatLatexForCopy(latex, element)));
    }

    if (formulaEntries.length === 0) {
      // 只选中公式内部若干字符时，cloneContents 不一定保留 KaTeX 外层。
      const startFormula = closestFormula(range.startContainer);
      const endFormula = closestFormula(range.endContainer);
      if (startFormula && startFormula === endFormula) {
        const latex = extractLatex(startFormula);
        if (latex) {
          return { text: formatLatexForCopy(latex, startFormula), formulaCount: 1 };
        }
      }
      return null;
    }

    const text = normalizeSelectionText(serializeSelectionNode(fragment));
    return text ? { text, formulaCount: formulaEntries.length } : null;
  }

  function escapeMarkdownText(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/([\\`*_[\]])/g, "\\$1");
  }

  function stashMarkdownBlock(context, value) {
    const index = context.blocks.push(String(value ?? "").trim()) - 1;
    return `\n\n\uE000GFC_BLOCK_${index}\uE001\n\n`;
  }

  function restoreMarkdownBlocks(value, context) {
    return String(value ?? "").replace(/\uE000GFC_BLOCK_(\d+)\uE001/g, (_, index) =>
      context.blocks[Number(index)] || ""
    );
  }

  function serializeMarkdownChildren(element, context) {
    return Array.from(
      element.childNodes,
      (child) => serializeMarkdownNode(child, context)
    ).join("");
  }

  function inlineCode(value) {
    const code = String(value ?? "").replace(/\r\n?/g, "\n");
    const longestRun = Math.max(0, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
    const fence = "`".repeat(Math.max(1, longestRun + 1));
    const padding = /^\s|\s$/.test(code) ? " " : "";
    return `${fence}${padding}${code}${padding}${fence}`;
  }

  function codeBlockLanguage(pre, code) {
    const explicit = code.getAttribute("data-language") || pre.getAttribute("data-language") || "";
    if (explicit.trim()) return explicit.trim();
    const className = `${code.getAttribute("class") || ""} ${pre.getAttribute("class") || ""}`;
    return className.match(/(?:^|\s)(?:language|lang)-([^\s]+)/i)?.[1] || "";
  }

  function fencedCodeMarkdown(value, language = "") {
    const code = String(value ?? "").replace(/\r\n?/g, "\n").replace(/^\n|\n$/g, "");
    const longestRun = Math.max(0, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
    const fence = "`".repeat(Math.max(3, longestRun + 1));
    return `${fence}${language}\n${code}\n${fence}`;
  }

  function serializeMarkdownList(list, context) {
    const ordered = list.tagName === "OL";
    const start = ordered ? Number.parseInt(list.getAttribute("start") || "1", 10) || 1 : 1;
    const items = Array.from(list.children).filter((child) => child.tagName === "LI");
    const lines = items.map((item, index) => {
      const content = restoreMarkdownBlocks(serializeMarkdownChildren(item, context), context)
        .replace(/^\s+|\s+$/g, "")
        .replace(/\n{3,}/g, "\n\n");
      const marker = ordered ? `${start + index}. ` : "- ";
      const continuation = " ".repeat(marker.length);
      const indented = content.split("\n").map((line, lineIndex) =>
        lineIndex === 0 ? line : `${continuation}${line}`
      ).join("\n");
      return `${marker}${indented}`;
    });
    return `\n${lines.join("\n")}\n`;
  }

  function serializeMarkdownTable(table, context) {
    const rows = Array.from(table.rows || []);
    if (rows.length === 0) return "";
    const values = rows.map((row) => Array.from(row.cells || []).map((cell) =>
      serializeMarkdownChildren(cell, context)
        .replace(/\s*\n\s*/g, "<br>")
        .replace(/\|/g, "\\|")
        .trim()
    ));
    const columnCount = Math.max(...values.map((row) => row.length));
    const pad = (row) => Array.from({ length: columnCount }, (_, index) => row[index] || "");
    const header = pad(values[0]);
    const body = values.slice(1).map(pad);
    const lines = [
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...body.map((row) => `| ${row.join(" | ")} |`)
    ];
    return stashMarkdownBlock(context, lines.join("\n"));
  }

  function serializeMarkdownNode(node, context) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      const preservesWhitespace = Boolean(parent?.closest(
        '.whitespace-pre-wrap, .whitespace-pre-line, .whitespace-break-spaces, [style*="white-space: pre"], [style*="white-space:pre"]'
      ));
      const value = preservesWhitespace
        ? (node.nodeValue || "").replace(/\r\n?/g, "\n")
        : (node.nodeValue || "").replace(/[\t\r\n ]+/g, " ");
      return escapeMarkdownText(value);
    }
    if (!(node instanceof Element)) {
      return Array.from(node.childNodes || [], (child) => serializeMarkdownNode(child, context)).join("");
    }

    const formulaMarkdown = node.getAttribute("data-gpt-formula-markdown");
    if (formulaMarkdown !== null) return formulaMarkdown;
    const taskMarker = node.getAttribute("data-gpt-task-marker");
    if (taskMarker !== null) return taskMarker;

    const tag = node.tagName;
    if (tag === "BR") return "\n";
    if (tag === "HR") return "\n\n---\n\n";
    if (tag === "IMG") {
      const alt = escapeMarkdownText(node.getAttribute("alt") || "image");
      const source = node.getAttribute("src") || "";
      return source && !source.startsWith("blob:")
        ? `![${alt}](${source})`
        : `[Image: ${alt}]`;
    }
    if (tag === "A") {
      const label = serializeMarkdownChildren(node, context).trim();
      const href = node.getAttribute("href") || "";
      if (!href || /^javascript:/i.test(href)) return label;
      return label === href ? `<${href}>` : `[${label || href}](${href})`;
    }
    if (tag === "PRE") {
      const code = node.querySelector("code") || node;
      const value = (code.textContent || "").replace(/\r\n?/g, "\n").replace(/^\n|\n$/g, "");
      return stashMarkdownBlock(context, fencedCodeMarkdown(value, codeBlockLanguage(node, code)));
    }
    if (tag === "CODE" || tag === "KBD") return inlineCode(node.textContent || "");
    if (tag === "STRONG" || tag === "B") return `**${serializeMarkdownChildren(node, context).trim()}**`;
    if (tag === "EM" || tag === "I") return `*${serializeMarkdownChildren(node, context).trim()}*`;
    if (tag === "DEL" || tag === "S") return `~~${serializeMarkdownChildren(node, context).trim()}~~`;
    if (tag === "SUP") return `<sup>${serializeMarkdownChildren(node, context).trim()}</sup>`;
    if (tag === "SUB") return `<sub>${serializeMarkdownChildren(node, context).trim()}</sub>`;
    if (/^H[1-6]$/.test(tag)) {
      const level = Number(tag.slice(1));
      return `\n\n${"#".repeat(level)} ${serializeMarkdownChildren(node, context).trim()}\n\n`;
    }
    if (tag === "BLOCKQUOTE") {
      const quote = restoreMarkdownBlocks(serializeMarkdownChildren(node, context), context).trim()
        .split("\n").map((line) => `> ${line}`).join("\n");
      return `\n\n${quote}\n\n`;
    }
    if (tag === "UL" || tag === "OL") return serializeMarkdownList(node, context);
    if (tag === "TABLE") return serializeMarkdownTable(node, context);

    const content = serializeMarkdownChildren(node, context);
    return BLOCK_TAGS.has(tag) ? `\n${content}\n` : content;
  }

  function replaceFormulasForMarkdown(root) {
    const entries = topLevelFormulaEntries(root);
    for (const { element, latex } of entries) {
      const formatted = formatLatexForCopy(latex, element, "smart");
      const replacement = document.createElement("span");
      replacement.setAttribute(
        "data-gpt-formula-markdown",
        isDisplayFormula(element) ? `\n\n${formatted}\n\n` : formatted
      );
      element.replaceWith(replacement);
    }
    return entries.length;
  }

  function serializeElementToMarkdown(element) {
    if (!(element instanceof Element)) return "";
    const clone = element.cloneNode(true);
    replaceFormulasForMarkdown(clone);
    clone.querySelectorAll('li input[type="checkbox"]').forEach((input) => {
      const marker = document.createElement("span");
      marker.setAttribute("data-gpt-task-marker", input.checked ? "[x]" : "[ ]");
      input.replaceWith(marker);
    });
    clone.querySelectorAll(EXPORT_REMOVE_SELECTOR).forEach((node) => node.remove());
    clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());

    const context = { blocks: [] };
    let markdown = serializeMarkdownChildren(clone, context)
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    markdown = restoreMarkdownBlocks(markdown, context);
    return markdown.trim();
  }

  function selectionToMarkdown(selection = globalThis.getSelection?.()) {
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return "";
    const range = selection.getRangeAt(0);
    const startFormula = closestFormula(range.startContainer);
    const endFormula = closestFormula(range.endContainer);
    if (startFormula && startFormula === endFormula) {
      const latex = extractLatex(startFormula);
      if (latex) return formatLatexForCopy(latex, startFormula, "smart");
    }

    const wrapper = document.createElement("div");
    wrapper.appendChild(range.cloneContents());
    return serializeElementToMarkdown(wrapper);
  }

  function messageContentElement(message) {
    const candidates = [
      ...message.querySelectorAll('[data-message-content], .markdown, .prose')
    ];
    return candidates.find((element) =>
      element.textContent?.trim() || element.querySelector?.(FORMULA_SELECTOR)
    ) || message;
  }

  function isVisibleConversationMessage(message, root = document) {
    if (!(message instanceof Element)) return false;
    for (let element = message; element && element !== root; element = element.parentElement) {
      if (
        element.hidden ||
        element.hasAttribute("inert") ||
        element.getAttribute("aria-hidden") === "true"
      ) {
        return false;
      }
      try {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
      } catch (error) {
        // Detached test fragments may not have a computed style; structural checks still apply.
      }
    }
    return true;
  }

  function visibleConversationMessageElements(root = document) {
    return Array.from(root.querySelectorAll(MESSAGE_SELECTOR))
      .filter((message) => !message.parentElement?.closest(MESSAGE_SELECTOR))
      .filter((message) => isVisibleConversationMessage(message, root));
  }

  function collectConversationMessages(root = document) {
    return visibleConversationMessageElements(root)
      .map((message) => {
        const role = message.getAttribute("data-message-author-role");
        const markdown = serializeElementToMarkdown(messageContentElement(message));
        return { role, markdown };
      })
      .filter(({ role, markdown }) => (role === "user" || role === "assistant") && markdown);
  }

  function conversationTitle() {
    const raw = (document.title || "")
      .replace(/\s*[|–—-]\s*ChatGPT\s*$/i, "")
      .replace(/^ChatGPT\s*[|–—-]\s*/i, "")
      .trim();
    return raw && !/^ChatGPT$/i.test(raw) ? raw : "ChatGPT Conversation";
  }

  function buildConversationMarkdown(messages = collectConversationMessages()) {
    if (!messages.length) return "";
    const lines = [`# ${escapeMarkdownText(conversationTitle())}`];
    if (exportMetadataEnabled) {
      lines.push(
        "",
        `> Exported from [ChatGPT](${location.href}) on ${new Date().toISOString()}`
      );
    }
    for (const message of messages) {
      lines.push("", message.role === "user" ? "## You" : "## ChatGPT", "", message.markdown);
    }
    return `${lines.join("\n").trim()}\n`;
  }

  function lastAssistantMarkdown() {
    const messages = visibleConversationMessageElements();
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.getAttribute("data-message-author-role") !== "assistant") continue;
      const markdown = serializeElementToMarkdown(messageContentElement(message));
      if (markdown) return markdown;
    }
    return "";
  }

  function safeMarkdownFilename(title = conversationTitle()) {
    const safe = String(title || "ChatGPT Conversation")
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/[. ]+$/g, "")
      .trim()
      .slice(0, 96) || "ChatGPT Conversation";
    return `${safe}.md`;
  }

  function downloadMarkdown(markdown, filename = safeMarkdownFilename()) {
    if (!markdown) throw new Error("当前页面没有可导出的 ChatGPT 对话");
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    (document.body || document.documentElement).appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  }

  function handleSelectionCopy(event) {
    if (!selectionCopyEnabled) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, [contenteditable="true"]')) return;

    const converted = convertSelectionToLatex();
    if (!converted) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (event.clipboardData) {
      event.clipboardData.setData("text/plain", converted.text);
    } else {
      copyLatex(converted.text).catch((error) => {
        console.error("[ChatGPT LaTeX Copy] 选区复制失败", error);
      });
    }
    showToast(`已复制整段，${converted.formulaCount} 个公式已转为 LaTeX`);
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
    if (!clipboardTextarea?.isConnected) {
      clipboardTextarea = document.createElement("textarea");
      clipboardTextarea.setAttribute("readonly", "");
      clipboardTextarea.setAttribute("aria-hidden", "true");
      clipboardTextarea.style.cssText = [
        "position:fixed",
        "left:-9999px",
        "top:0",
        "width:1px",
        "height:1px",
        "opacity:0",
        "pointer-events:none"
      ].join(";");
      (document.body || document.documentElement).appendChild(clipboardTextarea);
    }
    clipboardTextarea.value = text;
    clipboardTextarea.focus({ preventScroll: true });
    clipboardTextarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    } finally {
      clipboardTextarea.blur();
      clipboardTextarea.value = "";
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
    return topLevelFormulaEntries(document).length;
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
    const descendants = Array.from(formula.querySelectorAll("*")).slice(0, 100);
    const payload = {
      scriptVersion: "5.0.0",
      formula: describeElement(formula),
      formulaOuterHTML: shorten(formula.outerHTML, 20000),
      annotationCount: formula.querySelectorAll('annotation[encoding="application/x-tex"]').length,
      mathCount: formula.querySelectorAll("math").length,
      descendantSummary: descendants.map(describeElement)
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
    const selectionToggle = controlShadow.getElementById("selection-toggle");
    const metadataToggle = controlShadow.getElementById("metadata-toggle");
    const format = controlShadow.getElementById("format");
    const formulas = topLevelFormulaEntries(document).length;
    const messages = visibleConversationMessageElements().length;
    document.documentElement.dataset.gptFormulaCopyEnabled = String(copyEnabled);
    launcher.dataset.enabled = String(copyEnabled || selectionCopyEnabled);
    launcher.title = "打开公式复制";
    status.textContent = message || "就绪";
    controlShadow.getElementById("formula-metric").textContent = String(formulas);
    controlShadow.getElementById("message-metric").textContent = String(messages);
    controlShadow.getElementById("launcher-count").textContent = formulas > 99 ? "99+" : String(formulas);
    for (const [button, enabled] of [
      [toggle, copyEnabled],
      [selectionToggle, selectionCopyEnabled],
      [metadataToggle, exportMetadataEnabled]
    ]) {
      button.dataset.on = String(enabled);
      button.setAttribute("aria-checked", String(enabled));
    }
    format.value = copyFormat;
  }

  function setPanelOpen(open) {
    if (!controlShadow) return;
    const panel = controlShadow.getElementById("panel");
    const launcher = controlShadow.getElementById("launcher");
    panel.dataset.open = String(open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    if (open) refreshControlState();
  }

  function activatePanelTab(tabName) {
    if (!controlShadow) return;
    for (const tab of controlShadow.querySelectorAll('[role="tab"]')) {
      const active = tab.dataset.tab === tabName;
      tab.dataset.active = String(active);
      tab.setAttribute("aria-selected", String(active));
    }
    for (const pane of controlShadow.querySelectorAll('[role="tabpanel"]')) {
      pane.hidden = pane.dataset.pane !== tabName;
    }
  }

  function mountControl() {
    if (!document.body || document.getElementById("gpt-formula-copy-control")) return;

    const host = document.createElement("div");
    controlHost = host;
    host.id = "gpt-formula-copy-control";
    host.style.cssText = [
      "all:initial!important",
      "position:fixed!important",
      "right:20px!important",
      "bottom:20px!important",
      "z-index:2147483647!important",
      "display:block!important"
    ].join(";");
    controlShadow = host.attachShadow({ mode: "open" });
    controlShadow.innerHTML = `
      <style>
        :host {
          color-scheme: light;
          --ink: #303a5a;
          --muted: #66708b;
          --paper: rgba(248,251,255,.86);
          --paper-strong: rgba(255,255,255,.82);
          --line: rgba(111,137,198,.4);
          --blue: #527bd6;
          --blue-deep: #344e96;
          --blue-soft: rgba(214,229,255,.78);
          --sakura: #d96f96;
          --sakura-soft: rgba(247,220,232,.72);
          --leaf: #5f9a80;
          --leaf-soft: rgba(220,240,230,.78);
          --lavender: #9180c3;
          --lavender-soft: rgba(230,224,248,.72);
          font: 13px/1.45 ui-rounded, "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif;
        }
        * { box-sizing: border-box; }
        button, select, textarea { font: inherit; }
        button { -webkit-tap-highlight-color: transparent; }
        #launcher {
          display:flex; align-items:center; gap:9px; min-height:52px;
          padding:7px 11px 7px 7px; border:1px solid rgba(92,128,211,.58); border-radius:999px;
          background:linear-gradient(135deg,rgba(255,255,255,.97),rgba(224,236,255,.96) 52%,rgba(239,233,252,.94)); color:#35436c; cursor:pointer;
          box-shadow:0 12px 34px rgba(58,83,157,.22),0 3px 15px rgba(91,142,190,.15),inset 0 1px rgba(255,255,255,.96);
          font-weight:700;
          transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
        }
        #launcher:hover { transform:translateY(-3px) rotate(-.35deg); border-color:#527bd6; box-shadow:0 17px 40px rgba(58,83,157,.28),0 4px 18px rgba(107,143,219,.18); }
        #launcher:active { transform:translateY(0) scale(.98); }
        #launcher[data-enabled="false"] { background:#eee9e5; color:#8e8488; border-color:#d6ceca; }
        #launcher:focus-visible, button:focus-visible, select:focus-visible { outline:2px solid #557fd8; outline-offset:2px; }
        #launcher-icon { display:block; width:38px; height:38px; border:1px solid rgba(255,255,255,.9); border-radius:12px; object-fit:cover; box-shadow:0 5px 14px rgba(63,91,166,.28); }
        #launcher-count {
          display:grid; place-items:center; min-width:22px; height:22px; padding:0 6px;
          border-radius:999px; background:linear-gradient(135deg,var(--blue-soft),var(--lavender-soft)); color:#3f5f9e; font-size:11px;
        }
        #panel {
          position:absolute; right:0; bottom:65px; width:min(376px,calc(100vw - 24px));
          padding:18px; border:1px solid rgba(113,139,205,.56); border-radius:24px;
          background:
            radial-gradient(circle at 91% 4%,rgba(94,143,235,.28),transparent 30%),
            radial-gradient(circle at 8% 94%,rgba(94,162,132,.15),transparent 31%),
            radial-gradient(circle at 11% 3%,rgba(154,133,210,.2),transparent 25%),
            radial-gradient(circle at 76% 90%,rgba(231,145,180,.12),transparent 28%),
            linear-gradient(145deg,rgba(255,255,255,.78),rgba(244,248,255,.68)),
            var(--paper);
          backdrop-filter:blur(26px) saturate(1.28);
          box-shadow:0 28px 82px rgba(53,72,137,.27),0 8px 30px rgba(99,128,198,.13),inset 0 1px rgba(255,255,255,.94);
          color:var(--ink); opacity:0; visibility:hidden; pointer-events:none;
          transform:translateY(10px) scale(.975); transform-origin:right bottom;
          transition:opacity .18s ease,transform .18s ease,visibility .18s;
        }
        #panel[data-open="true"] { opacity:1; visibility:visible; pointer-events:auto; transform:translateY(0) scale(1); }
        #panel::before { content:"✦"; position:absolute; top:11px; right:53px; color:rgba(83,126,218,.7); font-size:13px; text-shadow:-24px 17px 0 rgba(149,128,203,.32); pointer-events:none; }
        #panel::after { content:""; position:absolute; right:-24px; top:88px; width:68px; height:68px; border-radius:50%; background:rgba(112,155,235,.24); filter:blur(14px); pointer-events:none; }
        #panel-head { display:flex; justify-content:space-between; align-items:center; gap:12px; cursor:grab; user-select:none; touch-action:none; }
        #panel-head:active { cursor:grabbing; }
        #brand { display:flex; align-items:center; gap:12px; min-width:0; }
        #brand-icon { display:block; width:54px; height:54px; flex:none; border:2px solid rgba(255,255,255,.92); border-radius:17px; object-fit:cover; box-shadow:0 9px 22px rgba(58,83,157,.3); }
        #brand-title { color:#303a5a; font-size:16px; font-weight:780; letter-spacing:.025em; }
        #brand-subtitle { margin-top:3px; color:#74809d; font-size:11px; }
        #close {
          display:grid; place-items:center; width:31px; height:31px; padding:0; border:0; border-radius:10px;
          background:transparent; color:#927f86; cursor:pointer; font-size:19px;
        }
        #close:hover { background:var(--blue-soft); color:#4167bd; }
        #status {
          margin:13px 0 0; padding:8px 11px; border:1px solid rgba(105,145,216,.44); border-radius:10px;
          background:linear-gradient(110deg,rgba(217,232,255,.9),rgba(224,242,234,.78),rgba(239,234,251,.74)); color:#354f88; font-size:11px; font-weight:650;
          box-shadow:inset 0 1px rgba(255,255,255,.76);
        }
        #metrics { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:9px; }
        .metric { padding:10px 11px; border:1px solid var(--line); border-radius:14px; background:var(--paper-strong); box-shadow:0 5px 16px rgba(83,61,86,.07),inset 0 1px rgba(255,255,255,.78); }
        .metric:first-child { border-color:rgba(102,144,223,.44); background:linear-gradient(145deg,rgba(222,235,255,.92),rgba(255,255,255,.72)); }
        .metric:last-child { border-color:rgba(153,133,202,.42); background:linear-gradient(145deg,rgba(236,231,251,.9),rgba(250,238,247,.68)); }
        .metric strong { display:block; color:#33426b; font-size:17px; line-height:1.1; }
        .metric span { display:block; margin-top:3px; color:var(--muted); font-size:10px; }
        #tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; margin:13px 0 4px; padding:4px; border:1px solid rgba(118,143,201,.36); border-radius:14px; background:rgba(72,99,160,.09); box-shadow:inset 0 1px rgba(255,255,255,.58); }
        .tab { padding:8px 5px; border:0; border-radius:9px; background:transparent; color:#66718e; cursor:pointer; font-weight:700; }
        .tab:hover { color:#36466f; }
        .tab[data-active="true"] { background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(226,235,255,.9)); color:#4167bd; box-shadow:0 4px 12px rgba(63,87,153,.16),inset 0 1px #fff; }
        .pane { padding-top:4px; }
        .pane[hidden] { display:none; }
        .action {
          display:flex; align-items:center; justify-content:space-between; gap:10px;
          width:100%; margin-top:8px; padding:10px 11px; border:1px solid var(--line);
          border-radius:14px; background:linear-gradient(135deg,rgba(255,255,255,.8),rgba(255,250,251,.68)); color:var(--ink); cursor:pointer; text-align:left;
          box-shadow:0 5px 15px rgba(83,61,86,.06),inset 0 1px rgba(255,255,255,.75);
          transition:background .15s ease,border-color .15s ease,transform .15s ease,box-shadow .15s ease;
        }
        .action:hover { background:rgba(255,255,255,.95); border-color:rgba(76,121,215,.6); transform:translateY(-2px); box-shadow:0 9px 22px rgba(59,82,151,.14); }
        .action.primary { border-color:rgba(93,136,219,.48); background:linear-gradient(120deg,rgba(215,231,255,.94),rgba(224,243,234,.78),rgba(238,232,251,.8)); }
        .action-copy { padding:2px 7px; border-radius:999px; background:linear-gradient(135deg,rgba(213,228,255,.82),rgba(232,225,248,.76)); color:#536a9f; font-size:10px; }
        .field { display:block; margin-top:8px; color:#56617e; font-size:11px; font-weight:650; }
        #format {
          width:100%; margin-top:6px; padding:9px 10px; border:1px solid var(--line);
          border-radius:12px; background:rgba(255,255,255,.72); color:var(--ink); cursor:pointer; font-weight:500;
          box-shadow:inset 0 1px rgba(255,255,255,.86);
        }
        .switch-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 2px; border-bottom:1px solid rgba(126,148,198,.24); }
        .switch-copy strong { display:block; color:#414d70; font-size:12px; }
        .switch {
          position:relative; width:39px; height:23px; flex:none; padding:0; border:0; border-radius:999px;
          background:#aeb8cf; cursor:pointer; transition:background .18s ease;
        }
        .switch::after { content:""; position:absolute; top:3px; left:3px; width:17px; height:17px; border-radius:50%; background:#fffdf9; box-shadow:0 2px 5px rgba(88,68,75,.2); transition:transform .18s ease; }
        .switch[data-on="true"] { background:linear-gradient(90deg,#527bd6,#8877be); }
        .switch[data-on="true"]::after { transform:translateX(16px); }
        #diagnostic-text {
          width:100%; height:112px; margin-top:8px; padding:8px; border:1px solid var(--line);
          border-radius:10px; resize:vertical; background:#f3ede8; color:var(--ink); font:10px/1.4 Consolas,monospace;
        }
        #diagnostic-text[hidden] { display:none; }
        #footer { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:3px 6px; margin:12px 1px 0; color:#7c86a0; font-size:9px; text-align:center; }
        #permission-help { padding:0; border:0; background:transparent; color:#5272b9; cursor:pointer; font-size:9px; text-decoration:underline; text-underline-offset:2px; }
        #permission-help:hover { color:#3459a8; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration:.01ms!important; animation-duration:.01ms!important; } }
      </style>
      <div id="panel" data-open="false" aria-hidden="true">
        <div id="panel-head">
          <div id="brand"><img id="brand-icon" src="${CONTROL_ICON_DATA_URL}" alt=""><div><div id="brand-title">公式复制</div><div id="brand-subtitle">对话提取</div></div></div>
          <button id="close" type="button" aria-label="关闭面板">×</button>
        </div>
        <p id="status"></p>
        <div id="metrics"><div class="metric"><strong id="formula-metric">0</strong><span>页内公式</span></div><div class="metric"><strong id="message-metric">0</strong><span>对话消息</span></div></div>
        <div id="tabs" role="tablist" aria-label="工具分类">
          <button class="tab" type="button" role="tab" data-tab="copy" data-active="true" aria-selected="true">公式复制</button>
          <button class="tab" type="button" role="tab" data-tab="export" data-active="false" aria-selected="false">对话提取</button>
          <button class="tab" type="button" role="tab" data-tab="settings" data-active="false" aria-selected="false">设置</button>
        </div>
        <section class="pane" role="tabpanel" data-pane="copy">
          <label class="field" for="format">复制格式<select id="format"><option value="smart">自动添加 $ / $$</option><option value="inline">统一用 $...$</option><option value="raw">只要 LaTeX</option></select></label>
          <button id="test" class="action primary" type="button"><span>复制一条示例</span><span class="action-copy">试试看 →</span></button>
        </section>
        <section class="pane" role="tabpanel" data-pane="export" hidden>
          <button id="copy-selection-markdown" class="action" type="button"><span>复制选中内容</span><span class="action-copy">Markdown</span></button>
          <button id="copy-last-response" class="action" type="button"><span>复制最近回答</span><span class="action-copy">Markdown</span></button>
          <button id="copy-conversation" class="action" type="button"><span>复制整段对话</span><span class="action-copy">Markdown</span></button>
          <button id="download-conversation" class="action primary" type="button"><span>保存为 Markdown</span><span class="action-copy">.md ↓</span></button>
          <div class="switch-row"><div class="switch-copy"><strong>附上来源与时间</strong></div><button id="metadata-toggle" class="switch" type="button" role="switch" aria-label="附上来源与时间"></button></div>
        </section>
        <section class="pane" role="tabpanel" data-pane="settings" hidden>
          <div class="switch-row"><div class="switch-copy"><strong>点按公式复制</strong></div><button id="toggle" class="switch" type="button" role="switch" aria-label="点按公式复制"></button></div>
          <div class="switch-row"><div class="switch-copy"><strong>整段复制</strong></div><button id="selection-toggle" class="switch" type="button" role="switch" aria-label="整段复制"></button></div>
          <button id="diagnostic" class="action" type="button"><span>复制排查信息</span><span class="action-copy">遇到问题时</span></button>
          <textarea id="diagnostic-text" readonly hidden aria-label="公式诊断信息"></textarea>
        </section>
        <div id="footer"><span>只在本机整理 · 不上传</span><button id="permission-help" type="button">油猴版没显示？复制权限页地址</button></div>
      </div>
      <button id="launcher" type="button" aria-expanded="false">
        <img id="launcher-icon" src="${CONTROL_ICON_DATA_URL}" alt=""><span>公式复制</span><span id="launcher-count">0</span>
      </button>
    `;

    const launcher = controlShadow.getElementById("launcher");
    const panel = controlShadow.getElementById("panel");
    const panelHead = controlShadow.getElementById("panel-head");
    const close = controlShadow.getElementById("close");
    const permissionHelp = controlShadow.getElementById("permission-help");
    const test = controlShadow.getElementById("test");
    const diagnostic = controlShadow.getElementById("diagnostic");
    const diagnosticText = controlShadow.getElementById("diagnostic-text");
    const toggle = controlShadow.getElementById("toggle");
    const selectionToggle = controlShadow.getElementById("selection-toggle");
    const metadataToggle = controlShadow.getElementById("metadata-toggle");
    const format = controlShadow.getElementById("format");
    const copySelectionMarkdown = controlShadow.getElementById("copy-selection-markdown");
    const copyLastResponse = controlShadow.getElementById("copy-last-response");
    const copyConversation = controlShadow.getElementById("copy-conversation");
    const downloadConversation = controlShadow.getElementById("download-conversation");

    launcher.addEventListener("click", () => {
      setPanelOpen(panel.dataset.open !== "true");
    });
    close.addEventListener("click", () => setPanelOpen(false));
    let panelDrag = null;
    panelHead.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      const rect = panel.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panelDrag = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        height: rect.height
      };
      panelHead.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    panelHead.addEventListener("pointermove", (event) => {
      if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
      const left = Math.min(
        Math.max(8, event.clientX - panelDrag.offsetX),
        Math.max(8, window.innerWidth - panelDrag.width - 8)
      );
      const top = Math.min(
        Math.max(8, event.clientY - panelDrag.offsetY),
        Math.max(8, window.innerHeight - panelDrag.height - 8)
      );
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    });
    const finishPanelDrag = (event) => {
      if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
      if (panelHead.hasPointerCapture(event.pointerId)) panelHead.releasePointerCapture(event.pointerId);
      panelDrag = null;
    };
    panelHead.addEventListener("pointerup", finishPanelDrag);
    panelHead.addEventListener("pointercancel", finishPanelDrag);
    permissionHelp.addEventListener("click", async () => {
      try {
        await copyLatex("chrome://extensions");
        showToast("已复制 chrome://extensions，请打开 Tampermonkey 详情并允许用户脚本");
      } catch (error) {
        console.error("[ChatGPT Formula Copy] 权限页地址复制失败", error);
        showToast("请手动打开 chrome://extensions", true);
      }
    });
    controlShadow.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setPanelOpen(false);
        launcher.focus({ preventScroll: true });
      }
    });
    for (const tab of controlShadow.querySelectorAll('[role="tab"]')) {
      tab.addEventListener("click", () => activatePanelTab(tab.dataset.tab));
    }
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
      saveSetting("copyEnabled", copyEnabled);
      refreshControlState();
      showToast(copyEnabled ? "LaTeX 单击复制已开启" : "LaTeX 单击复制已关闭");
    });
    selectionToggle.addEventListener("click", () => {
      selectionCopyEnabled = !selectionCopyEnabled;
      saveSelectionCopyEnabled(selectionCopyEnabled);
      refreshControlState();
      showToast(selectionCopyEnabled ? "整段复制增强已开启" : "整段复制增强已关闭");
    });
    metadataToggle.addEventListener("click", () => {
      exportMetadataEnabled = !exportMetadataEnabled;
      saveSetting("exportMetadataEnabled", exportMetadataEnabled);
      refreshControlState();
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

    copySelectionMarkdown.addEventListener("click", async () => {
      const markdown = selectionToMarkdown();
      if (!markdown) {
        showToast("先选中一段内容", true);
        return;
      }
      try {
        await copyLatex(markdown);
        showToast("选中内容已复制 · Markdown");
      } catch (error) {
        console.error("[ChatGPT Formula Copy] 选区 Markdown 复制失败", error);
        showToast("复制失败，请检查剪贴板权限", true);
      }
    });

    copyLastResponse.addEventListener("click", async () => {
      const markdown = lastAssistantMarkdown();
      if (!markdown) {
        refreshControlState("没有找到可复制的 ChatGPT 回答");
        showToast("当前页面没有可复制的回答", true);
        return;
      }
      try {
        await copyLatex(markdown);
        refreshControlState("最后一条回答已复制为 Markdown");
        showToast("已复制最后一条回答 · Markdown");
      } catch (error) {
        console.error("[ChatGPT Formula Copy] 回答复制失败", error);
        showToast("回答复制失败，请检查剪贴板权限", true);
      }
    });

    copyConversation.addEventListener("click", async () => {
      const messages = collectConversationMessages();
      const markdown = buildConversationMarkdown(messages);
      if (!markdown) {
        refreshControlState("没有找到可复制的 ChatGPT 对话");
        showToast("当前页面没有可复制的对话", true);
        return;
      }
      try {
        await copyLatex(markdown);
        refreshControlState("完整对话已复制为 Markdown");
        showToast(`已复制完整对话 · ${messages.length} 条消息`);
      } catch (error) {
        console.error("[ChatGPT Formula Copy] 对话复制失败", error);
        showToast("对话复制失败，请检查剪贴板权限", true);
      }
    });

    downloadConversation.addEventListener("click", () => {
      try {
        const messages = collectConversationMessages();
        const filename = downloadMarkdown(buildConversationMarkdown(messages));
        refreshControlState(`已导出 ${messages.length} 条消息：${filename}`);
        showToast(`已下载 ${filename}`);
      } catch (error) {
        console.error("[ChatGPT Formula Copy] Markdown 导出失败", error);
        refreshControlState(error.message || "Markdown 导出失败");
        showToast(error.message || "Markdown 导出失败", true);
      }
    });

    document.body.appendChild(host);
    refreshControlState();
    const firstRun = !loadBooleanSetting("welcomeShown", false);
    if (firstRun) {
      saveSetting("welcomeShown", true);
    }
    if (pendingPanelTab) {
      const requestedTab = pendingPanelTab;
      pendingPanelTab = null;
      activatePanelTab(requestedTab);
      setPanelOpen(true);
    } else if (firstRun) {
      activatePanelTab("copy");
      setPanelOpen(true);
    }
    if (firstRun) {
      showToast("公式复制已就绪");
    }
  }

  async function handleFormulaPointerUp(event) {
    if (!copyEnabled || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;

    // 用户正在拖选整段内容时不触发单击复制，交给原生 copy 事件处理。
    const selection = globalThis.getSelection?.();
    if (selection && !selection.isCollapsed && selection.toString().trim()) return;

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
      flashFormula(formula);
      await copyLatex(output);
      const preview = output.length > 90 ? `${output.slice(0, 87)}…` : output;
      showToast(`已复制：${preview}`);
    } catch (error) {
      console.error("[ChatGPT LaTeX Copy] 复制失败", error);
      flashFormula(formula, true);
      showToast("复制失败：请确认脚本管理器已授予剪贴板权限", true);
    }
  }

  function ensureControl() {
    if (!document.body) return;
    if (!controlHost?.isConnected && !document.getElementById("gpt-formula-copy-control")) {
      controlShadow = null;
      controlHost = null;
      mountControl();
    }
  }

  function observeCurrentBody() {
    if (!document.body) return;
    if (!bodyObserver) {
      bodyObserver = new MutationObserver((records) => {
        if (!controlHost?.isConnected) queueMicrotask(ensureControl);
        const affectsMetrics = records.some((record) =>
          [...record.addedNodes, ...record.removedNodes].some((node) =>
            node instanceof Element && (
              node.matches(`${FORMULA_SELECTOR},${MESSAGE_SELECTOR}`) ||
              Boolean(node.querySelector(`${FORMULA_SELECTOR},${MESSAGE_SELECTOR}`))
            )
          )
        );
        if (affectsMetrics && !metricsRefreshTimer) {
          metricsRefreshTimer = setTimeout(() => {
            metricsRefreshTimer = 0;
            refreshControlState();
          }, 180);
        }
      });
    }
    bodyObserver.disconnect();
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  function installControlObservers() {
    if (!rootObserver) {
      rootObserver = new MutationObserver(() => {
        observeCurrentBody();
        if (!controlHost?.isConnected) queueMicrotask(ensureControl);
      });
      rootObserver.observe(document.documentElement, { childList: true });
    }
    observeCurrentBody();
  }

  function boot() {
    installStyles();
    window.addEventListener("pointerup", handleFormulaPointerUp, true);
    window.addEventListener("copy", handleSelectionCopy, true);
    if (document.body) {
      ensureControl();
      installControlObservers();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        ensureControl();
        installControlObservers();
      }, { once: true });
      installControlObservers();
    }
    console.info("[ChatGPT 公式复制] initialized", location.href);
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
    formatLatexForCopy,
    normalizeSelectionText,
    convertSelectionToLatex,
    selectionToMarkdown,
    serializeElementToMarkdown,
    collectConversationMessages,
    buildConversationMarkdown,
    lastAssistantMarkdown,
    safeMarkdownFilename,
    downloadMarkdown,
    copyLatex,
    openControlPanel(tab = "copy") {
      const requestedTab = ["copy", "export", "settings"].includes(tab) ? tab : "copy";
      if (!controlShadow) {
        pendingPanelTab = requestedTab;
        return true;
      }
      activatePanelTab(requestedTab);
      setPanelOpen(true);
      return true;
    },
    getStatus() {
      return {
        version: "5.0.0",
        formulaCount: formulaCount(),
        messageCount: visibleConversationMessageElements().length,
        copyEnabled,
        selectionCopyEnabled,
        copyFormat
      };
    }
  });
})();
