import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

export function registerSoilRoutes(app: Express) {
  app.get("/api/soil", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getSoilEntries(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch soil entries" });
    }
  });

  app.post("/api/soil", isAuthenticated, async (req: any, res) => {
    try {
      const { content, entryType, tags } = req.body;
      if (!content)
        return res.status(400).json({ message: "Content required" });
      const entry = await storage.createSoilEntry(req.user.id, {
        content,
        entryType,
        tags,
      });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create soil entry" });
    }
  });

  app.patch("/api/soil/:id", isAuthenticated, async (req: any, res) => {
    try {
      const entry = await storage.updateSoilEntry(
        req.user.id,
        req.params.id,
        req.body,
      );
      if (!entry) return res.status(404).json({ message: "Not found" });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update soil entry" });
    }
  });

  app.delete("/api/soil/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteSoilEntry(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete soil entry" });
    }
  });

}
