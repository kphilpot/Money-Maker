import { readLocalDeviceValue, removeLocalDeviceValue, writeLocalDeviceValue } from "./storage";
import { getDailyUsage as getBackendUsage, incrementDailyUsage as incrementBackendUsage } from "./api-client";
import type { UserTier } from "../types";

const USAGE_KEY_PREFIX = "verifyai:usage";
const RESET_KEY_PREFIX = "verifyai:reset";

interface UsageData {
  count: number;
  lastReset: string;
}

function normalizeUserId(userId: string) {
  return userId.trim() || "anonymous";
}

function usageKey(userId: string) {
  return `${USAGE_KEY_PREFIX}:${normalizeUserId(userId)}`;
}

function resetKey(userId: string) {
  return `${RESET_KEY_PREFIX}:${normalizeUserId(userId)}`;
}

/**
 * Parse user ID to extract base ID (without tier suffix)
 */
function parseUserId(scopedId: string): string {
  // scopedId format: "user-id:tier"
  const parts = scopedId.split(":");
  return parts[0] || scopedId;
}

/**
 * Extract tier from scoped user ID
 */
function extractTier(scopedId: string): UserTier {
  const parts = scopedId.split(":");
  const tier = parts[1] as UserTier | undefined;
  return tier || "free";
}

/**
 * Get daily usage count.
 * Free tier: localStorage only
 * Pro/Max tiers: backend API
 */
export async function getDailyUsage(scopedUserId: string): Promise<number> {
  const tier = extractTier(scopedUserId);
  const userId = parseUserId(scopedUserId);

  // For pro/max tiers, fetch from backend
  if (tier !== "free") {
    try {
      const backendCount = await getBackendUsage(userId);
      return backendCount;
    } catch (error) {
      console.warn("Failed to fetch usage from backend, falling back to localStorage", error);
      // Fall back to localStorage if backend is down
    }
  }

  // For free tier or fallback: use localStorage
  const key = usageKey(scopedUserId);
  const raw = await readLocalDeviceValue(key);

  if (!raw) {
    return 0;
  }

  const parsed = JSON.parse(raw) as UsageData;
  const shouldReset = await resetDailyUsageIfNeeded(scopedUserId);
  return shouldReset ? 0 : parsed.count;
}

/**
 * Increment usage counter.
 * Free tier: localStorage only
 * Pro/Max tiers: backend API
 */
export async function incrementDailyUsage(scopedUserId: string): Promise<number> {
  const tier = extractTier(scopedUserId);
  const userId = parseUserId(scopedUserId);

  // For pro/max tiers, increment in backend
  if (tier !== "free") {
    try {
      const newCount = await incrementBackendUsage(userId);
      return newCount;
    } catch (error) {
      console.warn("Failed to increment usage in backend, falling back to localStorage", error);
      // Fall back to localStorage if backend is down
    }
  }

  // For free tier or fallback: use localStorage
  const key = usageKey(scopedUserId);
  const current = await getDailyUsage(scopedUserId);
  const newCount = current + 1;
  const lastReset = await getLastResetDate(scopedUserId);

  const data: UsageData = {
    count: newCount,
    lastReset,
  };

  await writeLocalDeviceValue(key, JSON.stringify(data));
  return newCount;
}

/**
 * Get last reset date (UTC midnight).
 * For all tiers, computed locally based on when last reset occurred
 */
export async function getLastResetDate(scopedUserId: string): Promise<string> {
  const key = resetKey(scopedUserId);
  const stored = await readLocalDeviceValue(key);

  if (!stored) {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const isoString = midnight.toISOString();
    await writeLocalDeviceValue(key, isoString);
    return isoString;
  }

  return stored;
}

/**
 * Reset usage if crossed UTC midnight.
 * Free tier: localStorage only
 * Pro/Max tiers: backend tracks separately, but we track local reset time
 */
export async function resetDailyUsageIfNeeded(scopedUserId: string): Promise<boolean> {
  const lastReset = await getLastResetDate(scopedUserId);
  const lastResetDate = new Date(lastReset);
  const now = new Date();
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (lastResetDate < todayMidnight) {
    await writeLocalDeviceValue(resetKey(scopedUserId), todayMidnight.toISOString());
    await removeLocalDeviceValue(usageKey(scopedUserId));
    return true;
  }

  return false;
}
