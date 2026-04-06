import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Filter, Search, Send, Plus, Sprout, ClipboardCheck, 
  Clock, Briefcase, Loader2, X, Inbox
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Writing, Issue, GreenhouseEntry, PublishRequest } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

type StudioBucket = "all" | "triage" | "development" | "ready" | "published";

const READINESS_MAP: Record<string, string> = {
  triage: "raw_seed",
  development: "growing",
  ready: "ready_to_show",
  published: "published",
};

const READINESS_LABEL: Record<string, string> = {
  raw_seed: "Triage",
  growing: "Development",
  ready_to_show: "Ready",
  published: "Published",
};

const REQUEST_STATUS_STYLE: Record<string, string> = {
  accepted: "bg-green-50 border-green-200 text-green-700",
  declined: "bg-red-50 border-red-200 text-red-700",
  draft: "border-black/10 text-black/50",
};

const ISSUE_STATUS_STYLE: Record<string, string> = {
  published: "bg-green-50 border-green-200 text-green-700",
  archived: "bg-black/5 border-black/10 text-black/40",
  draft: "border-black/10 text-black/50",
};

export default function EditorStudio() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [bucket, setBucket] = useState<StudioBucket>("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pipeline" | "greenhouse" | "requests" | "issues">("pipeline");

  // New Issue form state
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueSubtitle, setNewIssueSubtitle] = useState("");
  const [newIssueDate, setNewIssueDate] = useState("");

  // Create Request form state
  const [showCreateRequestForm, setShowCreateRequestForm] = useState(false);
  const [requestWritingId, setRequestWritingId] = useState("");
  const [requestProposedDate, setRequestProposedDate] = useState("");
  const [requestEditorNote, setRequestEditorNote] = useState("");
  const [requestIssueId, setRequestIssueId] = useState("");

  // Per-item publishing loading state
  const [publishingWritingId, setPublishingWritingId] = useState<string | null>(null);
  const [publishingIssueId, setPublishingIssueId] = useState<string | null>(null);

  // Core Data Queries
  const { data: writings = [], isFetching: isFetchingWritings } = useQuery<Writing[]>({
    queryKey: ["/api/editor/garden-stream"],
    enabled: !!user,
  });

  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: ["/api/editor/issues"],
    enabled: !!user,
  });

  const { data: greenhouse = [] } = useQuery<GreenhouseEntry[]>({
    queryKey: ["/api/editor/greenhouse"],
    enabled: !!user,
  });

  const { data: requests = [] } = useQuery<PublishRequest[]>({
    queryKey: ["/api/editor/requests"],
    enabled: !!user,
  });

  // Mutations
  const publishWritingMutation = useMutation({
    mutationFn: (writingId: string) =>
      apiRequest("POST", `/api/editorial/publish/${writingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/garden-stream"] });
    },
    onSettled: () => {
      setPublishingWritingId(null);
    },
  });

  const publishIssueMutation = useMutation({
    mutationFn: (issueId: string) =>
      apiRequest("POST", `/api/editor/issues/${issueId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
    },
    onSettled: () => {
      setPublishingIssueId(null);
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: (data: { title: string; subtitle?: string; publishDate?: string }) =>
      apiRequest("POST", "/api/editor/issues", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      setShowNewIssueForm(false);
      setNewIssueTitle("");
      setNewIssueSubtitle("");
      setNewIssueDate("");
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: {
      writingId: string;
      authorId: string;
      proposedDate?: string;
      editorNote?: string;
      issueId?: string;
    }) => apiRequest("POST", "/api/editor/requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/requests"] });
      setShowCreateRequestForm(false);
      setRequestWritingId("");
      setRequestProposedDate("");
      setRequestEditorNote("");
      setRequestIssueId("");
    },
  });

  // Filtered writings for pipeline
  const filteredWritings = useMemo(() => {
    let result = writings;
    if (bucket !== "all") {
      const readiness = READINESS_MAP[bucket];
      result = result.filter((w) => w.readiness === readiness);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          (w.genre ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [writings, bucket, search]);

  // Derived stats for sidebar
  const readyCount = useMemo(
    () => writings.filter((w) => w.readiness === "ready_to_show").length,
    [writings]
  );
  const upcomingIssues = useMemo(
    () =>
      issues
        .filter((i) => i.status === "draft" && i.publishDate)
        .sort(
          (a, b) =>
            new Date(a.publishDate!).getTime() -
            new Date(b.publishDate!).getTime()
        )
        .slice(0, 3),
    [issues]
  );

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

  function handleNewIssueSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;
    createIssueMutation.mutate({
      title: newIssueTitle.trim(),
      subtitle: newIssueSubtitle.trim() || undefined,
      publishDate: newIssueDate || undefined,
    });
  }

  function handleCreateRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requestWritingId) return;
    const writing = writings.find((w) => w.id === requestWritingId);
    if (!writing) return;
    createRequestMutation.mutate({
      writingId: requestWritingId,
      authorId: writing.authorId,
      proposedDate: requestProposedDate || undefined,
      editorNote: requestEditorNote.trim() || undefined,
      issueId: requestIssueId || undefined,
    });
  }

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
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black/80"}`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid lg:grid-cols-[1fr,400px] gap-6">
        <section className="space-y-6">
          {/* View Search/Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
              <input 
                type="text" 
                placeholder="Search by title or genre..."
                className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="p-3 bg-white border border-black/5 rounded-2xl hover:bg-black/[0.02]">
              <Filter size={18} className="text-black/60" />
            </button>
          </div>

          {/* Dynamic Content Based on Tab */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden min-h-[600px]">

            {/* ── Pipeline ── */}
            {activeTab === "pipeline" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Garden Stream</h2>
                  <div className="flex gap-2">
                    {(['all', 'triage', 'development', 'ready'] as StudioBucket[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setBucket(f)}
                        className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest border ${bucket === f ? "bg-black text-white border-black" : "border-black/10 text-black/40"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {isFetchingWritings && writings.length === 0 ? (
                  <div className="flex items-center justify-center py-20 gap-2 text-black/30">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="font-mono text-[10px] uppercase tracking-widest">Scanning Garden…</span>
                  </div>
                ) : filteredWritings.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">
                    {bucket !== "all" ? `No ${bucket} pieces found` : "No writings in the garden yet"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredWritings.map(w => (
                      <div key={w.id} className="flex items-center justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                        <div className="space-y-1 min-w-0 flex-1 mr-4">
                          <p className="text-sm font-medium truncate">{w.title || "Untitled"}</p>
                          <div className="flex items-center gap-2">
                            {w.genre && (
                              <span className="px-2 py-0.5 rounded-full bg-black/5 font-mono text-[9px] uppercase tracking-widest text-black/50">
                                {w.genre}
                              </span>
                            )}
                            {w.readiness && (
                              <span className="font-mono text-[9px] text-black/30 uppercase tracking-widest">
                                {READINESS_LABEL[w.readiness] ?? w.readiness}
                              </span>
                            )}
                          </div>
                          {w.createdAt && (
                            <p className="text-[10px] font-mono text-black/30">
                              {format(new Date(w.createdAt), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        {!w.isPublished ? (
                          <button
                            onClick={() => {
                              setPublishingWritingId(w.id);
                              publishWritingMutation.mutate(w.id);
                            }}
                            disabled={publishingWritingId === w.id}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {publishingWritingId === w.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : null}
                            Publish
                          </button>
                        ) : (
                          <span className="shrink-0 px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest bg-green-50 border border-green-200 text-green-700">
                            Published
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {publishWritingMutation.isError && (
                  <p className="mt-4 text-xs text-red-600 font-mono">Failed to publish writing. Please try again.</p>
                )}
              </div>
            )}

            {/* ── Greenhouse ── */}
            {activeTab === "greenhouse" && (
              <div className="p-8">
                <h2 className="text-2xl font-semibold mb-2">The Greenhouse</h2>
                <p className="text-sm text-black/50 mb-8">Your private editorial shortlist. No authors are notified of activity here.</p>
                {greenhouse.length === 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {['Winter 2026', 'Spring 2026', 'Unsorted'].map(group => (
                      <div key={group} className="bg-[#f9f8f4] p-5 rounded-2xl border border-black/5">
                        <h3 className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-4">{group}</h3>
                        <div className="text-center py-10 border border-dashed border-black/10 rounded-xl">
                          <Sprout size={20} className="mx-auto text-black/10 mb-2" />
                          <p className="text-[10px] font-mono text-black/20 uppercase">No entries yet</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {greenhouse.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-mono text-black/60 truncate">{entry.writingId}</p>
                          {entry.themeFolder && (
                            <p className="text-[10px] font-mono text-black/40 uppercase">{entry.themeFolder}</p>
                          )}
                          {entry.internalNote && (
                            <p className="text-xs text-black/50 italic">{entry.internalNote}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest border ${entry.priority === "high" ? "bg-amber-50 border-amber-200 text-amber-700" : entry.priority === "low" ? "bg-black/5 border-black/10 text-black/40" : "border-black/10 text-black/50"}`}>
                          {entry.priority ?? "medium"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Requests ── */}
            {activeTab === "requests" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold">Publish Requests</h2>
                    <p className="text-xs text-black/40 mt-0.5">Requests you have sent to authors for publication</p>
                  </div>
                  <button
                    onClick={() => setShowCreateRequestForm(v => !v)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-black/80 transition-all"
                  >
                    {showCreateRequestForm ? <X size={12} /> : <Plus size={12} />}
                    {showCreateRequestForm ? "Cancel" : "New Request"}
                  </button>
                </div>

                {showCreateRequestForm && (
                  <form onSubmit={handleCreateRequestSubmit} className="mb-6 p-5 bg-[#f9f8f4] rounded-2xl border border-black/5 space-y-4">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-black/40">Send Publish Request</h3>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Writing *</label>
                      <select
                        value={requestWritingId}
                        onChange={(e) => setRequestWritingId(e.target.value)}
                        required
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      >
                        <option value="">Select a writing…</option>
                        {writings.filter(w => !w.isPublished).map(w => (
                          <option key={w.id} value={w.id}>{w.title || "Untitled"}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Link to Issue (optional)</label>
                      <select
                        value={requestIssueId}
                        onChange={(e) => setRequestIssueId(e.target.value)}
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      >
                        <option value="">No issue</option>
                        {issues.filter(i => i.status !== "published").map(i => (
                          <option key={i.id} value={i.id}>{i.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Proposed Date (optional)</label>
                      <input
                        type="date"
                        value={requestProposedDate}
                        onChange={(e) => setRequestProposedDate(e.target.value)}
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Editor Note (optional)</label>
                      <textarea
                        value={requestEditorNote}
                        onChange={(e) => setRequestEditorNote(e.target.value)}
                        rows={3}
                        placeholder="A note for the author…"
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                      />
                    </div>
                    {createRequestMutation.isError && (
                      <p className="text-xs text-red-600 font-mono">Failed to send request. Please try again.</p>
                    )}
                    <button
                      type="submit"
                      disabled={createRequestMutation.isPending || !requestWritingId}
                      className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {createRequestMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                      Send Request
                    </button>
                  </form>
                )}

                {requests.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No publish requests yet</div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium font-mono text-black/60 truncate">{req.writingId}</p>
                          {req.proposedDate && (
                            <p className="text-[10px] font-mono text-black/40">Proposed: {req.proposedDate}</p>
                          )}
                          {req.editorNote && (
                            <p className="text-xs text-black/50 italic truncate max-w-xs">{req.editorNote}</p>
                          )}
                        </div>
                        <span className={`shrink-0 px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest border ${REQUEST_STATUS_STYLE[req.status] ?? REQUEST_STATUS_STYLE.draft}`}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Issues ── */}
            {activeTab === "issues" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold">Issues</h2>
                    <p className="text-xs text-black/40 mt-0.5">{issues.length} total</p>
                  </div>
                  <button
                    onClick={() => setShowNewIssueForm(v => !v)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-black/80 transition-all"
                  >
                    {showNewIssueForm ? <X size={12} /> : <Plus size={12} />}
                    {showNewIssueForm ? "Cancel" : "New Issue"}
                  </button>
                </div>

                {showNewIssueForm && (
                  <form onSubmit={handleNewIssueSubmit} className="mb-6 p-5 bg-[#f9f8f4] rounded-2xl border border-black/5 space-y-4">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-black/40">Create New Issue</h3>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Title *</label>
                      <input
                        type="text"
                        value={newIssueTitle}
                        onChange={(e) => setNewIssueTitle(e.target.value)}
                        required
                        placeholder="Issue title…"
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Subtitle (optional)</label>
                      <input
                        type="text"
                        value={newIssueSubtitle}
                        onChange={(e) => setNewIssueSubtitle(e.target.value)}
                        placeholder="Issue subtitle…"
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Publish Date (optional)</label>
                      <input
                        type="date"
                        value={newIssueDate}
                        onChange={(e) => setNewIssueDate(e.target.value)}
                        className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                    {createIssueMutation.isError && (
                      <p className="text-xs text-red-600 font-mono">Failed to create issue. Please try again.</p>
                    )}
                    <button
                      type="submit"
                      disabled={createIssueMutation.isPending || !newIssueTitle.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {createIssueMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                      Create Issue
                    </button>
                  </form>
                )}

                {issues.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No issues created yet</div>
                ) : (
                  <div className="space-y-3">
                    {issues.map(issue => (
                      <div key={issue.id} className="flex items-center justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                        <div className="space-y-0.5 min-w-0 flex-1 mr-4">
                          <p className="text-sm font-medium truncate">{issue.title}</p>
                          {issue.subtitle && (
                            <p className="text-xs text-black/50 truncate">{issue.subtitle}</p>
                          )}
                          {issue.publishDate && (
                            <p className="text-[10px] font-mono text-black/40">{format(new Date(issue.publishDate), "MMM d, yyyy")}</p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {issue.status === "draft" ? (
                            <button
                              onClick={() => {
                                setPublishingIssueId(issue.id);
                                publishIssueMutation.mutate(issue.id);
                              }}
                              disabled={publishingIssueId === issue.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              {publishingIssueId === issue.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : null}
                              Publish
                            </button>
                          ) : (
                            <span className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest border ${ISSUE_STATUS_STYLE[issue.status] ?? ISSUE_STATUS_STYLE.draft}`}>
                              {issue.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {publishIssueMutation.isError && (
                  <p className="mt-4 text-xs text-red-600 font-mono">Failed to publish issue. Please try again.</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Action Sidebar */}
        <aside className="space-y-6">
          <div className="bg-black text-white rounded-3xl p-6 space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActiveTab("issues"); setShowNewIssueForm(true); }}
                className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
              >
                <Plus size={20} />
                <span className="text-[9px] font-mono uppercase">New Issue</span>
              </button>
              <button
                onClick={() => { setActiveTab("requests"); setShowCreateRequestForm(true); }}
                className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
              >
                <Send size={20} />
                <span className="text-[9px] font-mono uppercase">Request</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">Active Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/60 font-mono">Ready Queue</span>
                <span className="text-xs font-semibold">{readyCount} {readyCount === 1 ? "Piece" : "Pieces"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/60 font-mono">Open Requests</span>
                <span className="text-xs font-semibold">{requests.filter(r => r.status === "draft").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/60 font-mono">Draft Issues</span>
                <span className="text-xs font-semibold">{issues.filter(i => i.status === "draft").length}</span>
              </div>
            </div>
          </div>

          {upcomingIssues.length > 0 && (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {upcomingIssues.map(issue => (
                  <div key={issue.id} className="space-y-0.5">
                    <p className="text-xs font-medium truncate">{issue.title}</p>
                    <p className="text-[10px] font-mono text-black/40 flex items-center gap-1">
                      <Clock size={10} />
                      {format(new Date(issue.publishDate!), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
