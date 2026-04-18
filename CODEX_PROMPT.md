# **VerifyAI: Codex Implementation Prompt**

## **CONTEXT: What We're Building**

We are transforming the existing AI Companion extension (`C:\Users\user\Personal_Workspace\02_Projects\Codex-AI Companion\ai-companion-extension`) into **VerifyAI**, a professional verification platform with:

- **Soft-ceiling usage tiers** (not hard blocks)
- **Session countdown system** (shows time until reset)
- **Three pricing tiers:** FREE (injection), PRO ($20/mo), MAX ($99/mo)
- **Dynamic throttling** (slow down instead of blocking)
- **Immutable audit trail** (SHA-256 chain-of-custody)

**Reference Document:** `/c/Users/user/Personal_Workspace/02_Projects/Money\ Maker/HANDOFF.md` (contains all specs)

---

## **EXISTING CODEBASE STRUCTURE**

```
ai-companion-extension/
├── src/
│   ├── background.ts          # Service worker, manages state + injection
│   ├── content.ts             # Content script, interacts with AI tabs
│   ├── panel.tsx              # React UI for the side panel
│   ├── panel-simple.tsx       # Simplified panel
│   ├── types.ts               # TypeScript interfaces
│   ├── adapters/              # AI provider adapters (ChatGPT, Claude, Gemini)
│   └── utils/
│       ├── api.ts             # API calls
│       ├── screenshot.ts       # Screenshot capture
│       ├── platforms.ts        # Provider detection
│       └── ...
├── manifest.json              # Chrome extension config
├── public/                     # Static assets, icons
└── package.json               # Dependencies
```

**Key Existing Types:**
```typescript
ExtensionState {
  selectedAI: "chatgpt" | "claude" | "gemini"
  history: ConversationMessage[]
  status: "idle" | "captured" | "injecting" | "completed" | "error"
  // ... more fields
}
```

---

## **COMPLETE IMPLEMENTATION CHECKLIST**

### **PHASE 1: Session Management & Throttling (Week 1-2)**

#### **1.1 Create `src/session-manager.ts`**

```typescript
export class SessionManager {
  userId: string;
  tier: 'free' | 'pro' | 'max';
  
  // Define by tier
  limits = {
    free: { daily: 50, throttleDelay: 5000 },      // 5s delay
    pro: { daily: 100, throttleDelay: 3000 },      // 3s delay
    max: { daily: Infinity, throttleDelay: 0 }     // No throttle
  };

  async getSessionStatus() {
    // Returns: { usage, limit, percentageUsed, timeUntilReset, status, message, canProceed, shouldThrottle }
  }

  getStatusIndicator(percentageUsed: number) {
    // Returns: { color, emoji, text }
    // 'green'/'yellow'/'orange'/'red'
  }

  getWarningMessage(usage, limit, timeUntilReset) {
    // Returns user-friendly warning based on usage %
  }

  calculateTimeUntilReset() {
    // Returns "8h 34m" until tomorrow midnight
  }

  async recordUsage() {
    // Increment daily usage counter
  }

  async getThrottleDelay() {
    // Returns delay in ms if at limit
  }
}
```

**Requirements:**
- Track daily usage per user (reset at midnight)
- Calculate time until reset
- Never fully block (only throttle)
- Store usage in localStorage for free users, backend for paid

---

#### **1.2 Update `src/types.ts`**

Add new types:

```typescript
export type UserTier = 'free' | 'pro' | 'max';

export type SessionStatus = {
  usage: number;
  limit: number;
  percentageUsed: number;
  timeUntilReset: string;
  status: { color: string; emoji: string; text: string };
  message: string;
  canProceed: boolean;
  shouldThrottle: boolean;
};

export type ExtensionState = ExtensionState & {
  userTier: UserTier;              // NEW
  dailyUsage: number;               // NEW
  lastUsageReset: string;           // NEW (ISO date)
  subscriptionStatus: 'none' | 'pro' | 'max'; // NEW
  apiKey: string | null;            // NEW (encrypted)
};

export type RuntimeRequest = RuntimeRequest | 
  | { type: "verifyai:get-session-status" }        // NEW
  | { type: "verifyai:set-user-tier"; tier: UserTier } // NEW
  | { type: "verifyai:record-usage" };             // NEW
```

---

#### **1.3 Update `src/background.ts`**

Replace the `relayInjection()` function to include throttling:

