# Copilot Instructions — The Page Gallery Journal (Sleep-Well)

## Who You Are Working For

This is **The Page Gallery Journal** — a literary arts platform that functions as a dream-museum for writers. The site lives at thepagegalleryjournal.com. It is private, beautiful, and built to feel like something that cost millions. Every decision should reflect that.

## Stack (Do Not Deviate)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Wouter (routing)
- **Animation:** GSAP 3 + ScrollTrigger, Lenis (smooth scroll), Framer Motion — use all three; they co-exist
- **3D:** Three.js, @react-three/fiber, @react-three/drei
- **Editor:** TipTap 3 (rich text)
- **Backend:** Express 5, Node.js (ESM modules), tsx runtime
- **Database:** PostgreSQL via Drizzle ORM, drizzle-kit for migrations
- **Auth:** Passport.js (local strategy) + express-session + connect-pg-simple
- **Payments:** Stripe + PayPal (@paypal/react-paypal-js)
- **AI:** OpenAI SDK
- **Forms:** React Hook Form + Zod + @hookform/resolvers
- **UI primitives:** Radix UI (full suite), Lucide React icons, shadcn patterns
- **Testing:** Vitest + @testing-library/react + happy-dom
- **Email:** Nodemailer

File structure:
```
/client        → all frontend React code
/server        → Express backend
/shared        → types and schemas shared across client+server
/public        → static assets
/script        → build scripts
```

## Design Identity — Read This Carefully

The Page Gallery Journal is a **dream-museum**. The aesthetic is:
- Cinematic, slow, atmospheric — like walking into a gallery at dusk
- Illustrations are sacred. Never remove, resize, or replace them without explicit instruction
- Dark palette with warm amber/gold accents
- Typography is literary: serif headings, generous line-height, never cramped
- Animations feel like breathing — not bouncing. Ease in, drift, settle
- No startup energy. No SaaS patterns. No "Get Started" buttons unless explicitly asked

### Voice & Copy Rules
- Never write "Submit" — use contextual language ("Share your piece", "Enter the garden", "Publish")
- Never use "Click here", "Learn more", "Sign up"
- Error messages are calm, never accusatory
- Loading states are poetic — not spinners with "Loading..."

## Code Standards

### TypeScript
- Strict mode always. No `any` unless you have a very good reason and comment it
- Prefer `interface` for object shapes, `type` for unions/intersections
- All API response types must be defined in `/shared`

### React
- Functional components only
- Custom hooks for all data fetching (use TanStack Query)
- Never use `useEffect` for data fetching — use `useQuery`
- `useCallback` and `useMemo` only when there is a genuine performance reason
- All forms use React Hook Form + Zod schema validation

### Animation
- All GSAP animations must respect `prefers-reduced-motion` — wrap with `window.matchMedia('(prefers-reduced-motion: reduce)')`
- Lenis is the scroll driver — never fight it with `overflow: hidden` on `body`
- ScrollTrigger must be registered: `gsap.registerPlugin(ScrollTrigger)`
- Three.js scenes must have a cleanup function in `useEffect` return

### Backend
- All routes must have Zod input validation
- All database queries go through Drizzle ORM — never raw SQL unless unavoidable
- Session-based auth — check `req.isAuthenticated()` on protected routes
- Never log sensitive data (passwords, tokens, session secrets)
- Rate limiting is already configured via express-rate-limit — do not remove it
- Helmet is active — do not override security headers

### Database
- Schema lives in `/shared` or `/server/db/schema.ts` — always check before creating new tables
- Run `npm run db:push` to apply schema changes (never edit the DB directly)
- All timestamps use `timestamptz` (timezone-aware)

### Payments
- Stripe webhook verification must always check signature — never skip
- Never log full card data or payment method details
- PayPal integration uses `@paypal/react-paypal-js` — follow the existing patterns

## What You Must Never Do

- Never remove or modify existing animations without being explicitly asked
- Never change colour tokens or typography scales without being explicitly asked
- Never disable RLS or security middleware to fix a bug — find the real fix
- Never add `console.log` statements that log user data
- Never use `dangerouslySetInnerHTML` without DOMPurify sanitisation (already imported)
- Never install a new package without checking if the functionality already exists in the current deps
- Never break existing routes or API contracts when adding new ones
- Never commit secrets, `.env` values, or API keys

## Pull Request Behaviour

When creating a PR:
1. Title format: `type(scope): description` — e.g. `feat(atelier): add star drift animation`
2. PR body must include: what changed, why, which files were touched, and how to test it
3. If you touch any animation file, note which breakpoints you tested
4. Keep PRs small and focused — one concern per PR
5. Always run `npm run check` (TypeScript) before marking ready

## Testing

- Unit tests for all utility functions and hooks
- Integration tests for all API routes
- Use `vitest` — not jest
- Test files live next to the file they test: `foo.ts` → `foo.test.ts`
- Never mock Drizzle — use a test database seeded with fixtures

## Supabase / Database Context

Project ID: `snulcgtnlurperqqkaps`
All form writes must be verified in the Supabase dashboard after implementation.
Connection is via `pg` (node-postgres) configured through environment variables — never hardcode connection strings.
