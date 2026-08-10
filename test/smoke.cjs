const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const projectRoot = path.resolve(__dirname, "..");
const fixturePath = path.join(__dirname, "fixture.html");
const userscriptPath = path.join(projectRoot, "chatgpt-latex-copy.user.js");
const chromePath = process.env.CHROME_PATH;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : { channel: "chrome" })
  });

  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      globalThis.__copiedLatex = [];
      globalThis.__gmValues = { welcomeShown: true };
      globalThis.GM_setClipboard = (text, type) => {
        globalThis.__copiedLatex.push({ text, type });
      };
      globalThis.GM_getValue = (key, fallback) => globalThis.__gmValues[key] ?? fallback;
      globalThis.GM_setValue = (key, value) => {
        globalThis.__gmValues[key] = value;
      };
    });

    await page.goto(pathToFileURL(fixturePath).href);
    await page.addScriptTag({ path: userscriptPath });
    const launcher = page.locator("#gpt-formula-copy-control #launcher");
    assert.equal(await launcher.isVisible(), true, "常驻“公式复制”按钮应可见");
    assert.match(await launcher.innerText(), /公式复制/, "按钮应显示新版功能名称");

    await page.locator("#inline .mord").hover();
    const hoverStyle = await page.locator("#inline").evaluate((element) => ({
      cursor: getComputedStyle(element).cursor,
      outlineStyle: getComputedStyle(element).outlineStyle
    }));
    assert.equal(hoverStyle.cursor, "copy", "公式悬浮时应显示 copy cursor");
    assert.equal(hoverStyle.outlineStyle, "solid", "公式悬浮时应出现柔和高亮");

    await launcher.click();
    await page.locator("#gpt-formula-copy-control #panel").waitFor({ state: "visible" });
    const permissionHelp = page.locator("#gpt-formula-copy-control #permission-help");
    assert.match(await permissionHelp.innerText(), /复制权限页地址/);
    const starProject = page.locator("#gpt-formula-copy-control #star-project");
    assert.match(await starProject.innerText(), /为项目点亮一颗星/);
    assert.equal(await starProject.getAttribute("href"), "https://github.com/yzhi51161-cmd/chatgpt-formula-copy");
    const panel = page.locator("#gpt-formula-copy-control #panel");
    const panelHead = page.locator("#gpt-formula-copy-control #panel-head");
    assert.equal(await panelHead.evaluate((element) => getComputedStyle(element).cursor), "grab");
    const beforeDrag = await panel.boundingBox();
    const headBox = await panelHead.boundingBox();
    await page.mouse.move(headBox.x + 70, headBox.y + 20);
    await page.mouse.down();
    await page.mouse.move(headBox.x - 30, headBox.y - 40);
    await page.mouse.up();
    const afterDrag = await panel.boundingBox();
    assert.ok(afterDrag.x < beforeDrag.x, "面板标题栏应支持拖动");
    assert.ok(afterDrag.x >= 8 && afterDrag.y >= 8, "拖动后面板应留在可视区域内");
    assert.equal(
      await page.locator("#gpt-formula-copy-control #panel").isVisible(),
      true,
      "控制面板应能主动打开"
    );

    await page.locator('#gpt-formula-copy-control [data-tab="settings"]').click();
    const languageToggle = page.locator("#gpt-formula-copy-control #language-toggle");
    await languageToggle.click();
    assert.equal(await page.locator("#gpt-formula-copy-control #brand-title").innerText(), "Formula Copy");
    assert.equal(await page.locator('#gpt-formula-copy-control [data-tab="export"]').innerText(), "Export");
    assert.equal(await page.evaluate(() => globalThis.__gmValues.uiLanguage), "en", "英语 UI 选择应持久化");
    await languageToggle.click();
    assert.equal(await page.locator("#gpt-formula-copy-control #brand-title").innerText(), "公式复制");
    assert.equal(await page.evaluate(() => globalThis.__gmValues.uiLanguage), "zh", "中文 UI 选择应持久化");
    await page.locator('#gpt-formula-copy-control [data-tab="copy"]').click();

    const formatSelect = page.locator("#gpt-formula-copy-control #format");
    await formatSelect.selectOption("inline");
    await formatSelect.selectOption("raw");
    await formatSelect.selectOption("smart");
    assert.equal(
      await page.evaluate(() => globalThis.__gmValues.copyFormat),
      "smart",
      "格式选择应持久化"
    );

    const markdownExport = await page.evaluate(() => {
      const api = globalThis.__GPT_LATEX_COPY_API__;
      const assistant = api.serializeElementToMarkdown(document.querySelector("#message-assistant [data-message-content]"));
      const messages = api.collectConversationMessages();
      return {
        assistant,
        messages,
        conversation: api.buildConversationMarkdown(messages),
        filename: api.safeMarkdownFilename()
      };
    });
    assert.equal(markdownExport.messages.length, 3, "应识别 fixture 中三条对话消息");
    assert.match(markdownExport.assistant, /^## 核心结论/m);
    assert.match(markdownExport.assistant, /\*\*缩放点积注意力\*\*/);
    assert.match(markdownExport.assistant, /\$\\alpha\+\\beta\$/);
    assert.match(markdownExport.assistant, /- 保留 \*标题\* 和列表/);
    assert.match(markdownExport.assistant, /\[参考链接\]\(https:\/\/example\.com\/reference\)/);
    assert.match(markdownExport.assistant, /```python\ndef attention\(q, k\):/);
    assert.match(markdownExport.assistant, /\| 符号 \| 含义 \|/);
    assert.match(markdownExport.assistant, /> 所有导出均在本机完成。/);
    assert.match(markdownExport.assistant, /1\. 父项\n {3}- 子项/);
    assert.match(markdownExport.assistant, /- \[x\] 已完成/);
    assert.match(markdownExport.assistant, /- \[ \] 未完成/);
    assert.match(markdownExport.assistant, /> ```\n> quoted\(\)\n> next\(\)\n> ```/);
    assert.match(markdownExport.assistant, /&lt;img src="https:\/\/tracker\.invalid\/pixel" onerror="alert\(1\)"&gt;/);
    assert.doesNotMatch(markdownExport.assistant, /<img src="https:\/\/tracker\.invalid\/pixel"/);
    assert.match(markdownExport.assistant, /!\[attention diagram\]\(https:\/\/example\.com\/attention\.png\)/);
    assert.doesNotMatch(markdownExport.assistant, /不应导出/);
    assert.match(markdownExport.conversation, /^# Attention Notes/m);
    assert.match(markdownExport.conversation, /^## You$/m);
    assert.match(markdownExport.conversation, /^## ChatGPT$/m);
    assert.doesNotMatch(markdownExport.conversation, /备用分支/);
    assert.match(markdownExport.conversation, /第一行\n第二行\n\n第四行/);
    assert.equal(markdownExport.filename, "Attention Notes.md");

    const materialTools = await page.evaluate(() => {
      const api = globalThis.__GPT_LATEX_COPY_API__;
      const paragraph = document.querySelector("#message-assistant [data-message-content] p");
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const selectionMarkdown = api.selectionToMarkdown(selection);
      selection.removeAllRanges();
      return {
        selectionMarkdown,
      };
    });
    assert.match(materialTools.selectionMarkdown, /\*\*缩放点积注意力\*\*/);
    assert.match(materialTools.selectionMarkdown, /\$\\alpha\+\\beta\$/);

    const selectionCopy = await page.evaluate(() => {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("mixed-selection"));
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const clipboardData = new DataTransfer();
      const event = new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData
      });
      document.dispatchEvent(event);
      selection.removeAllRanges();
      return {
        prevented: event.defaultPrevented,
        text: clipboardData.getData("text/plain")
      };
    });
    assert.deepEqual(selectionCopy, {
      prevented: true,
      text: "圆的方程是 $x^2+y^2=1$ ，积分结果如下：\n$$\\int_0^1 x^2\\,dx$$\n复制结束。"
    });

    const partialFormulaSelection = await page.evaluate(() => {
      const textNode = document.querySelector("#selection-inline .katex-html").firstChild;
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 2);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const converted = globalThis.__GPT_LATEX_COPY_API__.convertSelectionToLatex(selection);
      selection.removeAllRanges();
      return converted;
    });
    assert.deepEqual(partialFormulaSelection, {
      text: "$x^2+y^2=1$",
      formulaCount: 1
    });

    const plainTextCopy = await page.evaluate(() => {
      const paragraph = document.querySelector("#mixed-selection p:last-child");
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const clipboardData = new DataTransfer();
      const event = new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData
      });
      document.dispatchEvent(event);
      selection.removeAllRanges();
      return event.defaultPrevented;
    });
    assert.equal(plainTextCopy, false, "纯文字选区不应被脚本接管");

    await page.locator('#gpt-formula-copy-control [data-tab="settings"]').click();
    const selectionToggle = page.locator("#gpt-formula-copy-control #selection-toggle");
    await selectionToggle.click();
    assert.equal(
      await page.evaluate(() => globalThis.__gmValues.selectionCopyEnabled),
      false,
      "整段复制增强关闭状态应持久化"
    );
    await selectionToggle.click();
    assert.equal(
      await page.evaluate(() => globalThis.__gmValues.selectionCopyEnabled),
      true,
      "整段复制增强开启状态应持久化"
    );

    await page.locator('#gpt-formula-copy-control [data-tab="copy"]').click();
    await page.locator("#gpt-formula-copy-control #test").click();
    await page.locator('#gpt-formula-copy-control [data-tab="settings"]').click();
    await page.locator("#gpt-formula-copy-control #toggle").click();
    await page.locator("#inline .mord").click();
    assert.equal(
      (await page.evaluate(() => globalThis.__copiedLatex)).length,
      1,
      "关闭状态不应复制公式"
    );
    await page.locator("#gpt-formula-copy-control #toggle").click();

    const restoreMs = await page.locator("#gpt-formula-copy-control").evaluate((element) => new Promise((resolve, reject) => {
      const started = performance.now();
      element.remove();
      const check = () => {
        if (document.getElementById("gpt-formula-copy-control")) {
          resolve(performance.now() - started);
        } else if (performance.now() - started > 1000) {
          reject(new Error("控制按钮未由 MutationObserver 恢复"));
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    }));
    await launcher.waitFor({ state: "visible", timeout: 1000 });
    assert.match(await launcher.innerText(), /公式复制/, "控制按钮被页面移除后应自动恢复");
    assert.ok(restoreMs < 500, `控制按钮应快速恢复，实际 ${restoreMs.toFixed(1)}ms`);

    await page.locator("#inline .mord").click();
    await page.locator("#data-math .visual-formula").click();
    await page.locator("#alttext").click();
    await page.locator("#current-chatgpt .mord").click();

    await page.evaluate(() => {
      document.getElementById("dynamic-root").innerHTML = `
        <span id="dynamic" class="katex">
          <span class="katex-mathml">
            <math><semantics><mi>e</mi>
              <annotation encoding="application/x-tex">e^{i\\pi}+1=0</annotation>
            </semantics></math>
          </span>
          <span class="katex-html"><span class="mord">eⁱᵖⁱ+1=0</span></span>
        </span>`;
    });
    await page.locator("#dynamic .mord").click();

    const streamedFormula = await page.evaluate(() => {
      const formula = document.getElementById("dynamic");
      formula.querySelector('annotation[encoding="application/x-tex"]').textContent = "u+v";
      formula.style.display = "block";
      const api = globalThis.__GPT_LATEX_COPY_API__;
      return {
        latex: api.extractLatex(formula),
        display: api.isDisplayFormula(formula),
        formatted: api.formatLatexForCopy(api.extractLatex(formula), formula, "smart")
      };
    });
    assert.deepEqual(streamedFormula, {
      latex: "u+v",
      display: true,
      formatted: "$$u+v$$"
    }, "同一公式 DOM 流式更新后不应返回陈旧缓存");

    const copied = await page.evaluate(() => globalThis.__copiedLatex);
    assert.deepEqual(copied, [
      { text: "$\\frac{a}{b}$", type: "text" },
      { text: "$x^2+y^2=1$", type: "text" },
      { text: "$$\\int_0^1 x^2\\,dx$$", type: "text" },
      { text: "$\\frac{a}{b}$", type: "text" },
      { text: "$$a_{5,2}\\neq a_{2,5},$$", type: "text" },
      { text: "$e^{i\\pi}+1=0$", type: "text" }
    ]);

    const apiChecks = await page.evaluate(() => ({
      display: globalThis.__GPT_LATEX_COPY_API__.normalizeLatex("\\[a+b\\]"),
      inline: globalThis.__GPT_LATEX_COPY_API__.normalizeLatex("\\(c+d\\)"),
      dollars: globalThis.__GPT_LATEX_COPY_API__.normalizeLatex("$$e+f$$"),
      boldInline: globalThis.__GPT_LATEX_COPY_API__.formatLatexForCopy(
        "\\mathbf{W}_q", document.getElementById("inline"), "smart"
      ),
      displayMath: globalThis.__GPT_LATEX_COPY_API__.formatLatexForCopy(
        "a_{5,2}\\neq a_{2,5}", document.getElementById("current-chatgpt"), "smart"
      ),
      raw: globalThis.__GPT_LATEX_COPY_API__.formatLatexForCopy(
        "x_i", document.getElementById("inline"), "raw"
      ),
      compactAligned: globalThis.__GPT_LATEX_COPY_API__.formatLatexForCopy(
        "\\begin{aligned}\n  \\mathbf{W}_q x_i  & = q_i \\\\\n  q_i^\\top k_j & = a_{i,j}\n\\end{aligned}",
        document.getElementById("current-chatgpt"), "smart"
      )
    }));
    assert.deepEqual(apiChecks, {
      display: "a+b",
      inline: "c+d",
      dollars: "e+f",
      boldInline: "$\\mathbf{W}_q$",
      displayMath: "$$a_{5,2}\\neq a_{2,5}$$",
      raw: "x_i",
      compactAligned: "$$\\begin{aligned} \\mathbf{W}_q x_i  & = q_i \\\\ q_i^\\top k_j & = a_{i,j} \\end{aligned}$$"
    });

    const largeSelection = await page.evaluate(() => {
      const section = document.createElement("section");
      section.id = "large-selection";
      section.innerHTML = Array.from({ length: 250 }, (_, index) =>
        `<span data-math-source="x_${index}"><span class="katex"><span class="katex-html" aria-hidden="true">x${index}</span></span></span>`
      ).join(" + ");
      document.body.appendChild(section);
      const range = document.createRange();
      range.selectNodeContents(section);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const started = performance.now();
      const converted = globalThis.__GPT_LATEX_COPY_API__.convertSelectionToLatex(selection);
      const elapsed = performance.now() - started;
      selection.removeAllRanges();
      section.remove();
      return { formulaCount: converted?.formulaCount, elapsed, length: converted?.text.length };
    });
    assert.equal(largeSelection.formulaCount, 250);
    assert.ok(largeSelection.length > 1000);
    assert.ok(largeSelection.elapsed < 1500, `250 个公式转换耗时过长：${largeSelection.elapsed.toFixed(1)}ms`);

    await page.evaluate(() => {
      const formula = document.createElement("span");
      formula.id = "metric-formula";
      formula.setAttribute("data-math-source", "m+n");
      document.body.appendChild(formula);
    });
    await page.waitForFunction(() =>
      document.getElementById("gpt-formula-copy-control")?.shadowRoot
        ?.getElementById("launcher-count")?.textContent ===
        String(globalThis.__GPT_LATEX_COPY_API__.getStatus().formulaCount)
    );

    await page.evaluate(() => globalThis.__GPT_LATEX_COPY_API__.openControlPanel("export"));
    await page.locator("#gpt-formula-copy-control #panel").waitFor({ state: "visible" });
    assert.equal(
      await page.locator('#gpt-formula-copy-control [data-pane="export"]').isVisible(),
      true,
      "导出面板应可主动打开"
    );
    await page.locator("#gpt-formula-copy-control #copy-last-response").click();
    assert.equal(
      (await page.evaluate(() => globalThis.__copiedLatex)).at(-1).text,
      markdownExport.assistant,
      "最后回答应复制为 Markdown"
    );

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#gpt-formula-copy-control #download-conversation").click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "Attention Notes.md");
    const downloadedMarkdown = fs.readFileSync(await download.path(), "utf8");
    assert.match(
      downloadedMarkdown,
      /> Exported from \[ChatGPT\]\(.+\) on \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
      "下载文件应包含合法的动态导出时间"
    );
    const withoutTimestamp = (value) => value.replace(/ on \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/, "");
    assert.equal(
      withoutTimestamp(downloadedMarkdown),
      withoutTimestamp(markdownExport.conversation),
      "下载文件正文应与构建结果完全一致"
    );

    await page.evaluate(() => {
      document.getElementById("dynamic-root").innerHTML += `
        <p>PRIVATE_DO_NOT_LEAK
          <span id="no-latex" class="katex">
            <span class="katex-html"><span class="mord">a≠b</span></span>
          </span>
        </p>`;
    });
    await page.locator("#no-latex .mord").click();
    await page.evaluate(() => globalThis.__GPT_LATEX_COPY_API__.openControlPanel("settings"));
    await page.locator("#gpt-formula-copy-control #diagnostic").click();
    const diagnosticCopy = (await page.evaluate(() => globalThis.__copiedLatex)).at(-1);
    assert.equal(diagnosticCopy.type, "text");
    assert.match(diagnosticCopy.text, /ChatGPT LaTeX Copy diagnostic/);
    assert.match(diagnosticCopy.text, /no-latex/);
    assert.match(diagnosticCopy.text, /"annotationCount": 0/);
    assert.doesNotMatch(diagnosticCopy.text, /PRIVATE_DO_NOT_LEAK/);
    assert.doesNotMatch(diagnosticCopy.text, /"page"|"userAgent"/);
    assert.equal(
      await page.locator("#gpt-formula-copy-control #diagnostic-text").isVisible(),
      true,
      "诊断文本框应作为手动复制后备"
    );

    const freshPage = await browser.newPage();
    await freshPage.addInitScript(() => {
      globalThis.__gmValues = {};
      globalThis.GM_setClipboard = () => {};
      globalThis.GM_getValue = (key, fallback) => globalThis.__gmValues[key] ?? fallback;
      globalThis.GM_setValue = (key, value) => {
        globalThis.__gmValues[key] = value;
      };
    });
    await freshPage.goto(pathToFileURL(fixturePath).href);
    await freshPage.addScriptTag({ path: userscriptPath });
    assert.equal(
      await freshPage.locator("#gpt-formula-copy-control #panel").isVisible(),
      true,
      "首次成功注入后应主动打开面板"
    );
    assert.match(
      await freshPage.locator("#gpt-latex-copy-toast").innerText(),
      /已就绪/,
      "首次成功注入后应明确提示启用状态"
    );
    assert.equal(
      await freshPage.evaluate(() => globalThis.__gmValues.welcomeShown),
      true,
      "首次引导状态应持久化"
    );
    await freshPage.close();

    console.log(`smoke ok: v5 UI + selection + Markdown download + ${largeSelection.elapsed.toFixed(1)}ms/250 formulas + diagnostics + ${copied.length} formula clipboard writes`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
