import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { db } from "../db";
import { randomUUID } from "crypto";
import { users } from "@shared/schema";

export function registerGroveRoutes(app: Express) {
  app.get("/api/grove/my-plant", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { rows } = await (await import("../db")).pool.query(
        `SELECT * FROM grove_plants WHERE user_id = $1`,
        [userId]
      );
      if (rows.length === 0) {
        // Auto-create plant on first visit
        const { rows: newRows } = await (await import("../db")).pool.query(
          `INSERT INTO grove_plants (user_id) VALUES ($1) RETURNING *`,
          [userId]
        );
        return res.json(newRows[0]);
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Error fetching grove plant:", error);
      res.status(500).json({ message: "Failed to fetch grove plant" });
    }
  });

  app.post("/api/grove/water", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("../db");
      // Check if already watered today
      const today = new Date().toISOString().slice(0, 10);
      const { rows: existing } = await db.pool.query(
        `SELECT id FROM grove_watering_sessions WHERE user_id = $1 AND watered_on = $2`,
        [userId, today]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: "Already watered today" });
      }
      // Log watering session
      await db.pool.query(
        `INSERT INTO grove_watering_sessions (user_id, watered_on) VALUES ($1, $2)`,
        [userId, today]
      );
      // Update streak on plant
      const { rows: plant } = await db.pool.query(
        `SELECT * FROM grove_plants WHERE user_id = $1`,
        [userId]
      );
      let currentPlant = plant[0];
      if (!currentPlant) {
        const { rows: newPlant } = await db.pool.query(
          `INSERT INTO grove_plants (user_id) VALUES ($1) RETURNING *`,
          [userId]
        );
        currentPlant = newPlant[0];
      }
      const lastWatered = currentPlant.last_watered_at
        ? new Date(currentPlant.last_watered_at).toISOString().slice(0, 10)
        : null;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak =
        lastWatered === yesterday ? (currentPlant.streak_days || 0) + 1 : 1;
      const { rows: updated } = await db.pool.query(
        `UPDATE grove_plants SET streak_days = $1, last_watered_at = NOW(), updated_at = NOW() WHERE user_id = $2 RETURNING *`,
        [newStreak, userId]
      );
      res.json({ plant: updated[0], streakDays: newStreak });
    } catch (error) {
      console.error("Error watering plant:", error);
      res.status(500).json({ message: "Failed to water plant" });
    }
  });

  app.get("/api/grove/connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("../db");
      const { rows } = await db.pool.query(
        `SELECT gc.*, u.display_name, u.profile_image_url
         FROM grove_connections gc
         JOIN users u ON (
           CASE WHEN gc.requester_id = $1 THEN u.id = gc.addressee_id
                ELSE u.id = gc.requester_id END
         )
         WHERE (gc.requester_id = $1 OR gc.addressee_id = $1)
           AND gc.status = 'accepted'`,
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching grove connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post("/api/grove/connections/request", isAuthenticated, async (req, res) => {
    try {
      const requesterId = (req.user as any).claims.sub;
      const { addresseeId } = req.body;
      if (!addresseeId) return res.status(400).json({ message: "addresseeId required" });
      const db = await import("../db");
      const { rows } = await db.pool.query(
        `INSERT INTO grove_connections (requester_id, addressee_id)
         VALUES ($1, $2)
         ON CONFLICT (requester_id, addressee_id) DO NOTHING
         RETURNING *`,
        [requesterId, addresseeId]
      );
      res.json(rows[0] || { message: "Request already sent" });
    } catch (error) {
      console.error("Error sending grove connection request:", error);
      res.status(500).json({ message: "Failed to send request" });
    }
  });

  app.post("/api/grove/connections/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { id } = req.params;
      const db = await import("../db");
      const { rows } = await db.pool.query(
        `UPDATE grove_connections SET status = 'accepted', updated_at = NOW()
         WHERE id = $1 AND addressee_id = $2
         RETURNING *`,
        [id, userId]
      );
      if (!rows[0]) return res.status(404).json({ message: "Request not found" });
      res.json(rows[0]);
    } catch (error) {
      console.error("Error accepting grove connection:", error);
      res.status(500).json({ message: "Failed to accept request" });
    }
  });

  app.get("/api/grove/seed-packets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("../db");
      const { rows } = await db.pool.query(
        `SELECT * FROM grove_seed_packets WHERE sender_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching seed packets:", error);
      res.status(500).json({ message: "Failed to fetch seed packets" });
    }
  });

  app.post("/api/grove/seed-packets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("../db");
      // Limit: max 10 pending packets per user
      const { rows: existing } = await db.pool.query(
        `SELECT id FROM grove_seed_packets WHERE sender_id = $1 AND status = 'pending'`,
        [userId]
      );
      if (existing.length >= 10) {
        return res.status(429).json({ message: "Seed packet limit reached" });
      }
      const token = randomUUID();
      const { rows } = await db.pool.query(
        `INSERT INTO grove_seed_packets (sender_id, token) VALUES ($1, $2) RETURNING *`,
        [userId, token]
      );
      res.json({ ...rows[0], inviteUrl: `/grove/join?seed=${token}` });
    } catch (error) {
      console.error("Error creating seed packet:", error);
      res.status(500).json({ message: "Failed to create seed packet" });
    }
  });

  app.get("/api/grove/seed-packets/redeem/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const db = await import("../db");
      const { rows } = await db.pool.query(
        `SELECT gsp.*, u.display_name as sender_name
         FROM grove_seed_packets gsp
         JOIN users u ON u.id = gsp.sender_id
         WHERE gsp.token = $1 AND gsp.status = 'pending'`,
        [token]
      );
      if (!rows[0]) return res.status(404).json({ message: "Seed packet not found or already used" });
      res.json({
        token,
        senderName: rows[0].sender_name,
        rarePlantUnlock: rows[0].rare_plant_unlock,
        message: "Sign up to plant your rare seed and join the Grove!",
      });
    } catch (error) {
      console.error("Error redeeming seed packet:", error);
      res.status(500).json({ message: "Failed to redeem seed packet" });
    }
  });

  app.post("/api/grove/seed-packets/redeem", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "token required" });
      const db = await import("../db");
      const { rows } = await db.pool.query(
        `UPDATE grove_seed_packets
         SET status = 'redeemed', redeemed_by_id = $1, redeemed_at = NOW()
         WHERE token = $2 AND status = 'pending'
         RETURNING *`,
        [userId, token]
      );
      if (!rows[0]) return res.status(404).json({ message: "Token invalid or already redeemed" });
      // Unlock rare plant on the new user's plant
      await db.pool.query(
        `INSERT INTO grove_plants (user_id, rare_plant_unlocked)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET rare_plant_unlocked = $2`,
        [userId, rows[0].rare_plant_unlock]
      );
      res.json({ message: "Rare seed planted! Welcome to the Grove.", rarePlantUnlock: rows[0].rare_plant_unlock });
    } catch (error) {
      console.error("Error redeeming seed packet:", error);
      res.status(500).json({ message: "Failed to redeem seed packet" });
    }
  });

  app.get("/api/grove/plants", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const db = await import("../db");
      const { rows } = await db.pool.query(
        `SELECT * FROM grove_plants WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching grove plants:", error);
      res.status(500).json({ message: "Failed to fetch grove plants" });
    }
  });

  app.get("/api/grove/community", async (req, res) => {
    try {
      const db = await import("../db");
      const { rows } = await db.pool.query(
        `SELECT gp.*, u.display_name as author_name FROM grove_plants gp LEFT JOIN users u ON gp.user_id = u.id ORDER BY gp.created_at DESC LIMIT 50`
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching community plants:", error);
      res.status(500).json({ message: "Failed to fetch community plants" });
    }
  });

}
