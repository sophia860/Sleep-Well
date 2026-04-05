# Deadweight — Pages/Files Retained But Not Actively Routed

> Last audited: 2026-04-05 | Auditor: repo-organisation agent

These files exist in the codebase but are **not registered in `client/src/App.tsx`** as routes.
They are retained rather than deleted because they represent in-progress features or recent experiments.

## Decision legend

- `KEEP — in-progress`: Feature is being actively developed, not yet wired to a route
- `KEEP — recently built`: Recently added, expected to be wired soon
- `KEEP — legacy`: Older feature, no longer in active development but kept for reference
- `DELETE CANDIDATE`: Can be deleted safely; no in-progress work

---

## Pages (`client/src/pages/`) with no route in App.tsx

| # | File | Decision | Reason |
|---|------|----------|---------|
| 1 | `BouquetBuilder.tsx` | KEEP — in-progress | Bouquet creation feature (recently built, 3 days ago). Route expected at `/bouquet-builder`. |
| 2 | `Challenges.tsx` | KEEP — legacy | Original challenges page (2 months old). No active route. Review for deletion next pass. |
| 3 | `EICDashboard.tsx` | KEEP — in-progress | Editor-in-Chief dashboard (added 2 days ago). Likely to be wired as alias of `/editorial-dashboard`. |
| 4 | `EditorialReview.tsx` | KEEP — in-progress | Editorial review workflow (3 days ago). Route expected at `/editorial-review`. |
| 5 | `Exhibit.tsx` | KEEP — legacy | Single exhibit detail page (2 months old). May be wired via `/exhibit/:id`. |
| 6 | `Exhibits.tsx` | KEEP — legacy | Exhibits listing page (2 months old). Route expected at `/exhibits`. |
| 7 | `IdeaDrops.tsx` | KEEP — in-progress | IdeaDrops feature with CRUD (3 days ago). Route expected at `/idea-drops`. |
| 8 | `InnerWeather.tsx` | KEEP — in-progress | Mood and energy tracking page (3 days ago). Route expected at `/inner-weather`. |
| 9 | `JulyExhibit.tsx` | KEEP — legacy | July exhibit page (synced from Replit 1 month ago). Likely a one-off exhibit. Review for deletion. |
| 10 | `Nursery.tsx` | KEEP — legacy | Replaced Greenhouse page with Coming Soon (1 month ago). Route may have been removed intentionally. |
| 11 | `Pollinations.tsx` | KEEP — in-progress | Affirmation sending feature (3 days ago). Route expected at `/pollinations`. |
| 12 | `PublicCollectionPage.tsx` | KEEP — in-progress | Public collection detail view (3 days ago). May duplicate or extend `PublicCollection.tsx`. Verify. |
| 13 | `ReadingQueue.tsx` | KEEP — in-progress | Reading queue with CRUD (3 days ago). Route expected at `/reading-queue`. |
| 14 | `RootInfluences.tsx` | KEEP — in-progress | Root Influences page (3 days ago, part of Prompts 6-19 integration). |
| 15 | `SavedPieces.tsx` | KEEP — in-progress | SavedPieces page (3 days ago, part of Prompts 6-19 integration). Note: `/saved` routes to `Saved.tsx`. |
| 16 | `WorkshopRoom.tsx` | KEEP — in-progress | Workshop Room freemium feature (4 days ago). Route expected at `/workshop`. |
| 17 | `WritingCircles.tsx` | KEEP — in-progress | Writing circles feature (3 days ago, part of Prompts 6-19 integration). |

---

## Misplaced/Orphaned Components (resolved in this pass)

| File | Action | Notes |
|------|--------|-------|
| `src/components/TakeoverScreen.tsx` (root) | DELETED | Boilerplate stub at wrong location (outside Vite `client/` root). Moved clean version to `client/src/components/TakeoverScreen.tsx`. |

---

## Notes

- All KEEP items above should be wired to routes or deleted within the next 2–4 sprints.
- `Challenges.tsx`, `JulyExhibit.tsx`, and `Nursery.tsx` are the strongest delete candidates on next pass.
- `PublicCollectionPage.tsx` vs `PublicCollection.tsx` — verify whether these are duplicates.
