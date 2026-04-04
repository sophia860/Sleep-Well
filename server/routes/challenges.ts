import type { Express } from "express";
import { storage } from "../storage";

export function registerChallengesRoutes(app: Express) {
  app.get("/api/challenges", async (_req, res) => {
    try {
      const allChallenges = await storage.getChallenges();
      const now = new Date();
      const withStatus = allChallenges.map((c) => {
        let computedStatus = c.status;
        if (now < c.startsAt) computedStatus = "upcoming";
        else if (now >= c.startsAt && now <= c.endsAt) computedStatus = "open";
        else if (c.votingEndsAt && now > c.endsAt && now <= c.votingEndsAt)
          computedStatus = "voting";
        else computedStatus = "closed";
        return { ...c, status: computedStatus };
      });
      res.json(withStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge)
        return res.status(404).json({ message: "Challenge not found" });
      const now = new Date();
      let computedStatus = challenge.status;
      if (now < challenge.startsAt) computedStatus = "upcoming";
      else if (now >= challenge.startsAt && now <= challenge.endsAt)
        computedStatus = "open";
      else if (
        challenge.votingEndsAt &&
        now > challenge.endsAt &&
        now <= challenge.votingEndsAt
      )
        computedStatus = "voting";
      else computedStatus = "closed";
      res.json({ ...challenge, status: computedStatus });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id/entries", async (req, res) => {
    try {
      const entries = await storage.getChallengeEntries(req.params.id);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/entries", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge)
        return res.status(404).json({ message: "Challenge not found" });
      const now = new Date();
      if (now < challenge.startsAt || now > challenge.endsAt) {
        return res
          .status(400)
          .json({
            message: "This challenge is not currently accepting entries",
          });
      }
      const { title, content, writingId } = req.body;
      if (!title || !content)
        return res
          .status(400)
          .json({ message: "Title and content are required" });
      if (challenge.wordLimit) {
        const wordCount = content.trim().split(/\s+/).length;
        if (wordCount > challenge.wordLimit) {
          return res
            .status(400)
            .json({
              message: `Entry exceeds word limit of ${challenge.wordLimit} words`,
            });
        }
      }
      const entry = await storage.submitChallengeEntry(
        (req.user as any).claims.sub,
        {
          challengeId: req.params.id,
          title,
          content,
          writingId,
        },
      );
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/challenges/:id/entries/:entryId", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      await storage.withdrawChallengeEntry(
        (req.user as any).claims.sub,
        req.params.entryId,
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id/my-entry", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      const entry = await storage.getUserChallengeEntry(
        (req.user as any).claims.sub,
        req.params.id,
      );
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/votes", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge)
        return res.status(404).json({ message: "Challenge not found" });
      const now = new Date();
      const isVotingOpen =
        (challenge.votingEndsAt &&
          now > challenge.endsAt &&
          now <= challenge.votingEndsAt) ||
        (now >= challenge.startsAt && now <= challenge.endsAt);
      if (!isVotingOpen)
        return res
          .status(400)
          .json({ message: "Voting is not open for this challenge" });
      const { entryId } = req.body;
      if (!entryId)
        return res.status(400).json({ message: "Entry ID is required" });
      const vote = await storage.voteChallengeEntry(
        (req.user as any).claims.sub,
        req.params.id,
        entryId,
      );
      res.json(vote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/challenges/:id/votes/:entryId", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      await storage.unvoteChallengeEntry(
        (req.user as any).claims.sub,
        req.params.id,
        req.params.entryId,
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id/my-votes", async (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    try {
      const votes = await storage.getUserChallengeVotes(
        (req.user as any).claims.sub,
        req.params.id,
      );
      res.json(votes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

}
