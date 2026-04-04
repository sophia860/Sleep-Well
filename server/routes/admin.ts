import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { sql, count } from "drizzle-orm";
import { users, writings } from "@shared/schema";

export function registerAdminRoutes(app: Express) {
  app.get("/api/admin/user-count", async (_req, res) => {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      res.json({ count: Number(result[0].count) });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user count" });
    }
  });

  app.get("/api/admin/user-list", async (_req, res) => {
    try {
      const result = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(sql`${users.createdAt} DESC`);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user list" });
    }
  });

  app.get("/api/admin/user-activity", async (_req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.tier,
          u.created_at,
          COALESCE(w.writing_count, 0) AS writing_count,
          COALESCE(w.published_count, 0) AS published_count,
          w.stages_used,
          w.genres_used,
          COALESCE(iw.inner_weather_count, 0) AS inner_weather_count,
          COALESCE(ce.compost_count, 0) AS compost_count,
          COALESCE(tt.topic_count, 0) AS topic_count,
          COALESCE(gh.greenhouse_count, 0) AS greenhouse_count,
          (
            COALESCE(w.writing_count, 0) +
            COALESCE(iw.inner_weather_count, 0) +
            COALESCE(ce.compost_count, 0) +
            COALESCE(tt.topic_count, 0) +
            COALESCE(gh.greenhouse_count, 0)
          ) AS total_actions
        FROM users u
        LEFT JOIN (
          SELECT author_id,
            COUNT(*) AS writing_count,
            COUNT(*) FILTER (WHERE is_published) AS published_count,
            array_agg(DISTINCT stage) FILTER (WHERE stage IS NOT NULL) AS stages_used,
            array_agg(DISTINCT genre) FILTER (WHERE genre IS NOT NULL) AS genres_used
          FROM writings GROUP BY author_id
        ) w ON w.author_id = u.id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS inner_weather_count
          FROM inner_weather GROUP BY user_id
        ) iw ON iw.user_id = u.id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS compost_count
          FROM compost_entries GROUP BY user_id
        ) ce ON ce.user_id = u.id
        LEFT JOIN (
          SELECT author_id, COUNT(*) AS topic_count
          FROM table_topics GROUP BY author_id
        ) tt ON tt.author_id = u.id
        LEFT JOIN (
          SELECT editor_id, COUNT(*) AS greenhouse_count
          FROM greenhouse_entries GROUP BY editor_id
        ) gh ON gh.editor_id = u.id
        ORDER BY total_actions DESC, u.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  app.get("/api/admin/users", async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:userId/bio", async (req: any, res) => {
    try {
      const { bio } = req.body;
      const user = await storage.updateUserBio(req.params.userId, bio);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bio" });
    }
  });

}
