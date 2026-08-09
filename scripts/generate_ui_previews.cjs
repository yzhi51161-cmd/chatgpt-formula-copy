const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const projectRoot = path.resolve(__dirname, "..");
const fixturePath = path.join(projectRoot, "test", "fixture.html");
const userscriptPath = path.join(projectRoot, "chatgpt-latex-copy.user.js");
const popupPath = path.join(projectRoot, "extension", "popup.html");
const uiPreviewPath = path.join(projectRoot, "docs", "ui-preview.png");
const popupPreviewPath = path.join(projectRoot, "docs", "popup-preview.png");
const chromePath = process.env.CHROME_PATH;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : { channel: "chrome" })
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 1 });
    await page.addInitScript(() => {
      globalThis.__gmValues = { welcomeShown: true };
      globalThis.GM_setClipboard = () => {};
      globalThis.GM_getValue = (key, fallback) => globalThis.__gmValues[key] ?? fallback;
      globalThis.GM_setValue = (key, value) => { globalThis.__gmValues[key] = value; };
    });
    await page.goto(pathToFileURL(fixturePath).href);
    await page.addScriptTag({ path: userscriptPath });
    await page.locator("#gpt-formula-copy-control #launcher").click();
    await page.locator('#gpt-formula-copy-control [data-tab="export"]').click();
    await page.locator('#gpt-formula-copy-control #panel[data-open="true"]').waitFor();
    await page.screenshot({ path: uiPreviewPath });

    const popup = await browser.newPage({ viewport: { width: 354, height: 450 }, deviceScaleFactor: 1 });
    await popup.addInitScript(() => {
      globalThis.close = () => {};
      globalThis.chrome = {
        tabs: {
          async query() { return [{ id: 17 }]; },
          async sendMessage(_tabId, message) {
            if (message.type === "GPT_FORMULA_COPY_STATUS") {
              return { version: "5.0.0", formulaCount: 8, messageCount: 6, copyFormat: "smart" };
            }
            return { ok: true };
          },
          create() {}
        }
      };
    });
    await popup.goto(pathToFileURL(popupPath).href);
    await popup.locator('#connection[data-state="connected"]').waitFor();
    await popup.screenshot({ path: popupPreviewPath, fullPage: true });

    console.log("UI previews updated:");
    console.log(uiPreviewPath);
    console.log(popupPreviewPath);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
