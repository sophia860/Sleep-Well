import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { isEditor } from "./middleware";
import { storage } from "../storage";
import { writings } from "@shared/schema";

export function registerSubmissionsRoutes(app: Express) {
  app.get("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const subs = await storage.getSubmissions(req.user.id);
      res.json(subs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions/stats", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getSubmissionStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submission stats" });
    }
  });

  app.get(
    "/api/submissions/by-writing/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const subs = await storage.getSubmissionsByWriting(
          req.user.id,
          req.params.writingId,
        );
        res.json(subs);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch submissions" });
      }
    },
  );

  app.post("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const sub = await storage.createSubmission(req.user.id, req.body);
      res.json(sub);
    } catch (error) {
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.patch("/api/submissions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const sub = await storage.updateSubmission(
        req.params.id,
        req.user.id,
        req.body,
      );
      if (!sub)
        return res.status(404).json({ message: "Submission not found" });
      res.json(sub);
    } catch (error) {
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  app.delete("/api/submissions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteSubmission(
        req.params.id,
        req.user.id,
      );
      if (!deleted)
        return res.status(404).json({ message: "Submission not found" });
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });

  app.post(
    "/api/submissions/:id/accept",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const sub = await storage.updateSubmission(
          req.params.id,
          req.user.id,
          {
            status: "accepted",
            respondedAt: new Date(),
          },
        );
        if (!sub)
          return res.status(404).json({ message: "Submission not found" });
        const otherSubs = sub.writingId
          ? await storage.getSubmissionsByWriting(
              req.user.id,
              sub.writingId,
            )
          : [];
        const pendingElsewhere = otherSubs.filter(
          (s) => s.id !== sub.id && s.status === "pending",
        );
        res.json({ submission: sub, pendingElsewhere });
      } catch (error) {
        res.status(500).json({ message: "Failed to accept submission" });
      }
    },
  );

  app.post(
    "/api/submissions/bulk-withdraw",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { submissionIds } = req.body;
        if (!Array.isArray(submissionIds))
          return res
            .status(400)
            .json({ message: "submissionIds array required" });
        const results = await Promise.all(
          submissionIds.map((id: string) =>
            storage.updateSubmission(id, req.user.id, {
              status: "withdrawn",
              respondedAt: new Date(),
            }),
          ),
        );
        res.json({ updated: results.filter(Boolean).length });
      } catch (error) {
        res.status(500).json({ message: "Failed to bulk withdraw" });
      }
    },
  );

  app.get(
    "/api/submission-calls/open",
    async (req: any, res) => {
      try {
        const calls = await storage.getOpenSubmissionCalls();
        res.json(calls);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch open submission calls" });
      }
    },
  );

  app.post(
    "/api/submission-calls/:id/respond",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { writingId, note } = req.body;
        const call = await storage.getSubmissionCall(req.params.id);
        if (!call || call.status !== "open") {
          return res
            .status(400)
            .json({ message: "This submission call is not open" });
        }
        if (writingId) {
          const writing = await storage.getWriting(writingId);
          if (!writing || writing.authorId !== req.user.id) {
            return res
              .status(403)
              .json({ message: "You can only submit your own writings" });
          }
        }
        const response = await storage.createSubmissionCallResponse(
          req.user.id,
          {
            callId: req.params.id,
            writingId: writingId || null,
            note: note || null,
          },
        );
        res.json(response);
      } catch (error) {
        res.status(500).json({ message: "Failed to submit response" });
      }
    },
  );

  app.post("/api/editorial-flags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { writingId } = req.body;
      if (!writingId)
        return res.status(400).json({ message: "writingId is required" });

      const call = await storage.getActiveSubmissionCall();
      const flagLimit = call ? call.flagLimit : 1;
      const activeCount = await storage.getActiveFlagCount(userId);
      if (activeCount >= flagLimit) {
        return res
          .status(400)
          .json({
            message: call
              ? `You can flag up to ${flagLimit} pieces during the Submission Call`
              : "You can only flag one piece at a time",
          });
      }

      const tier = await storage.getUserTier(userId);
      const isPaidFlag = tier === "paid";
      const flag = await storage.createEditorialFlag(
        userId,
        writingId,
        isPaidFlag,
      );
      res.status(201).json(flag);
    } catch (error) {
      console.error("Error creating editorial flag:", error);
      res.status(500).json({ message: "Failed to create flag" });
    }
  });

  app.get(
    "/api/editorial-flags/mine",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const flags = await storage.getMyFlags(req.user.id);
        res.json(flags);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch flags" });
      }
    },
  );

  app.get(
    "/api/editorial-feedback/:writingId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const writing = await storage.getWriting(req.params.writingId);
        if (!writing || writing.authorId !== userId)
          return res.status(404).json({ message: "Not found" });
        const notes = await storage.getEditorNotes(req.params.writingId);
        const flags = await storage.getMyFlags(userId);
        const flag = flags.find(
          (f: any) => f.writingId === req.params.writingId,
        );
        res.json({ notes, flag: flag || null });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch editorial feedback" });
      }
    },
  );

  app.get("/api/submission-calls/active", async (req, res) => {
    try {
      const call = await storage.getActiveSubmissionCall();
      res.json(call);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch active submission call" });
    }
  });

  app.get(
    "/api/submission-calls/:id/queue",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const call = await storage.getSubmissionCall(req.params.id);
        if (!call)
          return res.status(404).json({ message: "Submission call not found" });
        const stream = await storage.getEditorGardenStream({
          readiness: "ready_to_show",
        });
        const flags = await storage.getFlaggedQueue();
        res.json({ call, stream, flags });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch submission call queue" });
      }
    },
  );

}
