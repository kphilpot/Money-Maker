# **VerifyAI: Complete Handoff Document**

**Document Version:** 1.0  
**Last Updated:** 2026-04-17  
**Status:** Ready for Implementation  

---

## **1. PRODUCT OVERVIEW**

### **What Is VerifyAI?**

VerifyAI is a Chrome extension that eliminates the "last-mile integration" problem for AI. Instead of copying and pasting between tabs, professionals press one hotkey and instantly verify any information on their screen against their own rules/documents/manuals.

### **Core Problem Solved**

**Before VerifyAI:**
```
Paralegal sees a contract → Copies text → Switches to ChatGPT → 
Pastes contract → Pastes checklist → Waits for response → 
Copies response back → Switches back to contract
Time: 5-10 minutes per verification
Risk: Copy-paste errors, data leaks, context loss
```

**With VerifyAI:**
```
Paralegal sees a contract → Presses Ctrl+Shift+S → Sees result instantly
Time: 10 seconds
Risk: Minimal (stays in browser, uses their AI accounts)
```

### **Why This Wins**

1. **Platform Agnostic** - Works on ANY website (Salesforce, custom portals, web apps)
2. **Zero Setup Friction** - Free users just click install and use (injection into their tabs)
3. **90% Margins on Paid Tiers** - Costs you $2-10/mo to serve users paying $20-99/mo
4. **Soft Ceilings (not hard walls)** - Users never feel locked out, just gently guided toward upgrade
5. **Natural Conversion Funnel** - Free users hit limit naturally → upgrade organically (no hard sell)
6. **Vertical-Specific** - Can brand it 3 different ways for 3 markets

---

## **1.1 THE COMPLETE MODEL AT A GLANCE**

### **How It Works (Pitch Version)**

```
TIER          | METHOD           | DAILY LIMIT | COST TO YOU | COST TO USER | PROFIT
──────────────┼──────────────────┼─────────────┼─────────────┼──────────────┼────────
FREE          | Injection        | 50          | $0          | $0           | $0
              | (their tab)      | (soft ceil) |             |              |
              |                  |             |             |              |
PRO ($20/mo)  | Your API         | 100         | $2.07/mo    | $20/mo       | $17.93
              | (you pay)        | (soft ceil) |             |              |
              |                  |             |             |              |
MAX ($99/mo)  | Your API         | ∞           | $10/mo      | $99/mo       | $89/mo
              | (you pay)        | (unlimited) |             |              |
```

### **The Psychology**

```
User's Journey:
  Day 1: Installs → Free tier → "Wow, I have 50/day? That's generous"
  Day 5: Hits 45/50 → Warning toast → "Oh, I've been using this a lot"
  Day 10: Hits 50 again → Sees "Upgrade to Pro ($20) for 100/day"
  Day 15: Upgrades → Gets 100/day → "This feels unlimited"
  Day 25: Hits 100 → Economy mode (slower) → "Either wait 8h or upgrade to Max"
  Day 30: Subscription renews → "Worth every penny, best $20 I spent"

Result: 
  - Churn: 5% (users feel premium, not limited)
  - LTV: $720/pro user ($20 × 36 months)
  - Conversion: 10-15% free → pro (organic)
```

### **The Revenue Model**

```
Month 6:  500 Pro users → $10,000 MRR → $8,965 profit
Month 12: 2,000 Pro + 75 Max users → $49,925 MRR → $44,785 profit

Year 1 Profit: ~$200K (solo operation, 89% margins)
```

---

## **2. TECHNICAL ARCHITECTURE**

### **2.1 High-Level System Design**

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │   Active Page    │    │ Claude/ChatGPT   │               │
│  │  (Any Website)   │    │    Tab (Open)    │               │
│  └────────┬─────────┘    └────────┬─────────┘               │
│           │                       │                         │
│           │  Ctrl+Shift+S         │                         │
│           │  ┌──────────────┐     │                         │
│           └─→│   Extension  │◄────┘ (FREE: Injection)       │
│              │              │                               │
│              │  - Screenshot│                               │
│              │  - Context   │                               │
│              │  - Prompt    │                               │
│              └──────┬───────┘                               │
│                     │                                       │
│                     │ (PRO: API Call)                       │
│                     ▼                                       │
└─────────────────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼ (FREE)                    ▼ (PRO)
    ┌────────┐                  ┌──────────────────┐
    │ Inject │                  │  Anthropic API   │
    │ into   │                  │  (Claude 3.5)    │
    │ Claude │                  │                  │
    │ Tab    │                  │ Cost: $0.006/use │
    └────┬───┘                  └────────┬─────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                    ┌────▼─────┐
                    │ Extension │
                    │  Backend  │
                    │(Supabase) │
                    └────┬──────┘
                         │
                    ┌────▼─────────┐
                    │ Show Result   │
                    │ to User       │
                    └───────────────┘
```

### **2.2 Extension Architecture**

**Folder Structure:**

```
verifyai-extension/
├── manifest.json              # Chrome extension config
├── public/
│   ├── popup.html            # Extension popup UI
│   ├── background.html       # Service worker entry
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── icon-256.png
│
├── src/
│   ├── background/
│   │   ├── service-worker.js     # Main extension logic
│   │   ├── api-handler.js        # API calls to Claude
│   │   ├── injection-handler.js  # Silent injection logic
│   │   └── config-manager.js     # User settings
│   │
│   ├── content/
│   │   ├── injector.js           # Injects into AI tabs
│   │   ├── screenshot.js         # Captures screenshots
│   │   └── dom-detector.js       # Finds input fields dynamically
│   │
│   ├── popup/
│   │   ├── popup.js              # Popup UI logic
│   │   ├── popup.css             # Popup styling
│   │   └── components/
│   │       ├── result-display.js
│   │       ├── settings.js
│   │       └── history.js
│   │
│   ├── storage/
│   │   ├── local-storage.js      # User settings, cache
│   │   ├── sync-storage.js       # Cross-device sync
│   │   └── audit-trail.js        # Immutable log
│   │
│   ├── ai/
│   │   ├── claude-adapter.js     # Claude API handler
│   │   ├── gpt-adapter.js        # OpenAI API handler
│   │   ├── gemini-adapter.js     # Google Gemini handler
│   │   └── multi-model.js        # Weighted consensus logic
│   │
│   ├── utils/
│   │   ├── hash.js               # SHA-256 for audit trail
│   │   ├── selectors.js          # Dynamic DOM selectors
│   │   ├── validator.js          # Input validation
│   │   └── logger.js             # Error logging
│   │
│   └── styles/
│       ├── global.css
│       ├── popup.css
│       └── overlay.css
│
├── backend/
│   ├── supabase/
│   │   ├── auth.js               # User auth
│   │   ├── payments.js           # Stripe integration
│   │   ├── usage-tracking.js     # API usage logging
│   │   └── audit-log.js          # Immutable audit trail
│   │
│   └── vercel/
│       ├── api/
│       │   ├── verify.js         # Main verification endpoint
│       │   ├── webhook.js        # Stripe webhooks
│       │   └── health.js         # Uptime check
│       │
│       └── functions/
│           ├── send-to-claude.js
│           ├── send-to-gpt.js
│           └── notify-breakage.js
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### **2.3 Key Components**

