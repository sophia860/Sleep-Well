# Deployment

This app deploys to **Render.com** automatically on push to `main`.

## Platform

- **Host:** [Render.com](https://render.com) — NOT Replit, NOT Railway
- **Dashboard:** [https://dashboard.render.com/web/srv-d6u05c450q8c73fo69q0](https://dashboard.render.com/web/srv-d6u05c450q8c73fo69q0)
- **Auto-deploy:** Every push to `main` triggers a new Render build

## Build & Start

| Step | Command |
|------|---------|
| Install | `npm install --include=dev` |
| Build | `npm run build` |
| Start | `npm start` |

## Node Version

Node 20 (set in `nixpacks.toml` via `nixPkgs = ["nodejs-20_x"]`).

## Environment Variables

All environment variables are set in the **Render dashboard** — not in `.env` files (which are gitignored).

Key vars to set in Render:

| Variable | Description |
|----------|-------------|
| `PORT` | Port the Express server listens on (default `5000`) |
| `DATABASE_URL` | PostgreSQL connection string (Render Postgres add-on) |
| `APP_URL` | Full public URL, e.g. `https://your-service.onrender.com` |
| `CONTACT_EMAIL` | Email address for inquiry notifications |
| `SMTP_HOST` | SMTP server host |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SESSION_SECRET` | Secret for session signing |

## Notes

- `nixpacks.toml` is **not** a Railway config — it is used by Render's Nixpacks builder for node version and build phase control.
- Do **not** use Replit for production. The `.replit` file in this repo is legacy and unused.
- Health check endpoint: `GET /health` (used for Render keep-warm pings).

## Why Changes May Not Appear on the Live Site

If changes are pushed but do not appear on `www.thepagegalleryjournal.com`, check the following:

1. **Is the change on `main`?**  
   Render only deploys from the `main` branch. Changes on feature branches (e.g. `copilot/*`) must be merged to `main` via a pull request before they are deployed. Draft PRs are not merged automatically — they need to be reviewed and merged.

2. **Is the Render build succeeding?**  
   Check the [Render dashboard](https://dashboard.render.com/web/srv-d6u05c450q8c73fo69q0) for build logs. If the build fails, the previous working version stays live.  
   Common causes of build failure:
   - **TypeScript/JavaScript syntax errors in `client/src/App.tsx`** — e.g. duplicate `const` declarations. Duplicate variable names are syntax errors in JavaScript that cause the Vite build to fail. Always check `App.tsx` for accidental duplicate lazy imports when adding new pages.
   - Missing environment variables (set these in the Render dashboard, not in `.env` files).

3. **Is the TypeScript Sentinel passing?**  
   Run `npx tsc --noEmit` locally before merging to `main`. If it fails, the Vite build will also fail and Render will not deploy. Fix all TypeScript errors before merging.
