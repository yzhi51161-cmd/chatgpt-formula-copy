document.getElementById("open-chatgpt").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://chatgpt.com/" });
});

