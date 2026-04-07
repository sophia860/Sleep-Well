import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Check, Filter, Search, 
  Send, Plus, Inbox, Sprout, ClipboardCheck, 
  Clock, Briefcase, BookMarked, X, Trash2, ChevronDown,
  type LucideIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Writing, Issue, GreenhouseEntry, PublishRequest } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

type StudioBucket = "all" | "triage" | "development" | "ready" | "published";
type ActiveTab = "pipeline" | "greenhouse" | "requests" | "issues";

type WritingWithAuthor = Writing & {
  authorName: string | null;
  authorImage: string | null;
  resonanceCount: number;
};

type GreenhouseEntryWithMeta = GreenhouseEntry & {
  writingTitle: string;
  authorName: string | null;
  authorId: string;
};

type RequestWithTitle = PublishRequest & {
  writingTitle: string;
  authorName: string | null;
  editorName: string | null;
};

const READINESS_OPTIONS: { value: Writing["readiness"]; label: string }[] = [
  { value: "raw_seed", label: "Raw Seed (Triage)" },
  { value: "growing", label: "Growing (Development)" },
  { value: "ready_to_show", label: "Ready to Show" },
  { value: "dormant", label: "Dormant" },
];

const BUCKET_FILTERS: { id: StudioBucket; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "" },
  { id: "triage", label: "Triage", hint: "raw_seed" },
  { id: "development", label: "Development", hint: "growing" },
  { id: "ready", label: "Ready", hint: "ready_to_show" },
  { id: "published", label: "Published", hint: "published" },
];

