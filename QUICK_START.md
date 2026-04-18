# **QUICK START - Complete This in 90 Minutes**

**Goal:** Make Money Maker live and production-ready  
**Time:** ~90 minutes  
**Difficulty:** Medium (mostly configuration, no coding)

---

## **CHECKLIST: Do These 7 Things**

### ✅ **1. STRIPE SETUP (20 min)**
```
[ ] Go to https://stripe.com/start
[ ] Sign up, verify email
[ ] Get Secret key (sk_test_XXX) → Save as STRIPE_SECRET_KEY
[ ] Create product "VerifyAI Pro" ($20/mo) → Save Price ID as STRIPE_PRICE_PRO
[ ] Create product "VerifyAI Max" ($99/mo) → Save Price ID as STRIPE_PRICE_MAX
[ ] Add webhook endpoint: https://money-maker-kl2345.vercel.app/api/stripe/webhook
[ ] Save webhook secret (whsec_XXX) → Save as STRIPE_WEBHOOK_SECRET
```

### ✅ **2. RESEND EMAIL (10 min)**
```
[ ] Go to https://resend.com
[ ] Sign up, verify email
[ ] Get API key (resend_XXX) → Save as RESEND_API_KEY
```

### ✅ **3. VERCEL ENVIRONMENT VARIABLES (10 min)**
```
[ ] Go to Vercel dashboard → money-maker-kl2345 project
[ ] Settings → Environment Variables
[ ] Add these 5 variables:
    - STRIPE_SECRET_KEY = [from step 1]
    - STRIPE_WEBHOOK_SECRET = [from step 1]
    - STRIPE_PRICE_PRO = [from step 1]
    - STRIPE_PRICE_MAX = [from step 1]
    - RESEND_API_KEY = [from step 2]
[ ] Save (auto-redeploys)
[ ] Wait for "Ready" status
```

### ✅ **4. SUPABASE SECURITY (10 min)**
```
[ ] Go to https://app.supabase.com/project/sppetblailyeblxgpqss/sql/new
[ ] Open file: migrations/add_rls_policies.sql
[ ] Copy all SQL, paste into Supabase SQL Editor
[ ] Click "Run"
[ ] Verify no errors
```

### ✅ **5. CREATE ADMIN USER (5 min)**
```
[ ] Supabase → Authentication → Users
[ ] Add user:
    - Email: admin@verifyai.dev
    - Password: [create strong password]
[ ] Save password securely
```

### ✅ **6. TEST LOGIN (5 min)**
```
[ ] Go to https://money-maker-kl2345.vercel.app/admin
[ ] Login with:
    - Email: admin@verifyai.dev
    - Password: [from step 5]
[ ] Should see audit dashboard
```

### ✅ **7. TEST STRIPE WEBHOOK (5 min)**
```
[ ] Stripe Dashboard → Developers → Webhooks → Your endpoint
[ ] Click "Test endpoint"
[ ] Send test event
[ ] Verify no errors in Vercel logs
```

---

## **VERIFY EVERYTHING WORKS**

After completing checklist:

```bash
# Check Vercel deployment
https://money-maker-kl2345.vercel.app/admin  ← Should load

# Check environment variables
Vercel Settings → Environment Variables  ← Should show 5 variables

# Check Supabase
Tables → Look for "subscriptions" table  ← Should exist

# Check Stripe
Dashboard → Products  ← Should show Pro and Max

# Check Resend
Dashboard → API Keys  ← Should show your key
```

---

## **YOU'RE DONE!**

At this point you have:
- ✅ Admin dashboard live at `/admin`
- ✅ Stripe payments ready (test mode)
- ✅ Email receipts configured
- ✅ Database secured with RLS
- ✅ All APIs working

**Next steps (optional):**
- Add upgrade button to extension UI
- Test with real Stripe account (switch from test to live keys)
- Deploy to production domain
- Set up custom email domain in Resend
- Add analytics

---

## **STUCK? READ THESE**

- `ACTION_PLAN.md` - Detailed step-by-step (what to do if something fails)
- `PHASE_5_SETUP.md` - Complete setup guide (extra details & explanations)
- `PHASE_5_COMPLETION.md` - What was built (architecture overview)

---

## **EMERGENCY CONTACTS**

If something breaks:
1. Check Vercel logs for errors
2. Check Supabase dashboard for database issues
3. Check Stripe test dashboard for webhook failures
4. Read troubleshooting section in `ACTION_PLAN.md`

---

**Status:** Code is ready, just needs configuration  
**Time to completion:** 90 minutes  
**Difficulty:** Easy (copy-paste mostly)

**START NOW → Section 1 of CHECKLIST above**
