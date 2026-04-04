import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertTableTopicSchema, insertTableReplySchema } from "@shared/schema";

export function registerTablesRoutes(app: Express) {
  app.get("/api/tables", async (req, res) => {
    try {
      const { category } = req.query;
      const topics = await storage.getTableTopics(
        category as string | undefined,
      );
      res.json(topics);
    } catch (error) {
      console.error("Error fetching table topics:", error);
      res.status(500).json({ message: "Failed to fetch table topics" });
    }
  });

  app.get("/api/tables/:id", async (req, res) => {
    try {
      const topic = await storage.getTableTopic(req.params.id);
      if (!topic) return res.status(404).json({ message: "Topic not found" });
      res.json(topic);
    } catch (error) {
      console.error("Error fetching table topic:", error);
      res.status(500).json({ message: "Failed to fetch table topic" });
    }
  });

  app.post("/api/tables", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertTableTopicSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.flatten() });
      const topic = await storage.createTableTopic(userId, parsed.data);
      res.status(201).json(topic);
    } catch (error) {
      console.error("Error creating table topic:", error);
      res.status(500).json({ message: "Failed to create table topic" });
    }
  });

  app.get("/api/tables/:id/replies", async (req, res) => {
    try {
      const replies = await storage.getTableReplies(req.params.id);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching table replies:", error);
      res.status(500).json({ message: "Failed to fetch table replies" });
    }
  });

  app.post(
    "/api/tables/:id/replies",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const parsed = insertTableReplySchema.safeParse({
          ...req.body,
          topicId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const reply = await storage.createTableReply(userId, {
          topicId: req.params.id,
          content: parsed.data.content,
          parentId: parsed.data.parentId ?? undefined,
        });
        res.status(201).json(reply);
      } catch (error) {
        console.error("Error creating table reply:", error);
        res.status(500).json({ message: "Failed to create table reply" });
      }
    },
  );

}
