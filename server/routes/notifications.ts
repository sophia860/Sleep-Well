import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

export function registerNotificationsRoutes(app: Express) {
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const unreadOnly = req.query.unread === "true";
      const items = await storage.getNotifications(
        req.user.id,
        unreadOnly,
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get(
    "/api/notifications/unread-count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const count = await storage.getUnreadNotificationCount(
          req.user.id,
        );
        res.json({ count });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch count" });
      }
    },
  );

  app.patch(
    "/api/notifications/:id/read",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const result = await storage.markNotificationRead(
          req.user.id,
          req.params.id,
        );
        res.json({ success: result });
      } catch (error) {
        res.status(500).json({ message: "Failed to mark read" });
      }
    },
  );

  app.patch(
    "/api/notifications/read-all",
    isAuthenticated,
    async (req: any, res) => {
      try {
        await storage.markAllNotificationsRead(req.user.id);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to mark all read" });
      }
    },
  );

}
