import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertMoonlitReadingSchema } from "@shared/schema";

export function registerMoonlitReadingsRoutes(app: Express) {
  const joinMoonlitReadingSchema = z.object({
    writingId: z.string().optional(),
  });

  app.get("/api/moonlit-readings", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getMoonlitReadings();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch readings" });
    }
  });

  app.post("/api/moonlit-readings", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertMoonlitReadingSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const reading = await storage.createMoonlitReading(req.user.id, {
        ...parsed.data,
        scheduledAt: parsed.data.scheduledAt
          ? new Date(parsed.data.scheduledAt)
          : undefined,
      });
      res.status(201).json(reading);
    } catch (error) {
      res.status(500).json({ message: "Failed to create reading" });
    }
  });

  app.post(
    "/api/moonlit-readings/:id/join",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = joinMoonlitReadingSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const participant = await storage.joinMoonlitReading(
          req.user.id,
          req.params.id,
          parsed.data.writingId,
        );
        res.status(201).json(participant);
      } catch (error) {
        res.status(500).json({ message: "Failed to join reading" });
      }
    },
  );

  app.delete(
    "/api/moonlit-readings/:id/leave",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const left = await storage.leaveMoonlitReading(
          req.user.id,
          req.params.id,
        );
        if (!left) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Left reading" });
      } catch (error) {
        res.status(500).json({ message: "Failed to leave reading" });
      }
    },
  );

}
