// ==UserScript==
// @name         ChatGPT 公式小站
// @namespace    chatgpt-formula-copy.share
// @version      5.0.0
// @license      MIT
// @description  轻松带走 ChatGPT 的公式、选区、回答、代码和 Markdown 对话。
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
      outline: 2px solid #79bfa4 !important;
      outline-offset: 3px !important;
      border-radius: 7px !important;
      background: rgba(219, 244, 234, 0.62) !important;
    }

    .gpt-latex-copy-flash {
      outline: 2px solid #62ad90 !important;
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

  function collectAssistantCodeBlocks(root = document) {
    const blocks = [];
    for (const message of visibleConversationMessageElements(root)) {
      if (message.getAttribute("data-message-author-role") !== "assistant") continue;
      for (const pre of messageContentElement(message).querySelectorAll("pre")) {
        const code = pre.querySelector("code") || pre;
        const text = (code.textContent || "").replace(/\r\n?/g, "\n").replace(/^\n|\n$/g, "");
        if (!text.trim()) continue;
        const language = codeBlockLanguage(pre, code);
        blocks.push({ text, language, markdown: fencedCodeMarkdown(text, language) });
      }
    }
    return blocks;
  }

  function allAssistantCodeMarkdown(root = document) {
    return collectAssistantCodeBlocks(root).map(({ markdown }) => markdown).join("\n\n");
  }

  function lastAssistantCode(root = document) {
    return collectAssistantCodeBlocks(root).at(-1)?.text || "";
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
    launcher.title = "打开公式小站";
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
          color-scheme: dark;
          --accent: #10b981;
          --accent-strong: #059669;
          --accent-soft: rgba(16,185,129,.14);
          --panel: rgba(14,18,24,.94);
          --panel-2: rgba(31,41,55,.72);
          --surface: rgba(255,255,255,.065);
          --surface-hover: rgba(255,255,255,.105);
          --border: rgba(255,255,255,.12);
          --text: #f8fafc;
          --muted: #9ca3af;
        }
        * { box-sizing: border-box; }
        button, select, textarea { font: inherit; }
        button { -webkit-tap-highlight-color: transparent; }
        #launcher {
          display: flex; align-items: center; gap: 8px; min-height: 42px;
          padding: 7px 9px 7px 8px; border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px; background: linear-gradient(135deg,#10b981,#087f5b);
          box-shadow: 0 10px 32px rgba(0,0,0,.30), 0 0 0 1px rgba(16,185,129,.08);
          color: #fff; cursor: pointer;
          font: 650 13px/1 system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
        }
        #launcher:hover { transform: translateY(-2px); filter: brightness(1.07); box-shadow: 0 14px 38px rgba(0,0,0,.34); }
        #launcher:active { transform: translateY(0) scale(.98); }
        #launcher:focus-visible, button:focus-visible, select:focus-visible { outline: 2px solid #6ee7b7; outline-offset: 2px; }
        #launcher[data-enabled="false"] { background: linear-gradient(135deg,#52525b,#3f3f46); }
        #launcher-icon {
          display:grid; place-items:center; width:28px; height:28px; border-radius:50%;
          background:rgba(255,255,255,.18); font:700 17px/1 Georgia,serif;
        }
        #launcher-count {
          display:grid; place-items:center; min-width:22px; height:22px; padding:0 6px;
          border-radius:999px; background:rgba(0,0,0,.20); color:#d1fae5; font-size:11px;
        }
        #panel {
          position: absolute; right: 0; bottom: 54px; width: min(360px, calc(100vw - 28px));
          padding: 15px; border: 1px solid var(--border); border-radius: 20px;
          background: var(--panel); backdrop-filter: blur(22px) saturate(1.2);
          box-shadow: 0 24px 80px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.05);
          color: var(--text); font: 13px/1.45 system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
          opacity: 0; visibility: hidden; pointer-events: none;
          transform: translateY(10px) scale(.975); transform-origin: right bottom;
          transition: opacity .18s ease, transform .18s ease, visibility .18s;
        }
        #panel[data-open="true"] { opacity:1; visibility:visible; pointer-events:auto; transform:translateY(0) scale(1); }
        #panel-head { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        #brand { display:flex; align-items:center; gap:10px; min-width:0; }
        #brand-icon {
          display:grid; place-items:center; width:38px; height:38px; flex:none; border-radius:12px;
          background:linear-gradient(145deg,#34d399,#047857); box-shadow:inset 0 1px rgba(255,255,255,.35);
          color:#fff; font:700 22px/1 Georgia,serif;
        }
        #brand-title { font-weight:750; font-size:14px; letter-spacing:.01em; }
        #brand-subtitle { margin-top:2px; color:var(--muted); font-size:11px; }
        #close {
          display:grid; place-items:center; width:30px; height:30px; border:0; border-radius:9px;
          background:transparent; color:var(--muted); cursor:pointer; font-size:19px;
        }
        #close:hover { background:var(--surface-hover); color:var(--text); }
        #status {
          margin:12px 0 0; padding:8px 10px; border:1px solid rgba(16,185,129,.18);
          border-radius:10px; background:var(--accent-soft); color:#a7f3d0; font-size:11px;
        }
        #metrics { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
        .metric { padding:9px 10px; border:1px solid var(--border); border-radius:11px; background:var(--surface); }
        .metric strong { display:block; color:var(--text); font-size:17px; line-height:1.1; }
        .metric span { display:block; margin-top:3px; color:var(--muted); font-size:10px; }
        #tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; margin:12px 0 4px; padding:4px; border-radius:12px; background:rgba(0,0,0,.18); }
        .tab { padding:7px 5px; border:0; border-radius:9px; background:transparent; color:var(--muted); cursor:pointer; font-weight:650; }
        .tab[data-active="true"] { background:var(--surface-hover); color:var(--text); box-shadow:0 1px 4px rgba(0,0,0,.16); }
        .pane { padding-top:4px; }
        .pane[hidden] { display:none; }
        .action {
          display:flex; align-items:center; justify-content:space-between; gap:10px;
          width:100%; margin-top:8px; padding:10px 11px; border:1px solid var(--border);
          border-radius:11px; background:var(--surface); color:var(--text); cursor:pointer; text-align:left;
          transition:background .15s ease, border-color .15s ease, transform .15s ease;
        }
        .action:hover { background:var(--surface-hover); border-color:rgba(52,211,153,.32); transform:translateY(-1px); }
        .action.primary { border-color:rgba(52,211,153,.32); background:linear-gradient(135deg,rgba(16,185,129,.24),rgba(5,150,105,.14)); }
        .action-copy { color:var(--muted); font-size:11px; }
        .field { display:block; margin-top:8px; color:var(--muted); font-size:11px; }
        #format {
          width:100%; margin-top:5px; padding:9px 10px; border:1px solid var(--border);
          border-radius:10px; background:#20262f; color:var(--text); cursor:pointer;
        }
        .switch-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 1px; border-bottom:1px solid rgba(255,255,255,.07); }
        .switch-copy strong { display:block; font-size:12px; }
        .switch-copy span { display:block; margin-top:2px; color:var(--muted); font-size:10px; }
        .switch {
          position:relative; width:38px; height:22px; flex:none; padding:0; border:0; border-radius:999px;
          background:#4b5563; cursor:pointer; transition:background .18s ease;
        }
        .switch::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.3); transition:transform .18s ease; }
        .switch[data-on="true"] { background:var(--accent); }
        .switch[data-on="true"]::after { transform:translateX(16px); }
        .hint { margin:10px 1px 0; color:var(--muted); font-size:10px; line-height:1.5; }
        #diagnostic-text {
          width:100%; height:112px; margin-top:8px; padding:8px; border:1px solid var(--border);
          border-radius:10px; resize:vertical; background:#080b0f; color:#e5e7eb; font:10px/1.4 Consolas,monospace;
        }
        #diagnostic-text[hidden] { display: none; }
        #footer { margin:11px 1px 0; color:#6b7280; font-size:9px; text-align:center; }

        :host {
          color-scheme: light;
          --accent: #79ad98;
          --accent-strong: #5f927f;
          --accent-soft: #eaf6f0;
          --panel: #fffaf4;
          --panel-2: #fff4f6;
          --surface: rgba(255,255,255,.78);
          --surface-hover: #fff;
          --border: #eadfe0;
          --text: #4f4a50;
          --muted: #93878e;
        }
        #launcher {
          min-height: 44px; padding: 7px 11px 7px 7px;
          border-color: #ead9dc;
          background: linear-gradient(135deg, #fffdf9 0%, #fff2f4 55%, #edf8f2 100%);
          box-shadow: 0 9px 26px rgba(121,91,101,.16), inset 0 1px #fff;
          color: #665b62;
        }
        #launcher:hover { filter:none; transform:translateY(-2px) rotate(-.4deg); box-shadow:0 13px 31px rgba(121,91,101,.2); }
        #launcher[data-enabled="false"] { background:#f4f0ef; color:#9d9698; }
        #launcher-icon {
          background: linear-gradient(145deg,#f6c4cf,#ef9fb2);
          color:#fff; box-shadow:inset 0 1px rgba(255,255,255,.7), 0 3px 8px rgba(215,132,153,.22);
        }
        #launcher-count { background:#e9f5ef; color:#628e7d; }
        #launcher:focus-visible, button:focus-visible, select:focus-visible { outline-color:#e79daf; }
        #panel {
          width:min(372px,calc(100vw - 24px)); padding:16px;
          border-color:#ead9dc; border-radius:24px;
          background:
            radial-gradient(circle at 92% 5%,rgba(246,196,207,.36),transparent 23%),
            radial-gradient(circle at 7% 92%,rgba(181,222,205,.30),transparent 28%),
            var(--panel);
          backdrop-filter:blur(18px) saturate(1.06);
          box-shadow:0 24px 64px rgba(107,82,91,.23),inset 0 1px rgba(255,255,255,.95);
          color:var(--text);
        }
        #panel::before {
          content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none; opacity:.24;
          background-image:radial-gradient(#d9bbbF 0.55px,transparent 0.55px);
          background-size:7px 7px;
        }
        #panel > * { position:relative; z-index:1; }
        #brand-icon {
          border-radius:14px; background:linear-gradient(145deg,#f7cbd4,#eda6b7);
          box-shadow:inset 0 1px rgba(255,255,255,.75),0 5px 12px rgba(213,131,152,.18);
        }
        #brand-title { color:#594f55; font-size:15px; }
        #brand-subtitle { color:#a08f98; letter-spacing:.02em; }
        #close { color:#aa969e; }
        #close:hover { background:#fff0f3; color:#cf7f94; }
        #status {
          border-color:#cfe7db; background:rgba(234,246,240,.86); color:#608a79;
        }
        .metric { border-color:#eadfe0; background:rgba(255,255,255,.72); box-shadow:0 3px 10px rgba(110,85,94,.05); }
        .metric:first-child { background:rgba(236,248,243,.84); }
        .metric:last-child { background:rgba(255,240,243,.82); }
        .metric strong { color:#61565d; }
        #tabs { background:rgba(238,229,229,.62); }
        .tab { color:#9a8c93; }
        .tab[data-active="true"] { background:#fffdf9; color:#6f625f; box-shadow:0 3px 9px rgba(112,86,95,.1); }
        .action {
          border-color:#eadfe0; border-radius:13px; background:rgba(255,255,255,.72); color:#5e555a;
          box-shadow:0 2px 8px rgba(116,88,98,.04);
        }
        .action:hover { background:#fff; border-color:#e8bdc7; box-shadow:0 7px 15px rgba(121,91,101,.09); transform:translateY(-2px); }
        .action.primary { border-color:#cde3d9; background:linear-gradient(135deg,#edf8f3,#fff8f4); }
        .action-copy { padding:2px 7px; border-radius:999px; background:#f7eff0; color:#9b8189; }
        .field { color:#8f8288; }
        #format { border-color:#e6dadd; background:#fffdf9; color:#62575d; }
        .switch-row { border-bottom-color:#eee4e3; }
        .switch-copy strong { color:#61565d; }
        .switch { background:#d8cdcf; }
        .switch::after { box-shadow:0 2px 5px rgba(88,68,75,.18); }
        .switch[data-on="true"] { background:#83b59f; }
        #diagnostic-text { border-color:#e3d6d8; background:#fffdf9; color:#62575d; }
        #footer { color:#ac9ea4; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration:.01ms!important; animation-duration:.01ms!important; } }
      </style>
      <div id="panel" data-open="false" aria-hidden="true">
        <div id="panel-head">
          <div id="brand"><span id="brand-icon">Σ</span><div><div id="brand-title">公式小站</div><div id="brand-subtitle">复制 LaTeX · 收好对话</div></div></div>
          <button id="close" type="button" aria-label="关闭面板">×</button>
        </div>
        <p id="status"></p>
        <div id="metrics"><div class="metric"><strong id="formula-metric">0</strong><span>页内公式</span></div><div class="metric"><strong id="message-metric">0</strong><span>对话消息</span></div></div>
        <div id="tabs" role="tablist" aria-label="工具分类">
          <button class="tab" type="button" role="tab" data-tab="copy" data-active="true" aria-selected="true">复制</button>
          <button class="tab" type="button" role="tab" data-tab="export" data-active="false" aria-selected="false">整理</button>
          <button class="tab" type="button" role="tab" data-tab="settings" data-active="false" aria-selected="false">设置</button>
        </div>
        <section class="pane" role="tabpanel" data-pane="copy">
          <label class="field" for="format">复制格式<select id="format"><option value="smart">自动添加 $ / $$</option><option value="inline">统一用 $...$</option><option value="raw">只要 LaTeX</option></select></label>
          <button id="test" class="action primary" type="button"><span>复制一条示例</span><span class="action-copy">试试看 →</span></button>
        </section>
        <section class="pane" role="tabpanel" data-pane="export" hidden>
          <button id="copy-selection-markdown" class="action" type="button"><span>复制选中内容</span><span class="action-copy">Markdown</span></button>
          <button id="copy-last-response" class="action" type="button"><span>复制最近回答</span><span class="action-copy">Markdown</span></button>
          <button id="copy-last-code" class="action" type="button"><span>复制最近代码</span><span class="action-copy">纯代码</span></button>
          <button id="copy-all-code" class="action" type="button"><span>复制全部代码</span><span class="action-copy">Markdown</span></button>
          <button id="copy-conversation" class="action" type="button"><span>复制整段对话</span><span class="action-copy">Markdown</span></button>
          <button id="download-conversation" class="action primary" type="button"><span>保存为 Markdown</span><span class="action-copy">.md ↓</span></button>
          <div class="switch-row"><div class="switch-copy"><strong>附上来源与时间</strong><span>放在文档开头</span></div><button id="metadata-toggle" class="switch" type="button" role="switch" aria-label="附上来源与时间"></button></div>
        </section>
        <section class="pane" role="tabpanel" data-pane="settings" hidden>
          <div class="switch-row"><div class="switch-copy"><strong>点按公式复制</strong><span>轻点一下，马上复制</span></div><button id="toggle" class="switch" type="button" role="switch" aria-label="点按公式复制"></button></div>
          <div class="switch-row"><div class="switch-copy"><strong>整段复制</strong><span>文字和公式一起带走</span></div><button id="selection-toggle" class="switch" type="button" role="switch" aria-label="整段复制"></button></div>
          <button id="diagnostic" class="action" type="button"><span>复制排查信息</span><span class="action-copy">遇到问题时</span></button>
          <textarea id="diagnostic-text" readonly hidden aria-label="公式诊断信息"></textarea>
        </section>
        <div id="footer">只在本机整理 · 不上传</div>
      </div>
      <button id="launcher" type="button" aria-expanded="false">
        <span id="launcher-icon">Σ</span><span>公式小站</span><span id="launcher-count">0</span>
      </button>
    `;

    const launcher = controlShadow.getElementById("launcher");
    const panel = controlShadow.getElementById("panel");
    const close = controlShadow.getElementById("close");
    const test = controlShadow.getElementById("test");
    const diagnostic = controlShadow.getElementById("diagnostic");
    const diagnosticText = controlShadow.getElementById("diagnostic-text");
    const toggle = controlShadow.getElementById("toggle");
    const selectionToggle = controlShadow.getElementById("selection-toggle");
    const metadataToggle = controlShadow.getElementById("metadata-toggle");
    const format = controlShadow.getElementById("format");
    const copySelectionMarkdown = controlShadow.getElementById("copy-selection-markdown");
    const copyLastResponse = controlShadow.getElementById("copy-last-response");
    const copyLastCode = controlShadow.getElementById("copy-last-code");
    const copyAllCode = controlShadow.getElementById("copy-all-code");
    const copyConversation = controlShadow.getElementById("copy-conversation");
    const downloadConversation = controlShadow.getElementById("download-conversation");

    launcher.addEventListener("click", () => {
      setPanelOpen(panel.dataset.open !== "true");
    });
    close.addEventListener("click", () => setPanelOpen(false));
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

    copyLastCode.addEventListener("click", async () => {
      const code = lastAssistantCode();
      if (!code) {
        showToast("当前回答里没有代码", true);
        return;
      }
      try {
        await copyLatex(code);
        showToast("最新代码已复制");
      } catch (error) {
        console.error("[ChatGPT Formula Copy] 最新代码复制失败", error);
        showToast("复制失败，请检查剪贴板权限", true);
      }
    });

    copyAllCode.addEventListener("click", async () => {
      const blocks = collectAssistantCodeBlocks();
      if (!blocks.length) {
        showToast("当前对话里没有代码", true);
        return;
      }
      try {
        await copyLatex(blocks.map(({ markdown }) => markdown).join("\n\n"));
        showToast(`已复制 ${blocks.length} 个代码块`);
      } catch (error) {
        console.error("[ChatGPT Formula Copy] 全部代码复制失败", error);
        showToast("复制失败，请检查剪贴板权限", true);
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
      showToast("公式小站已就绪");
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
    console.info("[ChatGPT 公式小站] initialized", location.href);
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
    collectAssistantCodeBlocks,
    allAssistantCodeMarkdown,
    lastAssistantCode,
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
