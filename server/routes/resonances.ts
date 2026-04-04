import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { resonances } from "@shared/schema";

export function registerResonancesRoutes(app: Express) {
  app.post("/api/resonances", isAuthenticated, async (req: any, res) => {
    try {
      const { writingId, type } = req.body;
      if (!writingId || !type)
        return res
          .status(400)
          .json({ message: "writingId and type are required" });
      const validTypes = [
        "glow",
        "pressed_flower",
        "dewdrop",
        "firefly",
        "roots",
        "tended",
        "spark",
        "fog",
        "seedling",
      ];
      if (!validTypes.includes(type))
        return res.status(400).json({ message: "Invalid resonance type" });
      const writing = await storage.getWriting(writingId);
      if (!writing)
        return res.status(404).json({ message: "Writing not found" });
      if (writing.authorId === req.user.id)
        return res
          .status(400)
          .json({ message: "Cannot resonate with your own work" });
      const result = await storage.addResonance(
        req.user.id,
        writingId,
        type,
      );
      const authorId = writing.authorId;
      await storage.createNotification(authorId, {
        type: "resonance",
        actorId: req.user.id,
        writingId,
        message: `left a ${type.replace("_", " ")} on "${writing.title || "Untitled"}"`,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to add resonance" });
    }
  });

  app.delete("/api/resonances", isAuthenticated, async (req: any, res) => {
    try {
      const { writingId, type } = req.body;
      if (!writingId || !type)
        return res
          .status(400)
          .json({ message: "writingId and type are required" });
      const result = await storage.removeResonance(
        req.user.id,
        writingId,
        type,
      );
      res.json({ removed: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove resonance" });
    }
  });

  app.get(
    "/api/resonances/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const resonances = await storage.getResonancesForWriting(
          req.params.writingId,
        );
        const userResonances = await storage.getUserResonances(
          req.user.id,
          req.params.writingId,
        );
        res.json({ resonances, userResonances });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch resonances" });
      }
    },
  );

}
