# Changelog

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
