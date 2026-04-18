export type UserTier = "free" | "pro" | "max";
export type SelectedModel = "haiku" | "sonnet" | "opus";
export type IndicatorColor = "green" | "yellow" | "orange" | "red";

export interface SessionStatus {
  usage: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  shouldThrottle: boolean;
  indicator: IndicatorColor;
  timeUntilReset: string;
}

export interface VerificationRecord {
  id: string;
  timestamp: string;
  model: SelectedModel;
  prompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
}

export interface ExtensionState {
  userId: string;
  userTier: UserTier;
  apiKey: string | null;
  selectedModel: SelectedModel;
  dailyUsage: number;
  lastUsageReset: string;
  sessionStatus: SessionStatus | null;
  latestScreenshot: string | null;
  currentResponse: string;
  error: string | null;
  status: "idle" | "capturing" | "captured" | "processing" | "completed" | "error";
  verificationHistory: VerificationRecord[];
}

export interface ApiResponse {
  success: boolean;
  response: string;
  error?: string;
  errorCode?: string;
  tokenCount?: {
    input: number;
    output: number;
  };
}

export type RuntimeRequest =
  | { type: "verifyai:get-state" }
  | { type: "verifyai:capture" }
  | { type: "verifyai:verify"; prompt: string }
  | { type: "verifyai:get-session-status" }
  | { type: "verifyai:set-user-tier"; tier: UserTier }
  | { type: "verifyai:update-settings"; payload: Partial<ExtensionState> }
  | { type: "verifyai:clear-history" };
