import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertRootInfluenceSchema } from "@shared/schema";

export function registerRootInfluencesRoutes(app: Express) {
  app.get("/api/root-influences", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getRootInfluences(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch influences" });
    }
  });

  app.post("/api/root-influences", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertRootInfluenceSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const influence = await storage.createRootInfluence(req.user.id, {
        name: parsed.data.name,
        category: parsed.data.category ?? undefined,
        note: parsed.data.note ?? undefined,
      });
      res.status(201).json(influence);
    } catch (error) {
      res.status(500).json({ message: "Failed to create influence" });
    }
  });

  app.delete(
    "/api/root-influences/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteRootInfluence(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete" });
      }
    },
  );

}
