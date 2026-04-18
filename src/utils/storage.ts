import type { ExtensionState } from "../types";

const STATE_KEY = "verifyai:state";
const INFINITY_TOKEN = "__VERIFYAI_INFINITY__";

const initialState: ExtensionState = {
  userId: "",
  userTier: "free",
  apiKey: null,
  selectedModel: "haiku",
  dailyUsage: 0,
  lastUsageReset: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())).toISOString(),
  sessionStatus: null,
  latestScreenshot: null,
  currentResponse: "",
  error: null,
  status: "idle",
  verificationHistory: [],
};

function hasLocalStorage() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function serialize(value: unknown) {
  return JSON.stringify(value, (_key, currentValue) => (currentValue === Infinity ? INFINITY_TOKEN : currentValue));
}

function deserialize<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value, (_key, currentValue) => (currentValue === INFINITY_TOKEN ? Infinity : currentValue)) as T;
  } catch {
    return fallback;
  }
}

export async function readLocalDeviceValue(key: string): Promise<string | null> {
  if (hasLocalStorage()) {
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      await chrome.storage.local.set({ [key]: localValue });
      return localValue;
    }
  }

  const stored = (await chrome.storage.local.get(key)) as Record<string, string | undefined>;
  return stored[key] ?? null;
}

export async function writeLocalDeviceValue(key: string, value: string): Promise<void> {
  if (hasLocalStorage()) {
    localStorage.setItem(key, value);
  }

  await chrome.storage.local.set({ [key]: value });
}

export async function removeLocalDeviceValue(key: string): Promise<void> {
  if (hasLocalStorage()) {
    localStorage.removeItem(key);
  }

  await chrome.storage.local.remove(key);
}

export async function getStoredState(): Promise<ExtensionState> {
  const raw = await readLocalDeviceValue(STATE_KEY);
  if (!raw) {
    return { ...initialState };
  }

  return { ...initialState, ...deserialize<ExtensionState>(raw, initialState) };
}

export async function updateStoredState(partial: Partial<ExtensionState>): Promise<ExtensionState> {
  const current = await getStoredState();
  const updated: ExtensionState = {
    ...current,
    ...partial,
  };

  await writeLocalDeviceValue(STATE_KEY, serialize(updated));
  return updated;
}
