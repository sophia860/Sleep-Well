import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import { insertContactMessageSchema } from "@shared/schema";

export function registerMessagingRoutes(app: Express) {
  app.post("/api/contact-messages", async (req: any, res) => {
    try {
      const parsed = insertContactMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: "Please fill in all fields correctly" });
      }
      const msg = await storage.createContactMessage(parsed.data);
      res.json({ id: msg.id });
    } catch (err) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/conversations", async (req: any, res) => {
    try {
      const { userName, userEmail, subject, message } = req.body;
      if (
        !userName?.trim() ||
        !userEmail?.trim() ||
        !subject?.trim() ||
        !message?.trim()
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const conv = await storage.createConversation({
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        subject: subject.trim(),
        status: "open",
      });
      await storage.addChatMessage({
        conversationId: conv.id,
        senderName: userName.trim(),
        senderEmail: userEmail.trim(),
        senderRole: "user",
        message: message.trim(),
      });
      res.json(conv);
    } catch (err) {
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const convs = await storage.getConversations();
      res.json(convs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: any, res) => {
    try {
      const conv = await storage.getConversation(req.params.id);
      if (!conv)
        return res.status(404).json({ message: "Conversation not found" });
      res.json(conv);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.patch(
    "/api/conversations/:id/status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { status } = req.body;
        if (!["open", "closed"].includes(status))
          return res.status(400).json({ message: "Invalid status" });
        const conv = await storage.updateConversationStatus(
          req.params.id,
          status,
        );
        if (!conv)
          return res.status(404).json({ message: "Conversation not found" });
        res.json(conv);
      } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
      }
    },
  );

  app.get("/api/conversations/:id/messages", async (req: any, res) => {
    try {
      const msgs = await storage.getChatMessages(req.params.id);
      res.json(msgs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: any, res) => {
    try {
      const conv = await storage.getConversation(req.params.id);
      if (!conv)
        return res.status(404).json({ message: "Conversation not found" });
      if (conv.status === "closed")
        return res.status(400).json({ message: "This conversation is closed" });
      const { senderName, senderEmail, senderRole, message } = req.body;
      if (!senderName?.trim() || !message?.trim())
        return res
          .status(400)
          .json({ message: "Name and message are required" });

      let resolvedRole = "user";
      if (senderRole === "editor") {
        if (!req.user?.claims?.sub)
          return res
            .status(401)
            .json({ message: "Authentication required to send as editor" });
        const editorUser = await storage.getUser(req.user.id);
        if (
          !editorUser ||
          !["editor", "editor_in_chief"].includes(editorUser.role || "")
        ) {
          return res.status(403).json({ message: "Editor role required" });
        }
        resolvedRole = "editor";
      }

      const msg = await storage.addChatMessage({
        conversationId: req.params.id,
        senderName: senderName.trim(),
        senderEmail: (senderEmail || "").trim(),
        senderRole: resolvedRole,
        message: message.trim(),
      });
      res.json(msg);
    } catch (err) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

}