export default function EditorStudio() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Tab & selection state
  const [activeTab, setActiveTab] = useState<ActiveTab>("pipeline");
  const [bucket, setBucket] = useState<StudioBucket>("all");
  const [search, setSearch] = useState("");
  const [selectedWritingId, setSelectedWritingId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // New issue form state
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueSubtitle, setNewIssueSubtitle] = useState("");

  // Add-to-issue dropdown in writing detail panel
  const [addToIssueId, setAddToIssueId] = useState("");

  // ── Data Queries ───────────────────────────────────────────────────────────
  const { data: writings = [], isFetching: isFetchingWritings } = useQuery<WritingWithAuthor[]>({
    queryKey: ["/api/editor/garden-stream"],
    enabled: !!user,
  });

  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: ["/api/editor/issues"],
    enabled: !!user,
  });

  const { data: greenhouse = [] } = useQuery<GreenhouseEntryWithMeta[]>({
    queryKey: ["/api/editor/greenhouse"],
    enabled: !!user,
  });

  const { data: requests = [] } = useQuery<RequestWithTitle[]>({
    queryKey: ["/api/editor/requests"],
    enabled: !!user,
  });

  // ── Derived state ──────────────────────────────────────────────────────────
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

  const selectedWriting = useMemo(
    () => writings.find(w => w.id === selectedWritingId) ?? null,
    [writings, selectedWritingId],
  );

  const selectedIssue = useMemo(
    () => issues.find(i => i.id === selectedIssueId) ?? null,
    [issues, selectedIssueId],
  );

  // Is this writing already in greenhouse?
  const inGreenhouse = useMemo(
    () => greenhouse.some(g => g.writingId === selectedWritingId),
    [greenhouse, selectedWritingId],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  // Change a piece's readiness
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

  // Add to greenhouse
  const addToGreenhouseMutation = useMutation({
    mutationFn: async (writingId: string) => {
      const res = await apiRequest("POST", "/api/editor/greenhouse", { writingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/greenhouse"] });
      toast({ title: "Added to Greenhouse" });
    },
    onError: () => {
      toast({ title: "Failed to add to Greenhouse", variant: "destructive" });
    },
  });

  // Remove from greenhouse
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

  // Create publish request
  const createRequestMutation = useMutation({
    mutationFn: async ({ writingId, authorId }: { writingId: string; authorId: string }) => {
      const res = await apiRequest("POST", "/api/editor/requests", { writingId, authorId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/requests"] });
      toast({ title: "Publish request created" });
      setActiveTab("requests");
    },
    onError: () => {
      toast({ title: "Failed to create request", variant: "destructive" });
    },
  });

  // Add piece to issue
  const addToIssueMutation = useMutation({
    mutationFn: async ({ issueId, writingId }: { issueId: string; writingId: string }) => {
      const res = await apiRequest("POST", `/api/editor/issues/${issueId}/pieces`, { writingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      toast({ title: "Piece added to issue" });
      setAddToIssueId("");
    },
    onError: () => {
      toast({ title: "Failed to add piece to issue", variant: "destructive" });
    },
  });

  // Publish issue
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

  // Create issue
  const createIssueMutation = useMutation({
    mutationFn: async (data: { title: string; subtitle?: string }) => {
      const res = await apiRequest("POST", "/api/editor/issues", data);
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

  // ── Access guard ───────────────────────────────────────────────────────────
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

  // ── Helpers ────────────────────────────────────────────────────────────────
  function handleSelectWriting(id: string) {
    setSelectedWritingId(prev => prev === id ? null : id);
    setSelectedIssueId(null);
    // Only navigate to pipeline tab if we're not already there
    if (activeTab !== "pipeline") setActiveTab("pipeline");
  }

  function handleSelectIssue(id: string) {
    setSelectedIssueId(prev => prev === id ? null : id);
    setSelectedWritingId(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#1f1d18] flex flex-col">
      {/* Header */}
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
            {([
              { id: "pipeline", label: "Pipeline", icon: Inbox },
              { id: "greenhouse", label: "Greenhouse", icon: Sprout },
              { id: "requests", label: "Requests", icon: Send },
              { id: "issues", label: "Issues", icon: ClipboardCheck },
            ] as { id: ActiveTab; label: string; icon: LucideIcon }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black/80"}`}
              >
                <tab.icon size={12} />
                {tab.label}
                {tab.id === "requests" && requests.length > 0 && (
                  <span className="bg-black text-white text-[8px] font-mono rounded-full w-4 h-4 flex items-center justify-center">{requests.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid lg:grid-cols-[1fr,400px] gap-6">
        {/* ── Main panel ── */}
        <section className="space-y-6">
          {/* Search bar (pipeline only) */}
          {activeTab === "pipeline" && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                <input
                  type="text"
                  placeholder="Search by title, author, or genre…"
                  className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button className="p-3 bg-white border border-black/5 rounded-2xl hover:bg-black/[0.02]">
                <Filter size={18} className="text-black/60" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden min-h-[600px]">

            {/* ── PIPELINE ── */}
            {activeTab === "pipeline" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Garden Stream</h2>
                  <span className="font-mono text-[10px] text-black/40 uppercase">{filteredWritings.length} pieces</span>
                </div>

                {/* Stage filter tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {BUCKET_FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { if (bucket !== f.id) { setBucket(f.id); setSelectedWritingId(null); } }}
                      className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest border transition-all ${bucket === f.id ? "bg-black text-white border-black" : "border-black/10 text-black/40 hover:border-black/30"}`}
                    >
                      {f.label}
                      {f.hint && <span className="ml-1 opacity-50">({f.hint.replace(/_/g, " ")})</span>}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {isFetchingWritings ? (
                    <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">Scanning Garden for seeds…</div>
                  ) : filteredWritings.length === 0 ? (
                    <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No pieces match this filter</div>
                  ) : (
                    filteredWritings.map(w => (
                      <div
                        key={w.id}
                        onClick={() => handleSelectWriting(w.id)}
                        className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selectedWritingId === w.id ? "bg-black text-white border-black" : "bg-[#f9f8f4] border-black/5 hover:border-black/20"}`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedWritingId === w.id ? "text-white" : "text-black"}`}>{w.title}</p>
                          {w.authorName && (
                            <p className={`text-[10px] font-mono ${selectedWritingId === w.id ? "text-white/60" : "text-black/40"}`}>{w.authorName}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest border ${selectedWritingId === w.id ? "border-white/20 text-white/70" : "border-black/10 text-black/40"}`}>{w.genre}</span>
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest border ${selectedWritingId === w.id ? "border-white/20 text-white/70" : "border-black/10 text-black/40"}`}>{w.readiness.replace(/_/g, " ")}</span>
                            {w.editorialAvailable && (
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest ${selectedWritingId === w.id ? "bg-white/20 text-white" : "bg-green-50 border border-green-200 text-green-700"}`}>editorial open</span>
                            )}
                          </div>
                        </div>
                        <div className={`text-[10px] font-mono ml-4 shrink-0 ${selectedWritingId === w.id ? "text-white/50" : "text-black/30"}`}>
                          {w.createdAt ? format(new Date(w.createdAt), "MMM d") : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── GREENHOUSE ── */}
            {activeTab === "greenhouse" && (
              <div className="p-8">
                <h2 className="text-2xl font-semibold mb-2">The Greenhouse</h2>
                <p className="text-sm text-black/50 mb-6">Your private editorial shortlist. No authors are notified.</p>
                {greenhouse.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest space-y-2">
                    <Sprout size={28} className="mx-auto text-black/10 mb-4" />
                    <p>No pieces in the Greenhouse yet.</p>
                    <p className="text-black/20">Select a piece in the Pipeline and click "Add to Greenhouse."</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {greenhouse.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{entry.writingTitle}</p>
                          {entry.authorName && <p className="text-[10px] font-mono text-black/40">{entry.authorName}</p>}
                          {entry.themeFolder && <p className="text-[10px] font-mono text-black/30">{entry.themeFolder}</p>}
                        </div>
                        <button
                          onClick={() => removeFromGreenhouseMutation.mutate(entry.id)}
                          disabled={removeFromGreenhouseMutation.isPending}
                          className="p-2 rounded-xl text-black/30 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Remove from Greenhouse"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── REQUESTS ── */}
            {activeTab === "requests" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Publish Requests</h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">{requests.length} total</span>
                </div>
                {requests.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <p className="text-black/30 font-mono text-[10px] uppercase tracking-widest">No publish requests yet</p>
                    <p className="text-black/40 text-sm">Select a "Ready to Show" piece in the Pipeline and click <strong>Request Publish</strong>.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{req.writingTitle}</p>
                          {req.authorName && <p className="text-[10px] font-mono text-black/40">{req.authorName}</p>}
                          {req.proposedDate && <p className="text-[10px] font-mono text-black/40">Proposed: {req.proposedDate}</p>}
                        </div>
                        <span className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest border ${req.status === "approved" ? "bg-green-50 border-green-200 text-green-700" : req.status === "rejected" ? "bg-red-50 border-red-200 text-red-700" : "border-black/10 text-black/50"}`}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ISSUES ── */}
            {activeTab === "issues" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Issues</h2>
                  <button
                    onClick={() => setShowNewIssueForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-mono text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors"
                  >
                    <Plus size={12} /> New Issue
                  </button>
                </div>
                {issues.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No issues created yet</div>
                ) : (
                  <div className="space-y-3">
                    {issues.map(issue => (
                      <div
                        key={issue.id}
                        onClick={() => handleSelectIssue(issue.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selectedIssueId === issue.id ? "bg-black text-white border-black" : "bg-[#f9f8f4] border-black/5 hover:border-black/20"}`}
                      >
                        <div className="space-y-0.5">
                          <p className={`text-sm font-medium ${selectedIssueId === issue.id ? "text-white" : "text-black"}`}>{issue.title}</p>
                          {issue.subtitle && <p className={`text-xs ${selectedIssueId === issue.id ? "text-white/60" : "text-black/50"}`}>{issue.subtitle}</p>}
                          {issue.publishDate && <p className={`text-[10px] font-mono ${selectedIssueId === issue.id ? "text-white/50" : "text-black/40"}`}>{format(new Date(issue.publishDate), "MMM d, yyyy")}</p>}
                        </div>
                        <span className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest border ${issue.status === "published" ? "bg-green-50 border-green-200 text-green-700" : issue.status === "archived" ? "bg-black/5 border-black/10 text-black/40" : selectedIssueId === issue.id ? "border-white/20 text-white/70" : "border-black/10 text-black/50"}`}>
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

        {/* ── Sidebar ── */}
        <aside className="space-y-6">

          {/* New Issue form */}
          {showNewIssueForm && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">New Issue</h3>
                <button onClick={() => setShowNewIssueForm(false)} className="text-black/30 hover:text-black/70 transition-colors"><X size={14} /></button>
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

          {/* Writing detail panel */}
          {selectedWriting && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-1">Piece Detail</p>
                  <p className="font-semibold text-sm leading-snug">{selectedWriting.title}</p>
                  {selectedWriting.authorName && <p className="text-[10px] font-mono text-black/40 mt-0.5">{selectedWriting.authorName}</p>}
                </div>
                <button onClick={() => setSelectedWritingId(null)} className="text-black/30 hover:text-black/70 transition-colors mt-0.5 ml-2 shrink-0"><X size={14} /></button>
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-black/40 font-mono">Genre</span>
                  <span className="font-mono uppercase text-[9px] px-2 py-0.5 rounded-full border border-black/10 text-black/50">{selectedWriting.genre}</span>
                </div>
                {selectedWriting.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-black/40 font-mono">Submitted</span>
                    <span className="font-mono text-[10px]">{format(new Date(selectedWriting.createdAt), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>

              {/* Status change */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-2">Stage</p>
                <div className="relative">
                  <select
                    value={selectedWriting.readiness}
                    onChange={e => updateReadinessMutation.mutate({ id: selectedWriting.id, readiness: e.target.value })}
                    disabled={updateReadinessMutation.isPending}
                    className="w-full appearance-none border border-black/10 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 cursor-pointer pr-8"
                  >
                    {READINESS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                </div>
              </div>

              {/* Add to Greenhouse */}
              <button
                onClick={() => {
                  if (!inGreenhouse) {
                    addToGreenhouseMutation.mutate(selectedWriting.id);
                  }
                }}
                disabled={inGreenhouse || addToGreenhouseMutation.isPending}
                className={`w-full rounded-xl py-2.5 font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${inGreenhouse ? "bg-green-50 text-green-700 border border-green-200 cursor-default" : "bg-[#f9f8f4] border border-black/10 text-black/60 hover:bg-black/5"}`}
              >
                <Sprout size={13} />
                {inGreenhouse ? "In Greenhouse" : addToGreenhouseMutation.isPending ? "Adding…" : "Add to Greenhouse"}
              </button>

              {/* Create Publish Request */}
              <button
                onClick={() => {
                  createRequestMutation.mutate({ writingId: selectedWriting.id, authorId: selectedWriting.authorId });
                }}
                disabled={createRequestMutation.isPending || selectedWriting.isPublished || !selectedWriting.authorId}
                className="w-full rounded-xl py-2.5 font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-[#f9f8f4] border border-black/10 text-black/60 hover:bg-black/5 disabled:opacity-40"
              >
                <Send size={13} />
                {createRequestMutation.isPending ? "Requesting…" : selectedWriting.isPublished ? "Already Published" : "Request Publish"}
              </button>

              {/* Add to Issue */}
              {issues.filter(i => i.status !== "published").length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-2">Add to Issue</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={addToIssueId}
                        onChange={e => setAddToIssueId(e.target.value)}
                        className="w-full appearance-none border border-black/10 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer pr-8"
                      >
                        <option value="">Select issue…</option>
                        {issues.filter(i => i.status !== "published").map(i => (
                          <option key={i.id} value={i.id}>{i.title}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                    </div>
                    <button
                      onClick={() => {
                        if (addToIssueId) {
                          addToIssueMutation.mutate({ issueId: addToIssueId, writingId: selectedWriting.id });
                        }
                      }}
                      disabled={!addToIssueId || addToIssueMutation.isPending}
                      className="px-4 py-2.5 bg-black text-white rounded-xl font-mono text-[10px] uppercase hover:bg-black/80 transition-colors disabled:opacity-40"
                    >
                      {addToIssueMutation.isPending ? "…" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Issue detail panel */}
          {selectedIssue && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-1">Selected Issue</h3>
                  <p className="font-semibold text-sm leading-snug">{selectedIssue.title}</p>
                  {selectedIssue.subtitle && <p className="text-xs text-black/50 mt-0.5">{selectedIssue.subtitle}</p>}
                </div>
                <button onClick={() => setSelectedIssueId(null)} className="text-black/30 hover:text-black/70 transition-colors mt-0.5 ml-2 shrink-0"><X size={14} /></button>
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

          {/* Quick Actions & Insights (when nothing selected) */}
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
                  <button
                    onClick={() => { setBucket("ready"); setActiveTab("pipeline"); setSelectedWritingId(null); }}
                    className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
                  >
                    <Clock size={20} />
                    <span className="text-[9px] font-mono uppercase">Ready Queue</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">Active Insights</h3>
                <div className="space-y-4">
                  {[
                    { label: "Total Seeds", value: `${writings.length}` },
                    { label: "Triage (Raw Seed)", value: `${writings.filter(w => w.readiness === "raw_seed").length}` },
                    { label: "In Development", value: `${writings.filter(w => w.readiness === "growing").length}` },
                    { label: "Ready Queue", value: `${writings.filter(w => w.readiness === "ready_to_show").length}` },
                    { label: "Greenhouse", value: `${greenhouse.length}` },
                    { label: "Open Issues", value: `${issues.filter(i => i.status === "draft").length} draft` },
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
