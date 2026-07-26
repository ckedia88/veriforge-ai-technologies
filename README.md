# VeriForge AI Technologies — Website

Marketing + enrollment site for **VeriForge AI Technologies**: AI-driven functional
verification for **IP / Subsystem (SS) / SoC**, plus premium **Design Verification & VLSI**
training with online enrollment and payments (UPI / credit card / debit card via Razorpay).

Built with plain **HTML / CSS / JavaScript** and **Netlify Functions** for secure payments.

## Structure

```
DV Site/
├── index.html                     Landing page (Services, AI Verification, Training, Enroll)
├── css/styles.css                 Styling / theme
├── js/main.js                     Navigation + UI interactions
├── js/payment.js                  Razorpay checkout (client)
├── netlify/functions/
│   ├── create-order.js            Creates a Razorpay order (server, direct REST call, no deps)
│   └── verify-payment.js          Verifies the payment signature (server, built-in crypto)
├── netlify.toml                   Netlify build/functions config
└── package.json                   Project metadata (no dependencies to install)
```

## Courses

| Course                      | Duration | Fee     |
|-----------------------------|----------|---------|
| VLSI Fundamentals           | 4 weeks  | ₹50,000 |
| Design Verification (UVM)   | 6 weeks  | ₹50,000 |
| AI in Design Verification   | 4 weeks  | ₹35,000 |

## Run locally

```powershell
npx netlify dev      # starts Netlify Dev at http://localhost:8888 (functions included)
```

> No `npm install` needed — the functions use only built-in Node APIs (`fetch`, `crypto`).
> Without keys the site runs in **DEMO MODE** — the form works but no real charge is made.
> You can also just open `index.html` in a browser to preview the UI (payments need Netlify Dev).

## Go live — payments (Razorpay)

1. Create a free account at https://razorpay.com and complete KYC.
2. Dashboard → **Settings → API Keys → Generate Key**. Copy the **Key ID** and **Key Secret**.
3. In Netlify: **Site settings → Environment variables**, add:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
4. Redeploy. Payments (UPI / cards / net banking) go live automatically.

## Deploy to Netlify

**Option A — drag & drop (fastest):**
1. Go to https://app.netlify.com/drop and drop this folder.
   (For functions to work you still need to add the env vars above and redeploy.)

**Option B — Git (recommended):**
1. Push this folder to a GitHub repo.
2. Netlify → **Add new site → Import from Git** → pick the repo.
3. Build command: *(leave blank)*  ·  Publish directory: `.`  ·  Functions: `netlify/functions`.
4. Add the Razorpay env vars → Deploy.

**Option C — Netlify CLI:**
```powershell
npm install -g netlify-cli
netlify deploy        # draft
netlify deploy --prod # production
```

## Custom domain

1. Buy a domain (e.g. from Namecheap, GoDaddy, Google Domains, or **directly in Netlify**:
   Netlify → **Domains → Add a domain** lets you purchase one).
2. If bought elsewhere: Netlify → **Domain settings → Add custom domain**, then either
   point your registrar's nameservers to Netlify, or add the DNS records Netlify shows.
3. Netlify provisions free HTTPS (Let's Encrypt) automatically.

## ⚠️ TODO before launch (reminders)

- [ ] **Contact details** — replace placeholders in `index.html` footer
      (`hello@veriforge.ai`, phone, city).
- [ ] **Razorpay keys** — add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` env vars.
- [ ] **Domain** — purchase and connect (see above).
- [ ] Optional: store enrollments / email receipts in `verify-payment.js`.
- [ ] Add Terms, Refund/Cancellation and Privacy pages (required by Razorpay for activation).
