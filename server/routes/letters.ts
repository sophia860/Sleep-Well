import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { db } from "../db";
import { eq, and, sql, count } from "drizzle-orm";
import { insertLetterSchema, users, appreciations, letters, echoes, whispers, writings, resonances } from "@shared/schema";

export function registerLettersRoutes(app: Express) {
  app.get(
    "/api/writings/:id/whispers",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const whispers = await storage.getQuietReadWhispers(req.params.id);
        res.json(whispers);
      } catch (error) {
        console.error("Error fetching whispers:", error);
        res.status(500).json({ message: "Failed to fetch whispers" });
      }
    },
  );

  app.post(
    "/api/appreciations/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const existing = await db
          .select()
          .from(appreciations)
          .where(
            and(
              eq(appreciations.userId, userId),
              eq(appreciations.writingId, writingId),
            ),
          )
          .limit(1);
        if (existing.length > 0) {
          await db
            .delete(appreciations)
            .where(
              and(
                eq(appreciations.userId, userId),
                eq(appreciations.writingId, writingId),
              ),
            );
          return res.json({ appreciated: false });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await db.execute(sql`
        SELECT COUNT(*) as total FROM appreciations
        WHERE user_id = ${userId} AND created_at >= ${today}
      `);
        if (Number(todayCount.rows[0]?.total || 0) >= 5) {
          return res
            .status(429)
            .json({
              message:
                "You've shared 5 admires today — save the rest for tomorrow",
              capped: true,
            });
        }
        await db.insert(appreciations).values({ userId, writingId });
        res.json({ appreciated: true });
      } catch (err) {
        res.status(500).json({ message: "Failed to toggle appreciation" });
      }
    },
  );

  app.get(
    "/api/appreciations/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const [countResult] = await db
          .select({ value: count() })
          .from(appreciations)
          .where(eq(appreciations.writingId, writingId));
        const mine = await db
          .select()
          .from(appreciations)
          .where(
            and(
              eq(appreciations.userId, userId),
              eq(appreciations.writingId, writingId),
            ),
          )
          .limit(1);
        res.json({
          count: countResult?.value || 0,
          appreciated: mine.length > 0,
        });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch appreciation" });
      }
    },
  );

  app.get(
    "/api/appreciations/my-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM appreciations a
        JOIN writings w ON a.writing_id = w.id
        WHERE w.author_id = ${userId}
      `);
        res.json({ count: Number(result.rows[0]?.total || 0) });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch appreciation count" });
      }
    },
  );

  app.get("/api/letters/:writingId", isAuthenticated, async (req: any, res) => {
    try {
      const writingId = req.params.writingId;
      const result = await db.execute(sql`
        SELECT l.id, l.content, l.created_at as "createdAt",
               u.display_name as "authorName", u.id as "authorId"
        FROM letters l
        JOIN users u ON l.user_id = u.id
        WHERE l.writing_id = ${writingId}
        ORDER BY l.created_at ASC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch letters" });
    }
  });

  app.post(
    "/api/letters/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const parsed = insertLetterSchema.safeParse({
          writingId,
          content: req.body?.content,
        });
        if (!parsed.success) {
          return res.status(400).json({ message: "Letter cannot be empty" });
        }
        const [letter] = await db
          .insert(letters)
          .values({ userId, writingId, content: parsed.data.content.trim() })
          .returning();
        res.json(letter);
      } catch (err) {
        res.status(500).json({ message: "Failed to send letter" });
      }
    },
  );

  app.get("/api/bookshelf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = await db.execute(sql`
        SELECT sp.id, sp.writing_id as "writingId", sp.saved_at as "savedAt",
               w.title, w.content, w.genre, w.author_id as "authorId",
               u.display_name as "authorName"
        FROM saved_pieces sp
        JOIN writings w ON sp.writing_id = w.id
        JOIN users u ON w.author_id = u.id
        WHERE sp.user_id = ${userId}
        ORDER BY sp.saved_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch bookshelf" });
    }
  });

  app.post(
    "/api/bookshelf/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const existing = await db.execute(sql`
        SELECT id FROM saved_pieces WHERE user_id = ${userId} AND writing_id = ${writingId} LIMIT 1
      `);
        if (existing.rows.length > 0) {
          await db.execute(
            sql`DELETE FROM saved_pieces WHERE user_id = ${userId} AND writing_id = ${writingId}`,
          );
          return res.json({ kept: false });
        }
        await db.execute(
          sql`INSERT INTO saved_pieces (id, user_id, writing_id) VALUES (gen_random_uuid(), ${userId}, ${writingId})`,
        );
        res.json({ kept: true });
      } catch (err) {
        res.status(500).json({ message: "Failed to toggle bookshelf" });
      }
    },
  );

  app.get(
    "/api/bookshelf/check/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const existing = await db.execute(sql`
        SELECT id FROM saved_pieces WHERE user_id = ${userId} AND writing_id = ${writingId} LIMIT 1
      `);
        res.json({ kept: existing.rows.length > 0 });
      } catch (err) {
        res.status(500).json({ message: "Failed to check bookshelf" });
      }
    },
  );

  app.get(
    "/api/admires/today-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM appreciations
        WHERE user_id = ${userId} AND created_at >= ${today}
      `);
        res.json({ count: Number(result.rows[0]?.total || 0) });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to fetch today's admire count" });
      }
    },
  );

  app.get(
    "/api/writings/:id/admirers",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT u.first_name as name, a.created_at as "createdAt"
        FROM appreciations a
        JOIN users u ON a.user_id = u.id
        WHERE a.writing_id = ${req.params.id}
        ORDER BY a.created_at DESC
      `);
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch admirers" });
      }
    },
  );

  app.get(
    "/api/writings/:id/tended-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM resonances
        WHERE writing_id = ${req.params.id} AND type = 'tended'
        AND created_at >= ${monthStart}
      `);
        res.json({ count: Number(result.rows[0]?.total || 0) });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch tended count" });
      }
    },
  );

  app.post("/api/echoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { writingId, echoedLine } = req.body;
      if (!writingId || !echoedLine)
        return res
          .status(400)
          .json({ message: "writingId and echoedLine required" });
      const writing = await storage.getWriting(writingId);
      if (!writing)
        return res.status(404).json({ message: "Writing not found" });
      if (writing.authorId === userId)
        return res.status(400).json({ message: "Cannot echo your own work" });
      const newWriting = await storage.createWriting(userId, {
        title: "Echoed Fragment",
        content: `<blockquote><em>${echoedLine}</em></blockquote>`,
        genre: writing.genre || "fragment",
        visibility: "personal",
        readiness: "raw_seed",
        tags: ["echo"],
      });
      const [echo] = await db
        .insert(echoes)
        .values({
          userId,
          writingId,
          echoedLine,
          createdWritingId: newWriting.id,
        })
        .returning();
      res.status(201).json(echo);
    } catch (err) {
      res.status(500).json({ message: "Failed to create echo" });
    }
  });

  app.get(
    "/api/writings/:id/echo-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM echoes WHERE writing_id = ${req.params.id}
      `);
        const lineResults = await db.execute(sql`
        SELECT echoed_line as "echoedLine", COUNT(*) as count
        FROM echoes WHERE writing_id = ${req.params.id}
        GROUP BY echoed_line ORDER BY count DESC LIMIT 5
      `);
        res.json({
          totalEchoes: Number(result.rows[0]?.total || 0),
          lines: lineResults.rows.map((r: any) => ({
            line: r.echoedLine,
            count: Number(r.count),
          })),
        });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch echo count" });
      }
    },
  );

  app.get(
    "/api/writings/:id/gentle-reactions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT type, COUNT(*) as count FROM resonances
        WHERE writing_id = ${req.params.id} AND type IN ('spark', 'fog', 'seedling')
        GROUP BY type
      `);
        const reactions: Record<string, number> = {};
        for (const row of result.rows as any[]) {
          reactions[row.type] = Number(row.count);
        }
        res.json(reactions);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch gentle reactions" });
      }
    },
  );

  app.post(
    "/api/whispers/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writingId = req.params.writingId;
        const { content } = req.body;
        if (!content || content.length > 280)
          return res
            .status(400)
            .json({ message: "Content required (max 280 chars)" });
        const writing = await storage.getWriting(writingId);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId === userId)
          return res
            .status(400)
            .json({ message: "Cannot whisper to your own work" });
        const [whisper] = await db
          .insert(whispers)
          .values({
            fromUserId: userId,
            writingId,
            content,
          })
          .returning();
        await storage.createNotification(writing.authorId, {
          type: "whisper",
          actorId: userId,
          writingId,
          message: `whispered about "${writing.title || "Untitled"}"`,
        });
        res.status(201).json(whisper);
      } catch (err) {
        res.status(500).json({ message: "Failed to send whisper" });
      }
    },
  );

  app.get(
    "/api/writings/:id/whisper-messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT w.content, w.created_at as "createdAt", u.first_name as "fromName"
        FROM whispers w
        JOIN users u ON w.from_user_id = u.id
        WHERE w.writing_id = ${req.params.id}
        ORDER BY w.created_at DESC
      `);
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch whispers" });
      }
    },
  );

  app.get(
    "/api/writings/:id/save-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.id);
        if (!writing)
          return res.status(404).json({ message: "Writing not found" });
        if (writing.authorId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        const result = await db.execute(sql`
        SELECT COUNT(*) as total FROM saved_pieces WHERE writing_id = ${req.params.id}
      `);
        res.json({ count: Number(result.rows[0]?.total || 0) });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch save count" });
      }
    },
  );

}
