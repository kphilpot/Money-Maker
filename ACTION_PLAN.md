# **COMPLETE ACTION PLAN - Money Maker Project**

**Status:** Phase 5 code complete, ready for final configuration & deployment  
**Created:** 2026-04-18  
**Priority:** HIGH - Everything below is required to launch

---

## **SECTION 1: WHAT'S ALREADY DONE** ✅

- ✅ Phase 3B: Supabase backend + Vercel APIs
- ✅ Phase 3C: End-to-end API testing
- ✅ Phase 4: Immutable audit trail (chain verification + email receipts + admin dashboard)
- ✅ Phase 5 Code: All payment, auth, and deployment infrastructure
- ✅ GitHub: All code pushed to https://github.com/kphilpot/Money-Maker

---

## **SECTION 2: IMMEDIATE ACTIONS (TODAY)**

### **Action 1: Deploy Admin Dashboard to Vercel** (5 min)
**Status:** Code is ready, auto-deploys on push

```bash
# Already done - code is on GitHub
# Vercel will auto-deploy when you push
# Check deployment at: https://money-maker-kl2345.vercel.app/admin
```

**Verify:** 
- Go to: https://money-maker-kl2345.vercel.app/admin
- Should see login page with "🔐 VerifyAI Admin" heading

---

## **SECTION 3: STRIPE SETUP** (30-45 min)

### **Step 1: Create Stripe Account**
1. Go to: https://stripe.com/start
2. Sign up (free, no credit card needed for test mode)
3. Verify email
4. Complete onboarding (takes ~2 min)

### **Step 2: Get Stripe Secret Key**
1. Dashboard → Developers (top right) → API Keys
2. Copy "Secret key" (starts with `sk_test_` or `sk_live_`)
3. Save to temp file: `STRIPE_SECRET_KEY`

### **Step 3: Create Products & Prices**
In Stripe Dashboard:

**Product 1: VerifyAI Pro**
- Products → Add product
- Name: `VerifyAI Pro`
- Price: `$20.00`
- Billing period: `Monthly`
- Recurring
- Save
- Copy Price ID from "Pricing" section (looks like `price_XXX`)
- Save as: `STRIPE_PRICE_PRO`

**Product 2: VerifyAI Max**
- Repeat above
- Name: `VerifyAI Max`
- Price: `$99.00`
- Save Price ID as: `STRIPE_PRICE_MAX`

### **Step 4: Set Up Webhook**
1. Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://money-maker-kl2345.vercel.app/api/stripe/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Click "Add endpoint"
6. Copy "Signing secret" (starts with `whsec_`)
7. Save as: `STRIPE_WEBHOOK_SECRET`

### **Step 5: Set Vercel Environment Variables**
1. Go to: https://vercel.com/dashboard
2. Select project: `money-maker-kl2345`
3. Settings → Environment Variables
4. Add 4 variables:
   ```
   STRIPE_SECRET_KEY = sk_test_XXX
   STRIPE_WEBHOOK_SECRET = whsec_XXX
   STRIPE_PRICE_PRO = price_XXX
   STRIPE_PRICE_MAX = price_XXX
   ```
5. Click "Save"
6. Vercel auto-redeploys (wait 2-3 min)

**Verify:**
- Vercel shows green "Ready" status
- No build errors

---

## **SECTION 4: RESEND EMAIL SETUP** (15-20 min)

### **Step 1: Create Resend Account**
1. Go to: https://resend.com
2. Sign up (free tier available)
3. Verify email

### **Step 2: Get API Key**
1. Dashboard → API Keys
2. Create new API key (or copy default)
3. Copy key (starts with `resend_`)
4. Save as: `RESEND_API_KEY`

### **Step 3: Set Vercel Environment Variable**
1. Go to Vercel: Settings → Environment Variables
2. Add:
   ```
   RESEND_API_KEY = resend_XXX
   ```
3. Save
4. Wait for redeploy (2-3 min)

**Optional:** Set up custom domain
- In Resend: Add domain `verifyai.dev` (if you own it)
- Add DNS records (follow Resend instructions)
- Takes ~15 min but improves deliverability

---

## **SECTION 5: SUPABASE SECURITY** (10-15 min)

### **Step 1: Apply RLS Policies**
1. Go to: https://app.supabase.com/project/sppetblailyeblxgpqss/sql/new
2. Open file: `migrations/add_rls_policies.sql`
3. Copy entire SQL content
4. Paste into Supabase SQL Editor
5. Click "Run"

**Verify:**
- No errors in output
- Green checkmark

### **Step 2: Create Admin User**
1. Go to Supabase: Authentication → Users
2. Click "Add user"
3. Email: `admin@verifyai.dev`
4. Password: (create strong password, save it)
5. Click "Create user"

**Verify:**
- User appears in list
- Email shows as `admin@verifyai.dev`

---

## **SECTION 6: TEST EVERYTHING** (20-30 min)

### **Test 1: Admin Dashboard Login**
1. Go to: https://money-maker-kl2345.vercel.app/admin
2. Enter: `admin@verifyai.dev` + password from Step 5.2
3. Should see audit trail dashboard
4. Click around - verify pages load