```typescript
async function relayInjection(request: Extract<RuntimeRequest, { type: "companion:inject" }>) {
  // NEW: Get session manager
  const session = new SessionManager(state.userId, state.userTier);
  const status = await session.getSessionStatus();
  
  // NEW: Show session countdown
  // (send to panel via updateStoredState)
  
  // NEW: Check if should throttle
  if (status.shouldThrottle && state.userTier !== 'max') {
    const delayMs = await session.getThrottleDelay();
    // Apply delay before calling AI
    await sleep(delayMs);
  }
  
  // NEW: Record usage
  await session.recordUsage();
  
  // ... existing injection logic ...
}
```

**Key Changes:**
- Before calling injection, check session status
- Apply throttle delay if needed
- Record usage after successful verification
- Return session status to UI

---

#### **1.4 Create `src/utils/usage-tracker.ts`**

```typescript
export async function getDailyUsage(userId: string): Promise<number> {
  // Get today's usage count from localStorage (free) or backend (paid)
}

export async function incrementDailyUsage(userId: string): Promise<void> {
  // Add 1 to today's usage
}

export async function getLastResetDate(userId: string): Promise<string> {
  // Get ISO date of last reset (midnight)
}

export async function resetDailyUsageIfNeeded(userId: string): Promise<void> {
  // If midnight passed, reset counter
}
```

**Requirements:**
- For FREE users: localStorage only (no backend cost)
- For PRO/MAX users: backend database (Supabase)
- Auto-reset at midnight UTC

---

### **PHASE 2: UI Updates (Week 2)**

#### **2.1 Update `src/panel.tsx`**

Add new section to show session countdown:

```typescript
const SessionCountdown = ({ status }: { status: SessionStatus }) => {
  if (!status) return null;
  
  return (
    <div className="session-countdown">
      <div className="status-indicator" style={{ color: status.status.color }}>
        {status.status.emoji} {status.status.text}
      </div>
      
      <div className="usage-bar">
        <progress 
          value={status.percentageUsed} 
          max="100"
        />
        <span>{status.usage} / {status.limit} audits</span>
      </div>
      
      <div className="reset-timer">
        ⏱️ {status.timeUntilReset} until reset
      </div>
      
      <div className="warning-message">
        {status.message}
      </div>
      
      {status.shouldThrottle && (
        <div className="throttle-warning">
          ⏳ Running in Economy Mode (single AI, delays)
          <button onClick={() => showUpgradeModal()}>
            Upgrade to Max for instant responses
          </button>
        </div>
      )}
    </div>
  );
};
```

**Display in panel:**
- Show session status before verification button
- Update in real-time as user approaches limit
- Show upgrade options when appropriate

---

#### **2.2 Create `src/ui/upgrade-modal.tsx`**

Modal showing upgrade options:

```typescript
const UpgradeModal = () => {
  return (
    <div className="modal">
      <h2>Upgrade Your Plan</h2>
      
      <PlanCard
        name="Pro"
        price="$20/month"
        dailyLimit="100 audits/day"
        features={["Multi-AI support", "Custom templates", "Team sharing"]}
        cta="Upgrade to Pro"
      />
      
      <PlanCard
        name="Max"
        price="$99/month"
        dailyLimit="Unlimited"
        features={["Zero throttling", "Priority support", "White-label"]}
        cta="Upgrade to Max"
      />
    </div>
  );
};
```

---

### **PHASE 3: Backend Integration (Week 3)**

#### **3.1 Update `src/utils/api.ts`**

Add new API functions:

```typescript
export async function getUserTier(userId: string): Promise<UserTier> {
  // GET /api/users/{userId}/tier
  // Returns: 'free' | 'pro' | 'max'
}

export async function getDailyUsageFromBackend(userId: string): Promise<number> {
  // GET /api/users/{userId}/usage/today
  // Returns: { count: number, resetAt: ISO string }
}

export async function recordUsageEvent(userId: string): Promise<void> {
  // POST /api/users/{userId}/usage
  // Body: { action: 'verification', timestamp: ISO string }
}

export async function getSessionStatus(userId: string, tier: UserTier): Promise<SessionStatus> {
  // GET /api/users/{userId}/session-status
  // Returns full session status object
}

export async function logAuditTrail(userId: string, event: AuditEvent): Promise<void> {
  // POST /api/audit
  // Log: { userId, timestamp, action, result, screenshotHash, etc. }
}
```

**Backend Integration:**
- All paid tier functions call backend
- Free tier uses localStorage
- Audit trail always logs (even for free users)