#### **A. Screenshot Capture (10 lines)**

```javascript
async function captureScreenshot() {
  const canvas = await html2canvas(document.body);
  const base64 = canvas.toDataURL('image/png');
  return base64.split(',')[1]; // Remove data:image prefix
}
```

#### **B. Dynamic Selector Detection (for injection)**

```javascript
async function findInputField(tabId, aiProvider) {
  // Strategy 1: Largest contenteditable (most likely input)
  const editables = await getEditableDivs(tabId);
  const largest = editables.sort((a, b) => b.height - a.height)[0];
  if (largest?.height > 50) return largest;
  
  // Strategy 2: Element with role="textbox"
  const textboxes = await getElements(tabId, '[role="textbox"]');
  if (textboxes.length > 0) return textboxes[0];
  
  // Strategy 3: Listen for user click
  const clicked = await waitForUserClick(tabId, 5000);
  if (clicked) return clicked;
  
  throw new Error('Could not find input field');
}
```

#### **C. Free User Flow (Injection)**

```javascript
async function verifyFreeUser(screenshot, prompt, rulebook) {
  // Step 1: Find open AI tab
  const aiTab = await findOpenAITab(['claude.ai', 'chatgpt.com', 'gemini.google.com']);
  if (!aiTab) throw new Error('No open AI tab found');
  
  // Step 2: Find input field dynamically
  const inputField = await findInputField(aiTab.id);
  
  // Step 3: Inject screenshot
  await pasteImage(aiTab.id, screenshot);
  
  // Step 4: Inject prompt
  await typeText(aiTab.id, prompt);
  
  // Step 5: Click send (try multiple methods)
  await clickSend(aiTab.id);
  
  // Step 6: Wait for response
  const response = await waitForResponse(aiTab.id, 60000);
  
  // Step 7: Extract result
  return parseAIResponse(response);
}
```

#### **D. Pro User Flow (API)**

```javascript
async function verifyProUser(screenshot, prompt, rulebook) {
  // Your API key (encrypted in extension)
  const apiKey = await getEncryptedAPIKey();
  
  // Call Claude API
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
  
  // Log usage for billing
  await logUsage({
    userId: getCurrentUser().id,
    tokens: data.usage.output_tokens,
    cost: data.usage.output_tokens * 0.000015
  });
  
  return data.content[0].text;
}
```

#### **E. Dynamic Throttling & Session Countdown**

This is the "Soft Ceiling" system that makes users feel generous limits, not punishing walls.

```javascript
// session-manager.js
class SessionManager {
  constructor(userId, tier) {
    this.userId = userId;
    this.tier = tier;  // 'free', 'pro', 'max'
    
    // Define limits by tier
    this.limits = {
      free: { daily: 50, throttleDelay: 5000 },      // 5s delay
      pro: { daily: 100, throttleDelay: 3000 },      // 3s delay
      max: { daily: Infinity, throttleDelay: 0 }     // No throttle
    };
  }
  
  async getSessionStatus() {
    const today = new Date().toDateString();
    const usage = await this.getDailyUsage(today);
    const limit = this.limits[this.tier].daily;
    const timeUntilReset = this.calculateTimeUntilReset();
    const percentageUsed = (usage / limit) * 100;
    
    return {
      usage,
      limit,
      percentageUsed: Math.min(percentageUsed, 100),
      timeUntilReset,
      status: this.getStatusIndicator(percentageUsed),
      message: this.getWarningMessage(usage, limit, timeUntilReset),
      canProceed: true,  // Never fully block, just throttle
      shouldThrottle: usage >= limit
    };
  }
  
  getStatusIndicator(percentageUsed) {
    if (percentageUsed < 80) return { color: 'green', emoji: '✅', text: 'High Speed' };
    if (percentageUsed < 90) return { color: 'yellow', emoji: '⚠️', text: 'Warning' };
    if (percentageUsed < 100) return { color: 'orange', emoji: '🔶', text: 'Near Limit' };
    return { color: 'red', emoji: '🔴', text: 'Economy Mode' };
  }
  
  getWarningMessage(usage, limit, timeUntilReset) {
    if (usage < limit * 0.8) {
      return `✅ You have plenty of audits left today (${limit - usage} remaining)`;
    }
    if (usage < limit * 0.9) {
      return `⚠️ You're approaching your limit. ${timeUntilReset} until reset. [Upgrade] [Economy Mode]`;
    }
    if (usage < limit) {
      return `🔶 Very close to limit. Switch to Economy Mode, wait ${timeUntilReset}, or upgrade.`;
    }
    return `🔴 Daily limit reached. Economy Mode active (single AI, ${this.limits[this.tier].throttleDelay/1000}s delays). Full speed in ${timeUntilReset}.`;
  }
  
  calculateTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow - now;
    const hoursRemaining = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursRemaining}h ${minutesRemaining}m`;
  }
  
  async recordUsage() {
    const today = new Date().toDateString();
    await incrementUsageCounter(this.userId, today);
  }
  
  async getThrottleDelay() {
    const shouldThrottle = (await this.getSessionStatus()).shouldThrottle;
    if (!shouldThrottle) return 0;
    
    const delayMs = this.limits[this.tier].throttleDelay;
    return delayMs;
  }
}

// Usage in verification flow:
async function performVerification(userId, screenshot, prompt, tier) {
  const session = new SessionManager(userId, tier);
  const status = await session.getSessionStatus();
  
  // Show session countdown to user
  showSessionCountdown(status);
  
  // Check if should throttle
  if (status.shouldThrottle && tier !== 'max') {
    const delayMs = await session.getThrottleDelay();
    
    // Show "Economy Mode" message
    showEconomyModeNotice({
      message: `⏳ Running in Economy Mode. ${delayMs/1000}s delay. [Upgrade to Max] [Continue]`,
      delay: delayMs
    });
    
    // Apply the delay
    await sleep(delayMs);
  }
  
  // Record the usage
  await session.recordUsage();
  
  // Perform verification
  return await runVerification(screenshot, prompt);
}
```

