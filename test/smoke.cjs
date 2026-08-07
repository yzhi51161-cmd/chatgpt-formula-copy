const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

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
      globalThis.__gmValues = {};
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
    assert.equal(await launcher.innerText(), "公式复制", "按钮只显示功能名称");

    await page.locator("#inline .mord").hover();
    const hoverStyle = await page.locator("#inline").evaluate((element) => ({
      cursor: getComputedStyle(element).cursor,
      outlineStyle: getComputedStyle(element).outlineStyle
    }));
    assert.equal(hoverStyle.cursor, "copy", "公式悬浮时应显示 copy cursor");
    assert.equal(hoverStyle.outlineStyle, "dashed", "公式悬浮时应出现虚线高亮");

    await launcher.click();
    assert.equal(
      await page.locator("#gpt-formula-copy-control #panel").isVisible(),
      true,
      "控制面板应能主动打开"
    );

    const formatSelect = page.locator("#gpt-formula-copy-control #format");
    await formatSelect.selectOption("inline");
    await formatSelect.selectOption("raw");
    await formatSelect.selectOption("smart");
    assert.equal(
      await page.evaluate(() => globalThis.__gmValues.copyFormat),
      "smart",
      "格式选择应持久化"
    );

    await page.locator("#gpt-formula-copy-control #test").click();
    await page.locator("#gpt-formula-copy-control #toggle").click();
    await page.locator("#inline .mord").click();
    assert.equal(
      (await page.evaluate(() => globalThis.__copiedLatex)).length,
      1,
      "关闭状态不应复制公式"
    );
    await page.locator("#gpt-formula-copy-control #toggle").click();

    await page.locator("#gpt-formula-copy-control").evaluate((element) => element.remove());
    await launcher.waitFor({ state: "visible", timeout: 4000 });
    assert.equal(await launcher.innerText(), "公式复制", "控制按钮被页面移除后应自动恢复");

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

    await page.evaluate(() => {
      document.getElementById("dynamic-root").innerHTML += `
        <span id="no-latex" class="katex">
          <span class="katex-html"><span class="mord">a≠b</span></span>
        </span>`;
    });
    await page.locator("#no-latex .mord").click();
    await launcher.click();
    await page.locator("#gpt-formula-copy-control #diagnostic").click();
    const diagnosticCopy = (await page.evaluate(() => globalThis.__copiedLatex)).at(-1);
    assert.equal(diagnosticCopy.type, "text");
    assert.match(diagnosticCopy.text, /ChatGPT LaTeX Copy diagnostic/);
    assert.match(diagnosticCopy.text, /no-latex/);
    assert.match(diagnosticCopy.text, /"annotationCount": 0/);
    assert.equal(
      await page.locator("#gpt-formula-copy-control #diagnostic-text").isVisible(),
      true,
      "诊断文本框应作为手动复制后备"
    );

    console.log(`smoke ok: share UI + compact math + data-math-source + diagnostics + ${copied.length} formula clipboard writes`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
