# Changelog

## 5.0.0 - 2026-08-09

- Redesigned the in-page control as an animated Copy / Export / Settings toolkit.
- Added live Chrome popup status and a no-new-permission bridge to open the page tools.
- Added Markdown copy for the latest assistant response and the full current conversation.
- Added Markdown copy for the current selection and a focused conversation-extraction pane.
- Reworked the draggable page panel and popup into a fresh blue, dreamlike visual style with a new local icon and shorter UI copy.
- Added local `.md` downloads preserving headings, emphasis, lists, quotes, code blocks, tables, links, image references, and LaTeX.
- Replaced the 1.2-second UI recovery poll with targeted `MutationObserver` recovery.
- Added a reusable clipboard textarea and linear top-level formula deduplication; formula source and display mode stay live for streaming answers.
- Documented Chrome 138+ Tampermonkey “Allow User Scripts” requirements, clarified standalone-extension permissions, and added a compact in-UI address helper.
- Added reproducible icon and UI-preview generation scripts.
- Added rich-export, 250-formula performance, immediate control recovery, MV3 messaging, popup, and download tests.

## 4.1.0 - 2026-08-09

- Added mixed-selection copy: normal text is preserved while formulas become LaTeX.
- Supports Ctrl+C and context-menu Copy for selections containing formulas.
- Avoids triggering one-click copy while the user is dragging a text selection.
- Added a persistent control-panel switch for selection-copy enhancement.

## 4.0.0 - 2026-08-07

- Adapted formula extraction to the current ChatGPT `data-math-source` DOM.
- Added reliable clipboard writes through the Userscript API.
- Added automatic `$...$` and `$$...$$` delimiters.
- Compacted safe multiline LaTeX while preserving semantic line breaks.
- Added persistent output modes, status UI, self-healing controls, and narrow diagnostics.
- Added automated syntax and browser smoke tests.
