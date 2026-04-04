import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

export function registerMoodboardsRoutes(app: Express) {
  app.get("/api/moodboards", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getMoodboards(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moodboards" });
    }
  });

  app.get("/api/moodboards/shared", async (_req, res) => {
    try {
      const items = await storage.getSharedMoodboards();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared moodboards" });
    }
  });

  app.get("/api/moodboards/:id", async (req, res) => {
    try {
      const board = await storage.getMoodboard(req.params.id);
      if (!board) return res.status(404).json({ message: "Not found" });
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moodboard" });
    }
  });

  app.post("/api/moodboards", isAuthenticated, async (req: any, res) => {
    try {
      const { title, description } = req.body;
      if (!title) return res.status(400).json({ message: "Title required" });
      const board = await storage.createMoodboard(req.user.id, {
        title,
        description,
      });
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to create moodboard" });
    }
  });

  app.patch("/api/moodboards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const board = await storage.updateMoodboard(
        req.user.id,
        req.params.id,
        req.body,
      );
      if (!board) return res.status(404).json({ message: "Not found" });
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to update moodboard" });
    }
  });

  app.post(
    "/api/moodboards/:id/items",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const item = await storage.addMoodboardItem(req.params.id, req.body);
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to add item" });
      }
    },
  );

  app.delete(
    "/api/moodboards/:id/items/:itemId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        await storage.deleteMoodboardItem(req.params.itemId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete item" });
      }
    },
  );

  app.delete("/api/moodboards/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMoodboard(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete moodboard" });
    }
  });

}
