const connection = document.getElementById("connection");
const connectionTitle = document.getElementById("connection-title");
const connectionDetail = document.getElementById("connection-detail");
const formulaCount = document.getElementById("formula-count");
const messageCount = document.getElementById("message-count");
const openCopy = document.getElementById("open-copy");
const openExport = document.getElementById("open-export");

function setToolButtonsEnabled(enabled) {
  openCopy.disabled = !enabled;
  openExport.disabled = !enabled;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function sendToActiveTab(message) {
  const tab = await activeTab();
  if (!tab?.id) throw new Error("No active tab");
  return chrome.tabs.sendMessage(tab.id, message);
}

function renderConnected(status) {
  connection.dataset.state = "connected";
  connectionTitle.textContent = "已连接";
  connectionDetail.textContent = `v${status.version} · ${status.copyFormat}`;
  formulaCount.textContent = String(status.formulaCount ?? 0);
  messageCount.textContent = String(status.messageCount ?? 0);
  setToolButtonsEnabled(true);
}

function renderDisconnected() {
  connection.dataset.state = "disconnected";
  connectionTitle.textContent = "未连接";
  connectionDetail.textContent = "刷新 ChatGPT 后重试";
  formulaCount.textContent = "—";
  messageCount.textContent = "—";
  setToolButtonsEnabled(false);
}

async function refreshStatus() {
  try {
    const status = await sendToActiveTab({ type: "GPT_FORMULA_COPY_STATUS" });
    if (
      !status ||
      typeof status.version !== "string" ||
      !Number.isFinite(status.formulaCount) ||
      !Number.isFinite(status.messageCount) ||
      typeof status.copyFormat !== "string"
    ) throw new Error("Malformed status response");
    renderConnected(status);
  } catch (error) {
    renderDisconnected();
  }
}

async function openPanel(tab) {
  try {
    const response = await sendToActiveTab({ type: "GPT_FORMULA_COPY_OPEN_PANEL", tab });
    if (!response?.ok) throw new Error(response?.error || "Panel did not open");
    window.close();
  } catch (error) {
    renderDisconnected();
  }
}

openCopy.addEventListener("click", () => openPanel("copy"));
openExport.addEventListener("click", () => openPanel("export"));
document.getElementById("open-chatgpt").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://chatgpt.com/" });
});

refreshStatus();
