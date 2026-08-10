# ChatGPT Formula Copy v5.0.2

v5.0.2 makes the update reminder less chatty while keeping the normal Userscript-manager update path intact.

## Update behavior

- Tampermonkey and Violentmonkey continue to use the declared update URL for normal Userscript updates.
- The panel's visible fallback check now runs at most once every **3 days**, rather than once per day.
- When the installed version is current, the panel shows no update notice at all.
- The check reads only the public script version metadata. It never includes ChatGPT messages, formulas, selections, or clipboard data.

## Release file

- `chatgpt-latex-copy.user.js` — the only file users need to install.
