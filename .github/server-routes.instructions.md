---
applyTo: server/**/*.ts
---

# Server Route Instructions

Applied automatically to all `.ts` files in `server/`.

## Route Template

Every Express route follows this exact pattern:

```ts
import { z } from 'zod';
import type { Request, Response } from 'express';

const inputSchema = z.object({
  // define all expected fields
});

router.post('/route-path', async (req: Request, res: Response) => {
  // 1. Auth check
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // 2. Validate input
  const result = inputSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  // 3. Business logic + DB
  try {
    const data = await db.query.table.findMany(/* ... */);
    return res.status(200).json(data);
  } catch (error) {
    console.error('[route-name] error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});
```

## ESM Module Rules

- This project uses `"type": "module"` — always use `import`/`export`
- File extensions in imports: `.js` for local files even when source is `.ts` (this is how tsx resolves them)
- No `require()` under any circumstances

## Error Handling

- All async route handlers wrapped in try/catch
- Database errors logged server-side with context: `console.error('[route-name]:', error)`
- Client receives safe generic message: `{ error: 'Something went wrong' }`
- Never expose stack traces, query strings, or internal paths to the client

## Input Validation

- Zod schema defined for EVERY route that accepts a body, query params, or path params
- Use `safeParse()` (not `parse()`) to handle errors gracefully
- Sanitize strings that will be stored and later rendered as HTML

## Database

- All queries use Drizzle ORM syntax
- Import `db` from the database module — never create a new connection
- Use transactions for operations that modify multiple tables
- Check ownership before returning or modifying user data:
  ```ts
  if (record.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  ```

## TypeScript

- `req.user` type is extended via Passport — use the existing type augmentation
- Return types on all async functions
- No `any` — if Express types are inadequate, extend them properly

## Security Checklist (run mentally on every route)

- [ ] Auth check present if route is protected
- [ ] Input validated with Zod
- [ ] No secrets in response body
- [ ] Ownership verified before data access
- [ ] Error messages safe for public consumption
- [ ] Rate limiting inherited (do not add second rate limiters unless route-specific)
