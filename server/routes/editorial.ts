import type { Express } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { isEditor } from "./middleware";
import { storage } from "../storage";
import { insertGreenhouseEntrySchema, insertPublishRequestSchema, insertRequestMessageSchema, insertIssueSchema, insertIssuePieceSchema, insertEditorNoteSchema, writings } from "@shared/schema";

export function registerEditorialRoutes(app: Express) {
  const publishRequestResponseSchema = z.object({
    status: z.enum(["accepted", "declined"]),
  });

  app.get("/api/editorial/pieces", isAuthenticated, async (req: any, res) => {
    try {
      const pieces = await storage.getEditorialPieces();
      res.json(pieces);
    } catch (error) {
      console.error("Error fetching editorial pieces:", error);
      res.status(500).json({ message: "Failed to fetch editorial pieces" });
    }
  });

  app.post(
    "/api/editorial/publish/:writingId",
    isEditor,
    async (req: any, res) => {
      try {
        const result = await storage.publishWritingByEditor(
          req.params.writingId,
        );
        if (!result)
          return res.status(404).json({ message: "Writing not found" });
        res.json(result);
      } catch (error) {
        console.error("Error publishing writing:", error);
        res.status(500).json({ message: "Failed to publish writing" });
      }
    },
  );

  app.post(
    "/api/editor/publish-external",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { title, content, genre, authorName, authorId } = req.body;
        if (!title || !content || !genre || !authorName) {
          return res
            .status(400)
            .json({
              message: "Title, content, genre, and author name are required",
            });
        }
        const piece = await storage.publishExternalPiece({
          title,
          content,
          genre,
          authorName,
          authorId,
        });
        res.json(piece);
      } catch (error) {
        console.error("Error publishing external piece:", error);
        res.status(500).json({ message: "Failed to publish external piece" });
      }
    },
  );

  app.get(
    "/api/editor/submission-calls",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const calls = await storage.getSubmissionCalls();
        res.json(calls);
      } catch (error) {
        console.error("Failed to fetch submission calls:", error);
        res.status(500).json({ message: "Failed to fetch submission calls" });
      }
    },
  );

  app.post(
    "/api/editor/submission-calls",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const {
          title,
          description,
          theme,
          prompt,
          issueId,
          startsAt,
          endsAt,
          flagLimit,
          status,
        } = req.body;
        if (!title || !startsAt || !endsAt) {
          return res
            .status(400)
            .json({ message: "Title, startsAt, and endsAt are required" });
        }
        const call = await storage.createSubmissionCall(req.user.id, {
          title,
          description: description || null,
          theme: theme || null,
          prompt: prompt || null,
          issueId: issueId || null,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          flagLimit: flagLimit || 3,
          status: status || "open",
        });
        res.json(call);
      } catch (error) {
        console.error("Failed to create submission call:", error);
        res.status(500).json({ message: "Failed to create submission call" });
      }
    },
  );

  app.patch(
    "/api/editor/submission-calls/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const updated = await storage.updateSubmissionCall(
          req.params.id,
          req.body,
        );
        if (!updated)
          return res.status(404).json({ message: "Submission call not found" });
        res.json(updated);
      } catch (error) {
        console.error("Failed to update submission call:", error);
        res.status(500).json({ message: "Failed to update submission call" });
      }
    },
  );

  app.delete(
    "/api/editor/submission-calls/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteSubmissionCall(req.params.id);
        if (!deleted)
          return res.status(404).json({ message: "Submission call not found" });
        res.json({ success: true });
      } catch (error) {
        console.error("Failed to delete submission call:", error);
        res.status(500).json({ message: "Failed to delete submission call" });
      }
    },
  );

  app.get(
    "/api/editor/submission-calls/:id/responses",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const responses = await storage.getSubmissionCallResponses(
          req.params.id,
        );
        res.json(responses);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch responses" });
      }
    },
  );

  app.patch(
    "/api/editor/submission-call-responses/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { status } = req.body;
        if (!status)
          return res.status(400).json({ message: "Status is required" });
        const updated = await storage.updateSubmissionCallResponseStatus(
          req.params.id,
          status,
        );
        if (!updated)
          return res.status(404).json({ message: "Response not found" });
        res.json(updated);
      } catch (error) {
        res.status(500).json({ message: "Failed to update response status" });
      }
    },
  );

  app.get(
    "/api/editor/gallery-opt-ins",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const writings = await storage.getGalleryOptInWritings();
        res.json(writings);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch gallery opt-ins" });
      }
    },
  );

  app.get(
    "/api/editor/overview",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const overview = await storage.getEditorOverview(req.user.id);
        res.json(overview);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch editor overview" });
      }
    },
  );

  app.get(
    "/api/editor/garden-stream",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { genre, readiness, search, quiet } = req.query;
        const filters: any = {};
        if (genre && genre !== "all") filters.genre = genre;
        if (readiness && readiness !== "all") filters.readiness = readiness;
        if (search) filters.search = search;
        if (quiet === "true") filters.quiet = true;
        const stream = await storage.getEditorGardenStream(filters);
        res.json(stream);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch garden stream" });
      }
    },
  );

  app.get(
    "/api/editor/greenhouse",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const entries = await storage.getGreenhouseEntries(req.user.id);
        res.json(entries);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch greenhouse entries" });
      }
    },
  );

  app.post(
    "/api/editor/greenhouse",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertGreenhouseEntrySchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const entry = await storage.addToGreenhouse(req.user.id, {
          writingId: parsed.data.writingId,
          issueId: parsed.data.issueId ?? undefined,
          themeFolder: parsed.data.themeFolder ?? undefined,
          priority: parsed.data.priority ?? undefined,
          internalNote: parsed.data.internalNote ?? undefined,
        });
        res.status(201).json(entry);
      } catch (error) {
        console.error("Failed to add to greenhouse:", error);
        res.status(500).json({ message: "Failed to add to greenhouse" });
      }
    },
  );

  app.patch(
    "/api/editor/greenhouse/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const entry = await storage.updateGreenhouseEntry(
          req.user.id,
          req.params.id,
          req.body,
        );
        if (!entry) return res.status(404).json({ message: "Not found" });
        res.json(entry);
      } catch (error) {
        res.status(500).json({ message: "Failed to update greenhouse entry" });
      }
    },
  );

  app.delete(
    "/api/editor/greenhouse/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const removed = await storage.removeFromGreenhouse(
          req.user.id,
          req.params.id,
        );
        if (!removed) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Removed from greenhouse" });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove from greenhouse" });
      }
    },
  );

  app.get(
    "/api/editor/requests",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { status } = req.query;
        const filters: any = { editorId: req.user.id };
        if (status) filters.status = status;
        const requests = await storage.getPublishRequests(filters);
        res.json(requests);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch publish requests" });
      }
    },
  );

  app.get("/api/author/requests", isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getAuthorPublishRequests(
        req.user.id,
      );
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch author requests" });
    }
  });

  app.post(
    "/api/editor/requests",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertPublishRequestSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const request = await storage.createPublishRequest(
          req.user.id,
          {
            writingId: parsed.data.writingId,
            authorId: req.body.authorId,
            issueId: parsed.data.issueId ?? undefined,
            editorNote: parsed.data.editorNote ?? undefined,
            proposedDate: parsed.data.proposedDate ?? undefined,
            rightsDuration: parsed.data.rightsDuration ?? undefined,
            payment: parsed.data.payment ?? undefined,
          },
        );
        res.status(201).json(request);
      } catch (error) {
        res.status(500).json({ message: "Failed to create publish request" });
      }
    },
  );

  app.patch(
    "/api/author/requests/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = publishRequestResponseSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const request = await storage.respondToPublishRequest(
          req.user.id,
          req.params.id,
          parsed.data.status,
        );
        if (!request) return res.status(404).json({ message: "Not found" });
        res.json(request);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to respond to publish request" });
      }
    },
  );

  app.get(
    "/api/editor/requests/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const messages = await storage.getRequestMessages(req.params.id);
        res.json(messages);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    },
  );

  app.post(
    "/api/editor/requests/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const parsed = insertRequestMessageSchema.safeParse({
          ...req.body,
          requestId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const message = await storage.createRequestMessage(
          req.user.id,
          { requestId: req.params.id, content: parsed.data.content },
        );
        res.status(201).json(message);
      } catch (error) {
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  app.get(
    "/api/editor/issues",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const allIssues = await storage.getIssues();
        res.json(allIssues);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch issues" });
      }
    },
  );

  app.get(
    "/api/editor/issues/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const issue = await storage.getIssue(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        res.json(issue);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch issue" });
      }
    },
  );

  app.post(
    "/api/editor/issues",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertIssueSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const issue = await storage.createIssue(req.user.id, {
          title: parsed.data.title,
          subtitle: parsed.data.subtitle ?? undefined,
          themeNote: parsed.data.themeNote ?? undefined,
          publishDate: parsed.data.publishDate
            ? new Date(parsed.data.publishDate)
            : undefined,
        });
        res.status(201).json(issue);
      } catch (error) {
        console.error("Failed to create issue:", error);
        res.status(500).json({ message: "Failed to create issue" });
      }
    },
  );

  app.patch(
    "/api/editor/issues/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const data: any = { ...req.body };
        if (data.publishDate) data.publishDate = new Date(data.publishDate);
        const issue = await storage.updateIssue(req.params.id, data);
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        res.json(issue);
      } catch (error) {
        res.status(500).json({ message: "Failed to update issue" });
      }
    },
  );

  app.get(
    "/api/editor/issues/:id/pieces",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const pieces = await storage.getIssuePieces(req.params.id);
        res.json(pieces);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch issue pieces" });
      }
    },
  );

  app.post(
    "/api/editor/issues/:id/pieces",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertIssuePieceSchema.safeParse({
          ...req.body,
          issueId: req.params.id,
        });
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const piece = await storage.addPieceToIssue({
          issueId: req.params.id,
          writingId: parsed.data.writingId,
          sortOrder: parsed.data.sortOrder ?? undefined,
        });
        res.status(201).json(piece);
      } catch (error) {
        res.status(500).json({ message: "Failed to add piece to issue" });
      }
    },
  );

  app.patch(
    "/api/editor/issues/:id/pieces/:pieceId",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const piece = await storage.updateIssuePiece(
          req.params.pieceId,
          req.body,
        );
        if (!piece) return res.status(404).json({ message: "Piece not found" });
        res.json(piece);
      } catch (error) {
        res.status(500).json({ message: "Failed to update piece" });
      }
    },
  );

  app.delete(
    "/api/editor/issues/:id/pieces/:pieceId",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const removed = await storage.removePieceFromIssue(req.params.pieceId);
        if (!removed)
          return res.status(404).json({ message: "Piece not found" });
        res.json({ message: "Removed from issue" });
      } catch (error) {
        res.status(500).json({ message: "Failed to remove piece" });
      }
    },
  );

  app.post(
    "/api/editor/issues/:id/publish",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const issue = await storage.publishIssue(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        res.json(issue);
      } catch (error) {
        res.status(500).json({ message: "Failed to publish issue" });
      }
    },
  );

  app.get(
    "/api/editor/notes/:writingId",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const notes = await storage.getEditorNotes(req.params.writingId);
        res.json(notes);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch editor notes" });
      }
    },
  );

  app.post(
    "/api/editor/notes",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const parsed = insertEditorNoteSchema.safeParse(req.body);
        if (!parsed.success)
          return res
            .status(400)
            .json({ message: "Invalid data", errors: parsed.error.flatten() });
        const note = await storage.createEditorNote(
          req.user.id,
          parsed.data,
        );
        res.status(201).json(note);
      } catch (error) {
        res.status(500).json({ message: "Failed to create editor note" });
      }
    },
  );

  app.delete(
    "/api/editor/notes/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteEditorNote(
          req.user.id,
          req.params.id,
        );
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete editor note" });
      }
    },
  );

  app.post(
    "/api/editor/promote",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { userId } = req.body;
        if (!userId)
          return res.status(400).json({ message: "userId is required" });
        await storage.setEditorRole(userId, "editor");
        res.json({ message: "User promoted to editor" });
      } catch (error) {
        res.status(500).json({ message: "Failed to promote user" });
      }
    },
  );

  app.post(
    "/api/editor/opportunities",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { title, link, outlet, deadline, payRate, genres, notes } =
          req.body;
        if (!title)
          return res.status(400).json({ message: "Title is required" });
        const item = await storage.createCuratedOpportunity(
          req.user.id,
          {
            title,
            link,
            outlet,
            deadline,
            payRate,
            genres,
            notes,
          },
        );
        res.status(201).json(item);
      } catch (error) {
        console.error("Failed to create curated opportunity:", error);
        res
          .status(500)
          .json({ message: "Failed to create curated opportunity" });
      }
    },
  );

  app.delete(
    "/api/editor/opportunities/:id",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const deleted = await storage.deleteCuratedOpportunity(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to delete curated opportunity" });
      }
    },
  );

  app.get(
    "/api/editor/flagged-queue",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const queue = await storage.getFlaggedQueue();
        res.json(queue);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch flagged queue" });
      }
    },
  );

  app.post(
    "/api/editor/flags/:id/seen",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const flag = await storage.markFlagSeen(
          req.params.id,
          req.user.id,
        );
        if (!flag) return res.status(404).json({ message: "Flag not found" });
        await storage.createNotification(flag.authorId, {
          type: "editor_paused",
          actorId: req.user.id,
          message: "An editor paused on your piece",
          writingId: flag.writingId,
        });
        res.json(flag);
      } catch (error) {
        res.status(500).json({ message: "Failed to mark flag as seen" });
      }
    },
  );

  app.post(
    "/api/editor/flags/:id/respond",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { response } = req.body;
        if (!response || typeof response !== "string")
          return res.status(400).json({ message: "response is required" });
        const flag = await storage.respondToFlag(
          req.params.id,
          req.user.id,
          response,
        );
        if (!flag) return res.status(404).json({ message: "Flag not found" });
        const noteType = response.startsWith("[Closed]")
          ? "decision"
          : "general_feedback";
        await storage.createEditorNote(req.user.id, {
          writingId: flag.writingId,
          content: response,
          noteType,
        });
        await storage.createNotification(flag.authorId, {
          type: "flag_response",
          actorId: req.user.id,
          message: response,
          writingId: flag.writingId,
        });
        res.json(flag);
      } catch (error) {
        res.status(500).json({ message: "Failed to respond to flag" });
      }
    },
  );

  app.get(
    "/api/editor/writer-profile/:authorId",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const writings = await storage.getWriterProfileForEditor(
          req.params.authorId,
        );
        const user = await storage.getUser(req.params.authorId);
        res.json({
          writer: user
            ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                profileImageUrl: user.profileImageUrl,
              }
            : null,
          writings,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch writer profile" });
      }
    },
  );

  app.post(
    "/api/editor/handoff",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const { writingId, targetEditorId, note } = req.body;
        if (!writingId || !targetEditorId)
          return res
            .status(400)
            .json({ message: "writingId and targetEditorId required" });
        await storage.createNotification(targetEditorId, {
          type: "editor_handoff",
          actorId: req.user.id,
          message: note || "An editor wants you to look at this piece",
          writingId,
        });
        res.json({ ok: true });
      } catch (error) {
        res.status(500).json({ message: "Failed to create handoff" });
      }
    },
  );

  app.get(
    "/api/editor/editors-list",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const editors = await storage.getEditors();
        res.json(editors.filter((e: any) => e.id !== req.user.id));
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch editors" });
      }
    },
  );

  app.get(
    "/api/editor/greenhouse/all",
    isAuthenticated,
    isEditor,
    async (req: any, res) => {
      try {
        const entries = await storage.getAllGreenhouseEntries();
        res.json(entries);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch all greenhouse entries" });
      }
    },
  );

}
