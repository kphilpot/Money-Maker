import { performApiVerification } from "./adapters/claude-api";
import { SessionManager } from "./session-manager";
import { captureVisibleTab, getActiveTab } from "./utils/screenshot";
import { getStoredState, updateStoredState } from "./utils/storage";
import { generateAuditHash } from "./utils/crypto";
import { logAuditTrail } from "./utils/api-client";
import type { ApiResponse, ExtensionState, RuntimeRequest, UserTier } from "./types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refreshSessionState(partial: Partial<ExtensionState> = {}) {
  const state = await updateStoredState(partial);
  if (!state.userId.trim()) {
    return state;
  }

  const session = new SessionManager(state.userId, state.userTier);
  const sessionStatus = await session.getSessionStatus();
  const lastUsageReset = await session.getLastResetDate();

  return updateStoredState({
    ...partial,
    dailyUsage: sessionStatus.usage,
    lastUsageReset,
    sessionStatus,
  });
}

async function captureScreenshot() {
  const tab = await getActiveTab();
  if (!tab.windowId) {
    throw new Error("Unable to capture the current window");
  }

  await updateStoredState({
    error: null,
    status: "capturing",
  });

  const screenshot = await captureVisibleTab(tab.windowId);

  return refreshSessionState({
    error: null,
    latestScreenshot: screenshot.dataUrl,
    status: "captured",
  });
}

async function performVerification(prompt: string) {
  const state = await getStoredState();

  if (!state.userId.trim()) {
    return updateStoredState({
      error: "Please set a User ID first",
      status: "error",
    });
  }

  if (!state.latestScreenshot) {
    return updateStoredState({
      error: "No screenshot captured",
      status: "error",
    });
  }

  // For free tier, we inject into open Claude tab (no API key needed)
  // For pro/max, we need API key
  const isFreeUser = state.userTier === "free";
  if (!isFreeUser && !state.apiKey) {
    return updateStoredState({
      error: "Please provide an Anthropic API key",
      status: "error",
    });
  }

  const session = new SessionManager(state.userId, state.userTier);
  const sessionStatus = await session.getSessionStatus();
  const lastUsageReset = await session.getLastResetDate();

  await updateStoredState({
    error: null,
    currentResponse: "",
    status: "processing",
    dailyUsage: sessionStatus.usage,
    lastUsageReset,
    sessionStatus,
  });

  if (sessionStatus.shouldThrottle && state.userTier !== "max") {
    await sleep(await session.getThrottleDelay());
  }

  let result;
  if (isFreeUser) {
    // Free tier: inject into user's open Claude tab
    result = await performFreeVerification(state.latestScreenshot, prompt);
  } else {
    // Pro/Max tier: call Claude API with user's key
    result = await performApiVerification(
      state.latestScreenshot,
      prompt,
      state.apiKey!,
      state.selectedModel,
    );
  }

  if (!result.success) {
    return updateStoredState({
      error: result.error || "Verification failed",
      status: "error",
    });
  }

  const updatedSessionStatus = await session.recordUsage();
  const updatedLastUsageReset = await session.getLastResetDate();

  const newRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    model: state.selectedModel,
    prompt,
    response: result.response,
    inputTokens: result.tokenCount?.input || 0,
    outputTokens: result.tokenCount?.output || 0,
  };

  // Generate audit trail entry with SHA-256 hash
  const screenshotHash = await generateAuditHash({
    userId: state.userId,
    action: "verification",
    result: "pass",
    screenshotHash: state.latestScreenshot,
    timestamp: newRecord.timestamp,
  });

  // Log audit trail to backend (async, don't block on failure)
  void logAuditTrail({
    userId: state.userId,
    action: "verification",
    result: "pass",
    screenshotHash: state.latestScreenshot,
    reasoningHash: result.response,
    hash: screenshotHash,
  }).catch((error) => {
    console.warn("Failed to log audit trail:", error);
  });

  const currentState = await getStoredState();
  const updatedHistory = [newRecord, ...(currentState.verificationHistory || [])].slice(0, 50); // Keep last 50

  return updateStoredState({
    currentResponse: result.response,
    error: null,
    status: "completed",
    dailyUsage: updatedSessionStatus.usage,
    lastUsageReset: updatedLastUsageReset,
    sessionStatus: updatedSessionStatus,
    verificationHistory: updatedHistory,
  });
}

async function performFreeVerification(screenshot: string, prompt: string): Promise<ApiResponse> {
  try {
    // Find active Claude/ChatGPT/Gemini tab
    const tabs = await chrome.tabs.query({});
    const aiTab = tabs.find((tab) => {
      const url = tab.url || "";
      return url.includes("claude.ai") || url.includes("chatgpt.com") || url.includes("gemini.google.com");
    });

    if (!aiTab?.id) {
      return {
        success: false,
        response: "",
        error: "No Claude/ChatGPT/Gemini tab found. Please open one and try again.",
        errorCode: "NO_AI_TAB",
      };
    }

    // Send injection request to content script
    const response = await chrome.tabs.sendMessage(aiTab.id, {
      type: "verifyai:inject",
      screenshot,
      prompt,
    });

    if (!response.success) {
      return {
        success: false,
        response: "",
        error: response.error || "Injection failed",
        errorCode: "INJECTION_FAILED",
      };
    }

    return {
      success: true,
      response: response.response,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during injection";
    return {
      success: false,
      response: "",
      error: message,
      errorCode: "INJECTION_ERROR",
    };
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await refreshSessionState();
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "capture-screen") {
    return;
  }

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      void chrome.sidePanel.open({ tabId: tabs[0].id });
      void captureScreenshot();
    }
  });
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  void (async () => {
    try {
      const req = request as RuntimeRequest;

      switch (req.type) {
        case "verifyai:get-state":
          sendResponse(await getStoredState());
          break;
        case "verifyai:capture":
          sendResponse(await captureScreenshot());
          break;
        case "verifyai:verify":
          sendResponse(await performVerification(req.prompt));
          break;
        case "verifyai:set-user-tier":
          sendResponse(await refreshSessionState({ userTier: req.tier as UserTier }));
          break;
        case "verifyai:update-settings":
          sendResponse(await refreshSessionState(req.payload));
          break;
        case "verifyai:get-session-status":
          sendResponse(await refreshSessionState());
          break;
        case "verifyai:clear-history":
          sendResponse(await updateStoredState({ verificationHistory: [] }));
          break;
        default:
          sendResponse({ ok: false });
      }
    } catch (error) {
      sendResponse(
        await updateStoredState({
          error: error instanceof Error ? error.message : "Unknown error",
          status: "error",
        }),
      );
    }
  })();

  return true;
});
