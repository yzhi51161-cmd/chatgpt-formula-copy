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
  assert.deepEqual(manifest.permissions, ["storage"]);
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
      globalThis.__extensionStored = {};
      globalThis.__extensionCopied = [];
      globalThis.chrome = {
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
    assert.equal(await launcher.innerText(), "公式复制");

    await launcher.click();
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

    console.log("chrome extension smoke ok: MV3 + storage + click copy + mixed selection copy");
  } finally {
    await browser.close();
  }
})();

