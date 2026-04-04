import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

export function registerBouquetsRoutes(app: Express) {
  app.get("/api/bouquets", async (_req, res) => {
    try {
      const items = await storage.getBouquets();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bouquets" });
    }
  });

  app.get("/api/bouquets/:id", async (req, res) => {
    try {
      const bouquet = await storage.getBouquet(req.params.id);
      if (!bouquet) return res.status(404).json({ message: "Not found" });
      res.json(bouquet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bouquet" });
    }
  });

  app.post("/api/bouquets", isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, theme } = req.body;
      if (!title) return res.status(400).json({ message: "Title required" });
      const bouquet = await storage.createBouquet(req.user.id, {
        title,
        description,
        theme,
      });
      res.json(bouquet);
    } catch (error) {
      res.status(500).json({ message: "Failed to create bouquet" });
    }
  });

  app.post(
    "/api/bouquets/:id/items",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { writingId, note } = req.body;
        if (!writingId)
          return res.status(400).json({ message: "WritingId required" });
        const item = await storage.addBouquetItem(
          req.params.id,
          writingId,
          note,
        );
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to add item" });
      }
    },
  );

  app.delete("/api/bouquets/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteBouquet(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bouquet" });
    }
  });

}
