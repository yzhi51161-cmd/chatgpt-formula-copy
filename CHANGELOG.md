# Changelog

## 5.0.1 - 2026-08-10

- Bumped the Userscript version so existing v5.0.0 installations can receive the visual refinements through the declared update URL.
- Added a once-per-24-hour version check and a persistent in-panel update link. It reads only the public script metadata and never sends ChatGPT content.

## 5.0.0 - 2026-08-09

- Redesigned the in-page control as an animated Copy / Export / Settings toolkit.
- Added Markdown copy for the latest assistant response and the full current conversation.
- Added Markdown copy for the current selection and a focused conversation-extraction pane.
- Reworked the draggable page panel with lighter typography, more breathing room, softer translucent frames, and a high-DPI icon generated from the original 1254px artwork.
- Refined the page-panel logo into a focused 256px crop for clearer face and formula details, moved the project Star link into the header, and exposed the `EN` / `Chinese` language switch there as well.
- Added a persistent Chinese / English UI switch in Settings, including localized status and toast messages.
- Added local `.md` downloads preserving headings, emphasis, lists, quotes, code blocks, tables, links, image references, and LaTeX.
- Replaced the 1.2-second UI recovery poll with targeted `MutationObserver` recovery.
- Added a reusable clipboard textarea and linear top-level formula deduplication; formula source and display mode stay live for streaming answers.
- Documented Chrome 138+ Tampermonkey “Allow User Scripts” requirements and added a compact in-UI address helper.
- Added reproducible icon and UI-preview generation scripts.
- Added rich-export, 250-formula performance, immediate control recovery, and download tests.

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