---

#### **F. Weighted Consensus (Multi-Model)**

```javascript
async function multiModelVerification(screenshot, prompt, rulebook) {
  // Call all models in parallel
  const [claude, gemini, gpt] = await Promise.all([
    callClaude(screenshot, prompt, rulebook),
    callGemini(screenshot, prompt, rulebook),
    callGPT(screenshot, prompt, rulebook)
  ]);
  
  // Calculate weighted score
  const weights = { claude: 0.6, gemini: 0.3, gpt: 0.1 };
  
  const results = {
    claude: { verdict: claude.verdict, confidence: claude.confidence, weight: weights.claude },
    gemini: { verdict: gemini.verdict, confidence: gemini.confidence, weight: weights.gemini },
    gpt: { verdict: gpt.verdict, confidence: gpt.confidence, weight: weights.gpt }
  };
  
  // Show ALL reasoning (transparency is the value)
  return {
    consensus: calculateConsensus(results),
    breakdown: results,
    explainability: generateTrace(results),
    userDecision: await askUserToDecide(results) // Human makes final call
  };
}
```

#### **F. Immutable Audit Trail**

```javascript
async function createAuditEntry(verification) {
  // Get previous entry hash (creates chain)
  const previousEntry = await getLastAuditEntry();
  const previousHash = previousEntry?.hash || 'genesis';
  
  // Create current entry
  const entryData = {
    timestamp: new Date().toISOString(),
    screenshot_hash: sha256(verification.screenshot),
    verdict: verification.verdict,
    reasoning_hash: sha256(JSON.stringify(verification.reasoning)),
    rulebook_version: verification.rulebook.version,
    previous_hash: previousHash  // ← CREATES UNBREAKABLE CHAIN
  };
  
  const currentHash = sha256(JSON.stringify(entryData));
  
  // Store locally (append-only)
  await chrome.storage.local.append('auditTrail', {
    ...entryData,
    hash: currentHash
  });
  
  // Send to external notarization (proof it existed)
  await notarizeHash(currentHash, entryData.timestamp);
  
  // Email user a backup
  await sendEmailReceipt(getCurrentUser().email, {
    hash: currentHash,
    timestamp: entryData.timestamp
  });
  
  return { entry: entryData, hash: currentHash };
}

// To verify later:
async function verifyAuditEntry(hash) {
  const entry = await findAuditEntryByHash(hash);
  
  // Verify hash chain (if any entry missing/modified, chain breaks)
  const previousEntry = await findAuditEntryByHash(entry.previous_hash);
  if (!previousEntry) throw new Error('Chain broken - tampering detected');
  
  // Recalculate hash (proves no modification)
  const recalculatedHash = sha256(JSON.stringify({...entry, hash: undefined}));
  if (recalculatedHash !== hash) throw new Error('Entry has been tampered with');
  
  return { verified: true, entry };
}
```

---

## **3. BUSINESS MODEL (Claude Dynamic Throttling)**

### **The Philosophy: "Soft Ceilings, Not Hard Walls"**

Instead of blocking users ("Error: Out of Credits"), we guide them ("Full speed returns in 8 hours, or upgrade"). This is inspired by Claude's 2026 Dynamic Throttling model.

**Why this works:**
- Hard walls = punishing, high churn
- Soft ceilings = helpful, low churn (5% vs 30%)
- Users feel generous limits, not trapped by paywalls

---

### **3.1 Pricing Structure**

```
FREE TIER (Injection-Based)
├─ Daily High-Speed Audits: 50/day
├─ Method: Injection (silent talk to user's open Claude/ChatGPT tabs)
├─ Cost to you: $0 (user provides API credit via their open tab)
├─ Cost to user: $0 (uses their existing Claude/ChatGPT account)
├─ What Happens at Limit:
│   ├─ At 90% (45 audits): ⚠️ Warning toast appears
│   ├─ "You're nearing your daily limit. Resets in 8 hours."
│   ├─ User can: Wait for reset, upgrade, or use Economy Mode
│   └─ Economy Mode: Single AI only, 5s delays (still works)
├─ Experience: Feels "generous" (50/day = 1,500/month potential)
├─ Conversion: When user wants speed/multi-AI, upgrade to Pro
└─ Target: Try-before-buy, casual users, students

PRO TIER ($20/month, API-Based)
├─ Daily High-Speed Audits: 100/day
├─ Monthly Potential: ~3,000 audits
├─ Method: API calls (you call Claude using your API key)
├─ Cost to you: ~$2.07/month per active user
│   ├─ Calculation: ~100-150 avg audits/day × 30 days × $0.0069/audit = $2.07
├─ Cost to user: $20/month flat rate
├─ Your Margin: $17.93/month (89.7%)
├─ What Happens at Limit:
│   ├─ At 90 audits: ⚠️ "You're crushing it! 8 hours until reset."
│   ├─ At 100 audits: 🔶 "Daily limit reached. Economy Mode active."
│   ├─ Economy Mode: Single AI, 3s delays (still works)
│   ├─ User options:
│   │   ├─ Wait 8 hours for reset (free)
│   │   ├─ Use Economy Mode (free, just slower)
│   │   └─ Upgrade to Max ($99/mo) for zero delays
│   └─ Psychology: "I got SO much value from $20"
├─ Features:
│   ├─ 100 high-speed audits/day
│   ├─ Multi-AI support (Claude + GPT + Gemini)
│   ├─ Custom prompt templates (create + save)
│   ├─ Team sharing (share templates with colleagues)
│   ├─ 90-day audit trail
│   ├─ Session countdown dashboard
│   └─ Economy Mode for overflow
├─ Experience: Feels "unlimited" in practice (100/day is a lot)
├─ Conversion: 10-15% of free users upgrade (natural when limit hit)
└─ Target: Active professionals, small teams, individual power users

MAX TIER ($99/month, API-Based)
├─ Daily High-Speed Audits: Unlimited
├─ Method: API calls (your key, full speed always)
├─ Cost to you: ~$5-15/month (for heavy users doing 300+ audits/day)
├─ Cost to user: $99/month flat rate
├─ Your Margin: $84-94/month (84-95%)
├─ What Happens: Nothing. Ever. Just works.
├─ Features:
│   ├─ Everything in Pro, plus:
│   ├─ Unlimited daily audits (no throttling)
│   ├─ Multi-model simultaneous (Claude + GPT + Gemini in parallel)
│   ├─ Priority API queue (fastest response times)
│   ├─ Advanced audit trail (7-year immutable, cryptographically signed)
│   ├─ API access for custom integrations
│   ├─ Dedicated support channel
│   ├─ Team features (unlimited seats)
│   └─ White-label option available
├─ Experience: "Zero limits, maximum speed"
├─ Conversion: 5-10% of $20 users upgrade (power users, teams)
└─ Target: Enterprises, teams, compliance-heavy organizations

ENTERPRISE TIER (Custom Pricing, $200+/month)
├─ Everything in Max, plus:
├─ Custom integrations (Salesforce, Jira, etc.)
├─ SSO/SAML authentication
├─ Custom branding + white-label
├─ Dedicated account manager
├─ SLA guarantees (99.9% uptime)
├─ On-premises option (if needed)
├─ Training + implementation support
└─ Target: Banks, law firms, insurance companies, hospitals
```

