# **Phase 5: Production Hardening - Setup Guide**

**Status:** WIP  
**Date:** 2026-04-18

---

## **Overview**

Phase 5 implements:
1. ✅ Admin dashboard deployment to Vercel
2. ✅ Admin authentication via Supabase Auth
3. ✅ Stripe payment integration (webhooks + checkout)
4. ⏳ Security policies (RLS on Supabase)
5. ⏳ Resend email configuration
6. ⏳ Extension integration

---

## **1. Admin Dashboard Deployment**

**Status:** ✅ READY

The admin dashboard is now configured to deploy to Vercel:
- Built with Vite + vanilla JavaScript
- Located at `/admin/src` with dist output at `/admin/dist`
- Configured in `vercel.json` to serve from `/admin` path
- Login page uses Supabase Auth directly

**Next:** Push to GitHub and Vercel will auto-deploy

```bash
git push origin main
# Vercel auto-deploys
# Admin dashboard will be available at: https://money-maker-kl2345.vercel.app/admin
```

---

## **2. Admin Authentication**

**Status:** ✅ IMPLEMENTED

### Frontend (admin/src/auth.js)
- Uses Supabase Password Auth directly
- No hardcoded credentials
- Stores JWT in localStorage
- Supports both demo tokens (base64-encoded) and real Supabase JWTs

### Backend (api/utils/admin-auth.js)
- Middleware to validate tokens
- Supports demo tokens for development
- Validates Supabase JWTs for production
- All admin endpoints now require valid token

**Next Steps:**
1. Create admin user in Supabase Auth dashboard
   - Go to: https://app.supabase.com/project/sppetblailyeblxgpqss/auth/users
   - Create new user: `admin@verifyai.dev`
   - Set password (save securely)

2. Update hint in admin login page (optional)
   - Edit `admin/src/auth.js` line 31 to show real credentials

---

## **3. Stripe Payment Integration**

**Status:** ✅ CODE READY, ⏳ CONFIGURATION NEEDED

### Implemented Endpoints

**POST /api/stripe/webhook** (Handles Stripe events)
- Validates webhook signature
- Updates user tier on subscription events
- Handles: subscription_created, subscription_updated, payment_succeeded, subscription_deleted
- **Requires:** STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY env vars

**POST /api/stripe/checkout** (Creates checkout sessions)
- Requires Supabase Auth token
- Creates Stripe customer if needed
- Returns checkout URL
- **Requires:** STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_MAX env vars

### Database Schema
✅ All required columns already exist:
- `users.stripe_id` (Stripe customer ID)
- `subscriptions.stripe_subscription_id`
- `subscriptions.tier` (pro/max)
- `subscriptions.status` (active/cancelled)
- `subscriptions.next_billing_date`

### Setup Steps

1. **Create Stripe Account**
   - Go to: https://stripe.com
   - Sign up (or login if you have account)
   - Go to Dashboard

2. **Get API Keys**
   - Go to: Developers → API Keys
   - Copy "Secret key" (keep private!)
   - This is your `STRIPE_SECRET_KEY`

3. **Create Products & Prices**
   - Go to: Products → Add product
   - Create "VerifyAI Pro" ($20/month)
     - Name: VerifyAI Pro
     - Price: $20
     - Billing period: Monthly
     - Copy Price ID (price_XXX)
   - Create "VerifyAI Max" ($99/month)
     - Name: VerifyAI Max
     - Price: $99
     - Billing period: Monthly
     - Copy Price ID (price_YYY)

4. **Set Up Webhooks**
   - Go to: Developers → Webhooks
   - Add endpoint: https://money-maker-kl2345.vercel.app/api/stripe/webhook
   - Select events: 
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_succeeded
   - Copy "Signing secret" (whsec_...)
   - This is your `STRIPE_WEBHOOK_SECRET`

5. **Configure Vercel Environment Variables**
   - Go to: https://vercel.com/dashboard
   - Select "money-maker-kl2345" project
   - Settings → Environment Variables
   - Add:
     ```
     STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
     STRIPE_WEBHOOK_SECRET=whsec_...
     STRIPE_PRICE_PRO=price_... (from step 3)
     STRIPE_PRICE_MAX=price_... (from step 3)
     ```
   - Click "Deploy" to redeploy with new env vars

6. **Test Webhook**
   - Use Stripe test mode (toggle at top of dashboard)
   - Go to: Developers → Webhooks → Your endpoint
   - Send test event: "customer.subscription.created"
   - Verify in Vercel logs: tail -f .vercel/logs

---

## **4. Security: Row-Level Security (RLS) Policies**

**Status:** ⏳ READY TO APPLY

**What it does:** Ensures users can only access their own data

### To Apply RLS Policies

