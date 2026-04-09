---
applyTo: client/**/*.tsx
---

# Client Component Instructions

Applied automatically to all `.tsx` files in `client/`.

## Component Structure

Every component follows this structure:

```tsx
import type { FC } from 'react';

interface ComponentNameProps {
  // explicit prop types — no implicit any
}

export const ComponentName: FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  return (
    // JSX
  );
};
```

- Named exports preferred over default exports
- Prop interface always defined above the component
- No prop spreading (`{...props}`) unless explicitly needed

## Styling

- Tailwind CSS v4 utility classes only
- Use the `cn()` helper (clsx + tailwind-merge) for conditional classes
- No CSS modules, no styled-components, no inline style objects for static values
- Inline styles only for dynamic values that cannot be expressed in Tailwind

## State & Data

- Local state: `useState` for simple UI state only
- Server state: `useQuery` from TanStack Query — never `useEffect` + `fetch`
- Mutations: `useMutation` from TanStack Query
- Forms: React Hook Form + Zod schema

## Accessibility

- All interactive elements are keyboard-accessible
- All images have descriptive `alt` text — empty alt (`alt=""`) only for decorative images
- Form inputs have associated `<label>` elements
- Use Radix UI primitives for dialogs, dropdowns, menus — they handle ARIA correctly
- Focus indicators must be visible — never `outline: none` without a replacement

## Performance

- Lazy load components not needed on initial render: `React.lazy()` + `Suspense`
- `React.memo()` only when profiling shows a genuine re-render problem
- Large lists use windowing — don't render 1000+ DOM nodes

## What Not To Do

- No class components
- No `dangerouslySetInnerHTML` without DOMPurify (already imported globally)
- No direct DOM manipulation — use refs
- No global event listeners without cleanup in `useEffect` return
- No hardcoded colour values — use Tailwind tokens
