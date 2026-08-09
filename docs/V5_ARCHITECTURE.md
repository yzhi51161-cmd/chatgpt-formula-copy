# v5 architecture and Voyager research notes

## Product boundary

Version 5 keeps one coherent purpose: help users move math-rich ChatGPT content into portable text formats without losing the underlying formula source.

The supported workflows are:

1. copy one formula as LaTeX;
2. copy a mixed text-and-formula selection;
3. copy the latest assistant answer as Markdown;
4. copy or download the current conversation as Markdown.

This boundary deliberately excludes unrelated chatbot customization, account automation, remote synchronization, prompt marketplaces, usage metering, and visual effects.

## What was learned from Voyager

[Voyager](https://github.com/Nagi-ovo/voyager) is a broad AI-chat enhancement suite. Its feature set includes folders, prompts, timelines, exports, formula copying, reading-width controls, usage displays, plugins, and platform adapters. The useful product lessons for this project are:

- export should be a first-class workflow rather than a hidden utility;
- site-specific DOM discovery should be separated from format generation;
- copied/exported content should preserve semantic structures such as code, tables, links, images, and formulas;
- long-running page enhancements need explicit lifecycle and cleanup behavior;
- the UI should expose status and feature groups instead of presenting a flat list of buttons.

Voyager is licensed under **GPL-3.0**, while this repository is MIT-licensed. No Voyager source code, styles, or assets are copied into this repository. Version 5 is an independent implementation based on public product behavior and our own DOM serializer, tests, UI, and lifecycle design.

## Runtime architecture

`chatgpt-latex-copy.user.js` remains the authoritative runtime source for both editions:

- Userscript managers execute it directly and provide `GM_*` APIs.
- `scripts/build_chrome_extension.py` removes the metadata header, supplies a small `chrome.storage.local` compatibility layer, and generates the MV3 content script.
- The Chrome wrapper also exposes a narrow status/open-panel message bridge for the popup. It does not expose conversation content to the popup.

The extension still declares only the `storage` API permission and ChatGPT-only static content-script matches. Markdown downloads use a local `Blob` and a temporary anchor, so no `downloads` permission is needed.

## Formula-copy performance

Version 5 removes or bounds the previously avoidable work:

- formula source and display mode are resolved at interaction time so in-place streaming updates cannot return stale LaTeX;
- a reusable hidden textarea replaces per-copy textarea allocation for the legacy clipboard fallback;
- top-level formula deduplication uses a candidate `Set` plus ancestor traversal instead of comparing every candidate with every other candidate;
- the 1.2-second `setInterval` control check is replaced by event-driven observers; relevant formula/message insertions refresh metrics through a short coalescing delay;
- visual feedback starts before the clipboard Promise settles, while failures replace it with an error state.

The browser test converts a selection containing 250 formulas and enforces a generous latency ceiling to catch accidental quadratic regressions.

## Markdown conversion

The exporter clones only message content and performs all work locally. Before serialization, it replaces top-level rendered formulas with protected Markdown-LaTeX tokens and removes interactive UI controls.

The independent serializer supports:

- paragraphs and headings;
- bold, italic, strike-through, superscript, and subscript;
- ordered and unordered lists;
- block quotes and horizontal rules;
- inline code and fenced code blocks with language hints;
- links and non-blob image references;
- Markdown tables;
- inline and display LaTeX.

Code blocks and tables are temporarily stashed while surrounding whitespace is normalized, preventing conversation-level cleanup from modifying code content.

## Known boundaries

- Images are referenced by URL; they are not downloaded or bundled into a ZIP.
- Blob-backed images are represented by a readable placeholder because the blob URL will not survive outside the page.
- The exporter reads the currently rendered branch of the current conversation only.
- ChatGPT DOM selectors can change. Export tests cover representative structures, while formula diagnostics remain intentionally narrow to avoid collecting a conversation.

## Userscript permission limitation

On Chrome 138+, Tampermonkey requires the user to enable **Allow User Scripts** on Tampermonkey's extension details page. If that switch is off, this Userscript never executes and therefore cannot detect the problem or open the setting itself. Version 5 addresses the part that is technically possible:

- README installation guidance puts the permission step before troubleshooting;
- the first successful execution opens the tool once and shows a confirmation toast;
- the green launcher is the explicit success indicator;
- troubleshooting distinguishes installation, Chrome permission, site access, and runtime-init failures.

The packaged MV3 Chrome extension does not depend on the `chrome.userScripts` API or this Tampermonkey switch.
