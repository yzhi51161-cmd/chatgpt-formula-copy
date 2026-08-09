const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const projectRoot = path.resolve(__dirname, "..");
const fixturePath = path.join(__dirname, "fixture.html");
const unpackedPath = path.join(projectRoot, "dist", "chatgpt-formula-copy-chrome");
const contentPath = path.join(unpackedPath, "content.js");
const manifestPath = path.join(unpackedPath, "manifest.json");
const chromePath = process.env.CHROME_PATH;

(async () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, "5.0.0");
  assert.deepEqual(manifest.permissions, ["storage"]);
  for (const key of ["host_permissions", "optional_permissions", "optional_host_permissions", "externally_connectable"]) {
    assert.ok(!manifest[key], `${key} should remain absent`);
  }
  assert.deepEqual(manifest.content_scripts[0].matches, [
    "https://chatgpt.com/*",
    "https://*.chatgpt.com/*",
    "https://chat.openai.com/*"
  ]);

  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : { channel: "chrome" })
  });

  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      globalThis.__extensionStored = { welcomeShown: true };
      globalThis.__extensionCopied = [];
      globalThis.chrome = {
        runtime: {
          onMessage: {
            addListener(listener) {
              globalThis.__extensionMessageListener = listener;
            }
          }
        },
        storage: {
          local: {
            get(defaults, callback) {
              callback({ ...defaults, ...globalThis.__extensionStored });
            },
            set(values) {
              Object.assign(globalThis.__extensionStored, values);
            }
          }
        }
      };
      document.execCommand = (command) => {
        if (command !== "copy") return false;
        globalThis.__extensionCopied.push(document.activeElement?.value || "");
        return true;
      };
    });

    await page.goto(pathToFileURL(fixturePath).href);
    await page.addScriptTag({ path: contentPath });

    const launcher = page.locator("#gpt-formula-copy-control #launcher");
    await launcher.waitFor({ state: "visible" });
    assert.match(await launcher.innerText(), /公式复制/);

    await launcher.click();
    await page.locator("#gpt-formula-copy-control #panel").waitFor({ state: "visible" });
    const formatSelect = page.locator("#gpt-formula-copy-control #format");
    await formatSelect.selectOption("raw");
    assert.equal(
      await page.evaluate(() => globalThis.__extensionStored.copyFormat),
      "raw",
      "Chrome storage shim should persist output format"
    );
    await formatSelect.selectOption("smart");

    await page.locator("#inline .mord").click();
    assert.equal(
      await page.evaluate(() => globalThis.__extensionCopied.at(-1)),
      "$x^2+y^2=1$",
      "Click copy should work without Userscript GM APIs"
    );
    await page.locator("#inline .mord").click();
    assert.equal(
      await page.locator('body > textarea[readonly][aria-hidden="true"]').count(),
      1,
      "execCommand fallback should reuse exactly one textarea"
    );
    assert.equal(
      await page.locator('body > textarea[readonly][aria-hidden="true"]').inputValue(),
      "",
      "execCommand fallback must not retain copied content in the page DOM"
    );
    const fallbackMethod = await page.evaluate(async () => {
      document.execCommand = () => { throw new Error("blocked"); };
      Object.defineProperty(globalThis, "isSecureContext", { value: true, configurable: true });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { async writeText(text) { globalThis.__navigatorCopied = text; } }
      });
      return globalThis.__GPT_LATEX_COPY_API__.copyLatex("navigator fallback");
    });
    assert.equal(fallbackMethod, "navigator.clipboard");
    assert.equal(await page.evaluate(() => globalThis.__navigatorCopied), "navigator fallback");

    const mixedSelection = await page.evaluate(() => {
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
      return clipboardData.getData("text/plain");
    });
    assert.equal(
      mixedSelection,
      "圆的方程是 $x^2+y^2=1$ ，积分结果如下：\n$$\\int_0^1 x^2\\,dx$$\n复制结束。"
    );

    const status = await page.evaluate(() => new Promise((resolve) => {
      globalThis.__extensionMessageListener(
        { type: "GPT_FORMULA_COPY_STATUS" },
        {},
        resolve
      );
    }));
    assert.equal(status.version, "5.0.0");
    assert.ok(status.formulaCount >= 5);
    assert.equal(status.messageCount, 3);

    await page.evaluate(() => new Promise((resolve) => {
      globalThis.__extensionMessageListener(
        { type: "GPT_FORMULA_COPY_OPEN_PANEL", tab: "export" },
        {},
        resolve
      );
    }));
    assert.equal(
      await page.locator('#gpt-formula-copy-control [data-pane="export"]').isVisible(),
      true,
      "Popup message should open the export pane"
    );

    const earlyPage = await browser.newPage();
    const contentSource = fs.readFileSync(contentPath, "utf8");
    await earlyPage.addInitScript({ content: `
      globalThis.__extensionStored = { welcomeShown: true };
      globalThis.chrome = {
        runtime: { onMessage: { addListener(listener) { globalThis.__extensionMessageListener = listener; } } },
        storage: {
          local: {
            get(defaults, callback) {
              globalThis.__releaseExtensionStorage = () => {
                callback({ ...defaults, ...globalThis.__extensionStored });
                globalThis.__releaseExtensionStorage = null;
              };
            },
            set(values) { Object.assign(globalThis.__extensionStored, values); }
          }
        }
      };
      document.execCommand = () => true;
      ${contentSource}
    ` });
    await earlyPage.goto(pathToFileURL(fixturePath).href);
    const earlyOpen = await earlyPage.evaluate(() => new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("early OPEN_PANEL response timed out")), 1500);
      let keepChannelOpen;
      keepChannelOpen = globalThis.__extensionMessageListener(
        { type: "GPT_FORMULA_COPY_OPEN_PANEL", tab: "export" },
        {},
        (response) => {
          clearTimeout(timeout);
          resolve({ response, keepChannelOpen });
        }
      );
      globalThis.__releaseExtensionStorage();
    }));
    assert.deepEqual(earlyOpen, {
      response: { ok: true },
      keepChannelOpen: true
    }, "document_start 阶段应保持消息通道并排队打开面板");
    await earlyPage.locator("#gpt-formula-copy-control #launcher").waitFor({ state: "visible" });
    assert.equal(
      await earlyPage.locator('#gpt-formula-copy-control [data-pane="export"]').isVisible(),
      true,
      "body/storage 尚未就绪时收到的导出请求应在挂载后执行"
    );
    await earlyPage.close();

    console.log("chrome extension smoke ok: MV3 + storage + status bridge + copy + Markdown export UI");
  } finally {
    await browser.close();
  }
})();
