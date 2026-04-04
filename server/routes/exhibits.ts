import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { z } from "zod";
import { insertExhibitResponseSchema, insertExhibitReflectionSchema, reflections } from "@shared/schema";

export function registerExhibitsRoutes(app: Express) {
  app.get("/api/exhibits", async (req: any, res) => {
    try {
      const allExhibits = await storage.getExhibits();
      const userId = req.user?.claims?.sub;
      if (userId) {
        const withStatus = await Promise.all(
          allExhibits.map(async (exhibit) => {
            const purchased = await storage.hasExhibitPurchase(
              userId,
              exhibit.id,
            );
            const progress = await storage.getExhibitProgress(
              userId,
              exhibit.id,
            );
            let status: "locked" | "available" | "in_progress" | "completed" =
              exhibit.price > 0 && !purchased ? "locked" : "available";
            if (progress) {
              status = progress.completedAt ? "completed" : "in_progress";
            }
            return {
              ...exhibit,
              purchased,
              status,
              currentScreen: progress?.currentScreen || null,
            };
          }),
        );
        return res.json(withStatus);
      }
      res.json(
        allExhibits.map((e) => ({
          ...e,
          purchased: false,
          status: e.price > 0 ? "locked" : "available",
          currentScreen: null,
        })),
      );
    } catch (error) {
      console.error("Error fetching exhibits:", error);
      res.status(500).json({ message: "Failed to fetch exhibits" });
    }
  });

  app.get("/api/exhibits/:slug", async (req: any, res) => {
    try {
      const exhibit = await storage.getExhibitBySlug(req.params.slug);
      if (!exhibit || !exhibit.isPublished)
        return res.status(404).json({ message: "Exhibit not found" });
      const userId = req.user?.claims?.sub;
      const purchased = userId
        ? await storage.hasExhibitPurchase(userId, exhibit.id)
        : false;
      res.json({ ...exhibit, purchased });
    } catch (error) {
      console.error("Error fetching exhibit:", error);
      res.status(500).json({ message: "Failed to fetch exhibit" });
    }
  });

  app.post(
    "/api/exhibits/:slug/purchase",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit)
          return res.status(404).json({ message: "Exhibit not found" });
        const alreadyPurchased = await storage.hasExhibitPurchase(
          userId,
          exhibit.id,
        );
        if (alreadyPurchased)
          return res.json({ message: "Already purchased", purchased: true });
        const purchase = await storage.createExhibitPurchase(
          userId,
          exhibit.id,
        );
        res.status(201).json(purchase);
      } catch (error) {
        console.error("Error purchasing exhibit:", error);
        res.status(500).json({ message: "Failed to purchase exhibit" });
      }
    },
  );

  app.get(
    "/api/exhibits/:slug/progress",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        if (exhibit.price > 0) {
          const purchased = await storage.hasExhibitPurchase(
            userId,
            exhibit.id,
          );
          if (!purchased)
            return res.status(403).json({ message: "Purchase required" });
        }
        const progress = await storage.getExhibitProgress(userId, exhibit.id);
        res.json(
          progress || {
            currentScreen: 1,
            completedExercises: [],
            completedAt: null,
          },
        );
      } catch (error) {
        console.error("Error fetching exhibit progress:", error);
        res.status(500).json({ message: "Failed to fetch progress" });
      }
    },
  );

  app.post(
    "/api/exhibits/:slug/progress",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        if (exhibit.price > 0) {
          const purchased = await storage.hasExhibitPurchase(
            userId,
            exhibit.id,
          );
          if (!purchased)
            return res.status(403).json({ message: "Purchase required" });
        }
        const { currentScreen, completedExercises, completedAt } = req.body;
        const progressSchema = z.object({
          currentScreen: z.number().int().min(1).optional(),
          completedExercises: z.array(z.string()).optional(),
          completedAt: z.string().nullable().optional(),
        });
        const parsed = progressSchema.safeParse({
          currentScreen,
          completedExercises,
          completedAt,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const progress = await storage.upsertExhibitProgress(
          userId,
          exhibit.id,
          {
            currentScreen: parsed.data.currentScreen,
            completedExercises: parsed.data.completedExercises,
            completedAt: parsed.data.completedAt
              ? new Date(parsed.data.completedAt)
              : undefined,
          },
        );
        res.json(progress);
      } catch (error) {
        console.error("Error updating exhibit progress:", error);
        res.status(500).json({ message: "Failed to update progress" });
      }
    },
  );

  app.post(
    "/api/exhibits/:slug/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        if (exhibit.price > 0) {
          const purchased = await storage.hasExhibitPurchase(
            userId,
            exhibit.id,
          );
          if (!purchased)
            return res.status(403).json({ message: "Purchase required" });
        }
        const parsed = insertExhibitResponseSchema.safeParse({
          ...req.body,
          exhibitId: exhibit.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const response = await storage.saveExhibitResponse(userId, parsed.data);
        res.status(201).json(response);
      } catch (error) {
        console.error("Error saving exhibit response:", error);
        res.status(500).json({ message: "Failed to save response" });
      }
    },
  );

  app.get(
    "/api/exhibits/:slug/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        const responses = await storage.getExhibitResponses(userId, exhibit.id);
        res.json(responses);
      } catch (error) {
        console.error("Error fetching exhibit responses:", error);
        res.status(500).json({ message: "Failed to fetch responses" });
      }
    },
  );

  app.post(
    "/api/exhibits/:slug/reflections",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const exhibit = await storage.getExhibitBySlug(req.params.slug);
        if (!exhibit || !exhibit.isPublished)
          return res.status(404).json({ message: "Exhibit not found" });
        if (exhibit.price > 0) {
          const purchased = await storage.hasExhibitPurchase(
            userId,
            exhibit.id,
          );
          if (!purchased)
            return res.status(403).json({ message: "Purchase required" });
        }
        const parsed = insertExhibitReflectionSchema.safeParse({
          ...req.body,
          exhibitId: exhibit.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const reflection = await storage.saveExhibitReflection(
          userId,
          parsed.data,
        );
        res.status(201).json(reflection);
      } catch (error) {
        console.error("Error saving exhibit reflection:", error);
        res.status(500).json({ message: "Failed to save reflection" });
      }
    },
  );

}
