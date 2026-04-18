# **Phase 3B: Backend Integration - Setup Guide**

**Status:** ✅ Implementation Complete  
**Date:** 2026-04-17  
**Next Phase:** Phase 3C - Vercel Deployment & Testing

---

## **What Was Built in Phase 3B**

### **1. Supabase Backend** ✅
- **Project:** `verifyai` (us-west-1 region)
- **Project URL:** `https://sppetblailyeblxgpqss.supabase.co`
- **Database:** 4 tables created
  - `users` - user tier and subscription tracking
  - `daily_usage` - tracks daily API usage per user
  - `audit_trail` - immutable verification log
  - `subscriptions` - Stripe subscription records

### **2. Vercel API Functions** ✅
Created 4 serverless endpoints:
- `GET /api/users/{id}/tier` - Fetch user tier
- `GET /api/users/{id}/usage/today` - Fetch today's usage count
- `POST /api/users/{id}/usage` - Increment daily usage
- `POST /api/audit/log` - Log audit trail entry

### **3. Extension Backend Integration** ✅
- `src/utils/api-client.ts` - Fetch/increment from backend
- `src/utils/crypto.ts` - SHA-256 audit hashing
- Updated `background.ts` - Audit logging with hashing
- Updated `usage-tracker.ts` - Free tier=localStorage, Pro/Max=backend API

---

## **Supabase Credentials**

**⚠️ IMPORTANT: These are secret keys. Do not commit to git.**

```
Supabase URL:          https://sppetblailyeblxgpqss.supabase.co
Supabase Anon Key:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU
Publishable Key:       sb_publishable_9dDhbMUqqQ6rV6NERDGjGw_ncnuDlPt
```

**To get Service Role Key (for admin operations):**
1. Go to https://app.supabase.com/project/sppetblailyeblxgpqss/settings/api
2. Look for "Service role" secret key
3. Store in `.env.local` (never commit)

---

## **Deploy to Vercel**

### **Step 1: Create Vercel Project**
```bash
# If you have Vercel CLI installed
vercel login
vercel link

# Or go to https://vercel.com/new and import from GitHub
```

### **Step 2: Set Environment Variables**
In Vercel dashboard, go to **Settings → Environment Variables**:

```
SUPABASE_URL = https://sppetblailyeblxgpqss.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGV0YmxhaWx5ZWJseGdwcXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDY3NzUsImV4cCI6MjA5MjAyMjc3NX0.TsD_HtFj0uoO4t22sR3CGEoHOdbYGI5FnnYvV-fEjeU
SUPABASE_SERVICE_ROLE_KEY = [Get from Supabase dashboard]
```

### **Step 3: Deploy**
```bash
npm install -g vercel
vercel --prod
```

After deployment, you'll get a URL like: `https://money-maker-xxxxx.vercel.app`

### **Step 4: Update Extension**
Update the `API_BASE` in `src/utils/api-client.ts`:
```typescript
const API_BASE = 'https://your-vercel-url.vercel.app'
```

---

## **File Structure (New Files)**

```
Money Maker/
├── api/                           # Vercel API functions
│   ├── users/[id]/
│   │   ├── tier.ts               # GET user tier
│   │   └── usage/
│   │       ├── today.ts          # GET today's usage
│   │       └── index.ts          # POST increment usage
│   └── audit/
│       └── log.ts                # POST audit entry
│
├── backend/                       # Shared backend utilities
│   ├── lib/
│   │   └── supabase.ts           # Supabase client init
│   ├── types/
│   │   └── supabase.ts           # Generated TypeScript types
│   └── package.json              # Backend dependencies
│
├── src/utils/
│   ├── api-client.ts             # Extension calls backend APIs
│   └── crypto.ts                 # SHA-256 audit hashing
│
├── src/
│   └── background.ts             # Updated with audit logging
│
└── vercel.json                   # Vercel deployment config
```

---

## **How It Works**

### **Free Tier (Still Uses localStorage)**
```
Extension (free user) 
→ SessionManager 
→ usage-tracker.ts (localStorage) 
→ Shows soft ceiling warnings at 90%, 100%
```

### **Pro/Max Tier (Uses Supabase Backend)**
```
Extension (paid user)
→ SessionManager
→ usage-tracker.ts (checks tier)
→ Calls api-client.ts
→ Fetches from Vercel API
→ Supabase queries
→ Returns count to extension

After verification:
→ Generates SHA-256 audit hash
→ POST /api/audit/log
→ Stored in audit_trail table
```

---

## **Testing the Backend**

