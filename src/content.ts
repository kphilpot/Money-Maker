/**
 * Content script - runs in AI provider tabs (Claude, ChatGPT, Gemini)
 * Allows extension to inject prompts and screenshots
 */

import type { ExtensionState } from "./types";

interface InjectRequest {
  type: "verifyai:inject";
  screenshot: string;
  prompt: string;
}

// Listen for injection requests from background script
chrome.runtime.onMessage.addListener((request: InjectRequest, sender, sendResponse) => {
  if (request.type !== "verifyai:inject") {
    return;
  }

  void (async () => {
    try {
      const result = await performInjection(request.screenshot, request.prompt);
      sendResponse({ success: true, response: result });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Injection failed",
      });
    }
  })();

  return true; // Keep channel open for async response
});

async function performInjection(screenshot: string, prompt: string): Promise<string> {
  // Step 1: Find input field
  const inputField = await findInputField();
  if (!inputField) {
    throw new Error("Could not find input field");
  }

  // Step 2: Paste screenshot
  await pasteScreenshot(inputField, screenshot);
  await sleep(300); // Wait for image to process

  // Step 3: Type prompt
  await typePrompt(inputField, prompt);
  await sleep(200);

  // Step 4: Click send
  const sendButton = await findSendButton();
  if (sendButton) {
    sendButton.click();
  } else {
    // Fallback: try keyboard
    inputField.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
  }

  // Step 5: Wait for response
  const response = await waitForResponse(60000); // 60s timeout
  return response;
}

/**
 * Find the main input field
 * Tries multiple strategies for different AI providers
 */
async function findInputField(): Promise<HTMLElement | null> {
  // Strategy 1: contenteditable with role=textbox
  let input = document.querySelector('[role="textbox"][contenteditable="true"]') as HTMLElement;
  if (input) return input;

  // Strategy 2: Largest contenteditable div (usually the input)
  const editables = Array.from(document.querySelectorAll("[contenteditable=true]")) as HTMLElement[];
  if (editables.length > 0) {
    const largest = editables.sort((a, b) => {
      const aHeight = a.offsetHeight || a.clientHeight;
      const bHeight = b.offsetHeight || b.clientHeight;
      return bHeight - aHeight;
    })[0];

    if (largest && (largest.offsetHeight > 40 || largest.clientHeight > 40)) {
      return largest;
    }
  }

  // Strategy 3: Standard textarea
  input = document.querySelector("textarea") as HTMLElement;
  if (input) return input;

  // Strategy 4: Listen for user click
  return await waitForUserClick(5000);
}

/**
 * Wait for user to click on an input field
 * Used as fallback when auto-detection fails
 */
function waitForUserClick(timeout: number): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    let clicked = false;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.matches('[contenteditable="true"]') ||
        target.matches("textarea") ||
        target.matches("input[type=text]")
      ) {
        clicked = true;
        document.removeEventListener("click", handler);
        resolve(target);
      }
    };

    document.addEventListener("click", handler);
    setTimeout(() => {
      if (!clicked) {
        document.removeEventListener("click", handler);
        resolve(null);
      }
    }, timeout);
  });
}

/**
 * Paste screenshot into input field
 */
async function pasteScreenshot(inputField: HTMLElement, screenshotDataUrl: string): Promise<void> {
  // Create blob from data URL
  const response = await fetch(screenshotDataUrl);
  const blob = await response.blob();

  // Create ClipboardItem with image
  const clipboardItem = new ClipboardItem({ "image/png": blob });

  // Copy to clipboard
  await navigator.clipboard.write([clipboardItem]);

  // Focus and paste
  inputField.focus();
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Trigger paste
  document.execCommand("paste");

  // Wait for image to be processed
  await sleep(500);
}

/**
 * Type prompt text into input field
 */
async function typePrompt(inputField: HTMLElement, prompt: string): Promise<void> {
  inputField.focus();

  // Clear any existing text
  inputField.innerHTML = "";

  // Set text content
  if (inputField instanceof HTMLTextAreaElement || inputField instanceof HTMLInputElement) {
    inputField.value = prompt;
  } else {
    inputField.textContent = prompt;
  }

  // Trigger input events
  inputField.dispatchEvent(new Event("input", { bubbles: true }));
  inputField.dispatchEvent(new Event("change", { bubbles: true }));

  // Simulate typing for AI models that track input
  for (const char of prompt) {
    inputField.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: char,
        bubbles: true,
      })
    );
    await sleep(5); // Simulate keystroke delay
  }
}

/**
 * Find and return the send button
 */
function findSendButton(): HTMLElement | null {
  // Look for button with send-like text
  const buttons = Array.from(document.querySelectorAll("button"));
  const sendButton = buttons.find(
    (btn) =>
      btn.textContent?.toLowerCase().includes("send") ||
      btn.getAttribute("aria-label")?.toLowerCase().includes("send") ||
      btn.className.includes("send")
  );

  return sendButton || null;
}

/**
 * Wait for AI response to appear
 */
async function waitForResponse(timeout: number): Promise<string> {
  const startTime = Date.now();

  // Poll for new messages
  while (Date.now() - startTime < timeout) {
    // Look for last message that doesn't belong to user
    const messages = Array.from(document.querySelectorAll("[role=article], .message, .chat-message"));

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const text = lastMessage.textContent;

      if (text && text.length > 20) {
        // Likely a real response
        return text;
      }
    }

    await sleep(500);
  }

  throw new Error("Timeout waiting for AI response");
}

/**
 * Helper: Sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