---

### **3.2 How It Works in Practice**

#### **Free User Journey**

```
Day 1: User installs extension, signs up free
├─ Gets 50 free audits/day via injection
├─ Uses their own Claude/ChatGPT account
├─ Cost to you: $0
└─ Cost to them: $0

Day 5: User hits 45 audits (90% of 50)
├─ Toast notification: "⚠️ You're nearing your daily limit.
│                      Resets in 8 hours 34 minutes.
│                      [Upgrade to Pro] [Use Economy Mode] [Got it]"
├─ User reaction: "Oh wow, I've been using this a lot!"
└─ Probability they upgrade: 2-5% (not time to buy yet)

Day 10: User runs out of free audits again, second time
├─ Same warning, but user is now thinking...
├─ "Maybe I should just get Pro, it's only $20"
└─ Probability they upgrade: 10-15% (habit forming)

Day 20: User hits limit third time, also wants faster response
├─ Tries Economy Mode (3s delays), feels slow
├─ Sees: "Upgrade to Pro for instant responses ($20/mo)"
└─ Probability they upgrade: 30-40% (friction + habit)

Conversion to Pro: By day 30, 10-15% of active free users upgrade
```

#### **Pro User Journey**

```
Day 1: User upgrades to Pro ($20/month)
├─ Gets 100 audits/day via API calls
├─ Feels "unlimited" compared to free tier
├─ Cost to you: $2.07/month
├─ Cost to them: $20/month
└─ Your profit: $17.93/month

Day 15: User hits 90 audits (90% of 100)
├─ Dashboard shows: "🟡 You've used 90 audits today.
│                   Full speed resets in 8 hours 34 minutes.
│                   Or upgrade to Max for unlimited ($99/mo)"
├─ User reaction: "I got SO much work done for $20"
└─ Probability they upgrade: 1-2% (satisfied with Pro)

Day 25: User hits 100 audits again
├─ System says: "🔶 Daily limit reached.
│               Economy Mode active (3s delays).
│               Full speed returns in 8 hours 34 minutes.
│               Upgrade to Max to remove delays ($99/mo)"
├─ User tries Economy Mode, works fine for overflow
├─ Just waits 8 hours for reset
└─ Probability they upgrade: 5-10% (power users consider it)

Day 30: Subscription renews
├─ User has used ~150 audits/day average
├─ Paid $20 total
├─ Value: $0.13 per audit (incredible ROI)
├─ Churn probability: <1% (felt premium, not limited)
└─ Lifetime value: $20 × 36 months = $720
```

#### **Max User Journey**

```
Day 1: Power user upgrades to Max ($99/month)
├─ Gets unlimited audits/day
├─ Zero delays, zero warnings
├─ Cost to you: ~$10/month (heavy user)
├─ Cost to them: $99/month
└─ Your profit: $89/month

Day 30: User does 500+ audits
├─ No warnings, no throttling, perfect experience
├─ User thinks: "This is worth every penny"
└─ Churn probability: <0.5% (maximum satisfaction)

Lifetime value: $99 × 36 months = $3,564
```

---

### **3.3 Unit Economics**

#### **Free User**
```
Revenue: $0
Cost: $0 (injection, no API calls)
Profit: $0
But: 10-15% convert to Pro each month
Expected LTV: $20 × 3 months (avg) = $60
```

#### **Pro User**
```
Revenue: $20/month
Cost: $2.07/month (API calls)
Profit: $17.93/month
Margin: 89.7%
LTV: $20 × 36 months = $720
Customer Acquisition: Natural (free → pro conversion)
CAC Payback: 1.1 months (paid back immediately)
```

#### **Max User**
```
Revenue: $99/month
Cost: $10/month (heavy API usage)
Profit: $89/month
Margin: 89.9%
LTV: $99 × 36 months = $3,564
Customer Acquisition: Convert from Pro (natural upgrade)
CAC Payback: 1.3 months (paid back immediately)
```

---

### **3.4 Revenue Forecast**

#### **Month 6**

```
Free Users: 5,000
├─ Using injection (free)
├─ Average 30 audits/day (under 50 limit)
├─ Cost to you: $0
└─ Conversion: ~500 upgrade to Pro

Active Pro Users: 500
├─ Using API calls
├─ Average 100-120 audits/day
├─ Cost: $2.07/month each
├─ Revenue: 500 × $20 = $10,000/month
├─ Costs: 500 × $2.07 = $1,035
└─ Profit: $8,965

Max Users: 10
├─ Using API calls
├─ Average 300+ audits/day
├─ Cost: $10/month each
├─ Revenue: 10 × $99 = $990/month
├─ Costs: 10 × $10 = $100
└─ Profit: $890

───────────────────────────────
TOTAL MRR: $10,990
TOTAL COST: $1,135
TOTAL PROFIT: $9,855
```

#### **Month 12**

```
Free Users: 15,000
├─ Using injection (free)
├─ Conversion rate: 12-15% → 1,800-2,250 to Pro

Active Pro Users: 2,000
├─ Using API calls
├─ Average 110 audits/day
├─ Cost: $2.07/month each
├─ Revenue: 2,000 × $20 = $40,000/month
├─ Costs: 2,000 × $2.07 = $4,140
└─ Profit: $35,860

Max Users: 75
├─ Using API calls
├─ Average 350+ audits/day
├─ Cost: $12/month each
├─ Revenue: 75 × $99 = $7,425/month
├─ Costs: 75 × $12 = $900
└─ Profit: $6,525

Enterprise Users: 5 (custom deals)
├─ Average: $500/month
├─ Revenue: 5 × $500 = $2,500/month
├─ Costs: ~$100/month
└─ Profit: $2,400

───────────────────────────────
TOTAL MRR: $49,925
TOTAL COST: $5,140
TOTAL PROFIT: $44,785
MARGIN: 89.7%
```

