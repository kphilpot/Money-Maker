import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ExtensionState, SelectedModel, SessionStatus, UserTier, VerificationRecord } from "./types";
import { modelMap } from "./adapters/claude-api";

async function sendMessage<T>(message: unknown): Promise<T> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response as T);
    });
  });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTokens(input: number, output: number): string {
  return `${input.toLocaleString()} in / ${output.toLocaleString()} out`;
}

function getIndicatorColors(status: SessionStatus["indicator"]) {
  switch (status) {
    case "yellow":
      return { background: "#fff7d6", border: "#e6c453", text: "#6f5600" };
    case "orange":
      return { background: "#ffe6d4", border: "#df8a4a", text: "#7a3e0f" };
    case "red":
      return { background: "#ffe1e1", border: "#d45a5a", text: "#7f1d1d" };
    default:
      return { background: "#e6f6ea", border: "#6fb784", text: "#1f5c2e" };
  }
}

function getModelLabel(model: SelectedModel) {
  switch (model) {
    case "sonnet":
      return "Sonnet";
    case "opus":
      return "Opus";
    default:
      return "Haiku";
  }
}

function SessionCard({ state }: { state: ExtensionState }) {
  if (!state.sessionStatus) {
    return null;
  }

  const colors = getIndicatorColors(state.sessionStatus.indicator);
  const progress = Number.isFinite(state.sessionStatus.percentUsed)
    ? Math.min(100, Math.max(0, state.sessionStatus.percentUsed))
    : 0;

  return (
    <div style={{ ...styles.card, background: colors.background, border: `1px solid ${colors.border}`, color: colors.text }}>
      <div style={styles.sectionTitle}>Session Status</div>
      <div style={styles.metricRow}>
        <strong>
          {state.sessionStatus.usage} / {state.sessionStatus.limit === Infinity ? "8" : state.sessionStatus.limit} audits
        </strong>
        <span>{state.userTier.toUpperCase()}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%`, background: colors.text }} />
      </div>
      <div style={styles.smallText}>{state.sessionStatus.percentUsed.toFixed(1)}% of daily limit</div>
      <div style={styles.smallText}>? {state.sessionStatus.timeUntilReset} until reset</div>
      {state.sessionStatus.shouldThrottle && state.userTier !== "max" && (
        <div style={{ ...styles.smallText, fontWeight: 700 }}>Economy mode active. Responses slow down after today's cap.</div>
      )}
    </div>
  );
}

function HistoryCard({ state }: { state: ExtensionState }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const history = state.verificationHistory || [];

  if (history.length === 0) {
    return null;
  }

  const clearHistory = async () => {
    const confirmed = confirm("Clear all verification history? This cannot be undone.");
    if (confirmed) {
      await sendMessage<ExtensionState>({ type: "verifyai:clear-history" });
    }
  };

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={styles.sectionTitle}>Verification History ({history.length})</div>
        <button
          onClick={clearHistory}
          style={{
            background: "none",
            border: "none",
            color: "#d45a5a",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          Clear
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {history.slice(0, 10).map((record: VerificationRecord) => (
          <div
            key={record.id}
            style={{
              borderRadius: "10px",
              border: "1px solid #d9d3c7",
              padding: "10px",
              cursor: "pointer",
              background: expandedId === record.id ? "#f8f5ee" : "#fffdfa",
            }}
            onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#1f2933" }}>
                  {record.model} • {formatTime(record.timestamp)}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#52606d",
                    marginTop: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: expandedId === record.id ? "normal" : "nowrap",
                  }}
                >
                  {record.prompt}
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#7b8794" }}>
                {record.inputTokens + record.outputTokens > 0 && formatTokens(record.inputTokens, record.outputTokens)}
              </div>
            </div>
            {expandedId === record.id && (
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #d9d3c7" }}>
                <div style={{ ...styles.smallText, fontWeight: 600, marginBottom: "4px" }}>Response:</div>
                <div style={{ ...styles.responseBox, fontSize: "12px" }}>{record.response}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel() {
  const [state, setState] = useState<ExtensionState | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadState = async () => {
      const nextState = await sendMessage<ExtensionState>({ type: "verifyai:get-state" });
      if (mounted) {
        setState(nextState);
      }
    };

    const refreshSession = async () => {
      const nextState = await sendMessage<ExtensionState>({ type: "verifyai:get-session-status" });
      if (mounted) {
        setState(nextState);
      }
    };

    void loadState();
    void refreshSession();

    const storageListener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === "local" && changes["verifyai:state"]) {
        void loadState();
      }
    };

    chrome.storage.onChanged.addListener(storageListener);
    const interval = window.setInterval(() => {
      void refreshSession();
    }, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const updateSettings = async (payload: Partial<ExtensionState>) => {
    const nextState = await sendMessage<ExtensionState>({ type: "verifyai:update-settings", payload });
    setState(nextState);
  };

  const handleCapture = async () => {
    setLoading(true);
    const nextState = await sendMessage<ExtensionState>({ type: "verifyai:capture" });
    setState(nextState);
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!prompt.trim()) {
      return;
    }

    setLoading(true);
    const nextState = await sendMessage<ExtensionState>({ type: "verifyai:verify", prompt });
    setState(nextState);
    setLoading(false);
  };

  const handleTierChange = async (userTier: UserTier) => {
    const nextState = await sendMessage<ExtensionState>({ type: "verifyai:set-user-tier", tier: userTier });
    setState(nextState);
  };

  if (!state) {
    return <div style={styles.loadingScreen}>Loading VerifyAI...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <div style={styles.brand}>VerifyAI</div>
          <div style={styles.subtitle}>Professional screenshot verification with Claude AI</div>
        </div>
        <div style={styles.statusChip}>{state.status}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Settings</div>
        <input
          type="text"
          placeholder="User ID"
          value={state.userId}
          onChange={(event) => {
            void updateSettings({ userId: event.target.value });
          }}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Anthropic API Key"
          value={state.apiKey || ""}
          onChange={(event) => {
            void updateSettings({ apiKey: event.target.value });
          }}
          style={styles.input}
        />
        <select
          value={state.userTier}
          onChange={(event) => {
            void handleTierChange(event.target.value as UserTier);
          }}
          style={styles.input}
        >
          <option value="free">Free (50/day, 5s throttle at cap)</option>
          <option value="pro">Pro (100/day, 3s throttle at cap) - $20/mo</option>
          <option value="max">Max (Unlimited, no throttle) - $99/mo</option>
        </select>
        <select
          value={state.selectedModel}
          onChange={(event) => {
            void updateSettings({ selectedModel: event.target.value as SelectedModel });
          }}
          style={styles.input}
        >
          <option value="haiku">Haiku (Fast and cheap)</option>
          <option value="sonnet">Sonnet (Balanced)</option>
          <option value="opus">Opus (Most capable)</option>
        </select>
      </div>

      <SessionCard state={state} />

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Screenshot</div>
        <button onClick={() => void handleCapture()} disabled={loading} style={styles.primaryButton}>
          Capture Screenshot
        </button>
        {state.latestScreenshot ? (
          <img src={state.latestScreenshot} alt="Captured screenshot" style={styles.previewImage} />
        ) : (
          <div style={styles.placeholder}>No screenshot captured yet.</div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Prompt</div>
        <textarea
          placeholder="Ask Claude about this screenshot..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          disabled={loading || !state.latestScreenshot}
          style={styles.textarea}
        />
        <button
          onClick={() => void handleVerify()}
          disabled={loading || !state.latestScreenshot || !prompt.trim()}
          style={styles.secondaryButton}
        >
          {loading ? "Verifying..." : `Send to ${getModelLabel(state.selectedModel)}`}
        </button>
      </div>

      {state.currentResponse && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Claude Response</div>
          <div style={styles.responseBox}>{state.currentResponse}</div>
        </div>
      )}

      {state.error && (
        <div style={{ ...styles.card, border: "1px solid #d45a5a", background: "#ffe1e1" }}>
          <div style={{ ...styles.sectionTitle, color: "#7f1d1d" }}>Error</div>
          <div style={{ color: "#7f1d1d", fontSize: "13px", lineHeight: 1.5 }}>{state.error}</div>
        </div>
      )}

      <HistoryCard state={state} />

      <div style={styles.footer}>
        Status: {state.status} • Tier: {state.userTier} • Model: {state.selectedModel}
        <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.6 }}>
          API: {modelMap[state.selectedModel]}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    minHeight: "100%",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    color: "#1f2933",
  },
  hero: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  brand: {
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  subtitle: {
    fontSize: "12px",
    color: "#52606d",
    marginTop: "4px",
    lineHeight: 1.4,
  },
  statusChip: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#e4ecf3",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#334e68",
  },
  card: {
    background: "rgba(255, 255, 255, 0.92)",
    borderRadius: "14px",
    border: "1px solid #d9d3c7",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#52606d",
  },
  input: {
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #c5bfb3",
    background: "#fffdfa",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#1f2933",
  },
  textarea: {
    width: "100%",
    minHeight: "96px",
    resize: "vertical",
    borderRadius: "10px",
    border: "1px solid #c5bfb3",
    background: "#fffdfa",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#1f2933",
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
  primaryButton: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #24618e",
    background: "#2f6f9f",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #1f6a42",
    background: "#2f8a58",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  previewImage: {
    width: "100%",
    maxHeight: "220px",
    objectFit: "cover",
    borderRadius: "12px",
    border: "1px solid #d9d3c7",
  },
  placeholder: {
    padding: "24px 16px",
    borderRadius: "12px",
    border: "1px dashed #b6ad9c",
    background: "#f8f5ee",
    textAlign: "center",
    fontSize: "13px",
    color: "#7b8794",
  },
  responseBox: {
    whiteSpace: "pre-wrap",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#243b53",
  },
  loadingScreen: {
    padding: "20px",
    fontSize: "14px",
    color: "#52606d",
  },
  smallText: {
    fontSize: "12px",
    lineHeight: 1.4,
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    fontSize: "13px",
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: "8px",
    borderRadius: "999px",
    background: "rgba(31, 41, 51, 0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
  },
  footer: {
    textAlign: "center",
    fontSize: "12px",
    color: "#52606d",
    paddingBottom: "4px",
  },
};

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <Panel />
    </React.StrictMode>,
  );
}

export default Panel;
