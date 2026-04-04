import type { Express } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { galleryComments, users } from "@shared/schema";

export function registerGalleryCommentsRoutes(app: Express) {
  app.get("/api/gallery-comments/:writingId", async (req, res) => {
    try {
      const { writingId } = req.params;
      const comments = await db
        .select({
          id: galleryComments.id,
          writingId: galleryComments.writingId,
          userId: galleryComments.userId,
          content: galleryComments.content,
          parentId: galleryComments.parentId,
          createdAt: galleryComments.createdAt,
          authorName: users.firstName,
        })
        .from(galleryComments)
        .leftJoin(users, eq(galleryComments.userId, users.id))
        .where(eq(galleryComments.writingId, writingId))
        .orderBy(galleryComments.createdAt);
      res.json(comments);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/gallery-comments", async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    try {
      const { writingId, content, parentId } = req.body;
      if (!writingId || !content?.trim())
        return res.status(400).json({ error: "Missing required fields" });
      const userId = req.user.claims?.sub || req.user.id;
      const [comment] = await db
        .insert(galleryComments)
        .values({
          writingId,
          userId,
          content: content.trim(),
          parentId: parentId || null,
        })
        .returning();
      res.json(comment);
    } catch (e) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/gallery-comments/:id", async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    try {
      const comment = await db
        .select()
        .from(galleryComments)
        .where(eq(galleryComments.id, req.params.id))
        .limit(1);
      if (!comment.length)
        return res.status(404).json({ error: "Comment not found" });
      const userId = req.user.claims?.sub || req.user.id;
      if (comment[0].userId !== userId)
        return res.status(403).json({ error: "Not authorized" });
      await db
        .delete(galleryComments)
        .where(eq(galleryComments.id, req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

}
