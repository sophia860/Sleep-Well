import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Check, Filter, Search, 
  Send, Plus, Inbox, Sprout, ClipboardCheck, 
  Clock, Briefcase, BookMarked, X, FileText,
  Trash2, MessageSquare, ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Writing, Issue, GreenhouseEntry, PublishRequest, EditorNote, IssuePiece } from "@shared/schema";
import { stripHtml, wordCountFromContent } from "@/components/garden/RichEditor";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

type StudioBucket = "all" | "triage" | "development" | "ready" | "published";

type WritingWithAuthor = Writing & {
  authorName: string | null;
  authorImage: string | null;
  resonanceCount: number;
};

type RequestWithTitle = PublishRequest & {
  writingTitle: string;
  authorName: string | null;
  editorName: string | null;
};

type GreenhouseEntryWithTitle = GreenhouseEntry & {
  writingTitle: string;
  authorName: string | null;
  authorId: string;
};

type EditorNoteWithEditor = EditorNote & { editorName: string | null };

type IssuePieceWithTitle = IssuePiece & { writingTitle?: string; authorName?: string | null };

const READINESS_LABELS: Record<string, string> = {
  raw_seed: "RAW SEED",
  growing: "GROWING",
  ready_to_show: "READY TO SHOW",
  dormant: "DORMANT",
};

const READINESS_COLORS: Record<string, string> = {
  raw_seed: "bg-amber-50 border-amber-200 text-amber-700",
  growing: "bg-green-50 border-green-200 text-green-700",
  ready_to_show: "bg-blue-50 border-blue-200 text-blue-700",
  dormant: "bg-gray-100 border-gray-200 text-gray-500",
};

