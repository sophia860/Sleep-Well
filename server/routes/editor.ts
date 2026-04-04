import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { isEditor, isEditorInChief } from "./middleware";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { insertSiteContentSchema, users, prompts as promptsTable } from "@shared/schema";

export function registerEditorRoutes(app: Express) {
  app.get("/api/editor/check", isAuthenticated, async (req: any, res) => {
    try {
      const editorStatus = await storage.isEditor(req.user.id);
      res.json({ isEditor: editorStatus });
    } catch (error) {
      res.status(500).json({ message: "Failed to check editor status" });
    }
  });

  app.post("/api/editor/prompts", isEditor, async (req, res) => {
    try {
      const { text, category } = req.body;
      if (!text || typeof text !== "string")
        return res.status(400).json({ message: "Prompt text is required" });
      const [created] = await db
        .insert(promptsTable)
        .values({ text: text.trim(), category: category || "freewrite" })
        .returning();
      res.json(created);
    } catch (err) {
      res.status(500).json({ message: "Failed to create prompt" });
    }
  });

  app.put("/api/editor/prompts/:id", isEditor, async (req, res) => {
    try {
      const { text, category } = req.body;
      if (!text || typeof text !== "string")
        return res.status(400).json({ message: "Prompt text is required" });
      const [updated] = await db
        .update(promptsTable)
        .set({ text: text.trim(), category: category || "freewrite" })
        .where(eq(promptsTable.id, req.params.id))
        .returning();
      if (!updated)
        return res.status(404).json({ message: "Prompt not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  app.delete("/api/editor/prompts/:id", isEditor, async (req, res) => {
    try {
      const [deleted] = await db
        .delete(promptsTable)
        .where(eq(promptsTable.id, req.params.id))
        .returning();
      if (!deleted)
        return res.status(404).json({ message: "Prompt not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete prompt" });
    }
  });

  app.get("/api/site-content", isEditor, async (_req, res) => {
    try {
      const all = await storage.getAllSiteContent();
      res.json(all);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch site content" });
    }
  });

  app.get("/api/site-content/:pageKey", async (req, res) => {
    try {
      const rows = await storage.getSiteContentByPage(req.params.pageKey);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch site content" });
    }
  });

  app.put("/api/site-content/:id", isEditor, async (req, res) => {
    try {
      const { content } = req.body;
      if (typeof content !== "string")
        return res.status(400).json({ message: "Content is required" });
      const userId =
        req.user?.claims?.sub || (req.session as any)?.user?.claims?.sub;
      const updated = await storage.updateSiteContent(
        req.params.id,
        content,
        userId,
      );
      if (!updated)
        return res.status(404).json({ message: "Content not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update site content" });
    }
  });

  app.post("/api/site-content", isEditor, async (req, res) => {
    try {
      const parsed = insertSiteContentSchema.parse(req.body);
      const created = await storage.createSiteContent(parsed);
      res.json(created);
    } catch (err: any) {
      if (err?.code === "23505")
        return res
          .status(409)
          .json({ message: "Content for this page/section already exists" });
      res.status(400).json({ message: err?.message || "Invalid data" });
    }
  });

  app.delete("/api/site-content/:id", isEditorInChief, async (req, res) => {
    try {
      const deleted = await storage.deleteSiteContent(req.params.id);
      if (!deleted)
        return res.status(404).json({ message: "Content not found" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete site content" });
    }
  });

  app.get("/api/editor/direct-messages/conversations", isAuthenticated, isEditor, async (req: any, res) => {
    try {
      const myId = req.user.id;
      const { pool } = await import("../db");
      const { rows } = await pool.query(`
        SELECT DISTINCT ON (other_id)
          other_id,
          other_name,
          other_email,
          last_message,
          last_at,
          unread_count
        FROM (
          SELECT
            CASE WHEN from_editor_id = $1 THEN to_editor_id ELSE from_editor_id END AS other_id,
            CASE WHEN from_editor_id = $1 THEN u2.first_name ELSE u1.first_name END AS other_name,
            CASE WHEN from_editor_id = $1 THEN u2.email ELSE u1.email END AS other_email,
            edm.content AS last_message,
            edm.created_at AS last_at,
            SUM(CASE WHEN edm.to_editor_id = $1 AND edm.is_read = false THEN 1 ELSE 0 END)
              OVER (PARTITION BY CASE WHEN from_editor_id = $1 THEN to_editor_id ELSE from_editor_id END) AS unread_count
          FROM editor_direct_messages edm
          JOIN users u1 ON u1.id = edm.from_editor_id
          JOIN users u2 ON u2.id = edm.to_editor_id
          WHERE edm.from_editor_id = $1 OR edm.to_editor_id = $1
        ) sub
        ORDER BY other_id, last_at DESC
      `, [myId]);
      res.json(rows);
    } catch (error) {
      console.error("DM conversations error:", error);
      res.status(500).json({ message: "Failed to load conversations" });
    }
  });

  app.get("/api/editor/direct-messages/:editorId", isAuthenticated, isEditor, async (req: any, res) => {
    try {
      const myId = req.user.id;
      const otherId = req.params.editorId;
      const { pool } = await import("../db");
      const { rows } = await pool.query(`
        SELECT edm.id, edm.from_editor_id, edm.to_editor_id, edm.content, edm.is_read, edm.created_at,
               u.first_name AS sender_name
        FROM editor_direct_messages edm
        JOIN users u ON u.id = edm.from_editor_id
        WHERE (edm.from_editor_id = $1 AND edm.to_editor_id = $2)
           OR (edm.from_editor_id = $2 AND edm.to_editor_id = $1)
        ORDER BY edm.created_at ASC
      `, [myId, otherId]);
      // Mark incoming messages as read
      await pool.query(`
        UPDATE editor_direct_messages
        SET is_read = true
        WHERE to_editor_id = $1 AND from_editor_id = $2 AND is_read = false
      `, [myId, otherId]);
      res.json(rows);
    } catch (error) {
      console.error("DM thread error:", error);
      res.status(500).json({ message: "Failed to load messages" });
    }
  });

  app.post("/api/editor/direct-messages/:editorId", isAuthenticated, isEditor, async (req: any, res) => {
    try {
      const myId = req.user.id;
      const toId = req.params.editorId;
      const { content } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const { pool } = await import("../db");
      const { rows } = await pool.query(`
        INSERT INTO editor_direct_messages (from_editor_id, to_editor_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [myId, toId, content.trim()]);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Send DM error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/editor/dm-unread", isAuthenticated, isEditor, async (req: any, res) => {
    try {
      const myId = req.user.id;
      const { pool } = await import("../db");
      const { rows } = await pool.query(`
        SELECT COUNT(*) as count
        FROM editor_direct_messages
        WHERE to_editor_id = $1 AND is_read = false
      `, [myId]);
      res.json({ count: Number(rows[0]?.count || 0) });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

}
