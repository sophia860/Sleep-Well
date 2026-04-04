import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertFirstReaderDropSchema, insertFirstReaderResponseSchema } from "@shared/schema";

export function registerFirstReaderRoutes(app: Express) {
  app.post("/api/first-reader", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertFirstReaderDropSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: "Invalid data" });
      const drop = await storage.createFirstReaderDrop(req.user.id, {
        content: parsed.data.content,
        genre: parsed.data.genre ?? undefined,
      });
      res.status(201).json(drop);
    } catch (error) {
      res.status(500).json({ message: "Failed to create drop" });
    }
  });

  app.get("/api/first-reader", isAuthenticated, async (req: any, res) => {
    try {
      const genre = req.query.genre as string | undefined;
      const drops = await storage.getFirstReaderDrops(genre);
      const userId = req.user.id;
      res.json(drops.filter((d: any) => d.authorId !== userId));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drops" });
    }
  });

  app.get("/api/first-reader/mine", isAuthenticated, async (req: any, res) => {
    try {
      const drops = await storage.getMyFirstReaderDrops(req.user.id);
      res.json(drops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch my drops" });
    }
  });

  app.post(
    "/api/first-reader/:id/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertFirstReaderResponseSchema.safeParse({
          ...req.body,
          dropId: req.params.id,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const response = await storage.createFirstReaderResponse(
          req.user.id,
          {
            dropId: parsed.data.dropId,
            aliveSignal: parsed.data.aliveSignal,
            strikingLine: parsed.data.strikingLine ?? undefined,
            oneSuggestion: parsed.data.oneSuggestion ?? undefined,
          },
        );
        res.status(201).json(response);
      } catch (error) {
        res.status(500).json({ message: "Failed to respond" });
      }
    },
  );

}
