import { getDailyUsage, getLastResetDate, incrementDailyUsage, resetDailyUsageIfNeeded } from "./utils/usage-tracker";
import type { IndicatorColor, SessionStatus, UserTier } from "./types";

const LIMITS: Record<UserTier, { daily: number; throttleDelay: number }> = {
  free: { daily: 50, throttleDelay: 5000 },
  pro: { daily: 100, throttleDelay: 3000 },
  max: { daily: Infinity, throttleDelay: 0 },
};

function normalizeUserId(userId: string, userTier: UserTier) {
  return `${userId.trim() || "anonymous"}:${userTier}`;
}

export class SessionManager {
  constructor(private userId: string, private userTier: UserTier) {}

  private get scopedUserId() {
    return normalizeUserId(this.userId, this.userTier);
  }

  async getSessionStatus(): Promise<SessionStatus> {
    await resetDailyUsageIfNeeded(this.scopedUserId);
    const usage = await getDailyUsage(this.scopedUserId);
    const limit = LIMITS[this.userTier].daily;
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - usage);
    const percentUsed = limit === Infinity ? 0 : (usage / limit) * 100;
    const shouldThrottle = limit !== Infinity && usage >= limit && this.userTier !== "max";
    const indicator = this.getStatusIndicator(percentUsed);
    const timeUntilReset = await this.calculateTimeUntilReset();

    return {
      usage,
      limit,
      remaining,
      percentUsed,
      shouldThrottle,
      indicator,
      timeUntilReset,
    };
  }

  async getThrottleDelay(): Promise<number> {
    if (this.userTier === "max") {
      return 0;
    }

    const status = await this.getSessionStatus();
    return status.shouldThrottle ? LIMITS[this.userTier].throttleDelay : 0;
  }

  async recordUsage(): Promise<SessionStatus> {
    await incrementDailyUsage(this.scopedUserId);
    return this.getSessionStatus();
  }

  async getLastResetDate(): Promise<string> {
    return getLastResetDate(this.scopedUserId);
  }

  private getStatusIndicator(percentUsed: number): IndicatorColor {
    if (percentUsed < 90) {
      return "green";
    }
    if (percentUsed < 98) {
      return "yellow";
    }
    if (percentUsed < 100) {
      return "orange";
    }
    return "red";
  }

  private async calculateTimeUntilReset(): Promise<string> {
    const lastReset = new Date(await getLastResetDate(this.scopedUserId));
    const tomorrow = new Date(lastReset);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const diff = tomorrow.getTime() - Date.now();
    if (diff <= 0) {
      return "Resetting now...";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hours ${minutes} minutes`;
  }
}
