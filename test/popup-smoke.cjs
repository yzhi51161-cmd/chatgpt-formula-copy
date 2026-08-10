const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const popupPath = path.resolve(__dirname, "..", "extension", "popup.html");
const chromePath = process.env.CHROME_PATH;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : { channel: "chrome" })
  });

  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      globalThis.__popupMessages = [];
      globalThis.__createdTabs = [];
      globalThis.__popupClosed = false;
      globalThis.__copiedText = "";
      globalThis.close = () => { globalThis.__popupClosed = true; };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { async writeText(text) { globalThis.__copiedText = text; } }
      });
      globalThis.chrome = {
        tabs: {
          async query() {
            return [{ id: 17 }];
          },
          async sendMessage(_tabId, message) {
            globalThis.__popupMessages.push(message);
            if (message.type === "GPT_FORMULA_COPY_STATUS") {
              return {
                version: "5.0.1",
                formulaCount: 8,
                messageCount: 6,
                copyFormat: "smart"
              };
            }
            return { ok: true };
          },
          create(options) {
            globalThis.__createdTabs.push(options);
          }
        }
      };
    });
    await page.goto(pathToFileURL(popupPath).href);
    await page.locator('#connection[data-state="connected"]').waitFor();
    assert.equal(await page.locator("#formula-count").innerText(), "8");
    assert.equal(await page.locator("#message-count").innerText(), "6");
    assert.match(await page.locator("#connection-detail").innerText(), /v5\.0\.1/);
    await page.locator("#userscript-help").click();
    assert.equal(await page.evaluate(() => globalThis.__copiedText), "chrome://extensions");
    assert.match(await page.locator("#userscript-help").innerText(), /已复制/);

    await page.locator("#open-export").click();
    const popupAction = await page.evaluate(() => ({
      message: globalThis.__popupMessages.at(-1),
      closed: globalThis.__popupClosed
    }));
    assert.deepEqual(popupAction, {
      message: { type: "GPT_FORMULA_COPY_OPEN_PANEL", tab: "export" },
      closed: true
    });

    await page.locator("#open-chatgpt").click();
    assert.deepEqual(
      await page.evaluate(() => globalThis.__createdTabs.at(-1)),
      { url: "https://chatgpt.com/" }
    );

    const disconnected = await browser.newPage();
    await disconnected.addInitScript(() => {
      globalThis.chrome = {
        tabs: {
          async query() { return [{ id: 21 }]; },
          async sendMessage() { throw new Error("No receiver"); },
          create() {}
        }
      };
    });
    await disconnected.goto(pathToFileURL(popupPath).href);
    await disconnected.locator('#connection[data-state="disconnected"]').waitFor();
    assert.match(await disconnected.locator("#connection-title").innerText(), /未连接/);
    assert.equal(await disconnected.locator("#open-copy").isDisabled(), true);
    assert.equal(await disconnected.locator("#open-export").isDisabled(), true);
    await disconnected.close();

    console.log("popup smoke ok: live status + page panel bridge + disconnected guidance");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
