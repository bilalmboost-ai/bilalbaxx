# Nur AI Studio — website

Static marketing site for **Nur AI Studio** (AI content strategy & video audits for Muslim creators and Islamic brands).

- **Live:** https://nuraibaxx.com (custom domain) — also https://bilalmboost-ai.github.io/bilalbaxx/ (redirects to the custom domain)
- **Stack:** plain static HTML/CSS/JS. No build step, no framework.
- **Hosting:** GitHub Pages, served from the **`main`** branch root.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main landing page (hero, offer, how it works, agents, sample audit, services, vision/roadmap, free-audit form, FAQ). |
| `beta.html` | **Founder Beta** page. Invite-code gated (code: `baxx10`), then a signup form. `noindex`. |
| `beta-feedback.html` | Feedback form for Founder Beta members. `noindex`. |
| `logo.png` | Brand lockup (used in hero via `mix-blend-mode: screen`). |
| `CNAME` | Custom domain (`nuraibaxx.com`). **Do not delete** — removing it can break the domain. |

All internal links use **lowercase** filenames (`index.html`, `beta.html`, `beta-feedback.html`) and **relative** paths, so they work on both the custom domain and the github.io project URL.

## ⚙️ Form endpoint setup (required to receive submissions)

The three forms (free audit on `index.html`, beta signup on `beta.html`, feedback on `beta-feedback.html`) POST to a `FORM_ENDPOINT` constant defined in a `<script>` block near the bottom of each file.

**Until you set a real endpoint, the forms will NOT fake success:**
- `index.html` — shows an honest "not connected" error on submit.
- `beta.html` / `beta-feedback.html` — the submit button is **disabled** with a clear notice.

### To connect a form (recommended: Formspree — free tier)

1. Create a form at **https://formspree.io** → copy its endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
2. In each HTML file, find:
   ```js
   var FORM_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
   ```
   and replace `YOUR_FORM_ID` with your real ID (or paste the full endpoint).
3. Commit & push. The forms go live on the next deploy.

> You can use the **same** endpoint for all three forms, or separate ones. Each submission includes a `cohort` / `_subject` field so you can tell them apart.
> Alternatives that use the same JSON-POST pattern: **Basin** (`https://usebasin.com/f/...`) and **Web3Forms** (`https://api.web3forms.com/submit`, add your `access_key` as a hidden field).

Spam protection: every form includes a hidden `_gotcha` honeypot (Formspree-compatible) that silently drops bot submissions.

## Invite code

The Founder Beta gate accepts the code **`baxx10`** (case-insensitive). Change it in `beta.html`:
```js
var INVITE_CODE = "baxx10";
```
The gate is a soft, client-side invite check — not security. Unlock state is remembered per-browser via `localStorage`.

## Deploy

```bash
git add -A
git commit -m "your message"
git push origin main
```
GitHub Pages rebuilds automatically (usually under 1–2 minutes). Hard-refresh (Ctrl/Cmd+Shift+R) to bypass browser cache.
