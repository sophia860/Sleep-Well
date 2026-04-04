import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertPollinationSchema, pollinations } from "@shared/schema";

export function registerPollinationsRoutes(app: Express) {
  app.get(
    "/api/pollinations/received",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getPollinationsReceived(
          req.user.id,
        );
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch pollinations" });
      }
    },
  );

  app.get("/api/pollinations/:writingId", async (req, res) => {
    try {
      const items = await storage.getPollinationsForWriting(
        req.params.writingId,
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pollinations" });
    }
  });

  app.post("/api/pollinations", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertPollinationSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createPollination(req.user.id, {
        writingId: parsed.data.writingId,
        affirmation: parsed.data.affirmation,
        highlightText: parsed.data.highlightText ?? undefined,
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create pollination" });
    }
  });

}
