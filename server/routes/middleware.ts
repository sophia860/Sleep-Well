import { storage } from "../storage";

export async function isEditor(req: any, res: any, next: any) {
  if (!req.user?.claims?.sub) {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      (req as any).user = sessionUser;
    }
  }
  const userId = req.user?.claims?.sub || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const editor = await storage.isEditor(userId);
  if (!editor) {
    return res.status(403).json({ message: "Editor access required" });
  }
  next();
}

export async function isEditorInChief(req: any, res: any, next: any) {
  if (!req.user?.claims?.sub) {
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      (req as any).user = sessionUser;
    }
  }
  const eicUserId = req.user?.claims?.sub || req.user?.id;
  if (!eicUserId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const eic = await storage.isEditorInChief(eicUserId);
  if (!eic) {
    return res.status(403).json({ message: "Editor-in-Chief access required" });
  }
  next();
}
