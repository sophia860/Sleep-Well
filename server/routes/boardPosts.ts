import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { insertBoardPostSchema, boardPosts, circles } from "@shared/schema";

export function registerBoardPostsRoutes(app: Express) {
  app.get("/api/circles/:circleId/board-posts", isAuthenticated, async (req, res) => {
    try {
      const { circleId } = req.params;
      const posts = await db
        .select()
        .from(boardPosts)
        .where(eq(boardPosts.circleId, String(circleId)))
        .orderBy(desc(boardPosts.createdAt));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching board posts:", error);
      res.status(500).json({ message: "Failed to fetch board posts" });
    }
  });

  app.post("/api/circles/:circleId/board-posts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const { circleId } = req.params;
      const validated = insertBoardPostSchema.parse({ ...req.body, circleId });
      const [post] = await db.insert(boardPosts).values({ ...validated, userId }).returning();
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating board post:", error);
      res.status(500).json({ message: "Failed to create board post" });
    }
  });

}
