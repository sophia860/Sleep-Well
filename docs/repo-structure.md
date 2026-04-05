# Repo Structure — The Page Gallery Journal

> Generated: 2026-04-05 | Branch: repo-organisation-2026-04-05

---

## Root Layout

```
.
├── client/               # Vite + React frontend (Vite root)
├── server/               # Express backend
├── shared/               # Types and schemas shared by client + server
├── public/               # Static assets served at /
├── docs/                 # Developer documentation (this folder)
├── script/               # Build scripts (script/build.ts)
├── attached_assets/      # Uploaded/attached media (not served in prod)
├── .github/              # GitHub Actions workflows
├── drizzle.config.ts     # Drizzle Kit config
├── vite.config.ts        # Vite config (root = client/, aliases @/ @shared/ @assets/)
├── tsconfig.json         # TypeScript project config
├── package.json          # Scripts + dependencies
├── postcss.config.js     # PostCSS config (Tailwind)
├── components.json       # shadcn/ui component config
├── nixpacks.toml         # Render/nixpacks build config (Node 20)
├── vite-plugin-meta-images.ts # Custom Vite plugin (standalone)
├── DEPLOYMENT.md         # Render deployment guide
├── README.md             # Project overview and getting started
└── replit.md             # Replit-specific notes (not a README)
```

---

## client/

Vite root. All imports use the `@/` alias (resolves to `client/src/`).

```
client/
├── index.html            # HTML template
└── src/
    ├── main.tsx          # Vite entrypoint — mounts <App />
    ├── App.tsx           # Router (wouter Switch/Route) + global providers
    ├── index.css         # Global Tailwind + CSS custom properties
    ├── data.ts           # Static data (used by pages)
    ├── pages/            # Route-level page components
    ├── components/       # Reusable UI components
    │   ├── garden/       # Garden-specific components
    │   ├── sections/     # Homepage section components (Hero, Featured, etc.)
    │   └── ui/           # shadcn/radix-ui primitives
    ├── hooks/            # Custom React hooks
    ├── lib/              # Utility functions, queryClient
    ├── data/             # Static data modules
    └── assets/           # Local image/font assets
```

### Naming conventions

- **Pages**: `PascalCase.tsx` (e.g. `Garden.tsx`, `EditorStudio.tsx`)
- **Components**: `PascalCase.tsx`
- **Hooks**: Mixed convention — some are `use-kebab-case.ts`, some are `usePascalCase.ts`.
  Both work; standardise to `usePascalCase.ts` on next refactor pass.
- **Lib/utils**: camelCase or kebab-case `.ts`

### Path aliases (vite.config.ts + tsconfig.json)

| Alias | Resolves to |
|-------|-------------|
| `@/` | `client/src/` |
| `@shared/` | `shared/` |
| `@assets/` | `attached_assets/` |

---

## server/

Express 5 server. Entrypoint: `server/index.ts`.

```
server/
├── index.ts              # Entrypoint: creates Express app, starts HTTP server
├── routes.ts             # Registers all route modules
├── db.ts                 # Drizzle ORM client (Supabase PostgreSQL)
├── storage.ts            # Storage abstraction layer
├── seedContent.ts        # Content seeding script
├── sitemap.ts            # Dynamic sitemap generation
├── static.ts             # Static file serving (Vite build in prod)
├── vite.ts               # Vite dev middleware (dev only)
├── routes/               # Individual route handlers
├── lib/                  # Server-side utilities
├── migrations/           # Drizzle migration SQL files
├── types/                # Server-specific TypeScript types
└── replit_integrations/  # Replit OIDC / auth integration
    └── auth/
```

---

## shared/

Code imported by both client and server.

```
shared/
├── schema.ts             # Main Drizzle table definitions + Zod insert/select schemas
├── atelier.schema.ts     # Atelier-specific schema declarations
└── models/               # Shared TypeScript model types
```

Imported in client as `@shared/schema`, in server as `../shared/schema`.

---

## public/

Static assets served directly at `/` (e.g. `/robots.txt`, `/sitemap.xml`).

---

## docs/

Developer documentation.

| File | Purpose |
|------|---------|
| `repo-structure.md` | This file — repo layout and conventions |
| `atelier-feature.md` | Atelier room integration guide and test checklist |
| `deadweight.md` | Pages/files retained but not actively routed |
| `tests-status.md` | Test suite status |

---

## Key Architectural Notes

### Auth
- Session-based auth via Passport.js (`passport-local`) + `express-session` + `connect-pg-simple`
- Replit OIDC integration in `server/replit_integrations/auth/`
- Client accesses auth state via `useAuth()` hook (`client/src/hooks/use-auth.ts`)

### Garden Flow
- Writers have a personal Garden (`/garden`) with Zones containing Seeds and Blooms
- Pieces move through: Seed → Bloom → Submission → Published
- Garden data lives in Supabase tables defined in `shared/schema.ts`

### Editorial Flow
- Editors access `/editor-studio` to review submissions
- EIC (Editor in Chief) has elevated access via role check (`editor_in_chief`)
- `EditorialDashboard` and `EditorialRoom` are role-gated

### Atelier
- Real-time collaborative room (see `docs/atelier-feature.md`)
- Schema in `shared/atelier.schema.ts`

### Build
- `npm run build` runs `script/build.ts` which bundles both client (Vite) and server (esbuild)
- Output: `dist/public/` (client), `dist/index.js` (server)
