# MailBlast — Bulk Personalised Mailer

Send branded PDF letters to hundreds of clients in one click.
Each client gets a personalised email with their own PDF attached.

---

## Prerequisites

- Node.js 18 or higher → https://nodejs.org
- A Resend.com account → https://resend.com (free: 100 emails/day)
- A verified domain on Resend (or use their test domain for testing)

---

## Setup (one time)

### 1. Install dependencies

Open a terminal in this folder and run:

```bash
npm install
```

This installs Express, Puppeteer (for PDF generation), and the Resend SDK.
Puppeteer will download a bundled Chrome (~150 MB) — this is what generates the PDFs.

### 2. Start the server

```bash
npm start
```

You will see:
```
✅ MailBlast server running at http://localhost:3000
```

### 3. Open the app

Go to http://localhost:3000 in your browser.

---

## First-time configuration

### Step A — API Settings
1. Click **API Settings** in the sidebar
2. Paste your Resend API key (from resend.com/api-keys)
3. Enter your verified From email (e.g. info@yourbusiness.com)
4. Click **Save settings**
5. Click **Test connection** to verify

### Step B — Add your companies
1. Click **Companies** in the sidebar
2. Click **Add company**
3. Fill in name, phone, address, brand colour, and 2-letter initials
4. Repeat for each company (max 3)

### Step C — Edit content
1. Click **Edit Content** in the sidebar
2. Set your **email subject** (Content 2) — e.g. "Update from {CompanyName}"
3. Set your **email body** (what appears in the email above the PDF)
4. Set your **PDF letter** (Content 1) — heading, greeting, body text, closing
5. Use placeholders like {Name}, {Email}, {Phone}, {Address}, {CompanyName}
6. Click **Save** for each section
7. Click **Preview PDF** to see what the letter looks like

---

## Sending emails

1. Go to **Send Mails**
2. Click your company tile
3. Open Excel and copy your client rows (including header row)
4. Paste into the text area
5. Click **Parse list** — you'll see a preview table
6. Click **Send to all clients**
7. Watch the live progress log

---

## Placeholders reference

| Placeholder | Replaced with |
|---|---|
| {Name} | Client's name |
| {Email} | Client's email |
| {Phone} | Client's phone |
| {Address} | Client's address |
| {CompanyName} | Selected company name |
| {CompanyPhone} | Selected company phone |
| {CompanyAddress} | Selected company address |

---

## Excel format

Your Excel paste should have these columns (first row = headers):

| Name | Email | Phone | Address |
|---|---|---|---|
| Rahul Shah | rahul@example.com | 9876543210 | Surat, Gujarat |

Column names are auto-detected — "Mobile", "Contact", "mobile number" all map to Phone.

---

## About Gmail

Gmail personal accounts cannot be used as the sending address (Google blocks it for bulk sending).

**Recommended setup:**
- Send FROM your business domain via Resend (e.g. info@yourbusiness.com)
- Set your Gmail as the **Reply-to** address — all replies come to your Gmail

If you use Google Workspace (paid), you can verify that domain on Resend.

---

## Data storage

Your companies and content are saved in `data/config.json` and persist between restarts.
Your Resend API key is also saved there — keep this file private.

---

## Running on a server (optional)

To run this on a VPS/cloud server so it's always accessible:

```bash
npm install -g pm2
pm2 start server/index.js --name mailblast
pm2 save
```

Then access at http://your-server-ip:3000