1. **Go to Supabase Dashboard**
   - Project: sppetblailyeblxgpqss
   - SQL Editor

2. **Run migrations (in order)**
   - Copy SQL from: `migrations/add_rls_policies.sql`
   - Paste each section and run

3. **Verify**
   - Go to: Authentication → Policies
   - Verify all tables have policies enabled

**Note:** After RLS is enabled, API calls MUST include valid JWT in Authorization header. All existing API endpoints already support this.

---

## **5. Resend Email Configuration**

**Status:** ✅ CODE READY, ⏳ CONFIGURATION NEEDED

The email receipt service is already implemented (`api/audit/send-receipt.js`).

### Setup Steps

1. **Create Resend Account**
   - Go to: https://resend.com
   - Sign up (free tier available)
   - Verify email

2. **Get API Key**
   - Go to: Dashboard → API Keys
   - Create new API key (or copy default one)
   - Copy the key (resend_...)
   - This is your `RESEND_API_KEY`

3. **Set Up Custom Domain (Optional)**
   - Resend allows emails from noreply@resend.dev by default
   - To use custom domain (noreply@verifyai.dev):
     - Add domain: verifyai.dev
     - Follow DNS setup (add DKIM/SPF records)
     - Enable domain

4. **Configure Vercel Environment Variables**
   - Add to your Vercel project:
     ```
     RESEND_API_KEY=resend_...
     ```
   - Redeploy

5. **Update Email Sender (Optional)**
   - If using custom domain, update `api/audit/send-receipt.js` line 89:
     ```javascript
     from: 'noreply@verifyai.dev'  // or your custom domain
     ```

6. **Test**
   - Call `/api/audit/send-receipt` with valid audit_id
   - Should receive email with audit receipt

---

## **6. Extension Integration**

**Status:** ⏳ TODO

After completing 1-5, update extension to:
1. Call `/api/stripe/checkout` when user clicks "Upgrade"
2. Handle Stripe checkout redirect
3. Update local tier on subscription success
4. Show session countdown (already in code, needs wiring)

**Files to update:**
- `src/utils/api-client.ts` - Add checkout function
- `src/panel.tsx` - Add upgrade button
- `src/background.ts` - Handle subscription updates

---

## **Environment Variables Checklist**

```
✅ SUPABASE_URL (already set)
✅ SUPABASE_ANON_KEY (already set)
⏳ SUPABASE_SERVICE_ROLE_KEY (needed for webhooks - get from Supabase)

⏳ STRIPE_SECRET_KEY (get from Stripe)
⏳ STRIPE_WEBHOOK_SECRET (get from Stripe webhooks)
⏳ STRIPE_PRICE_PRO (get from Stripe products)
⏳ STRIPE_PRICE_MAX (get from Stripe products)

⏳ RESEND_API_KEY (get from Resend)
```

---

## **Testing Plan**

### Phase 5 QA Checklist

- [ ] Admin dashboard deploys to Vercel `/admin` path
- [ ] Admin login works with Supabase Auth
- [ ] Admin can view audit trail
- [ ] Admin can verify chains
- [ ] Admin can send email receipts

**Stripe:**
- [ ] Create Stripe test account
- [ ] Test checkout flow (use test card: 4242 4242 4242 4242)
- [ ] Verify webhook received and user tier updated
- [ ] Verify subscription stored in Supabase

**RLS:**
- [ ] Enable RLS policies in Supabase
- [ ] Test that users can only access their own data
- [ ] Test that service role can access all data

**Email:**
- [ ] Send test receipt email
- [ ] Verify email received with hash and status

---

## **Deployment Checklist**

- [ ] Commit all Phase 5 code
- [ ] Configure all environment variables in Vercel
- [ ] Apply RLS policies in Supabase
- [ ] Create Stripe test account and products
- [ ] Set up Resend account and domain
- [ ] Create admin user in Supabase Auth
- [ ] Test each component individually
- [ ] Run end-to-end test (signup → checkout → receipt → admin view)

---

## **Files Changed in Phase 5**

```
api/
├── stripe/
│   ├── webhook.js (NEW)
│   └── checkout.js (NEW)
├── utils/
│   └── admin-auth.js (NEW)
├── admin/
│   ├── audits.js (auth added)
│   └── users.js (auth added)
└── audit/
    ├── verify.js (auth added)
    ├── send-receipt.js (auth added)
    └── chain/[userId].js (auth added)

admin/
├── package.json
├── vite.config.js
├── src/
│   └── api.js (API_BASE updated)
└── dist/ (NEW - built output)

migrations/
└── add_rls_policies.sql (NEW)

vercel.json (updated with rewrites)
package.json (stripe added)
```

---

**Status:** Ready for implementation  
**Next:** Follow checklist above to complete Phase 5
