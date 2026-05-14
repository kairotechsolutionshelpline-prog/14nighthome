# Kairotech Solutions — Mail Dashboard

A bulk registration email sender built with Next.js and Resend.

## Setup

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd kairotech-dashboard
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:
```
RESEND_API_KEY=re_your_api_key_here
DASHBOARD_PASSWORD=your_secure_password_here
SENDER_EMAIL=noreply@redalertsol.com
SENDER_NAME=Kairotech Solutions
```

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Deploy to Railway

1. Push this project to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select this repository
4. Go to **Variables** tab and add all 4 environment variables:
   - `RESEND_API_KEY`
   - `DASHBOARD_PASSWORD`
   - `SENDER_EMAIL`
   - `SENDER_NAME`
5. Railway auto-deploys — your dashboard will be live in 2 minutes!

---

## How to use

1. Open your Railway URL
2. Login with your `DASHBOARD_PASSWORD`
3. Paste member list (Name + Email, tab separated)
4. Click **Load members**
5. Click **Send all emails**

Each member receives a registration confirmation email from `noreply@redalertsol.com`.

---

## Features
- Password protected login
- Paste & parse member list from any database export
- Bulk email sending via Resend API
- Per-member send status (Pending / Sending / Sent / Failed)
- Send history stored locally
- Helpline contact button