### **3.2 Unit Economics**

#### **Pro User (Most Common)**

```
What they pay: $29/month

What you pay:
├─ Claude API: ~$0.0069 per verification
├─ Average active user: ~100 verifications/month
├─ Your API cost: 100 × $0.0069 = $0.69/month
└─ Your profit: $29 - $0.69 = $28.31/month

Per 1,000 Pro Users:
├─ Your revenue: $29,000/month
├─ Your API cost: $690/month
├─ Your backend cost: ~$100/month (Supabase + Vercel)
├─ Total cost: $790/month
└─ Your profit: $28,210/month (97.3% margin)
```

#### **Year 1 Forecast**

```
Month 6 (End of Vertical 1 - ComplianceGhost):
├─ Free users: 5,000
├─ Pro users: 250
├─ Pro revenue: $7,250/month
├─ API costs: $173/month
├─ Backend costs: $100/month
└─ Net profit: $6,977/month

Month 12 (All 3 Verticals Live):
├─ Free users: 30,000
├─ Pro users: 1,500
├─ Pro revenue: $43,500/month
├─ API costs: $1,035/month
├─ Backend costs: $100/month
└─ Net profit: $42,365/month

Year 1 Total Profit: ~$120,000-180,000 (solo operation)
```

---

## **4. THE 3-VERTICAL STRATEGY**

### **Why 3 Verticals?**

- Each vertical has different compliance rules, workflows, and pain points
- Same code, different prompts = 3x revenue without 3x work
- By month 12, you own 3 markets instead of competing in 1 crowded market

### **4.1 Vertical 1: ComplianceGhost (Paralegals)**

**Who:** Paralegals, legal assistants, contract reviewers  
**Pain:** Manually checking contracts against checklists takes 3-5 hours per contract

**What It Does:**
```
Paralegal uploads: "Contract Review Checklist"
Contains: Party names, liability clauses, indemnification, 
          termination conditions, governing law, etc.

Paralegal presses Ctrl+Shift+S on contract

Extension says: "✅ PASS
- All 5 required parties present
- Liability clause found (Section 4.2)
- Indemnification clause present
- Termination conditions clear
- Governing law specified: New York

⚠️ WARNING: Missing limitation of liability clause 
            (present in v2 of your template, but not v1)"
```

**Target Users:**
- Solo paralegals ($0-100/mo, use free tier)
- Small law firms (5-20 people, $145-580/mo)
- Corporate legal departments (50+ people, $2.5K+/mo)

**Launch Marketing:**
- Email paralegals on LinkedIn ("I built a tool that cuts contract review from 3 hours to 30 min...")
- Post in Bar Association slack channels
- Sponsor CLE (Continuing Legal Education) courses
- Target "Paralegal Manager" job titles on LinkedIn

**Success Metrics:**
- Month 3: 500 free users, 50 paid, $1.5K MRR
- Case study: "Law firm cuts review time by 70%"

---

### **4.2 Vertical 2: ClaimAuditor (Insurance Adjusters)**

**Who:** Claims adjusters, claims managers, compliance officers  
**Pain:** Manually matching claims against policy language, takes 2-3 hours per claim

**What It Does:**
```
Adjuster uploads: "Homeowners Policy 2024"
Contains: Coverage limits, deductibles, exclusions, 
          claim submission requirements, proof needed, etc.

Adjuster presses Ctrl+Shift+S on a claim form

Extension says: "❌ FAIL - CLAIM CANNOT BE APPROVED

Reason: Claimed damage ($12,000) exceeds policy limit 
        for Water Damage ($5,000)
        Policy Section 3.2, Subsection B

Required action: Request claimant to submit revised 
                claim or provide additional coverage documentation"
```

**Target Users:**
- Solo adjusters ($0-100/mo, free tier)
- Adjusting firms (10-30 people, $290-870/mo)
- Insurance companies (100+ people, $25K+/mo)

**Launch Marketing:**
- Target "Claims Adjuster" roles on LinkedIn
- Post in Insurance industry Slack communities
- Sponsor insurance industry conferences
- Email adjusting firms directly ("Your team processes 100 claims/month. You spend 300 hours on policy verification. We cut that to 90 hours.")

**Success Metrics:**
- Month 4-6: 300 new users (different from paralegals)
- Example ROI: "Adjuster handling 25 claims/month saves $500/month in labor"

---

### **4.3 Vertical 3: DevVision (Frontend Engineers)**

**Who:** Frontend developers, QA engineers, designers  
**Pain:** Translating visual bugs into code fixes takes 30-60 minutes per bug

**What It Does:**
```
Engineer screenshots a bug in their React app

Extension says: "❌ BUG FOUND - CSS issue

Problem: Button text overflows, padding too small
File: src/components/Button.css
Fix:
  .button {
    padding: 12px 16px;  /* was 8px 12px */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

Confidence: 94%
Severity: Medium (visual only, no functional impact)"
```

**Target Users:**
- Solo developers ($0-100/mo, free tier)
- Dev agencies (5-15 people, $145-435/mo)
- Tech startups (20+ people, $580+/mo)

**Launch Marketing:**
- Post on Hacker News
- Post on Dev.to
- Target #DEV community on Twitter/X
- GitHub discussions for popular projects

**Success Metrics:**
- Month 7-9: 200 new users (different from law/insurance)
- Developer time savings: "Each verification saves 20 minutes, no false positives"

---

### **4.4 General Tier (Month 10+)**

After you've proven product-market fit in 3 markets:

**Pricing:** $99/month (premium version)  
**Target:** Power users who want all verticals at once  
**Features:**
- Access to all 3 vertical templates (paralegals, adjusters, engineers)
- Custom prompt creation
- Team features
- Advanced analytics

**Why now?** You can say in your marketing:
> "Used by 2,000+ professionals across law, insurance, and tech. Now available for everyone."

This credibility lets you charge $99/mo instead of being a generic $29/mo tool.

---

## **5. LAUNCH TIMELINE (12 Months)**

### **Phase 0: Foundation (Weeks 1-4)**