### **Test 1: Check Supabase Connection**
```bash
# In browser console (any page):
const KEY = 'sb_publishable_9dDhbMUqqQ6rV6NERDGjGw_ncnuDlPt'
const URL = 'https://sppetblailyeblxgpqss.supabase.co'

fetch(`${URL}/rest/v1/users?select=*`, {
  headers: { 'apikey': KEY }
})
.then(r => r.json())
.then(d => console.log(d))
```

### **Test 2: Check Vercel API Functions (After Deployment)**
```bash
# Get user tier
curl https://your-vercel-url/api/users/test-user-123/tier

# Get today's usage
curl https://your-vercel-url/api/users/test-user-123/usage/today

# Increment usage
curl -X POST https://your-vercel-url/api/users/test-user-123/usage \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Test 3: End-to-End Flow**
1. Set extension to "pro" tier
2. Set user ID to a UUID from Supabase
3. Run a verification
4. Check Supabase dashboard → `daily_usage` table for new entry
5. Check Supabase dashboard → `audit_trail` table for audit entry

---

## **Database Schema Reference**

### **users table**
```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE
tier            TEXT ('free' | 'pro' | 'max')
subscription_status TEXT ('none' | 'active' | 'cancelled')
stripe_id       TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### **daily_usage table**
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to users)
date            TEXT (YYYY-MM-DD)
count           INTEGER (API calls today)
cost            DECIMAL (cost in USD)
created_at      TIMESTAMP
UNIQUE(user_id, date)
```

### **audit_trail table**
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to users)
timestamp       TIMESTAMP
action          TEXT ('verification')
result          TEXT ('pass' | 'fail' | 'unclear' | 'pending')
screenshot_hash TEXT (SHA-256)
reasoning_hash  TEXT (SHA-256)
previous_hash   TEXT (chain integrity)
hash            TEXT (unique SHA-256 of entry)
created_at      TIMESTAMP
```

### **subscriptions table**
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to users)
tier            TEXT ('pro' | 'max')
status          TEXT ('active' | 'cancelled')
stripe_subscription_id TEXT UNIQUE
next_billing_date TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## **Common Tasks**

### **Add a Test User to Supabase**
```sql
INSERT INTO users (email, tier, subscription_status)
VALUES ('test@example.com', 'pro', 'active')
RETURNING id;
```

Then use the returned `id` in extension's User ID field.

### **Check Usage for a User**
```sql
SELECT date, count, cost 
FROM daily_usage 
WHERE user_id = '...' 
ORDER BY date DESC
LIMIT 10;
```

### **View Audit Trail**
```sql
SELECT user_id, timestamp, result, hash 
FROM audit_trail 
WHERE user_id = '...'
ORDER BY timestamp DESC
LIMIT 20;
```

### **Verify Audit Chain Integrity**
```sql
SELECT 
  id, 
  timestamp, 
  hash, 
  previous_hash,
  CASE 
    WHEN previous_hash = LAG(hash) OVER (PARTITION BY user_id ORDER BY timestamp) 
      THEN 'VALID'
    WHEN previous_hash IS NULL 
      THEN 'FIRST ENTRY'
    ELSE 'BROKEN CHAIN'
  END as chain_status
FROM audit_trail
WHERE user_id = '...'
ORDER BY timestamp DESC;
```

---

## **Next Steps (Phase 3C)**

1. **Deploy to Vercel**
   - Push to GitHub
   - Deploy via Vercel dashboard
   - Get production URL

2. **Update Extension API_BASE**
   - Point to production Vercel URL
   - Rebuild extension

3. **End-to-End Testing**
   - Test free tier (localStorage)
   - Test pro tier (backend API)
   - Test max tier (no throttling)
   - Verify audit trail storage

4. **Deploy Extension**
   - Load updated extension in Chrome
   - Test full workflow

---

## **Troubleshooting**

### **Vercel Functions 404**
- Check that `api/` folder is in project root (not in `src/`)
- Check function names match routes (e.g., `api/users/[id]/tier.ts` → `/api/users/ID/tier`)

### **Supabase Connection Error**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check that tables exist: `SELECT table_name FROM information_schema.tables`

### **Usage Not Being Tracked**
- Make sure user ID matches in Supabase (`users` table)
- Check that `daily_usage` record exists with today's date
- Verify API function is being called (check Vercel logs)

### **Audit Entry Not Logged**
- Check browser DevTools Network tab for failed POST to `/api/audit/log`
- Verify `hash` field is not empty
- Check Vercel logs for database errors

---

## **Related Documents**

- **CURRENT_HANDOFF.md** - Phase 3A completion (free tier injection)
- **CODEX_PROMPT.md** - Full 6-phase implementation plan
- **HANDOFF.md** - Original 1600+ line specification

---

**Prepared by:** Claude AI  
**For:** Phase 3C testing and Vercel deployment
