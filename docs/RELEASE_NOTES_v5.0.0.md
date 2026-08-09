# ChatGPT Formula Copy v5.0.0

v5.0.0 brings formula copying, mixed-selection conversion, and Markdown conversation export into one compact, draggable panel with a softer translucent blue design and a larger icon.

## Install

Download `chatgpt-latex-copy.user.js`, then open it with Tampermonkey or Violentmonkey and confirm the installation.

On Chrome 138+ with Tampermonkey 5.3+, right-click Tampermonkey → **Manage extension** → enable **Allow User Scripts**. On older Chrome versions, enable **Developer mode** on the extensions page.

The Userscript does not create a separate browser toolbar icon. Refresh ChatGPT and look for the **公式复制** button in the lower-right corner.

## Highlights

- Copy individual ChatGPT formulas as clean LaTeX.
- Copy mixed text-and-formula selections with Markdown math delimiters.
- Choose automatic `$` / `$$`, always-inline, or raw LaTeX output.
- Copy a selection, the latest answer, or the full conversation as Markdown.
- Use **提取对话内容为md** to download the current conversation as an `.md` file.
- Preserve headings, lists, quotes, code blocks, tables, links, images, and formulas in exports.
- Use the compact permission helper at the bottom of the panel when troubleshooting Tampermonkey setup.
- Process all page content locally without uploads or remote code.

## Release file

- `chatgpt-latex-copy.user.js` — the only file users need to install.
