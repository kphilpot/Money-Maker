export async function captureVisibleTab(windowId?: number): Promise<{ dataUrl: string }> {
  const dataUrl = typeof windowId === "number"
    ? await chrome.tabs.captureVisibleTab(windowId, { format: "png" })
    : await chrome.tabs.captureVisibleTab({ format: "png" });

  return { dataUrl };
}

export async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const activeTab = tabs[0];

  if (!activeTab) {
    throw new Error("No active tab");
  }

  return activeTab;
}
