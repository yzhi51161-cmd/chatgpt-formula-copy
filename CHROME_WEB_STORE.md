# Chrome Web Store 发布资料

## 建议填写

- 名称：`ChatGPT 公式复制与 Markdown 导出`
- 摘要：`复制 ChatGPT 公式与混合选区，并将回答或整段对话导出为保留公式的 Markdown。`
- 类别：`生产力工具`
- 语言：`中文（简体）`，后续可增加英文商店本地化
- 官方网站：`https://github.com/yzhi51161-cmd/chatgpt-formula-copy`
- 支持网址：`https://github.com/yzhi51161-cmd/chatgpt-formula-copy/issues`
- 隐私政策：`https://github.com/yzhi51161-cmd/chatgpt-formula-copy/blob/main/PRIVACY.md`
- 可见性：`公开`
- 地区：`所有地区`

## 详细说明

ChatGPT 公式复制与 Markdown 导出让数学内容的复制、整理和保存重新变得像普通文字一样自然。

你可以直接单击 ChatGPT 回答中的公式，复制干净的 LaTeX；也可以框选一整段混合文字与公式，再按 Ctrl+C 或使用右键复制。扩展会保留普通文字的顺序，并把选区内的公式替换为带 `$...$` 或 `$$...$$` 分隔符的 LaTeX。

你还可以复制最后一条回答、复制完整对话，或把当前对话下载为 `.md` 文件。导出会保留标题、列表、粗体、引用、代码块、表格、链接、图片引用以及行内/独立公式。

主要功能：

- 单击公式复制 LaTeX
- 整段框选复制，自动转换其中的公式
- 自动区分行内公式与独立公式
- 支持纯 LaTeX、始终行内和 Markdown 自动分隔符模式
- 纯文字选区保持 Chrome 原生复制行为
- 最后一条回答复制为 Markdown
- 完整对话复制或下载为 Markdown
- Popup 显示当前页面连接状态、公式和消息数量
- 无广告、无网络请求、无远程代码
- 所有页面内容均只在本机处理

适合将 ChatGPT 数学内容粘贴到 Markdown、Obsidian、Typora、LaTeX 编辑器及其他支持数学公式的工具。

本项目为开源非官方工具，与 OpenAI 无隶属或授权关系。

## Privacy practices

### Single purpose

在 ChatGPT 页面中，将用户主动单击或框选的数学公式转换为 LaTeX，并把用户主动选择的当前回答或对话转换为 Markdown 以便复制或下载。

### Permission justification: storage

用于在用户设备本地保存复制格式、“整段复制增强”、导出元数据和首次运行提示等偏好；不进行同步或网络传输。

### Host access justification

扩展只在 `chatgpt.com` 和旧版 `chat.openai.com` 页面运行，以读取已渲染公式的 LaTeX 来源，并在用户主动触发时转换当前回答或对话 DOM。该访问用于公式复制、混合选区复制和 Markdown 导出，所有处理均在本机完成。

### Remote code

选择：`否，我没有使用远程代码。`

### Data disclosure

- 网站内容：会在本机临时处理，用于识别和转换用户主动选择的公式。
- 用户主动触发 Markdown 导出时，会在本机读取当前回答或对话 DOM。
- 不传输到开发者或第三方服务器。
- 不用于广告、分析、信用评估或其他无关用途。
- 勾选 Limited Use 合规声明。

## 审核测试说明

1. 打开 `https://chatgpt.com/` 并进入包含数学公式的对话。
2. 将鼠标悬停在公式上，可看到绿色虚线高亮；单击后应出现复制成功提示。
3. 框选一段同时包含普通文字和公式的回答，按 Ctrl+C。
4. 粘贴到文本编辑器，应看到普通文字与 `$...$` / `$$...$$` 形式的 LaTeX。
5. 页面右下角“公式工具”按钮可以切换输出格式、导出 Markdown 和调整复制设置。
6. 在工具的“导出”页复制最后回答、复制完整对话或下载 `.md`，确认公式保留为 `$...$` / `$$...$$`，代码块和表格结构保持完整。

## 素材文件

- 商店截图：`chrome-store/screenshot-1-1280x800.png`
- 小型宣传图：`chrome-store/promo-small-440x280.png`
- Marquee 宣传图：`chrome-store/promo-marquee-1400x560.png`
- 知乎/群聊分享图：`chrome-store/share-zhihu-groups-1200x675.png`

## 知乎/群聊宣传文案

我做了一个开源的 ChatGPT 公式复制与 Markdown 导出扩展。

现在可以像复制普通文字一样，直接框选 ChatGPT 的一整段回答再按 Ctrl+C：文字保持原样，里面的公式会自动变成 `$...$` 或 `$$...$$` 包裹的 LaTeX。单击某个公式也能单独复制。

整个扩展没有广告和网络请求，所有处理都在本机完成。适合粘贴到 Markdown、Obsidian、Typora 或 LaTeX 编辑器。

现在也可以把最后回答或整段对话直接复制/下载为 Markdown，标题、代码块、表格、链接和公式都会保留下来。

GitHub：<https://github.com/yzhi51161-cmd/chatgpt-formula-copy>

Chrome Web Store：审核通过后补充链接。

如果遇到某个公式复制失败，可以在 GitHub Issue 中附上扩展自带的窄范围诊断信息，我会继续适配 ChatGPT 的前端变化。
