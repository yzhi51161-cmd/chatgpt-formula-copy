# ChatGPT 公式一键复制

一个轻量、无网络请求的 Userscript。单击 ChatGPT 回答中的公式，即可复制规整的 LaTeX。

## 功能

- 兼容当前 `chatgpt.com` 的 `data-math-source` 公式结构。
- 默认输出 Markdown 数学格式：行内 `$...$`，独立公式 `$$...$$`。
- 自动清理首尾空白，并在不改变 LaTeX 语义的前提下压缩多余换行。
- 支持三种复制格式：
  - Markdown（自动 `$ / $$`）
  - 始终 `$...$`
  - 仅 LaTeX
- 复制格式会自动保存。
- 使用 Userscript 原生剪贴板 API，避免页面 Clipboard API 的权限限制。
- 支持流式生成和 SPA 页面更新；控制按钮被页面替换后会自动恢复。
- 内置窄范围公式 DOM 诊断，便于前端结构变化后的快速适配。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 Violentmonkey。
2. 点击 [直接安装脚本](https://raw.githubusercontent.com/yzhi51161-cmd/chatgpt-formula-copy/main/chatgpt-latex-copy.user.js)。
3. 在脚本管理器的安装页面确认安装。
4. 打开或刷新 `https://chatgpt.com/`，页面右下角应出现绿色的 **公式复制** 按钮。

也可以在脚本管理器中新建脚本，粘贴 `chatgpt-latex-copy.user.js` 的完整内容后保存。

## 使用

直接单击 ChatGPT 回答中的公式。复制成功后，公式会短暂显示绿色边框，并出现提示。

默认输出示例：

```latex
$a_{i,j}=q_i^\top k_j$
```

```latex
$$\int_{-\infty}^{\infty}e^{-x^2}\,dx=\sqrt{\pi}$$
```

点击右下角 **公式复制** 可以：

- 切换复制格式；
- 复制示例公式测试剪贴板；
- 暂停或重新开启单击复制；
- 在公式提取失败时复制诊断信息。

## 格式与兼容性

脚本优先读取新版 ChatGPT 的 `data-math-source`，并依次兼容：

- `role="math"` 的 `aria-label`
- KaTeX `annotation[encoding="application/x-tex"]`
- `data-math`
- `data-latex`
- `data-tex`
- MathML `alttext`

多行公式会在安全时压成一行。`aligned`、矩阵中的 `\\`、`\mathbf`、`\text{}` 等语义保持不变；如果源码包含未转义 `%` 注释，则保留换行，避免改变公式含义。

## 隐私与权限

脚本：

- 不读取完整对话；
- 不发起网络请求；
- 不上传任何数据；
- 只申请剪贴板写入和格式设置存储权限。

失败诊断仅包含被点击公式自身的有限 DOM、属性和祖先标签摘要。

## 本地测试

要求：Node.js、Google Chrome。

```bash
npm install
npm test
```

如 Chrome 不在系统默认位置，可设置 `CHROME_PATH`：

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm test
```

Smoke test 覆盖当前 ChatGPT DOM、KaTeX/MathML 后备、智能 `$ / $$`、复杂 `aligned` 公式压缩、格式持久化、控制按钮自愈和失败诊断。

## License

[MIT](./LICENSE)

> 本项目为非官方工具，与 OpenAI 无隶属或授权关系。