**What to Build:**
- [ ] Basic extension structure (manifest, popup, background script)
- [ ] Screenshot capture functionality
- [ ] Dynamic selector detection for Claude tab
- [ ] Injection logic (paste image, type text, click send)
- [ ] Simple response parsing

**Success Criteria:**
- Extension takes screenshot
- Successfully injects into open Claude tab
- Returns result to popup

**Estimated Effort:** 1-2 weeks solo

---

### **Phase 1: ComplianceGhost MVP (Weeks 5-12)**

**What to Build:**
- [ ] User onboarding (role selection, initial setup)
- [ ] Prompt library system (template storage, versioning)
- [ ] Supabase backend (user auth, usage tracking)
- [ ] Basic audit trail (simple logging)
- [ ] Landing page + marketing site
- [ ] Chrome Web Store listing

**Marketing:**
- [ ] Create 5 cold outreach messages to paralegal LinkedIn profiles
- [ ] Post in Bar Association Slack channels
- [ ] Create demo video showing contract review workflow

**Success Criteria:**
- 500 free users
- 50 paid users ($1.5K MRR)
- No major injection breakage for 2+ weeks

**Estimated Effort:** 4-6 weeks solo

---

### **Phase 2: ClaimAuditor Launch (Weeks 13-24)**

**What to Build:**
- [ ] Clone ComplianceGhost codebase
- [ ] Rebrand: Domain, colors, landing page, marketing copy
- [ ] Change prompt templates (contract → claims specific)
- [ ] Change target audience in marketing

**Why Fast?** 90% of code is identical. Just different prompts + branding.

**Marketing:**
- [ ] Cold outreach to insurance adjusters on LinkedIn
- [ ] Post in insurance industry forums
- [ ] Create ROI calculator ("You save X hours, earn Y dollars")

**Success Criteria:**
- 300 new free users (from insurance industry)
- 30-50 new paid users ($870-1.5K additional MRR)
- Total: 5K free users, 100-150 paid users, $3K-4.5K MRR

**Estimated Effort:** 2-3 weeks solo

---

### **Phase 3: DevVision Launch (Weeks 25-36)**

**What to Build:**
- [ ] Clone ComplianceGhost codebase again
- [ ] Rebrand for developers
- [ ] Change prompts (legal → code review specific)
- [ ] Add GitHub integration (optional: auto-file issues)

**Marketing:**
- [ ] Post on Hacker News, Dev.to
- [ ] Tweet in #dev community
- [ ] Create "I turned 10 random GitHub issues into fixes" video

**Success Criteria:**
- 200 new free users (developer community)
- 20-30 new paid users ($580-870 additional MRR)
- Total: 10K-15K free users, 150-200 paid users, $4.5K-6K MRR

**Estimated Effort:** 2-3 weeks solo

---

### **Phase 4: Security & Hardening (Weeks 37-48)**

**What to Build:**
- [ ] Immutable audit trail (SHA-256 chain-of-custody)
- [ ] Cryptographic signing for exports
- [ ] External notarization (email receipts, timestamp service)
- [ ] Multi-model verification (Claude + GPT + Gemini)
- [ ] Team features (sharing, permissions)
- [ ] SOC2 compliance documentation

**Why Now?** Enterprise customers asking for it. Time to build defensible features.

**Success Criteria:**
- Enterprise customer closes deal ($5K+/mo)
- Can confidently say "Audit trail is legally defensible"
- Multi-model verification reduces false positives to < 1%

**Estimated Effort:** 6-8 weeks solo (or hire help)

---

### **Phase 5: Scale & Optimize (Weeks 49-52)**

**What to Do:**
- [ ] Optimize conversion funnel (free → pro)
- [ ] Hire 1-2 contractors for customer support
- [ ] Build community features (prompt sharing, ratings)
- [ ] Launch marketplace (template creators earn commission)
- [ ] Plan Series A pitch deck

**Target:**
- 30K free users
- 1.5K paid users
- $43.5K MRR
- Ready to fundraise

---

## **6. TECHNOLOGY STACK**

| Layer | Technology | Cost | Why |
|-------|-----------|------|-----|
| **Extension** | Chrome Manifest V3 + Vanilla JS | $0 | Lightweight, no dependencies, direct browser API |
| **Backend** | Supabase (PostgreSQL + Auth) | $10-50/mo | Open source alternative, generous free tier |
| **Server** | Vercel Functions | $20-100/mo | Serverless, auto-scaling, global CDN |
| **AI APIs** | Anthropic Claude, OpenAI GPT, Google Gemini | $0.006/use | Pay-per-use, user brings credit (free tier) or you cover (pro tier) |
| **Payments** | Stripe | 2.9% + $0.30 | Industry standard, simple integration |
| **Monitoring** | Sentry | Free-$25/mo | Error tracking, crash reporting |
| **Analytics** | Posthog | Free tier | Product analytics, user behavior |
| **Email** | SendGrid | $15-300/mo | Transactional emails, newsletters |
| **Domain** | Namecheap | $12-20/year | Cheap, reliable registrar |

**Total Monthly Cost (at scale):**
- Supabase: $50
- Vercel: $100
- Sentry: $25
- SendGrid: $100
- Misc: $25
- **Total: $300/month** (before API costs for Pro users)

At 1,500 Pro users ($43.5K/mo), backend is 0.7% of revenue. Negligible.

---

## **7. IMPLEMENTATION ROADMAP**

### **Week 1-2: Core Extension + Session Management**

```
Priority: Screenshot + Injection + Dynamic Throttling

Files to create:
├── manifest.json              (10 lines)
├── popup.html                 (40 lines) - shows session countdown
├── background.js              (200 lines) - main logic + session manager
├── content.js                 (100 lines) - injection logic
├── session-manager.js         (150 lines) - throttling + warnings
└── utils/
    ├── screenshot.js          (20 lines)
    ├── injector.js            (100 lines)
    ├── parser.js              (50 lines)
    └── throttle.js            (60 lines) - apply delays

Deliverable: User can press Ctrl+Shift+S on free tier, extension 
captures screenshot, injects into Claude, shows countdown warning at 
45/50 (90%), applies 5s throttle if over 50
```

### **Week 3-4: User Settings + Prompts + Free Tier UI**