---

#### **3.2 Create `src/utils/crypto.ts`**

SHA-256 hashing for immutable audit trail:

```typescript
export async function generateHash(data: {
  screenshot: string;
  verdict: string;
  reasoning: string;
  rulebook: string;
  timestamp: string;
}): Promise<string> {
  // Use SubtleCrypto to generate SHA-256
  // Returns: hex string
}

export async function createAuditEntry(
  verification: VerificationResult
): Promise<AuditEntry> {
  // Create: { hash, previousHash, timestamp, data }
  // Store in localStorage (free) or backend (paid)
}
```

---

### **PHASE 4: Verification Logic (Week 4)**

#### **4.1 Update `src/background.ts`** - `performVerification()` function

Replace the entire verification flow:

```typescript
async function performVerification(
  userId: string,
  screenshot: string,
  prompt: string,
  tier: UserTier
) {
  // STEP 1: Get session status
  const session = new SessionManager(userId, tier);
  const status = await session.getSessionStatus();
  
  // STEP 2: Show countdown to user (update UI)
  await updateStoredState({ sessionStatus: status });
  
  // STEP 3: Check if should throttle
  if (status.shouldThrottle && tier !== 'max') {
    const delay = await session.getThrottleDelay();
    await new Promise(r => setTimeout(r, delay));
  }
  
  // STEP 4: Route based on tier
  let result;
  if (tier === 'free') {
    // Use injection (their open Claude tab)
    result = await performFreeVerification(screenshot, prompt);
  } else {
    // Use API (your Claude key)
    result = await performPaidVerification(userId, screenshot, prompt, tier);
  }
  
  // STEP 5: Record usage
  await session.recordUsage();
  
  // STEP 6: Create audit trail
  const auditEntry = await createAuditEntry({
    userId,
    screenshot,
    verdict: result.verdict,
    reasoning: result.reasoning,
    timestamp: new Date().toISOString()
  });
  
  // STEP 7: Return result with metadata
  return {
    ...result,
    sessionStatus: status,
    auditHash: auditEntry.hash
  };
}

async function performFreeVerification(
  screenshot: string,
  prompt: string
): Promise<VerificationResult> {
  // OLD: relayInjection() logic
  // Find user's open Claude tab
  // Inject screenshot + prompt
  // Wait for response
  // Return result
}

async function performPaidVerification(
  userId: string,
  screenshot: string,
  prompt: string,
  tier: UserTier
): Promise<VerificationResult> {
  // NEW: Call Claude API using your API key
  // POST to Anthropic API
  // Return { verdict, reasoning, confidence }
}
```

---

#### **4.2 Create `src/adapters/claude-api.ts`**

Call Claude API directly for paid users:

```typescript
export async function callClaudeAPI(
  screenshot: string,
  prompt: string,
  apiKey: string
): Promise<{ verdict: string; reasoning: string; confidence: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshot } },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  
  // Parse response to extract verdict, reasoning, confidence
  return parseVerification(text);
}
```

---

### **PHASE 5: Supabase Backend (Week 5)**

#### **5.1 Database Schema**

Create these tables in Supabase:

