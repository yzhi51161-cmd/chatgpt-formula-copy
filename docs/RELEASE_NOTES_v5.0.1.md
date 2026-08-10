# ChatGPT Formula Copy v5.0.1

v5.0.1 makes the latest visual refinements reachable for people who already installed v5.0.0, and adds a clear update reminder for future releases.

## Update behavior

- The Userscript version is now `5.0.1`; Tampermonkey and Violentmonkey can detect it through the existing update URL.
- The panel checks the public version metadata at most once every 24 hours. If a newer release is available, it shows a persistent update link in the panel.
- The version check reads only the public script metadata. It never includes ChatGPT messages, formulas, selections, or clipboard data.

## Also included

- Sharper focused panel logo.
- A more visible project Star chip near the title.
- An always-visible `EN` / `Chinese` UI switch in the panel header.

## Install

Download `chatgpt-latex-copy.user.js`, then open it with Tampermonkey or Violentmonkey and confirm the installation.

The Userscript does not create a separate browser toolbar icon. Refresh ChatGPT and look for the Formula Copy control in the lower-right corner.

## Release file

- `chatgpt-latex-copy.user.js` — the only file users need to install.
