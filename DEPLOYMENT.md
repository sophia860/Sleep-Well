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

Node 18 (set in `nixpacks.toml` via `nixPkgs = ["nodejs-18_x"]`).

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

## Common Build Gotchas

### Duplicate `const` declarations in `App.tsx`

Every `lazy(() => import(...))` declaration in `client/src/App.tsx` must be unique. A duplicate `const Publications` (or any other component name) will cause a **JavaScript syntax error** and the Vite build will fail silently on Render — the site will stop updating entirely.

**How to avoid:** Before merging a PR that adds new lazy imports to `App.tsx`, search the file for the same variable name. If it already exists, remove the duplicate instead of adding a second declaration. Likewise, each `<Route path="...">` should appear only once in the `Router` function.
