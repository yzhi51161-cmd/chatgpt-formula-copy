# ChatGPT Formula Copy

[![Version](https://img.shields.io/badge/version-4.0.0-22c55e)](https://github.com/yzhi51161-cmd/chatgpt-formula-copy/releases/tag/v4.0.0)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Install](https://img.shields.io/badge/install-Userscript-16a34a)](https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js)

[简体中文](./README.md) · [Install](https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js) · [Report a bug](https://github.com/yzhi51161-cmd/chatgpt-formula-copy/issues/new?template=bug_report.yml)

A lightweight, network-free Userscript for copying formulas from ChatGPT as clean LaTeX with one click. It automatically wraps inline math with `$...$` and display math with `$$...$$`.

## Why

Recent ChatGPT frontend changes can make formulas selectable without exposing the original LaTeX to ordinary clipboard extensions. This script reads only the clicked formula and copies its source through the Userscript clipboard API.

## Features

- Supports the current `data-math-source` structure on `chatgpt.com`.
- Falls back to KaTeX, MathML, ARIA, and common math data attributes.
- Offers automatic Markdown delimiters, always-inline delimiters, or raw LaTeX.
- Compacts unnecessary line breaks without changing LaTeX semantics.
- Handles streaming responses and SPA navigation.
- Makes no network requests and does not read entire conversations.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or Violentmonkey.
2. Open the [direct install link](https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js).
3. Confirm installation in your Userscript manager.
4. Refresh `https://chatgpt.com/`. A green **公式复制** button should appear in the lower-right corner.

## Use

Click any formula in a ChatGPT answer. A green outline and toast confirm a successful copy.

```latex
$a_{i,j}=q_i^\top k_j$
```

Use the **公式复制** control to change output mode, test the clipboard, pause click-to-copy, or collect a narrow formula-DOM diagnostic.

## Development

```bash
npm install
npm test
```

## Contributing

If a formula cannot be copied or is copied incorrectly, open a [bug report](https://github.com/yzhi51161-cmd/chatgpt-formula-copy/issues/new?template=bug_report.yml) with a non-sensitive minimal example.

## License

[MIT](./LICENSE)

> Unofficial community tool. Not affiliated with or endorsed by OpenAI.