```
Priority: Customizable prompts, tier indication, persistent storage

Files to add:
├── storage/
│   ├── settings.js            (100 lines)
│   ├── usage-tracker.js       (80 lines) - daily usage counter
│   └── templates.js           (120 lines)
├── ui/
│   ├── dashboard.html         (80 lines) - shows usage %, reset time
│   ├── dashboard.js           (150 lines)
│   ├── tier-badge.js          (40 lines) - shows 🟢/🟡/🟠/🔴 status
│   └── upgrade-modal.js       (100 lines) - Pro/Max options
└── prompt-library.json        (50 prompts pre-made)

Deliverable: 
- Free users see daily usage % and time until reset
- Status indicator (green/yellow/orange/red) in popup
- Upgrade modals show Pro ($20) and Max ($99) options
```

### **Week 5-6: Backend + Auth + Stripe + API Tier System**

```
Priority: User accounts, tier detection, API calling for paid tiers, usage tracking

Backend setup:
├── Supabase project
│   ├── users table
│   │   ├── email
│   │   ├── tier (free/pro/max)
│   │   └── api_key (encrypted)
│   ├── subscriptions table
│   │   ├── user_id
│   │   ├── tier
│   │   ├── status (active/cancelled)
│   │   └── next_billing_date
│   ├── daily_usage table
│   │   ├── user_id
│   │   ├── date
│   │   ├── count (number of audits)
│   │   └── cost
│   └── audit_trail table
│       ├── user_id
│       ├── timestamp
│       ├── action (verification performed)
│       └── result (pass/fail)
│
├── Vercel functions
│   ├── /api/auth/signup
│   ├── /api/auth/login
│   ├── /api/verify/free (calls free user's open tab)
│   ├── /api/verify/pro (calls Claude API with user tier check)
│   ├── /api/verify/max (calls Claude API, unlimited)
│   ├── /api/usage/get-daily (returns usage for dashboard)
│   ├── /api/stripe/webhook (handles subscription events)
│   └── /api/stripe/create-checkout (creates payment session)
│
└── Stripe setup
    ├── Product: VerifyAI Pro ($20/month)
    ├── Product: VerifyAI Max ($99/month)
    └── Webhooks: invoice.paid, customer.subscription.updated, etc.

Deliverable: 
- Free users inject into their own tabs (cost you $0)
- Pro users call your API (cost you $2.07/mo, you charge $20)
- Max users call your API (cost you $10/mo, you charge $99)
- Dashboard shows real-time usage + daily cost
- Stripe payments work in test mode
```

### **Week 7-8: ComplianceGhost Landing Page + Marketing**

```
Priority: Web presence, conversion funnel

Build:
├── Landing page (Webflow or Next.js)
│   ├── Hero section
│   ├── Features
│   ├── Pricing ($0 / $29/mo)
│   ├── Testimonials
│   ├── CTA "Get ComplianceGhost"
│   └── Waitlist form
├── Email sequences
│   ├── Welcome email
│   ├── Day 3: "Here's your first verification"
│   ├── Day 7: "50 verifications in a week?"
│   └── Day 14: "Ready to upgrade?"
└── Cold outreach template (Email/LinkedIn)

Deliverable: 500 signups in first 2 weeks
```

### **Week 9-12: Refinement + Polish**

```
Priority: Reliability, edge cases, first 50 paying users

Tasks:
├── Fix injection for:
│   ├─ ChatGPT (different UI than Claude)
│   ├─ Gemini (different UI than both)
│   └─ Handle when Claude UI updates
├── Add error handling
├── Add telemetry/logging
├── Create help docs + video tutorials
├── Set up Sentry for crash reporting
└── Get first 50 paying users and collect feedback

Deliverable: 500 free users, 50 paid users, <4% error rate
```

---

## **8. CRITICAL SUCCESS FACTORS**

### **Technical**

1. **Dynamic Selector Detection (Not Hard-Coded)**
   - Claude/ChatGPT UI changes 2-3 times/month
   - If you hardcode selectors, injection breaks constantly
   - Solution: Detect elements by behavior, not by specific selector
   - Impact: Reduces maintenance burden by 80%, injection stays reliable

2. **Soft Ceilings, Not Hard Walls**
   - **This is the #1 differentiator from competitors**
   - Hard wall: "Error: Out of audits. Upgrade or wait."
   - Soft ceiling: "⚠️ You're at 90%. Full speed resumes in 8 hours, or use Economy Mode."
   - Why it matters: 
     - Hard walls → 30% churn, users feel punished
     - Soft ceilings → 5% churn, users feel guided
   - Implementation: Throttle instead of block, warn before limit, offer choices
   - Impact: Changes everything about retention and conversion

3. **Session Countdown Dashboard**
   - Users need to see: "How many audits do I have left?" + "When does it reset?"
   - Not just: "You've used 50 audits"
   - Show countdown + time remaining + upgrade options
   - Psychology: "I have 8 hours and 34 minutes to use my remaining audits"
   - Impact: Users feel they own the limit, not trapped by it

