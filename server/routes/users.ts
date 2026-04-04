import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

export function registerUsersRoutes(app: Express) {
  app.get("/api/writer/:id", async (req, res) => {
    try {
      const profile = await storage.getWriterProfile(req.params.id);
      if (!profile)
        return res.status(404).json({ message: "Writer not found" });
      res.json(profile);
    } catch (error) {
      console.error("Error fetching writer profile:", error);
      res.status(500).json({ message: "Failed to fetch writer profile" });
    }
  });

  app.patch("/api/profile/bio", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bio } = req.body;
      if (typeof bio !== "string")
        return res.status(400).json({ message: "bio must be a string" });
      const result = await storage.updateBio(userId, bio);
      res.json(result);
    } catch (error) {
      console.error("Error updating bio:", error);
      res.status(500).json({ message: "Failed to update bio" });
    }
  });

  app.patch("/api/user/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { displayName, bio } = req.body;
      if (
        !displayName ||
        typeof displayName !== "string" ||
        displayName.trim().length === 0
      ) {
        return res.status(400).json({ message: "Username is required" });
      }
      if (displayName.trim().length > 100) {
        return res
          .status(400)
          .json({ message: "Username must be 100 characters or fewer" });
      }
      if (
        bio !== undefined &&
        typeof bio === "string" &&
        bio.trim().length > 500
      ) {
        return res
          .status(400)
          .json({ message: "Bio must be 500 characters or fewer" });
      }
      const updated = await storage.completeOnboarding(userId, {
        displayName: displayName.trim(),
        bio: typeof bio === "string" ? bio.trim() : undefined,
      });
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { displayName, bio, isAnonymous } = req.body;
      if (
        displayName !== undefined &&
        (typeof displayName !== "string" || displayName.trim().length > 100)
      ) {
        return res
          .status(400)
          .json({
            message: "Display name must be a string of 100 characters or fewer",
          });
      }
      if (
        bio !== undefined &&
        (typeof bio !== "string" || bio.trim().length > 500)
      ) {
        return res
          .status(400)
          .json({ message: "Bio must be a string of 500 characters or fewer" });
      }
      if (isAnonymous === false) {
        const existingUser = await storage.getUser(userId);
        if (existingUser && existingUser.isAnonymous) {
          return res
            .status(400)
            .json({
              message: "Anonymous mode cannot be turned off once enabled",
            });
        }
      }
      const updated = await storage.updateProfile(userId, {
        displayName:
          typeof displayName === "string" ? displayName.trim() : undefined,
        bio: typeof bio === "string" ? bio.trim() : undefined,
        isAnonymous: isAnonymous === true ? true : undefined,
      });
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/user/tier", isAuthenticated, async (req: any, res) => {
    try {
      const tier = await storage.getUserTier(req.user.id);
      res.json({ tier });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tier" });
    }
  });

  app.get("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ role: user.role, tier: user.tier });
    } catch (error) {
      console.error("Error fetching user role:", error);
      res.status(500).json({ message: "Failed to fetch user role" });
    }
  });

}
