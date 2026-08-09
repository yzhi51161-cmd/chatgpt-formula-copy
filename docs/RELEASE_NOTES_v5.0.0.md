# ChatGPT 公式复制 v5.0.0

v5.0.0 将单公式复制、混合选区复制和对话 Markdown 提取整理到一套更完整的 UI 中，并更新为与蓝色 Logo 协调的清新梦幻风格。

## 下载与安装

### 油猴版

下载 `chatgpt-latex-copy.user.js`，或直接打开仓库中的 Raw 链接安装。

Chrome 138+ 配合 Tampermonkey 5.3+ 时，需要在 Tampermonkey 的“管理扩展程序”页面打开“允许运行用户脚本”。旧版 Chrome 需要打开扩展管理页的“开发者模式”。油猴版不会创建独立的浏览器工具栏图标；刷新 ChatGPT 后，页面右下角出现“公式复制”才表示脚本已运行。

### Chrome MV3 扩展版

下载 `chatgpt-formula-copy-chrome-v5.0.0.zip` 并完整解压，然后在地址栏输入 `chrome://extensions`，打开“开发者模式”，选择“加载已解压的扩展程序”。这个独立扩展使用静态 `content_scripts`，不需要 Tampermonkey 的“允许运行用户脚本”开关。

请只启用油猴版或 Chrome 扩展版其中一种。

## v5.0.0 主要更新

- 支持单击公式复制 LaTeX，以及混合文字与公式的整段复制。
- 支持 Markdown 自动分隔符、始终行内和仅 LaTeX 三种格式。
- 支持把选区、最近回答或完整对话复制为 Markdown，也可下载 `.md`。
- Markdown 导出保留标题、列表、引用、代码块、表格、链接、图片和公式。
- 新增可拖动的“公式复制 / 对话提取 / 设置”面板和 Chrome Popup。
- 更新蓝色梦幻清新 UI 与本地 Logo；移除复制代码快捷按钮，代码块仍会保留在 Markdown 导出中。
- 页面内容只在本机处理，不上传服务器，也不加载远程代码。

## Release 文件

- `chatgpt-latex-copy.user.js`：Tampermonkey / Violentmonkey Userscript。
- `chatgpt-formula-copy-chrome-v5.0.0.zip`：可解压加载的 Chrome Manifest V3 扩展。
