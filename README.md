# ChatGPT 公式一键复制

[![Version](https://img.shields.io/badge/version-4.1.0-22c55e)](https://github.com/yzhi51161-cmd/chatgpt-formula-copy/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Install](https://img.shields.io/badge/安装-Userscript-16a34a)](https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js)

[English](./README_EN.md) · [直接安装](https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js) · [报告问题](https://github.com/yzhi51161-cmd/chatgpt-formula-copy/issues/new?template=bug_report.yml)

一个轻量、无网络请求的浏览器工具，同时提供 Userscript 与 Manifest V3 Chrome 扩展：既可单击公式直接复制，也可像普通文字一样框选整段后按 Ctrl+C；选区中的公式会自动替换为规整的 LaTeX，并使用 `$...$` 或 `$$...$$` 包裹。

> 解决新版 ChatGPT 公式“可以选中，但复制不到原始 LaTeX”的问题。

## 功能

- 兼容当前 `chatgpt.com` 的 `data-math-source` 公式结构。
- 默认输出 Markdown 数学格式：行内 `$...$`，独立公式 `$$...$$`。
- 自动清理首尾空白，并在不改变 LaTeX 语义的前提下压缩多余换行。
- 支持三种复制格式：Markdown 自动分隔符、始终行内分隔符、仅 LaTeX。
- 使用 Userscript 原生剪贴板 API，避免页面 Clipboard API 的权限限制。
- 支持流式生成和 SPA 页面更新；控制按钮被页面替换后会自动恢复。
- 支持整段复制增强：普通文字保持原顺序，公式自动转为 LaTeX。
- 内置窄范围公式 DOM 诊断，便于前端结构变化后的快速适配。

## 安装

### 一键安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 Violentmonkey。
2. 点击 [直接安装脚本](https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js)。
3. 在脚本管理器的安装页面确认安装。
4. 打开或刷新 `https://chatgpt.com/`，页面右下角应出现绿色的 **公式复制** 按钮。

### Chrome 扩展

Chrome Web Store 版本正在准备审核。开发者可运行 `npm run build:chrome`，生成 `dist/chatgpt-formula-copy-chrome-v4.1.0.zip`；ZIP 内的 `manifest.json` 位于压缩包根目录，可直接上传开发者后台。

请只启用 Chrome 扩展或 Userscript 其中一种，避免同一功能重复运行。

## 使用

直接单击 ChatGPT 回答中的公式。复制成功后，公式会短暂显示绿色边框，并出现提示。

也可以框选一段包含文字与公式的回答，然后使用 Ctrl+C 或右键复制。脚本只在选区内检测到公式时接管复制；纯文字选区仍由浏览器正常处理。

```latex
$a_{i,j}=q_i^\top k_j$
```

```latex
$$\int_{-\infty}^{\infty}e^{-x^2}\,dx=\sqrt{\pi}$$
```

点击右下角 **公式复制** 可以切换复制格式、测试剪贴板、暂停单击复制，或复制公式诊断信息。

## 格式与兼容性

脚本优先读取新版 ChatGPT 的 `data-math-source`，并兼容 ARIA、KaTeX、MathML 及常见公式属性。多行公式会在安全时压成一行；`aligned`、矩阵、`\mathbf`、`\text{}` 等语义保持不变。

## 隐私与权限

脚本不读取完整对话、不发起网络请求、不上传任何数据，只申请剪贴板写入和格式设置存储权限。失败诊断仅包含被点击公式自身的有限 DOM 摘要。

## 本地测试

```bash
npm install
npm test
npm run build:chrome
```

Chrome Web Store 的商店文案、权限说明和审核步骤见 [CHROME_WEB_STORE.md](./CHROME_WEB_STORE.md)，隐私政策见 [PRIVACY.md](./PRIVACY.md)。

## 参与贡献

发现公式无法复制或输出错误时，请使用 [Bug Report](https://github.com/yzhi51161-cmd/chatgpt-formula-copy/issues/new?template=bug_report.yml)，并只提供不含隐私信息的最小示例。

## License

[MIT](./LICENSE)

> 本项目为非官方工具，与 OpenAI 无隶属或授权关系。