### **Test 2: Stripe Webhook**
1. Stripe Dashboard → Developers → Webhooks → Your endpoint
2. Click "Test endpoint"
3. Select event: `customer.subscription.created`
4. Click "Send test event"
5. Check Vercel logs for success

**In Supabase:**
- Go to: Tables → subscriptions
- Should see test subscription record

### **Test 3: Email Receipts**
1. Create test audit entry (via API or manually in Supabase)
2. Call endpoint: `POST /api/audit/send-receipt`
3. Body:
   ```json
   {
     "audit_id": "[uuid from audit_trail table]",
     "user_id": "[user uuid]"
   }
   ```
4. Headers:
   ```
   Authorization: Bearer [valid_jwt_token]
   ```
5. Should receive email within 1 min

**Check:** Email inbox for receipt with hash

### **Test 4: Stripe Checkout (Test Mode)**
1. Extension should have upgrade button (once implemented)
2. Click upgrade → Pro
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `12/34`, CVC: `567`
5. Complete payment
6. Check Stripe dashboard for payment received
7. Verify Supabase user tier updated to `pro`

---

## **SECTION 7: EXTENSION INTEGRATION** (if you want to complete)

### **Note:** This is OPTIONAL - Phase 5 is complete without this

If you want to add upgrade button to extension:

**File: `src/panel.tsx`** (add upgrade button)
```typescript
// Find where tier is displayed
// Add button: <button onClick={handleUpgrade}>Upgrade to Pro</button>

async function handleUpgrade(tier: 'pro' | 'max') {
  const token = getUserAuthToken(); // Need to implement this
  const url = await createCheckoutSession(tier, token);
  if (url) window.open(url, '_blank');
}
```

**File: `src/background.ts`** (handle subscription updates)
```typescript
// Add listener for subscription updates
// When user returns from Stripe, verify tier was updated
```

**Requires:** Supabase Auth integration in extension (significant work)

---

## **SECTION 8: FINAL DEPLOYMENT CHECKLIST**

Before going live, verify:

- [ ] All environment variables set in Vercel
- [ ] Admin dashboard accessible at `/admin`
- [ ] Admin can login with Supabase user
- [ ] Admin can view audit trail
- [ ] Stripe webhook working (test event received)
- [ ] Email receipts sending (test sent successfully)
- [ ] RLS policies applied in Supabase
- [ ] User tier updates on Stripe webhook
- [ ] No errors in Vercel logs
- [ ] No errors in Supabase logs

---

## **SECTION 9: DOCUMENTATION FILES**

Read these files for reference:
- **PHASE_5_SETUP.md** - Detailed setup guide (280+ lines)
- **PHASE_5_COMPLETION.md** - What was built
- **ACTION_PLAN.md** - This file

---

## **SECTION 10: TROUBLESHOOTING**

### **Problem: "RESEND_API_KEY missing"**
- Solution: Check Vercel environment variables are saved
- Redeploy or wait 5 min for propagation

### **Problem: Stripe webhook returns 401**
- Solution: Check `STRIPE_WEBHOOK_SECRET` is correct
- Verify endpoint URL exactly matches: `https://money-maker-kl2345.vercel.app/api/stripe/webhook`

### **Problem: Admin can't login**
- Solution: Verify user created in Supabase Auth
- Email must be `admin@verifyai.dev`
- Check password is correct

### **Problem: Email not sending**
- Solution: Check `RESEND_API_KEY` set in Vercel
- Verify endpoint called with valid JWT token
- Check email address in users table is valid

### **Problem: RLS policies blocking access**
- Solution: Ensure you have valid JWT token in Authorization header
- Anon key won't work for authenticated endpoints after RLS

---

## **SUMMARY: Time Estimates**

| Step | Time | Status |
|------|------|--------|
| Stripe Setup | 30-45 min | Do now |
| Resend Setup | 15-20 min | Do now |
| Supabase RLS | 10-15 min | Do now |
| Testing | 20-30 min | Do now |
| Extension Integration | 1-2 hours | Optional |
| **Total** | **~1.5-2 hours** | **Ready to start** |

---

## **CRITICAL: DO NOT SKIP**

These are absolutely required:
1. ✅ Stripe account + API key
2. ✅ Stripe products + prices
3. ✅ Stripe webhook
4. ✅ Resend API key
5. ✅ Vercel environment variables
6. ✅ RLS policies in Supabase
7. ✅ Admin user in Supabase Auth

Everything else can be done later.

---

## **AFTER THIS IS DONE**

Once all above is complete, you have:
- ✅ Functional admin dashboard
- ✅ Stripe payment system working
- ✅ Email receipts sending
- ✅ Secure database with RLS
- ✅ Full backend API ready

Then add:
- Extension UI integration (buttons, modals)
- Analytics dashboard
- Support system
- More admin features

---

**Status:** Ready to execute  
**Next Action:** Start with Stripe Setup (Section 3)  
**Estimated Total Time:** 1.5-2 hours
