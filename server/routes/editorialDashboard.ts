import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { pool } from "../db";

// Re-usable role guards using the same pattern as routes.ts
async function editorGuard(req: any, res: any, next: any) {
  if (!req.user?.claims?.sub) {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) (req as any).user = sessionUser;
  }
  const userId = req.user?.claims?.sub || req.user?.id;
  if (!userId) return res.status(401).json({ message: "Not authenticated" });
  const { rows } = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [userId],
  );
  if (
    !rows[0] ||
    (rows[0].role !== "editor" && rows[0].role !== "editor_in_chief")
  ) {
    return res.status(403).json({ message: "Editor access required" });
  }
  next();
}

async function eicGuard(req: any, res: any, next: any) {
  if (!req.user?.claims?.sub) {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) (req as any).user = sessionUser;
  }
  const userId = req.user?.claims?.sub || req.user?.id;
  if (!userId) return res.status(401).json({ message: "Not authenticated" });
  const { rows } = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [userId],
  );
  if (!rows[0] || rows[0].role !== "editor_in_chief") {
    return res.status(403).json({ message: "Editor-in-Chief access required" });
  }
  next();
}

export function registerEditorialDashboardRoutes(app: Express) {
  // ── OVERVIEW ──────────────────────────────────────────────────────────────

  // GET /api/editorial/overview
  // Returns aggregate counts for the dashboard home panel.
  app.get(
    "/api/editorial/overview",
    isAuthenticated,
    editorGuard,
    async (_req: any, res) => {
      try {
        const { rows } = await pool.query(`
          SELECT
            (SELECT COUNT(*) FROM editorial_flags   WHERE decision = 'pending')::int          AS open_flags,
            (SELECT COUNT(*) FROM greenhouse_entries)::int                                    AS greenhouse_total,
            (SELECT COUNT(*) FROM greenhouse_entries WHERE priority = 'high')::int            AS greenhouse_high,
            (SELECT COUNT(*) FROM greenhouse_entries WHERE priority = 'featured')::int        AS greenhouse_featured,
            (SELECT COUNT(*) FROM publish_requests  WHERE status NOT IN ('accepted','rejected','declined'))::int AS pending_requests,
            (SELECT COUNT(*) FROM editorial_tasks   WHERE status != 'done' AND status != 'completed')::int      AS open_tasks,
            (SELECT COUNT(*) FROM issues            WHERE status = 'draft')::int              AS draft_issues,
            (SELECT COUNT(*) FROM editorial_inbox_states WHERE state = 'unread')::int         AS unread_inbox,
            (SELECT COUNT(*) FROM editorial_flags   WHERE created_at > NOW() - INTERVAL '7 days')::int AS flags_this_week
        `);
        res.json(rows[0]);
      } catch (err) {
        console.error("[editorialDashboard] GET /overview error:", err);
        res.status(500).json({ error: "Failed to fetch overview" });
      }
    },
  );

  // ── INBOX ──────────────────────────────────────────────────────────────────

  // GET /api/editorial/inbox
  // Paginated list of editorial flags with writing + author joins.
  app.get(
    "/api/editorial/inbox",
    isAuthenticated,
    editorGuard,
    async (req: any, res) => {
      try {
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const offset = Number(req.query.offset) || 0;
        const status = req.query.status as string | undefined;

        const statusClause = status && status !== "all"
          ? `AND ef.decision = $3`
          : "";
        const params: any[] = [limit, offset];
        if (status && status !== "all") params.push(status);

        const { rows } = await pool.query(
          `SELECT
             ef.id,
             ef.writing_id,
             ef.author_id,
             ef.decision,
             ef.status,
             ef.is_paid_flag,
             ef.seen_by_editor_id,
             ef.editor_response,
             ef.free_note,
             ef.is_publishable,
             ef.created_at,
             ef.responded_at,
             w.title      AS writing_title,
             w.content    AS writing_content,
             w.genre      AS writing_genre,
             w.readiness  AS writing_readiness,
             w.stage      AS writing_stage,
             length(w.content) AS writing_char_count,
             u.id         AS author_id,
             u.first_name AS author_first_name,
             u.last_name  AS author_last_name,
             u.email      AS author_email,
             u.display_name AS author_display_name,
             eis.state    AS inbox_state,
             eis.assigned_editor_id,
             ae.first_name AS assigned_editor_first_name,
             ae.last_name  AS assigned_editor_last_name
           FROM editorial_flags ef
           LEFT JOIN writings              w   ON ef.writing_id  = w.id
           LEFT JOIN users                 u   ON ef.author_id   = u.id
           LEFT JOIN editorial_inbox_states eis ON eis.writing_id = ef.writing_id
           LEFT JOIN users                 ae  ON eis.assigned_editor_id = ae.id
           WHERE 1=1 ${statusClause}
           ORDER BY ef.created_at DESC
           LIMIT $1 OFFSET $2`,
          params,
        );

        const { rows: countRows } = await pool.query(
          `SELECT COUNT(*)::int AS total FROM editorial_flags ef
           WHERE 1=1 ${status && status !== "all" ? "AND ef.decision = $1" : ""}`,
          status && status !== "all" ? [status] : [],
        );

        res.json({ items: rows, total: countRows[0].total });
      } catch (err) {
        console.error("[editorialDashboard] GET /inbox error:", err);
        res.status(500).json({ error: "Failed to fetch inbox" });
      }
    },
  );

  // PATCH /api/editorial/flags/:id/claim
  // Assigns the flag to the requesting editor and marks inbox state as 'claimed'.
  app.patch(
    "/api/editorial/flags/:id/claim",
    isAuthenticated,
    editorGuard,
    async (req: any, res) => {
      try {
        const editorId = req.user?.claims?.sub || req.user?.id;
        const { id } = req.params;

        // Upsert editorial_inbox_states for this flag's writing
        const { rows: flagRows } = await pool.query(
          `SELECT writing_id FROM editorial_flags WHERE id = $1`,
          [id],
        );
        if (!flagRows[0])
          return res.status(404).json({ error: "Flag not found" });

        const writingId = flagRows[0].writing_id;
        const { rowCount: existsCount } = await pool.query(
          `UPDATE editorial_inbox_states
           SET state = 'claimed', assigned_editor_id = $2, updated_at = NOW()
           WHERE writing_id = $1`,
          [writingId, editorId],
        );
        if ((existsCount ?? 0) === 0) {
          await pool.query(
            `INSERT INTO editorial_inbox_states
               (id, writing_id, state, assigned_editor_id, updated_at)
             VALUES (gen_random_uuid(), $1, 'claimed', $2, NOW())`,
            [writingId, editorId],
          );
        }

        await pool.query(
          `UPDATE editorial_flags
           SET seen_by_editor_id = $1, seen_at = NOW(), status = 'claimed'
           WHERE id = $2`,
          [editorId, id],
        );

        const { rows } = await pool.query(
          `SELECT * FROM editorial_flags WHERE id = $1`,
          [id],
        );
        res.json(rows[0]);
      } catch (err) {
        console.error("[editorialDashboard] PATCH /flags/:id/claim error:", err);
        res.status(500).json({ error: "Failed to claim flag" });
      }
    },
  );

  // PATCH /api/editorial/flags/:id/decide
  // Sets the decision (accept | reject | revise) and optional editor response.
  app.patch(
    "/api/editorial/flags/:id/decide",
    isAuthenticated,
    editorGuard,
    async (req: any, res) => {
      try {
        const editorId = req.user?.claims?.sub || req.user?.id;
        const { id } = req.params;
        const { decision, editorResponse, freeNote, isPublishable } = req.body;

        if (!decision)
          return res.status(400).json({ error: "decision is required" });

        const { rows } = await pool.query(
          `UPDATE editorial_flags
           SET
             decision          = $1,
             editor_response   = COALESCE($2, editor_response),
             free_note         = COALESCE($3, free_note),
             is_publishable    = COALESCE($4, is_publishable),
             seen_by_editor_id = $5,
             seen_at           = NOW(),
             responded_at      = NOW(),
             status            = 'decided'
           WHERE id = $6
           RETURNING *`,
          [decision, editorResponse || null, freeNote || null, isPublishable ?? false, editorId, id],
        );
        if (!rows[0])
          return res.status(404).json({ error: "Flag not found" });

        // Mark inbox state as decided
        const { rows: flagRow } = await pool.query(
          `SELECT writing_id FROM editorial_flags WHERE id = $1`,
          [id],
        );
        if (flagRow[0]) {
          const { rowCount: decideCount } = await pool.query(
            `UPDATE editorial_inbox_states
             SET state = 'decided', decided_at = NOW(), updated_at = NOW()
             WHERE writing_id = $1`,
            [flagRow[0].writing_id],
          );
          if ((decideCount ?? 0) === 0) {
            await pool.query(
              `INSERT INTO editorial_inbox_states
                 (id, writing_id, state, assigned_editor_id, decided_at, updated_at)
               VALUES (gen_random_uuid(), $1, 'decided', $2, NOW(), NOW())`,
              [flagRow[0].writing_id, editorId],
            );
          }
        }

        res.json(rows[0]);
      } catch (err) {
        console.error("[editorialDashboard] PATCH /flags/:id/decide error:", err);
        res.status(500).json({ error: "Failed to record decision" });
      }
    },
  );

  // ── CONTRIBUTORS ──────────────────────────────────────────────────────────

  // GET /api/editorial/contributors
  // Paginated list of writers with submission stats.
  app.get(
    "/api/editorial/contributors",
    isAuthenticated,
    editorGuard,
    async (req: any, res) => {
      try {
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const offset = Number(req.query.offset) || 0;
        const search = (req.query.search as string) || "";

        const searchClause = search
          ? `AND (u.first_name ILIKE $3 OR u.last_name ILIKE $3 OR u.email ILIKE $3 OR u.display_name ILIKE $3)`
          : "";
        const params: any[] = [limit, offset];
        if (search) params.push(`%${search}%`);

        const { rows } = await pool.query(
          `SELECT
             u.id,
             u.first_name,
             u.last_name,
             u.email,
             u.display_name,
             u.bio,
             u.created_at,
             COUNT(DISTINCT ef.id)::int                                         AS submission_count,
             COUNT(DISTINCT ef.id) FILTER (WHERE ef.is_publishable = true)::int AS acceptance_count,
             MAX(ef.created_at)                                                 AS last_submission_at,
             cn.note                                                            AS contributor_note
           FROM users u
           LEFT JOIN editorial_flags ef ON ef.author_id = u.id
           LEFT JOIN LATERAL (
             SELECT note FROM contributor_notes
             WHERE contributor_id = u.id
             ORDER BY updated_at DESC LIMIT 1
           ) cn ON true
           WHERE u.role = 'writer' ${searchClause}
           GROUP BY u.id, u.first_name, u.last_name, u.email, u.display_name, u.bio, u.created_at, cn.note
           ORDER BY submission_count DESC, u.created_at DESC
           LIMIT $1 OFFSET $2`,
          params,
        );

        const { rows: countRows } = await pool.query(
          `SELECT COUNT(*)::int AS total FROM users u
           WHERE u.role = 'writer' ${search ? "AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1 OR u.display_name ILIKE $1)" : ""}`,
          search ? [`%${search}%`] : [],
        );

        res.json({ items: rows, total: countRows[0].total });
      } catch (err) {
        console.error("[editorialDashboard] GET /contributors error:", err);
        res.status(500).json({ error: "Failed to fetch contributors" });
      }
    },
  );

  // GET /api/editorial/contributors/:id
  // Single contributor detail including submission history + notes.
  app.get(
    "/api/editorial/contributors/:id",
    isAuthenticated,
    editorGuard,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const { rows: userRows } = await pool.query(
          `SELECT id, first_name, last_name, email, display_name, bio, role, created_at
           FROM users WHERE id = $1`,
          [id],
        );
        if (!userRows[0])
          return res.status(404).json({ error: "Contributor not found" });

        const [{ rows: flags }, { rows: notes }, { rows: credits }] = await Promise.all([
          pool.query(
            `SELECT ef.*, w.title AS writing_title, w.genre AS writing_genre
             FROM editorial_flags ef
             LEFT JOIN writings w ON ef.writing_id = w.id
             WHERE ef.author_id = $1 ORDER BY ef.created_at DESC`,
            [id],
          ),
          pool.query(
            `SELECT cn.*, u.first_name || ' ' || u.last_name AS editor_name
             FROM contributor_notes cn
             LEFT JOIN users u ON cn.editor_id = u.id
             WHERE cn.contributor_id = $1 ORDER BY cn.updated_at DESC`,
            [id],
          ),
          pool.query(
            `SELECT * FROM publication_credits WHERE author_id = $1 ORDER BY created_at DESC`,
            [id],
          ),
        ]);

        res.json({
          user: userRows[0],
          submissions: flags,
          notes,
          credits,
        });
      } catch (err) {
        console.error("[editorialDashboard] GET /contributors/:id error:", err);
        res.status(500).json({ error: "Failed to fetch contributor" });
      }
    },
  );

  // POST /api/editorial/contributors/:id/notes
  // Add or update a contributor note.
  app.post(
    "/api/editorial/contributors/:id/notes",
    isAuthenticated,
    editorGuard,
    async (req: any, res) => {
      try {
        const editorId = req.user?.claims?.sub || req.user?.id;
        const { id: contributorId } = req.params;
        const { note } = req.body;
        if (!note?.trim())
          return res.status(400).json({ error: "note is required" });

        const { rows } = await pool.query(
          `INSERT INTO contributor_notes (id, contributor_id, editor_id, note)
           VALUES (gen_random_uuid(), $1, $2, $3)
           RETURNING *`,
          [contributorId, editorId, note.trim()],
        );
        res.status(201).json(rows[0]);
      } catch (err) {
        console.error("[editorialDashboard] POST /contributors/:id/notes error:", err);
        res.status(500).json({ error: "Failed to add note" });
      }
    },
  );

  // ── FINANCIALS ────────────────────────────────────────────────────────────

  // GET /api/editorial/financials
  // Aggregate financial data: orders, waitlist, rejection feedback.
  app.get(
    "/api/editorial/financials",
    isAuthenticated,
    editorGuard,
    async (req: any, res) => {
      try {
        const [{ rows: orders }, { rows: waitlist }, { rows: feedback }, { rows: summary }] =
          await Promise.all([
            pool.query(
              `SELECT eso.*, u.first_name || ' ' || u.last_name AS writer_name
               FROM editorial_service_orders eso
               LEFT JOIN users u ON eso.email = u.email
               ORDER BY eso.created_at DESC LIMIT 100`,
            ),
            pool.query(
              `SELECT * FROM editorial_waitlist ORDER BY created_at DESC LIMIT 100`,
            ),
            pool.query(
              `SELECT rfr.*,
                       w.title   AS writing_title,
                       u.first_name || ' ' || u.last_name AS author_name
               FROM rejection_feedback_requests rfr
               LEFT JOIN writings w ON rfr.writing_id = w.id
               LEFT JOIN users   u ON rfr.author_id   = u.id
               ORDER BY rfr.created_at DESC LIMIT 100`,
            ),
            pool.query(`
              SELECT
                (SELECT COUNT(*)::int  FROM editorial_service_orders WHERE payment_confirmed = true)  AS paid_orders,
                (SELECT COALESCE(SUM(quoted_price_pence), 0)::int FROM editorial_service_orders WHERE payment_confirmed = true) AS total_revenue_pence,
                (SELECT COUNT(*)::int  FROM editorial_waitlist)                                       AS waitlist_count,
                (SELECT COUNT(*)::int  FROM editorial_waitlist WHERE payment_confirmed = true)        AS waitlist_paid,
                (SELECT COUNT(*)::int  FROM rejection_feedback_requests WHERE status = 'delivered')   AS feedback_delivered,
                (SELECT COUNT(*)::int  FROM rejection_feedback_requests WHERE tier = 'paid' AND payment_confirmed = true) AS paid_feedback
            `),
          ]);

        res.json({
          summary: summary[0],
          orders,
          waitlist,
          feedback,
        });
      } catch (err) {
        console.error("[editorialDashboard] GET /financials error:", err);
        res.status(500).json({ error: "Failed to fetch financials" });
      }
    },
  );

  // ── ANALYTICS (EIC only) ──────────────────────────────────────────────────

  // GET /api/editorial/analytics
  // Aggregated analytics: submission funnel, genre breakdown, editor workload.
  app.get(
    "/api/editorial/analytics",
    isAuthenticated,
    eicGuard,
    async (_req: any, res) => {
      try {
        const [{ rows: funnel }, { rows: genres }, { rows: workload }, { rows: topWriters }] =
          await Promise.all([
            // Monthly submission funnel for the last 6 months
            pool.query(`
              SELECT
                TO_CHAR(DATE_TRUNC('month', ef.created_at), 'Mon YYYY') AS month,
                COUNT(*)::int                                            AS submitted,
                COUNT(*) FILTER (WHERE ef.decision != 'pending')::int   AS decided,
                COUNT(*) FILTER (WHERE ef.is_publishable = true)::int   AS accepted,
                COUNT(DISTINCT ge.id)::int                              AS greenhouse
              FROM editorial_flags ef
              LEFT JOIN greenhouse_entries ge ON ge.writing_id = ef.writing_id
              WHERE ef.created_at > NOW() - INTERVAL '6 months'
              GROUP BY DATE_TRUNC('month', ef.created_at)
              ORDER BY DATE_TRUNC('month', ef.created_at) ASC
            `),
            // Genre breakdown
            pool.query(`
              SELECT
                w.genre,
                COUNT(*)::int                                           AS submitted,
                COUNT(*) FILTER (WHERE ef.is_publishable = true)::int  AS accepted
              FROM editorial_flags ef
              LEFT JOIN writings w ON ef.writing_id = w.id
              WHERE w.genre IS NOT NULL
              GROUP BY w.genre
              ORDER BY submitted DESC
            `),
            // Editor workload
            pool.query(`
              SELECT
                u.id,
                u.first_name || ' ' || u.last_name AS editor_name,
                COUNT(DISTINCT ef.id)::int          AS total_claimed,
                COUNT(DISTINCT ef.id) FILTER (WHERE ef.decision != 'pending')::int AS total_decided,
                COUNT(DISTINCT et.id)::int          AS open_tasks
              FROM users u
              LEFT JOIN editorial_flags ef ON ef.seen_by_editor_id = u.id
              LEFT JOIN editorial_tasks  et ON et.assigned_editor_id = u.id AND et.status NOT IN ('done','completed')
              WHERE u.role IN ('editor', 'editor_in_chief')
              GROUP BY u.id, u.first_name, u.last_name
              ORDER BY total_claimed DESC
            `),
            // Top 10 most active submitters
            pool.query(`
              SELECT
                u.id,
                u.first_name || ' ' || u.last_name AS writer_name,
                COUNT(ef.id)::int                   AS submissions,
                COUNT(ef.id) FILTER (WHERE ef.is_publishable = true)::int AS acceptances
              FROM editorial_flags ef
              LEFT JOIN users u ON ef.author_id = u.id
              GROUP BY u.id, u.first_name, u.last_name
              ORDER BY submissions DESC
              LIMIT 10
            `),
          ]);

        res.json({ funnel, genres, workload, topWriters });
      } catch (err) {
        console.error("[editorialDashboard] GET /analytics error:", err);
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    },
  );
}
