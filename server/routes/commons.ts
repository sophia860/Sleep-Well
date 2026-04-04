import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

export function registerCommonsRoutes(app: Express) {
  app.get("/api/commons", async (_req, res) => {
    try {
      const items = await storage.getCommonsWritings();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commons" });
    }
  });

  app.post("/api/commons", isAuthenticated, async (req: any, res) => {
    try {
      const { writingId } = req.body;
      if (!writingId)
        return res.status(400).json({ message: "Missing writingId" });
      const item = await storage.shareToCommons(req.user.id, writingId);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to share to commons" });
    }
  });

  app.delete(
    "/api/commons/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        await storage.removeFromCommons(
          req.user.id,
          req.params.writingId,
        );
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove from commons" });
      }
    },
  );

}