export default function EditorStudio() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [bucket, setBucket] = useState<StudioBucket>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "greenhouse" | "requests" | "issues">("pipeline");
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueSubtitle, setNewIssueSubtitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [requestDate, setRequestDate] = useState("");

  // Core Data Queries
  const { data: writings = [], isFetching: isFetchingWritings } = useQuery<WritingWithAuthor[]>({
    queryKey: ["/api/editor/garden-stream"],
    enabled: !!user,
  });

  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: ["/api/editor/issues"],
    enabled: !!user,
  });

  const { data: greenhouse = [] } = useQuery<GreenhouseEntryWithTitle[]>({
    queryKey: ["/api/editor/greenhouse"],
    enabled: !!user,
  });

  const { data: requests = [] } = useQuery<RequestWithTitle[]>({
    queryKey: ["/api/editor/requests"],
    enabled: !!user,
  });

  // Selected writing notes (pipeline detail)
  const selectedWritingId = activeTab === "pipeline" ? selectedId : null;
  const { data: notes = [] } = useQuery<EditorNoteWithEditor[]>({
    queryKey: ["/api/editor/notes", selectedWritingId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/editor/notes/${selectedWritingId}`);
      return res.json();
    },
    enabled: !!selectedWritingId,
  });

  // Selected issue pieces
  const selectedIssueId = activeTab === "issues" ? selectedId : null;
  const { data: issuePieces = [] } = useQuery<IssuePieceWithTitle[]>({
    queryKey: ["/api/editor/issues", selectedIssueId, "pieces"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/editor/issues/${selectedIssueId}/pieces`);
      return res.json();
    },
    enabled: !!selectedIssueId,
  });

  // Derived: filtered writings for pipeline
  const filteredWritings = useMemo(() => {
    let list = writings;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w =>
        w.title.toLowerCase().includes(q) ||
        (w.authorName ?? "").toLowerCase().includes(q) ||
        w.genre.toLowerCase().includes(q),
      );
    }
    if (bucket === "triage") return list.filter(w => w.readiness === "raw_seed");
    if (bucket === "development") return list.filter(w => w.readiness === "growing");
    if (bucket === "ready") return list.filter(w => w.readiness === "ready_to_show" || w.editorialAvailable);
    if (bucket === "published") return list.filter(w => w.isPublished);
    return list;
  }, [writings, bucket, search]);

  const selectedWriting = useMemo(() =>
    activeTab === "pipeline" ? writings.find(w => w.id === selectedId) ?? null : null,
    [writings, selectedId, activeTab]);

  const selectedIssue = useMemo(() =>
    activeTab === "issues" ? issues.find(i => i.id === selectedId) ?? null : null,
    [issues, selectedId, activeTab]);

  // Mutations
  const publishIssueMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const res = await apiRequest("POST", `/api/editor/issues/${issueId}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      toast({ title: "Issue published", description: "All pieces are now live." });
    },
    onError: () => {
      toast({ title: "Failed to publish issue", variant: "destructive" });
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: { title: string; subtitle?: string }) => {
      const res = await apiRequest("POST", `/api/editor/issues`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      toast({ title: "Issue created" });
      setShowNewIssueForm(false);
      setNewIssueTitle("");
      setNewIssueSubtitle("");
      setActiveTab("issues");
    },
    onError: () => {
      toast({ title: "Failed to create issue", variant: "destructive" });
    },
  });

  const updateReadinessMutation = useMutation({
    mutationFn: async ({ id, readiness }: { id: string; readiness: string }) => {
      const res = await apiRequest("PATCH", `/api/editor/writings/${id}/readiness`, { readiness });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/garden-stream"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const addToGreenhouseMutation = useMutation({
    mutationFn: async (writingId: string) => {
      const res = await apiRequest("POST", `/api/editor/greenhouse`, { writingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/greenhouse"] });
      toast({ title: "Added to Greenhouse" });
    },
    onError: () => {
      toast({ title: "Already in Greenhouse or failed", variant: "destructive" });
    },
  });

  const removeFromGreenhouseMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await apiRequest("DELETE", `/api/editor/greenhouse/${entryId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/greenhouse"] });
      toast({ title: "Removed from Greenhouse" });
    },
    onError: () => {
      toast({ title: "Failed to remove", variant: "destructive" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async ({ writingId, content }: { writingId: string; content: string }) => {
      const res = await apiRequest("POST", `/api/editor/notes`, { writingId, content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/notes", selectedWritingId] });
      setNoteText("");
      toast({ title: "Note saved" });
    },
    onError: () => {
      toast({ title: "Failed to save note", variant: "destructive" });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { writingId: string; authorId: string; editorNote?: string; proposedDate?: string }) => {
      const res = await apiRequest("POST", `/api/editor/requests`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/requests"] });
      setShowRequestForm(false);
      setRequestNote("");
      setRequestDate("");
      toast({ title: "Publish request created", description: "The author will be notified." });
    },
    onError: () => {
      toast({ title: "Failed to create request", variant: "destructive" });
    },
  });

  const addToIssueMutation = useMutation({
    mutationFn: async ({ issueId, writingId }: { issueId: string; writingId: string }) => {
      const res = await apiRequest("POST", `/api/editor/issues/${issueId}/pieces`, { writingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues", selectedIssueId, "pieces"] });
      toast({ title: "Piece added to issue" });
    },
    onError: () => {
      toast({ title: "Failed to add piece to issue", variant: "destructive" });
    },
  });

  if (!isLoading && (!user || (user.role !== "editor" && user.role !== "editor_in_chief"))) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/50">Access Denied</p>
          <h1 className="text-3xl font-semibold">Editor Studio is restricted</h1>
          <button onClick={() => navigate("/garden")} className="rounded-lg border border-black/10 bg-white px-5 py-2.5 font-mono text-[10px] uppercase">Return to Garden</button>
        </div>
      </main>
    );
  }

  const inGreenhouse = (writingId: string) => greenhouse.some(e => e.writingId === writingId);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#1f1d18] flex flex-col">
      {/* Universal Header */}
      <header className="border-b border-black/5 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-2 rounded-lg"><Briefcase size={20} /></div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Editor Studio</h1>
              <p className="text-[10px] font-mono text-black/40 uppercase tracking-widest">Control Room / The Page Gallery</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 bg-black/[0.03] p-1 rounded-xl">
            {[
              { id: "pipeline", label: "Pipeline", icon: Inbox },
              { id: "greenhouse", label: "Greenhouse", icon: Sprout },
              { id: "requests", label: "Requests", icon: Send },
              { id: "issues", label: "Issues", icon: ClipboardCheck }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedId(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black/80"}`}
              >
                <tab.icon size={12} />
                {tab.label}
                {tab.id === "requests" && requests.length > 0 && (
                  <span className="ml-1 bg-black text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">{requests.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid lg:grid-cols-[1fr,400px] gap-6">
        <section className="space-y-6">
          {/* Search (pipeline + greenhouse) */}
          {(activeTab === "pipeline" || activeTab === "greenhouse") && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                <input 
                  type="text" 
                  placeholder="Search by title, author, or genre..."
                  className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="p-3 bg-white border border-black/5 rounded-2xl hover:bg-black/[0.02]">
                <Filter size={18} className="text-black/60" />
              </button>
            </div>
          )}

          {/* Dynamic Content Based on Tab */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden min-h-[600px]">
            {/* PIPELINE TAB */}
            {activeTab === "pipeline" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Garden Stream</h2>
                  <div className="flex gap-2">
                    {(["all", "triage", "development", "ready", "published"] as StudioBucket[]).map(f => (
                      <button key={f} onClick={() => setBucket(f)} className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest border transition-colors ${bucket === f ? "bg-black text-white border-black" : "border-black/10 text-black/40 hover:border-black/30"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {isFetchingWritings ? (
                    <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">Scanning Garden for seeds...</div>
                  ) : filteredWritings.length === 0 ? (
                    <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No pieces match this filter</div>
                  ) : (
                    filteredWritings.map(w => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedId(selectedId === w.id ? null : w.id)}
                        className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selectedId === w.id ? "bg-black text-white border-black" : "bg-[#f9f8f4] border-black/5 hover:border-black/20"}`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedId === w.id ? "text-white" : "text-black"}`}>{w.title}</p>
                          {w.authorName && (
                            <p className={`text-[10px] font-mono ${selectedId === w.id ? "text-white/60" : "text-black/40"}`}>{w.authorName}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest border ${selectedId === w.id ? "border-white/20 text-white/70" : "border-black/10 text-black/40"}`}>{w.genre}</span>
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest border ${selectedId === w.id ? "border-white/20 text-white/70" : "border-black/10 text-black/40"}`}>{(READINESS_LABELS[w.readiness] ?? w.readiness.replace(/_/g, " "))}</span>
                            {w.editorialAvailable && (
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest ${selectedId === w.id ? "bg-white/20 text-white" : "bg-green-50 border border-green-200 text-green-700"}`}>editorial open</span>
                            )}
                            {inGreenhouse(w.id) && (
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest ${selectedId === w.id ? "bg-white/10 text-white/60" : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}>🌱 greenhouse</span>
                            )}
                          </div>
                        </div>
                        <div className={`text-[10px] font-mono ml-4 shrink-0 ${selectedId === w.id ? "text-white/50" : "text-black/30"}`}>
                          {w.createdAt ? format(new Date(w.createdAt), "MMM d") : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* GREENHOUSE TAB */}
            {activeTab === "greenhouse" && (
              <div className="p-8">
                <h2 className="text-2xl font-semibold mb-2">The Greenhouse</h2>
                <p className="text-sm text-black/50 mb-8">Your private editorial shortlist. No authors are notified of activity here.</p>
                {greenhouse.length === 0 ? (
                  <div className="text-center py-20">
                    <Sprout size={32} className="mx-auto text-black/10 mb-4" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-black/30 mb-2">Your greenhouse is empty</p>
                    <p className="text-sm text-black/40">Select a piece in Pipeline and click "Add to Greenhouse" to shortlist it.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {['Unsorted', 'Winter 2026', 'Spring 2026'].map(group => {
                      const groupEntries = greenhouse.filter(e => 
                        group === 'Unsorted' 
                          ? !e.themeFolder || e.themeFolder === 'Unsorted' 
                          : e.themeFolder === group
                      );
                      return (
                        <div key={group} className="bg-[#f9f8f4] p-5 rounded-2xl border border-black/5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-mono text-[10px] uppercase tracking-widest text-black/40">{group}</h3>
                            <span className="font-mono text-[9px] text-black/30">{groupEntries.length}</span>
                          </div>
                          {groupEntries.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-black/10 rounded-xl">
                              <Sprout size={16} className="mx-auto text-black/10 mb-2" />
                              <p className="text-[9px] font-mono text-black/20 uppercase">No pieces</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {groupEntries.map(entry => (
                                <div key={entry.id} className="flex items-start justify-between p-3 bg-white rounded-xl border border-black/5 group">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{entry.writingTitle}</p>
                                    {entry.authorName && (
                                      <p className="text-[10px] font-mono text-black/40 mt-0.5">{entry.authorName}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeFromGreenhouseMutation.mutate(entry.id)}
                                    className="ml-2 shrink-0 p-1 text-black/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove from Greenhouse"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* REQUESTS TAB */}
            {activeTab === "requests" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Publish Requests</h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">{requests.length} total</span>
                </div>
                {requests.length === 0 ? (
                  <div className="text-center py-20">
                    <Send size={32} className="mx-auto text-black/10 mb-4" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-black/30 mb-2">No publish requests yet</p>
                    <p className="text-sm text-black/40">Select a piece in Pipeline that is "Ready to Show" and click "Request Publication" to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-start justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{req.writingTitle}</p>
                          {req.authorName && (
                            <p className="text-[10px] font-mono text-black/40">{req.authorName}</p>
                          )}
                          {req.proposedDate && (
                            <p className="text-[10px] font-mono text-black/40">Proposed: {req.proposedDate}</p>
                          )}
                          {req.editorNote && (
                            <p className="text-xs text-black/50 mt-1 italic">"{req.editorNote}"</p>
                          )}
                        </div>
                        <span className={`ml-4 shrink-0 px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest border ${req.status === "accepted" ? "bg-green-50 border-green-200 text-green-700" : req.status === "declined" ? "bg-red-50 border-red-200 text-red-700" : "border-black/10 text-black/50"}`}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ISSUES TAB */}
            {activeTab === "issues" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Issues</h2>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">{issues.length} total</span>
                    <button
                      onClick={() => setShowNewIssueForm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-black/80 transition-colors"
                    >
                      <Plus size={12} />
                      New Issue
                    </button>
                  </div>
                </div>
                {issues.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No issues created yet</div>
                ) : (
                  <div className="space-y-3">
                    {issues.map(issue => (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedId(selectedId === issue.id ? null : issue.id)}
                        className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selectedId === issue.id ? "bg-black text-white border-black" : "bg-[#f9f8f4] border-black/5 hover:border-black/20"}`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className={`text-sm font-medium ${selectedId === issue.id ? "text-white" : "text-black"}`}>{issue.title}</p>
                          {issue.subtitle && (
                            <p className={`text-xs ${selectedId === issue.id ? "text-white/60" : "text-black/50"}`}>{issue.subtitle}</p>
                          )}
                          {issue.publishDate && (
                            <p className={`text-[10px] font-mono ${selectedId === issue.id ? "text-white/50" : "text-black/40"}`}>{format(new Date(issue.publishDate), "MMM d, yyyy")}</p>
                          )}
                        </div>
                        <span className={`ml-4 shrink-0 px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest border ${issue.status === "published" ? "bg-green-50 border-green-200 text-green-700" : issue.status === "archived" ? "bg-black/5 border-black/10 text-black/40" : selectedId === issue.id ? "border-white/20 text-white/70" : "border-black/10 text-black/50"}`}>
                          {issue.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Action Sidebar */}
        <aside className="space-y-4">
          {/* New Issue inline form */}
          {showNewIssueForm && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">New Issue</h3>
                <button onClick={() => setShowNewIssueForm(false)} className="text-black/30 hover:text-black/70 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Issue title *"
                value={newIssueTitle}
                onChange={e => setNewIssueTitle(e.target.value)}
                className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <input
                type="text"
                placeholder="Subtitle (optional)"
                value={newIssueSubtitle}
                onChange={e => setNewIssueSubtitle(e.target.value)}
                className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <button
                onClick={() => {
                  const payload: { title: string; subtitle?: string } = { title: newIssueTitle.trim() };
                  if (newIssueSubtitle.trim()) payload.subtitle = newIssueSubtitle.trim();
                  createIssueMutation.mutate(payload);
                }}
                disabled={!newIssueTitle.trim() || createIssueMutation.isPending}
                className="w-full bg-black text-white rounded-xl py-2.5 font-mono text-[10px] uppercase tracking-widest disabled:opacity-40 hover:bg-black/80 transition-colors"
              >
                {createIssueMutation.isPending ? "Creating…" : "Create Issue"}
              </button>
            </div>
          )}

          {/* Writing Detail Panel */}
          {selectedWriting && activeTab === "pipeline" && !showRequestForm && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-black/30 mb-1">Selected Piece</p>
                  <h3 className="font-semibold text-sm leading-snug">{selectedWriting.title}</h3>
                  {selectedWriting.authorName && (
                    <p className="text-[10px] font-mono text-black/40 mt-0.5">{selectedWriting.authorName}</p>
                  )}
                </div>
                <button onClick={() => setSelectedId(null)} className="text-black/30 hover:text-black/70 transition-colors shrink-0">
                  <X size={14} />
                </button>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/50">
                <div><span className="text-black/30">Genre</span><br />{selectedWriting.genre}</div>
                <div><span className="text-black/30">Words</span><br />{wordCountFromContent(selectedWriting.content ?? "")}</div>
                <div><span className="text-black/30">Submitted</span><br />{selectedWriting.createdAt ? format(new Date(selectedWriting.createdAt), "MMM d, yyyy") : "—"}</div>
                <div><span className="text-black/30">Resonances</span><br />{selectedWriting.resonanceCount ?? 0}</div>
              </div>

              {/* Content preview */}
              {selectedWriting.content && (
                <div className="bg-[#f9f8f4] rounded-xl p-4">
                  <p className="text-[10px] font-mono text-black/30 uppercase tracking-widest mb-2">Preview</p>
                  <p className="text-xs text-black/60 leading-relaxed line-clamp-4">
                    {stripHtml(selectedWriting.content).slice(0, 280)}{selectedWriting.content.length > 280 ? "…" : ""}
                  </p>
                </div>
              )}

              {/* Status change */}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-black/30 mb-2">Readiness Status</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["raw_seed", "growing", "ready_to_show", "dormant"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => updateReadinessMutation.mutate({ id: selectedWriting.id, readiness: r })}
                      disabled={selectedWriting.readiness === r || updateReadinessMutation.isPending}
                      className={`px-2 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-widest border transition-all disabled:cursor-default ${
                        selectedWriting.readiness === r
                          ? READINESS_COLORS[r] + " font-bold"
                          : "border-black/10 text-black/40 hover:border-black/30 hover:text-black/60"
                      }`}
                    >
                      {READINESS_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Greenhouse action */}
              <button
                onClick={() => addToGreenhouseMutation.mutate(selectedWriting.id)}
                disabled={inGreenhouse(selectedWriting.id) || addToGreenhouseMutation.isPending}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-widest border transition-colors ${
                  inGreenhouse(selectedWriting.id)
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default"
                    : "border-black/10 text-black/60 hover:bg-black/[0.03] hover:border-black/20"
                }`}
              >
                <Sprout size={12} />
                {inGreenhouse(selectedWriting.id) ? "In Greenhouse" : "Add to Greenhouse"}
              </button>

              {/* Publish request action */}
              <button
                onClick={() => setShowRequestForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl font-mono text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors"
              >
                <Send size={12} />
                Request Publication
              </button>

              {/* Editor Notes */}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-black/30 mb-3">Editor Notes</p>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-[10px] text-black/30 italic">No notes yet</p>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className="bg-[#f9f8f4] rounded-xl p-3">
                        <p className="text-xs text-black/70 leading-relaxed">{note.content}</p>
                        <p className="text-[9px] font-mono text-black/30 mt-1">
                          {note.editorName ?? "Editor"} · {note.createdAt ? format(new Date(note.createdAt), "MMM d") : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a note…"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && noteText.trim()) {
                        createNoteMutation.mutate({ writingId: selectedWriting.id, content: noteText.trim() });
                      }
                    }}
                    className="flex-1 border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black/10"
                  />
                  <button
                    onClick={() => {
                      if (noteText.trim()) createNoteMutation.mutate({ writingId: selectedWriting.id, content: noteText.trim() });
                    }}
                    disabled={!noteText.trim() || createNoteMutation.isPending}
                    className="px-3 py-2 bg-black text-white rounded-xl text-xs font-mono disabled:opacity-40 hover:bg-black/80 transition-colors"
                  >
                    <MessageSquare size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Publish Request Form */}
          {showRequestForm && selectedWriting && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-black/30 mb-0.5">Request Publication</p>
                  <p className="text-sm font-medium truncate">{selectedWriting.title}</p>
                </div>
                <button onClick={() => setShowRequestForm(false)} className="text-black/30 hover:text-black/70 transition-colors shrink-0">
                  <X size={14} />
                </button>
              </div>
              <textarea
                placeholder="Editor note to author (optional)…"
                value={requestNote}
                onChange={e => setRequestNote(e.target.value)}
                rows={3}
                className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <input
                type="text"
                placeholder="Proposed date (e.g. Spring 2026)"
                value={requestDate}
                onChange={e => setRequestDate(e.target.value)}
                className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <button
                onClick={() => {
                  createRequestMutation.mutate({
                    writingId: selectedWriting.id,
                    authorId: selectedWriting.authorId,
                    editorNote: requestNote.trim() || undefined,
                    proposedDate: requestDate.trim() || undefined,
                  });
                }}
                disabled={createRequestMutation.isPending}
                className="w-full bg-black text-white rounded-xl py-2.5 font-mono text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Send size={12} />
                {createRequestMutation.isPending ? "Sending…" : "Send Request to Author"}
              </button>
            </div>
          )}

          {/* Issue Detail Panel */}
          {selectedIssue && activeTab === "issues" && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-1">Selected Issue</h3>
                  <p className="font-semibold text-sm leading-snug">{selectedIssue.title}</p>
                  {selectedIssue.subtitle && <p className="text-xs text-black/50 mt-0.5">{selectedIssue.subtitle}</p>}
                </div>
                <button onClick={() => setSelectedId(null)} className="text-black/30 hover:text-black/70 transition-colors mt-0.5 ml-2 shrink-0">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-black/40 font-mono">Status</span>
                  <span className={`font-mono uppercase text-[9px] px-2 py-0.5 rounded-full border ${selectedIssue.status === "published" ? "bg-green-50 border-green-200 text-green-700" : selectedIssue.status === "archived" ? "bg-black/5 border-black/10 text-black/40" : "border-black/10 text-black/50"}`}>{selectedIssue.status}</span>
                </div>
                {selectedIssue.publishDate && (
                  <div className="flex justify-between">
                    <span className="text-black/40 font-mono">Publish date</span>
                    <span className="font-mono text-[10px]">{format(new Date(selectedIssue.publishDate), "MMM d, yyyy")}</span>
                  </div>
                )}
                {selectedIssue.themeNote && (
                  <div className="pt-1">
                    <span className="text-black/40 font-mono text-[10px]">Theme</span>
                    <p className="text-xs text-black/70 mt-0.5">{selectedIssue.themeNote}</p>
                  </div>
                )}
              </div>

              {/* Pieces in issue */}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-black/30 mb-2">Pieces ({issuePieces.length})</p>
                {issuePieces.length === 0 ? (
                  <p className="text-[10px] text-black/30 italic">No pieces added yet. Select a piece from Pipeline and use "Add to Issue" to include it.</p>
                ) : (
                  <div className="space-y-1.5">
                    {issuePieces.map(piece => (
                      <div key={piece.id} className="flex items-center gap-2 px-3 py-2 bg-[#f9f8f4] rounded-xl">
                        <FileText size={11} className="text-black/30 shrink-0" />
                        <p className="text-xs text-black/70 truncate">{piece.writingTitle ?? piece.writingId}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add piece from pipeline quick-link */}
              <button
                onClick={() => { setActiveTab("pipeline"); setSelectedId(null); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-black/10 rounded-xl font-mono text-[10px] uppercase tracking-widest text-black/50 hover:bg-black/[0.02] hover:text-black/70 transition-colors"
              >
                <ArrowRight size={12} />
                Go to Pipeline to add pieces
              </button>

              {selectedIssue.status !== "published" && (
                <button
                  onClick={() => publishIssueMutation.mutate(selectedIssue.id)}
                  disabled={publishIssueMutation.isPending}
                  className="w-full bg-black text-white rounded-xl py-2.5 font-mono text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <BookMarked size={14} />
                  {publishIssueMutation.isPending ? "Publishing…" : "Publish Issue"}
                </button>
              )}
              {selectedIssue.status === "published" && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-2.5">
                  <Check size={14} />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Published</span>
                </div>
              )}
            </div>
          )}

          {/* Add to Issue panel (shown when a writing is selected and there are draft issues) */}
          {selectedWriting && activeTab === "pipeline" && !showRequestForm && issues.filter(i => i.status !== "published").length > 0 && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
              <p className="font-mono text-[9px] uppercase tracking-widest text-black/30 mb-3">Add to Issue</p>
              <div className="space-y-2">
                {issues.filter(i => i.status !== "published").map(issue => (
                  <button
                    key={issue.id}
                    onClick={() => addToIssueMutation.mutate({ issueId: issue.id, writingId: selectedWriting.id })}
                    disabled={addToIssueMutation.isPending}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-[#f9f8f4] rounded-xl border border-black/5 hover:border-black/20 transition-colors text-left"
                  >
                    <span className="text-xs font-medium truncate">{issue.title}</span>
                    <span className="font-mono text-[9px] text-black/30 ml-2 shrink-0">{issue.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions / Insights (default) */}
          {!selectedWriting && !selectedIssue && !showNewIssueForm && (
            <>
              <div className="bg-black text-white rounded-3xl p-6 space-y-4">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setShowNewIssueForm(true); setActiveTab("issues"); }}
                    className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
                  >
                    <Plus size={20} />
                    <span className="text-[9px] font-mono uppercase">New Issue</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                    <Clock size={20} />
                    <span className="text-[9px] font-mono uppercase">Deadlines</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">Active Insights</h3>
                <div className="space-y-4">
                  {[
                    { label: "Total Seeds", value: `${writings.length}` },
                    { label: "Ready Queue", value: `${writings.filter(w => w.readiness === "ready_to_show").length} Pieces` },
                    { label: "In Greenhouse", value: `${greenhouse.length} Pieces` },
                    { label: "Open Issues", value: `${issues.filter(i => i.status === "draft").length} Draft` },
                    { label: "Pending Requests", value: `${requests.filter(r => r.status === "draft" || r.status === "pending").length}` },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-xs text-black/60 font-mono">{stat.label}</span>
                      <span className="text-xs font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}

