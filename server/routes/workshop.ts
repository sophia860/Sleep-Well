import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertWorkshopExerciseSchema, insertWorkshopResponseSchema, insertSwapRequestSchema, insertSwapFeedbackSchema, insertMicroSwapSchema } from "@shared/schema";

export function registerWorkshopRoutes(app: Express) {
  app.get("/api/cafe/today", async (req, res) => {
    try {
      const question = await storage.getTodayCafeQuestion();
      res.json(question);
    } catch (error) {
      console.error("Error fetching today's café question:", error);
      res.status(500).json({ message: "Failed to fetch today's question" });
    }
  });

  app.get("/api/cafe/questions/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getCafeResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching café responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  app.post(
    "/api/cafe/questions/:id/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const content = req.body.content?.trim();
        if (!content)
          return res.status(400).json({ message: "Content is required" });
        const response = await storage.createCafeResponse(userId, {
          questionId: req.params.id,
          content,
        });
        res.status(201).json(response);
      } catch (error) {
        console.error("Error creating café response:", error);
        res.status(500).json({ message: "Failed to create response" });
      }
    },
  );

  app.get("/api/cafe/past", async (req, res) => {
    try {
      const questions = await storage.getPastCafeQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching past café questions:", error);
      res.status(500).json({ message: "Failed to fetch past questions" });
    }
  });

  app.get("/api/workshop/prompt-of-day", async (req, res) => {
    try {
      const prompt = await storage.getPromptOfDay();
      if (!prompt)
        return res.status(404).json({ message: "No exercises available" });
      res.json(prompt);
    } catch (error) {
      console.error("Error fetching prompt of the day:", error);
      res.status(500).json({ message: "Failed to fetch prompt of the day" });
    }
  });

  app.get("/api/workshop/exercises/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getWorkshopResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching exercise responses:", error);
      res.status(500).json({ message: "Failed to fetch exercise responses" });
    }
  });

  app.get("/api/workshop", async (req, res) => {
    try {
      const { category } = req.query;
      const exercises = await storage.getWorkshopExercises(
        category as string | undefined,
      );
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching workshop exercises:", error);
      res.status(500).json({ message: "Failed to fetch workshop exercises" });
    }
  });

  app.post("/api/workshop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertWorkshopExerciseSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const exercise = await storage.createWorkshopExercise(userId, {
        title: parsed.data.title,
        prompt: parsed.data.prompt,
        category: parsed.data.category,
        durationMinutes: parsed.data.durationMinutes ?? undefined,
      });
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating workshop exercise:", error);
      res.status(500).json({ message: "Failed to create workshop exercise" });
    }
  });

  app.get("/api/workshop/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getWorkshopResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching workshop responses:", error);
      res.status(500).json({ message: "Failed to fetch workshop responses" });
    }
  });

  app.post(
    "/api/workshop/:id/responses",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const parsed = insertWorkshopResponseSchema.safeParse({
          ...req.body,
          exerciseId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const response = await storage.createWorkshopResponse(userId, {
          exerciseId: req.params.id,
          content: parsed.data.content,
        });
        res.status(201).json(response);
      } catch (error) {
        console.error("Error creating workshop response:", error);
        res.status(500).json({ message: "Failed to create workshop response" });
      }
    },
  );

  app.get("/api/swaps", async (req, res) => {
    try {
      const { status } = req.query;
      const swaps = await storage.getSwapRequests(status as string | undefined);
      res.json(swaps);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  app.post("/api/swaps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertSwapRequestSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const swap = await storage.createSwapRequest(userId, {
        writingId: parsed.data.writingId,
        genre: parsed.data.genre,
        note: parsed.data.note ?? undefined,
        preferredLength: parsed.data.preferredLength ?? undefined,
        feedbackStyle: parsed.data.feedbackStyle ?? undefined,
      });
      res.status(201).json(swap);
    } catch (error) {
      console.error("Error creating swap request:", error);
      res.status(500).json({ message: "Failed to create swap request" });
    }
  });

  app.post("/api/swaps/:id/match", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { writingId } = req.body;
      if (!writingId)
        return res.status(400).json({ message: "writingId is required" });
      const swap = await storage.matchSwap(req.params.id, userId, writingId);
      if (!swap)
        return res.status(404).json({ message: "Swap request not found" });
      res.json(swap);
    } catch (error) {
      console.error("Error matching swap:", error);
      res.status(500).json({ message: "Failed to match swap" });
    }
  });

  app.get("/api/swaps/:id/feedback", async (req, res) => {
    try {
      const feedback = await storage.getSwapFeedback(req.params.id);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching swap feedback:", error);
      res.status(500).json({ message: "Failed to fetch swap feedback" });
    }
  });

  app.post(
    "/api/swaps/:id/feedback",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const parsed = insertSwapFeedbackSchema.safeParse({
          ...req.body,
          swapId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const feedback = await storage.createSwapFeedback(userId, {
          swapId: parsed.data.swapId,
          toUserId: parsed.data.toUserId,
          strengths: parsed.data.strengths,
          suggestions: parsed.data.suggestions,
          favoriteLines: parsed.data.favoriteLines ?? undefined,
        });
        res.status(201).json(feedback);
      } catch (error) {
        console.error("Error creating swap feedback:", error);
        res.status(500).json({ message: "Failed to create swap feedback" });
      }
    },
  );

  app.post("/api/micro-swaps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertMicroSwapSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const swap = await storage.createMicroSwap(userId, {
        fragment: parsed.data.fragment,
        genre: parsed.data.genre ?? undefined,
      });
      res.status(201).json(swap);
    } catch (error) {
      console.error("Error creating micro-swap:", error);
      res.status(500).json({ message: "Failed to create micro-swap" });
    }
  });

  app.get("/api/micro-swaps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const swaps = await storage.getMyMicroSwaps(userId);
      res.json(swaps);
    } catch (error) {
      console.error("Error fetching micro-swaps:", error);
      res.status(500).json({ message: "Failed to fetch micro-swaps" });
    }
  });

  app.post(
    "/api/micro-swaps/:id/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { response } = req.body;
        if (!response || typeof response !== "string")
          return res.status(400).json({ message: "Response is required" });
        const swap = await storage.respondToMicroSwap(
          req.params.id,
          userId,
          response,
        );
        if (!swap)
          return res.status(404).json({ message: "Micro-swap not found" });
        res.json(swap);
      } catch (error) {
        console.error("Error responding to micro-swap:", error);
        res.status(500).json({ message: "Failed to respond to micro-swap" });
      }
    },
  );

  app.delete("/api/potluck/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deletePromptPotluckItem(
        req.user.id,
        req.params.id,
      );
      if (!deleted) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete potluck item" });
    }
  });

  app.post(
    "/api/swaps/:id/smart-match",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const tier = await storage.getUserTier(req.user.id);
        if (tier !== "paid")
          return res
            .status(403)
            .json({ message: "Smart matching is a Cultivator feature" });
        const match = await storage.findSmartSwapMatch(req.params.id);
        if (!match)
          return res.json({
            match: null,
            message: "No compatible matches found yet",
          });

        const writing = await storage.getWriting(match.writingId);
        res.json({ match, writingTitle: writing?.title });
      } catch (error) {
        console.error("Error finding smart match:", error);
        res.status(500).json({ message: "Failed to find match" });
      }
    },
  );

}
