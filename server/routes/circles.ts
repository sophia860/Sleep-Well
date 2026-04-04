import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertCircleSchema, insertCircleMessageSchema, insertCircleIntentionSchema, insertCircleCelebrationSchema, insertPromptPotluckSchema, insertCircleShareSchema, insertCircleMicroResponseSchema, circles } from "@shared/schema";

export function registerCirclesRoutes(app: Express) {
  app.get("/api/circle-feed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const feed = await storage.getCircleFeed(userId);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching circle feed:", error);
      res.status(500).json({ message: "Failed to fetch circle feed" });
    }
  });

  app.get("/api/circles", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getCircles(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch circles" });
    }
  });

  app.post("/api/circles", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertCircleSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const circle = await storage.createCircle(
        req.user.id,
        parsed.data,
      );
      res.status(201).json(circle);
    } catch (error) {
      res.status(500).json({ message: "Failed to create circle" });
    }
  });

  app.post("/api/circles/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const circle = await storage.getCircle(req.params.id);
      if (!circle) return res.status(404).json({ message: "Circle not found" });
      const memberCount = await storage.getCircleMemberCount(req.params.id);
      if (memberCount >= circle.maxMembers) {
        return res.status(400).json({ message: "This circle is full" });
      }
      const member = await storage.joinCircle(
        req.user.id,
        req.params.id,
      );
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to join circle" });
    }
  });

  app.delete(
    "/api/circles/:id/leave",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const left = await storage.leaveCircle(
          req.user.id,
          req.params.id,
        );
        if (!left) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Left circle" });
      } catch (error) {
        res.status(500).json({ message: "Failed to leave circle" });
      }
    },
  );

  app.get(
    "/api/circles/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const messages = await storage.getCircleMessages(req.params.id);
        res.json(messages);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    },
  );

  app.post(
    "/api/circles/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertCircleMessageSchema.safeParse({
          ...req.body,
          circleId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const msg = await storage.createCircleMessage(req.user.id, {
          circleId: parsed.data.circleId,
          content: parsed.data.content,
          writingId: parsed.data.writingId ?? undefined,
        });
        res.status(201).json(msg);
      } catch (error) {
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  app.get("/api/circles/:id/shares", isAuthenticated, async (req: any, res) => {
    try {
      const shares = await storage.getCircleShares(req.params.id);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shares" });
    }
  });

  app.post(
    "/api/circles/:id/shares",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertCircleShareSchema.safeParse({
          ...req.body,
          circleId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const share = await storage.createCircleShare(req.user.id, {
          circleId: parsed.data.circleId,
          writingId: parsed.data.writingId ?? undefined,
          weekOf: parsed.data.weekOf,
        });
        res.status(201).json(share);
      } catch (error) {
        res.status(500).json({ message: "Failed to create share" });
      }
    },
  );

  app.get(
    "/api/circles/:id/current-sharer",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const sharer = await storage.getCurrentSharer(req.params.id);
        res.json(sharer);
      } catch (error) {
        res.status(500).json({ message: "Failed to get current sharer" });
      }
    },
  );

  app.get(
    "/api/circles/:id/members",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const members = await storage.getCircleMembers(req.params.id);
        res.json(members);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch members" });
      }
    },
  );

  app.get(
    "/api/circles/:id/micro-prompt",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const members = await storage.getCircleMembers(req.params.id);
        const isMember = members.some(
          (m: any) => m.userId === req.user.id,
        );
        if (!isMember)
          return res
            .status(403)
            .json({ message: "Not a member of this circle" });
        const prompt = await storage.getCircleWeeklyPrompt(req.params.id);
        res.json(prompt);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch micro-prompt" });
      }
    },
  );

  app.post(
    "/api/circles/:id/micro-prompt/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const members = await storage.getCircleMembers(req.params.id);
        const isMember = members.some(
          (m: any) => m.userId === req.user.id,
        );
        if (!isMember)
          return res
            .status(403)
            .json({ message: "Not a member of this circle" });
        const parsed = insertCircleMicroResponseSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const response = await storage.respondToCircleMicroPrompt(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(response);
      } catch (error) {
        res.status(500).json({ message: "Failed to submit response" });
      }
    },
  );

  app.get(
    "/api/circles/:circleId/intentions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getCircleIntentions(req.params.circleId);
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to get intentions" });
      }
    },
  );

  app.post(
    "/api/circles/:circleId/intentions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertCircleIntentionSchema.safeParse({
          ...req.body,
          circleId: req.params.circleId,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const item = await storage.createCircleIntention(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to create intention" });
      }
    },
  );

  app.delete(
    "/api/circle-intentions/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteCircleIntention(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete intention" });
      }
    },
  );

  app.get(
    "/api/circles/:circleId/celebrations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getCircleCelebrations(req.params.circleId);
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to get celebrations" });
      }
    },
  );

  app.post(
    "/api/circles/:circleId/celebrations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertCircleCelebrationSchema.safeParse({
          ...req.body,
          circleId: req.params.circleId,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const item = await storage.createCircleCelebration(
          req.user.id,
          {
            circleId: parsed.data.circleId,
            type: parsed.data.type,
            message: parsed.data.message ?? undefined,
            value: parsed.data.value ?? undefined,
          },
        );
        res.status(201).json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to create celebration" });
      }
    },
  );

  app.get(
    "/api/circles/:circleId/potluck",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const items = await storage.getPromptPotluckItems(req.params.circleId);
        res.json(items);
      } catch (error) {
        res.status(500).json({ message: "Failed to get potluck items" });
      }
    },
  );

  app.post(
    "/api/circles/:circleId/potluck",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertPromptPotluckSchema.safeParse({
          ...req.body,
          circleId: req.params.circleId,
        });
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid data" });
        const item = await storage.createPromptPotluckItem(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to create potluck item" });
      }
    },
  );

  app.get(
    "/api/circles/:circleId/potluck/random",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const item = await storage.getRandomPotluckItem(req.params.circleId);
        if (!item)
          return res.status(404).json({ message: "No items in potluck" });
        res.json(item);
      } catch (error) {
        res.status(500).json({ message: "Failed to get random potluck item" });
      }
    },
  );

}