```sql
-- Users table (extend existing)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  tier TEXT ('free' | 'pro' | 'max'),
  subscription_status TEXT ('none' | 'active' | 'cancelled'),
  stripe_id TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Daily usage tracking
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date TEXT (YYYY-MM-DD),
  count INTEGER,
  cost DECIMAL,
  created_at TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Immutable audit trail
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMP,
  action TEXT ('verification'),
  result TEXT ('pass' | 'fail' | 'unclear'),
  screenshot_hash TEXT,
  reasoning_hash TEXT,
  rulebook_version TEXT,
  previous_hash TEXT,  -- For chain integrity
  hash TEXT UNIQUE,    -- SHA-256 of entire entry
  created_at TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tier TEXT ('pro' | 'max'),
  status TEXT ('active' | 'cancelled'),
  stripe_subscription_id TEXT,
  next_billing_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

#### **5.2 Vercel API Functions**

Create these in `vercel/api/`:

```
api/
├── auth/
│   ├── signup.ts
│   ├── login.ts
│   └── verify-token.ts
├── users/
│   ├── [id]/
│   │   ├── tier.ts (GET user tier)
│   │   ├── usage.ts (GET today's usage)
│   │   └── session-status.ts (GET full session)
├── verification/
│   ├── free.ts (handle free tier)
│   ├── pro.ts (handle pro tier)
│   └── max.ts (handle max tier)
├── audit/
│   └── log.ts (POST audit entry)
└── stripe/
    ├── webhook.ts (handle Stripe events)
    └── create-checkout.ts (create payment)
```

---

### **PHASE 6: Testing & Polish (Week 6)**

#### **6.1 Test Scenarios**

```typescript
// Test: Free user hits 90%
- Install as free
- Do 45 audits (90% of 50)
- ✅ See warning: "⚠️ You're nearing daily limit"
- ✅ Can continue to 50

// Test: Free user hits 100%
- Continue to 50 audits
- ✅ See "🔴 Daily limit reached"
- ✅ Economy mode active (5s delay)
- ✅ Can still use extension (just slow)

// Test: Pro user workflow
- Upgrade to Pro ($20)
- ✅ Get 100 audits/day
- ✅ Hit 90 → see countdown
- ✅ Hit 100 → economy mode (3s delay)
- ✅ Dashboard shows "8h 34m until reset"

// Test: Upgrade Mid-Day
- Free user does 40 audits
- Upgrades to Pro
- ✅ Daily counter resets
- ✅ Now have 100 available
- ✅ Old 40 don't count against Pro limit

// Test: Max tier
- Upgrade to Max
- ✅ Do 500 audits/day
- ✅ ZERO delays, ZERO warnings
- ✅ Still log audit trail
```

---

## **IMPLEMENTATION ORDER**

### **Week 1: Foundation**
1. Create SessionManager class
2. Update types.ts
3. Create usage-tracker.ts
4. Update background.ts with throttling

### **Week 2: UI**
5. Update panel.tsx with session countdown
6. Create upgrade modal
7. Add CSS for status indicators

### **Week 3: Backend**
8. Create Supabase schema
9. Update api.ts functions
10. Create crypto.ts for audit hashing

### **Week 4: Verification**
11. Refactor performVerification()
12. Create claude-api.ts adapter
13. Implement free vs paid routing

### **Week 5: Stripe**
14. Add Stripe integration
15. Create API webhook handlers
16. Update user tier on subscription

### **Week 6: Polish**
17. Run all test scenarios
18. Fix any issues
19. Deploy to Chrome Web Store

---

## **CRITICAL SUCCESS CRITERIA**

✅ Free users see soft ceiling warnings at 90%, not hard blocks  
✅ Session countdown accurate (shows real time until reset)  
✅ Pro users feel "unlimited" (100/day = 3,000/month potential)  
✅ Throttling applied correctly (3-5s delay, not full block)  
✅ Audit trail immutable (chain-of-custody hashing)  
✅ Upgrade conversion natural (not aggressive sales)  
✅ All costs tracked properly (for revenue forecast)  
✅ Zero data leaks (all sensitive data encrypted)  

---

## **FILES TO MODIFY**

| File | Changes | Priority |
|------|---------|----------|
| `src/types.ts` | Add SessionStatus, UserTier, new RuntimeRequests | HIGH |
| `src/background.ts` | Add throttling, session mgmt, usage tracking | HIGH |
| `src/panel.tsx` | Add SessionCountdown component, UpgradeModal | HIGH |
| `src/session-manager.ts` | NEW FILE - Core throttling logic | HIGH |
| `src/utils/usage-tracker.ts` | NEW FILE - Daily usage counter | HIGH |
| `src/utils/api.ts` | Add backend API functions | MEDIUM |
| `src/utils/crypto.ts` | NEW FILE - SHA-256 hashing | MEDIUM |
| `src/adapters/claude-api.ts` | NEW FILE - Direct API calls | MEDIUM |
| `manifest.json` | Update permissions for Supabase | LOW |

---

## **REFERENCE: HANDOFF DOCUMENT**

All technical specifications are in `/c/Users/user/Personal_Workspace/02_Projects/Money\ Maker/HANDOFF.md`

Key sections:
- **Section 2.3:** Complete code snippets for SessionManager
- **Section 3.2:** Full pricing tier definitions
- **Section 3.3:** Unit economics
- **Section 8:** Critical success factors

---

## **NEXT STEPS**

1. Copy this entire prompt into ChatGPT Codex
2. Ask Codex to **start with Phase 1: Create SessionManager**
3. Have Claude review each phase before moving to next
4. Use Claude to debug any issues

**Good luck! This is a solid business model. Build it well.** 🚀