4. **Graceful Degradation**
   - If injection fails for free users, suggest upgrade (don't block)
   - If one AI model breaks, fall back to another
   - If API rate limits hit, use Economy Mode (single AI, delays)
   - Impact: Users never see "Extension broken" — they always get a result

5. **Immutable Audit Trail from Day 1**
   - Not an afterthought for "enterprise tier"
   - Build it into free tier
   - Chain-of-custody hashing from the start
   - Impact: When you sell to law firms later, it's already there

---

### **Business**

1. **The $20 Price Point is Magic**
   - $20/month feels premium but not expensive
   - User pays once, feels like they have unlimited value
   - At $0.0069 per API call, you're profitable even if they do 3,000 audits/month
   - Pro users feel like they got unlimited (100/day = 3,000/month potential)
   - Psychology: "I spent $20 and got unlimited feeling"
   - Impact: Low churn (5%), high LTV ($720), natural upsells

2. **Free Tier to Pro Conversion is Self-Service**
   - User hits 90% of daily limit → warning appears
   - User hits 100% → Economy Mode activates automatically
   - User has choice: wait, use slow mode, or upgrade
   - No aggressive sales pitch needed, just clear choices
   - Impact: 10-15% free users naturally upgrade to Pro

3. **Max Tier Converts from Pro Naturally**
   - Pro users who keep hitting the limit see: "Upgrade to Max ($99) for unlimited"
   - It's available, but not pushy
   - Only power users/teams convert (5-10% of Pro)
   - Impact: Second revenue multiplier (users pay 5x more)

4. **Free Tier Costs You Nothing**
   - Injection into their open tabs = $0 to you
   - They pay for their own Claude/ChatGPT subscription
   - Scale to 10,000 free users, costs you $0
   - Pure marketing funnel, zero operational cost
   - Impact: Can bootstrap without CAC burden

---

### **Marketing**

1. **Product Sells Itself via Soft Ceilings**
   - Users hit the limit naturally, see "upgrade" option naturally
   - No aggressive sales needed
   - 10-15% free → pro conversion is organic
   - Word-of-mouth: "This tool is so good I upgraded"
   - Impact: Lowest CAC of any SaaS model, high retention

2. **Vertical-First Wins, Horizontal Loses**
   - Own paralegals before building for everyone
   - One vertical → $10K MRR, then expand to 3 verticals → $43K MRR
   - Impact: Faster to profitability, more defensible positioning

3. **Cold Outreach: Case Studies Over Ads**
   - Don't run Facebook ads (low conversion, high cost)
   - Email paralegals directly ("I cut contract review time in half...")
   - Share case studies: "Before: 3 hours per contract, After: 30 minutes"
   - Impact: 10-20x better CAC than ads, higher conversion

---

## **9. APPENDIX: Code Snippets**

### **A. Manifest.json**

```json
{
  "manifest_version": 3,
  "name": "ComplianceGhost",
  "version": "1.0.0",
  "description": "Real-time contract compliance verification",
  "permissions": [
    "scripting",
    "tabs",
    "storage",
    "clipboardWrite",
    "webRequest"
  ],
  "host_permissions": [
    "https://api.anthropic.com/*",
    "https://api.openai.com/*",
    "https://supabase.example.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icons/icon-128.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "update_url": "https://clients2.google.com/service/update2/crx"
}
```

### **B. Background Service Worker**

```javascript
// background.js
const API_KEY = process.env.ANTHROPIC_API_KEY;

chrome.action.onClicked.addListener(async (tab) => {
  // Trigger on extension icon click
  const screenshot = await captureScreenshot(tab.id);
  const user = await getUser();
  
  if (user.subscription === 'pro') {
    const result = await callClaudeAPI(screenshot);
    showResult(result);
  } else {
    const result = await injectIntoOpenTab(screenshot);
    showResult(result);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-and-verify') {
    const activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
    // Same logic as above
  }
});

async function captureScreenshot(tabId) {
  const canvas = await html2canvas(document.body);
  return canvas.toDataURL('image/png').split(',')[1];
}

async function callClaudeAPI(screenshot) {
  const prompt = await getPromptForCurrentDomain();
  const rulebook = await getUserRulebook();
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshot } },
          { type: 'text', text: `${prompt}\n\nRulebook:\n${rulebook}` }
        ]
      }]
    })
  });
  
  const data = await response.json();
  await logUsage(data.usage.output_tokens);
  return data.content[0].text;
}

async function injectIntoOpenTab(screenshot) {
  const tabs = await chrome.tabs.query({});
  const aiTab = tabs.find(t => t.url.includes('claude.ai') || t.url.includes('chatgpt.com'));
  
  if (!aiTab) throw new Error('No Claude/ChatGPT tab found');
  
  const prompt = await getPromptForCurrentDomain();
  const rulebook = await getUserRulebook();
  
  // Find input field
  const inputField = await findInputField(aiTab.id);
  
  // Inject
  await pasteImage(aiTab.id, screenshot);
  await typeText(aiTab.id, `${prompt}\n\nRulebook:\n${rulebook}`);
  await clickSend(aiTab.id);
  
  // Wait for response
  const response = await waitForResponse(aiTab.id, 60000);
  return response;
}
```

---

## **10. SUCCESS METRICS & KPIs**

### **User Metrics**

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Total Free Users | 500 | 5,000 | 30,000 |
| Total Paid Users | 50 | 250 | 1,500 |
| Free-to-Paid Conversion Rate | 10% | 5% | 5% |
| Monthly Active Users (Free) | 300 | 2,500 | 15,000 |
| Monthly Active Users (Paid) | 40 | 200 | 1,200 |

### **Business Metrics**

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| MRR (Monthly Recurring Revenue) | $1,450 | $7,250 | $43,500 |
| Customer Acquisition Cost | $5 | $3 | $2 |
| Lifetime Value per Paid User | $348 | $348 | $348 |
| LTV:CAC Ratio | 70:1 | 116:1 | 174:1 |
| Monthly Churn Rate | 8% | 5% | 3% |
| Team Size | 1 | 1 | 3-4 |

### **Product Metrics**

| Metric | Target |
|--------|--------|
| Injection Success Rate | > 96% |
| API Call Success Rate | > 99.5% |
| Average Response Time | < 10 seconds |
| Audit Trail Integrity | 100% (chain never broken) |
| False Positive Rate | < 1% (users report wrong verdict) |
| Extension Crash Rate | < 0.1% |

---

## **11. RISKS & MITIGATION**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude/ChatGPT breaks injection | High | High | Dynamic selectors, auto-update mechanism, community reporting system |
| User churn if injection unreliable | High | High | Fall back to API calls, guarantee 4-hour fix SLA |
| Competitors copy vertical approach | Medium | Medium | Move fast (own market before they notice), build community + templates as moat |
| Enterprise security requirements | Medium | Medium | Build audit trail + compliance from day 1 |
| API costs spike if user base explodes | Low | Medium | Monitor per-user costs, adjust pricing if needed |
| Trademark/legal issues | Low | Medium | Check trademark availability before launch, get legal review of terms |

---

## **12. NEXT STEPS**

### **This Week**
- [ ] Set up GitHub repo
- [ ] Create manifest.json
- [ ] Build basic screenshot capture
- [ ] Test injection into Claude tab

### **Next Week**
- [ ] Finish core extension (screenshot + inject + result)
- [ ] Create popup UI
- [ ] Set up Supabase project
- [ ] Start Vercel setup

### **Week 3-4**
- [ ] User auth working
- [ ] Stripe test integration
- [ ] ComplianceGhost landing page
- [ ] First cold outreach emails sent

---

## **FINAL NOTE**

This document is your north star. Everything you build should ladder up to one of these goals:
1. Free users hit 50/month limit → Convert to Pro
2. Pro users get amazing ROI → Expand to other roles
3. Enterprise customers get audit trails → Expand to enterprise
4. Three verticals proven → Build marketplace

Keep it simple. Ship fast. Iterate based on real user feedback.

**You've got this. Go build.**

---

**Document Authored By:** Claude AI  
**For:** VerifyAI Product Team  
**Approved By:** [Your Name]  
**Last Updated:** 2026-04-17  
**Next Review:** 2026-05-01
