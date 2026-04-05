# The Page Gallery Journal

A literary journal and writing platform built with Vite + React (client), Express (server), and Supabase (database). Writers can grow a personal "garden" of work, submit to editorial flows, and participate in a collaborative creative community.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 19, TypeScript, Tailwind CSS v4, Wouter (routing), TanStack Query |
| Backend | Express 5, TypeScript, Drizzle ORM, Passport.js (auth), express-session |
| Database | Supabase (PostgreSQL) |
| Shared | Zod schemas, Drizzle table definitions in `shared/` |
| Animation | Framer Motion, GSAP, Lenis (smooth scroll) |
| Deployment | Render (nixpacks), served as Node + static Vite build |

---

## Getting Started

### Install dependencies

```bash
npm install
```

### Environment variables

Copy `.env.example` (if present) or set the following:

```
SESSION_SECRET=your-secret
SUPABASE_DATABASE_URL=postgresql://...
DATABASE_URL=postgresql://...
```

### Run in development

```bash
npm run dev          # starts Express server (port 5000, serves client via Vite middleware)
```

Or run the client standalone:

```bash
npm run dev:client   # Vite only, port 5000
```

### Build for production

```bash
npm run build        # runs script/build.ts — compiles client + server
npm start            # NODE_ENV=production node dist/index.js
```

### Type-check

```bash
npm run check        # tsc (TypeScript check across the project)
```

### Database

```bash
npm run db:push      # drizzle-kit push (apply schema to Supabase)
```

---

## Project Structure

```
.
├── client/              # Vite + React frontend
│   ├── src/
│   │   ├── pages/       # Route-level page components (PascalCase.tsx)
│   │   ├── components/  # Shared UI components
│   │   │   ├── garden/  # Garden-specific components
│   │   │   ├── sections/# Homepage / landing section components
│   │   │   └── ui/      # shadcn/radix-based primitives
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions, query client
│   │   ├── data/        # Static data files
│   │   ├── assets/      # Local images / fonts
│   │   ├── App.tsx      # Root component with router
│   │   ├── main.tsx     # Vite entrypoint
│   │   └── index.css    # Global styles
│   └── index.html       # HTML template
├── server/              # Express backend
│   ├── routes/          # Route handlers
│   ├── lib/             # Server utilities (db, auth helpers)
│   ├── migrations/      # Drizzle migration files
│   ├── types/           # Server-side types
│   ├── replit_integrations/ # Replit OIDC auth integration
│   ├── index.ts         # Server entrypoint
│   ├── routes.ts        # Route registration
│   ├── db.ts            # Drizzle DB client
│   └── storage.ts       # Storage abstraction
├── shared/              # Shared between client and server
│   ├── schema.ts        # Drizzle table definitions + Zod schemas
│   ├── atelier.schema.ts# Atelier-specific schema
│   └── models/          # Shared model types
├── public/              # Static assets served directly
├── docs/                # Developer documentation
│   └── repo-structure.md
├── script/              # Build and utility scripts
├── attached_assets/     # Uploaded/attached media assets
├── drizzle.config.ts    # Drizzle Kit configuration
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # npm scripts and dependencies
└── DEPLOYMENT.md        # Deployment instructions (Render)
```

For deeper structure details, see [`docs/repo-structure.md`](./docs/repo-structure.md).

---

## Key Patterns

- **Path aliases**: `@/` resolves to `client/src/`, `@shared/` to `shared/`, `@assets/` to `attached_assets/`
- **Routing**: Uses [Wouter](https://github.com/molefrog/wouter) (not React Router)
- **Auth**: Session-based via Passport + express-session + Supabase, plus Replit OIDC integration
- **Garden flow**: Writers have a "Garden" — a personal space with Zones, Seeds, and Blooms representing stages of work
- **Editorial flow**: Editors review submissions through EditorStudio and EditorialDashboard
- **Atelier**: A real-time collaborative room feature (see `docs/atelier-feature.md`)

---

## Tests

No automated test suite is currently configured. See `docs/tests-status.md` for details.
