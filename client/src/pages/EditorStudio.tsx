import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Send, Plus, Inbox, Sprout, ClipboardCheck,
  Briefcase, X, Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Writing, Issue, GreenhouseEntry, PublishRequest } from "@shared/schema";
import { wordCountFromContent } from "@/components/garden/RichEditor";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

type StudioBucket = "all" | "triage" | "development" | "ready";

const READINESS_LABEL: Record<string, string> = {
  raw_seed: "Raw Seed",
  growing: "Growing",
  ready_to_show: "Ready",
  dormant: "Dormant",
};

const READINESS_STYLE: Record<string, string> = {
  ready_to_show: "bg-green-50 text-green-600",
  growing: "bg-blue-50 text-blue-600",
  dormant: "bg-gray-50 text-gray-500",
  raw_seed: "bg-amber-50 text-amber-600",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-700",
  in_production: "bg-purple-50 text-purple-700",
};

const BUCKET_READINESS: Record<StudioBucket, string | undefined> = {
  all: undefined,
  triage: "raw_seed",
  development: "growing",
  ready: "ready_to_show",
};

export default function EditorStudio() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [bucket, setBucket] = useState<StudioBucket>("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pipeline" | "greenhouse" | "requests" | "issues">("pipeline");
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueSubtitle, setNewIssueSubtitle] = useState("");
  const [newIssueTheme, setNewIssueTheme] = useState("");

  // Core Data Queries — correct API paths
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
  const addToGreenhouseMutation = useMutation({
    mutationFn: async (writingId: string) => {
      const res = await apiRequest("POST", "/api/editor/greenhouse", { writingId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/greenhouse"] });
      toast({ title: "Added to Greenhouse." });
    },
    onError: () => toast({ title: "Could not add to Greenhouse.", variant: "destructive" }),
  });

  const removeFromGreenhouseMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest("DELETE", `/api/editor/greenhouse/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/greenhouse"] });
      toast({ title: "Removed from Greenhouse." });
    },
    onError: () => toast({ title: "Could not remove from Greenhouse.", variant: "destructive" }),
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: { title: string; subtitle?: string; themeNote?: string }) => {
      const res = await apiRequest("POST", "/api/editor/issues", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      setShowNewIssue(false);
      setNewIssueTitle("");
      setNewIssueSubtitle("");
      setNewIssueTheme("");
      toast({ title: "Issue created." });
    },
    onError: () => toast({ title: "Could not create issue.", variant: "destructive" }),
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { writingId: string; authorId: string; editorNote?: string }) => {
      const res = await apiRequest("POST", "/api/editor/requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/requests"] });
      toast({ title: "Publish request sent." });
    },
    onError: () => toast({ title: "Could not send request.", variant: "destructive" }),
  });

  // Derived data
  const greenhouseWritingIds = useMemo(
    () => new Set(greenhouse.map((e) => e.writingId)),
    [greenhouse],
  );

  const filteredWritings = useMemo(() => {
    let result = writings;
    const readiness = BUCKET_READINESS[bucket];
    if (readiness) result = result.filter((w) => w.readiness === readiness);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.title.toLowerCase().includes(q));
    }
    return result;
  }, [writings, bucket, search]);

  const writingsById = useMemo(() => {
    const map = new Map<string, Writing>();
    writings.forEach((w) => map.set(w.id, w));
    return map;
  }, [writings]);

  const greenhouseGroups = useMemo(() => {
    const groups: Record<string, GreenhouseEntry[]> = {};
    greenhouse.forEach((entry) => {
      const key = entry.themeFolder || "Unsorted";
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    if (Object.keys(groups).length === 0) groups["Unsorted"] = [];
    return groups;
  }, [greenhouse]);

  const sidebarStats = useMemo(
    () => [
      { label: "In Greenhouse", value: `${greenhouse.length} Pieces`, color: "#29493d" },
      { label: "Pending Requests", value: `${requests.filter((r) => r.status === "draft").length} Drafts`, color: "#d97706" },
      { label: "Open Issues", value: `${issues.filter((i) => i.status === "draft").length} Active`, color: "#0284c7" },
    ],
    [greenhouse, requests, issues],
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
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-black" : "text-black/40 hover:text-black/60"}`}
              >
                <tab.icon size={12} />
                {tab.label}
                {tab.id === "greenhouse" && greenhouse.length > 0 && (
                  <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    {greenhouse.length}
                  </span>
                )}
                {tab.id === "requests" && requests.filter((r) => r.status === "draft").length > 0 && (
                  <span className="bg-amber-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    {requests.filter((r) => r.status === "draft").length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid lg:grid-cols-[1fr,400px] gap-6">
        <section className="space-y-6">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                type="text"
                placeholder="Search by title..."
                className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {search && (
              <button onClick={() => setSearch("")} className="p-3 bg-white border border-black/5 rounded-2xl hover:bg-black/[0.02]">
                <X size={18} className="text-black/60" />
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden min-h-[600px]">

            {/* PIPELINE */}
            {activeTab === "pipeline" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Garden Stream</h2>
                  <div className="flex gap-2">
                    {(["all", "triage", "development", "ready"] as StudioBucket[]).map((f) => (
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
                <div className="space-y-3">
                  {isFetchingWritings ? (
                    <div className="flex items-center justify-center py-20 text-black/30">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : filteredWritings.length === 0 ? (
                    <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">
                      {search ? "No pieces match your search." : "No pieces in this queue."}
                    </div>
                  ) : filteredWritings.map((writing) => {
                    const inGreenhouse = greenhouseWritingIds.has(writing.id);
                    const wordCount = wordCountFromContent(writing.content);
                    return (
                      <div
                        key={writing.id}
                        className="group flex items-start gap-4 p-4 rounded-2xl border border-black/5 hover:border-black/10 hover:bg-black/[0.01] transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{writing.title || "Untitled"}</h3>
                            {writing.readiness && (
                              <span className={`shrink-0 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${READINESS_STYLE[writing.readiness] ?? "bg-gray-50 text-gray-500"}`}>
                                {READINESS_LABEL[writing.readiness] ?? writing.readiness}
                              </span>
                            )}
                            {writing.editorialAvailable && (
                              <span className="shrink-0 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Open</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-black/40 font-mono">
                            {writing.genre && <span>{writing.genre}</span>}
                            <span>·</span>
                            <span>{wordCount} words</span>
                            <span>·</span>
                            <span>{format(new Date(writing.updatedAt ?? writing.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {inGreenhouse ? (
                            <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                              <Sprout size={10} /> In Greenhouse
                            </span>
                          ) : (
                            <button
                              onClick={() => addToGreenhouseMutation.mutate(writing.id)}
                              disabled={addToGreenhouseMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white font-mono text-[9px] uppercase tracking-widest hover:bg-black/80 transition-all disabled:opacity-50"
                            >
                              <Sprout size={10} />
                              Add to Greenhouse
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GREENHOUSE */}
            {activeTab === "greenhouse" && (
              <div className="p-8">
                <h2 className="text-2xl font-semibold mb-2">The Greenhouse</h2>
                <p className="text-sm text-black/50 mb-8">Your private editorial shortlist. No authors are notified of activity here.</p>
                {greenhouse.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">
                    No pieces in your greenhouse yet. Add them from the Pipeline.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(greenhouseGroups).map(([group, entries]) => (
                      <div key={group} className="bg-[#f9f8f4] p-5 rounded-2xl border border-black/5">
                        <h3 className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-4">{group}</h3>
                        {entries.length === 0 ? (
                          <div className="text-center py-10 border border-dashed border-black/10 rounded-xl">
                            <Sprout size={20} className="mx-auto text-black/10 mb-2" />
                            <p className="text-[10px] font-mono text-black/20 uppercase">Empty</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {entries.map((entry) => {
                              const writing = writingsById.get(entry.writingId);
                              return (
                                <div key={entry.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/5">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{writing?.title || "Untitled"}</p>
                                    {writing?.genre && (
                                      <p className="text-[10px] font-mono text-black/40 uppercase">{writing.genre}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeFromGreenhouseMutation.mutate(entry.id)}
                                    disabled={removeFromGreenhouseMutation.isPending}
                                    className="ml-2 p-1.5 rounded-lg hover:bg-red-50 text-black/20 hover:text-red-500 transition-all"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REQUESTS */}
            {activeTab === "requests" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold">Requests & Contracts</h2>
                    <p className="text-sm text-black/50 mt-1">Publish requests you've initiated with writers.</p>
                  </div>
                  <button
                    onClick={() => {
                      const entry = greenhouse[0];
                      if (!entry) {
                        toast({ title: "Add pieces to the Greenhouse first.", variant: "destructive" });
                        return;
                      }
                      const writing = writingsById.get(entry.writingId);
                      if (writing) createRequestMutation.mutate({ writingId: writing.id, authorId: writing.authorId });
                    }}
                    disabled={createRequestMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-mono text-[10px] uppercase tracking-widest hover:bg-black/80 disabled:opacity-50"
                  >
                    <Plus size={12} />
                    New Request
                  </button>
                </div>
                {requests.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">
                    No requests yet. Add pieces to the Greenhouse and initiate contact.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => {
                      const writing = writingsById.get(req.writingId);
                      return (
                        <div key={req.id} className="flex items-start gap-4 p-4 rounded-2xl border border-black/5 hover:border-black/10 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{writing?.title || "Untitled"}</p>
                              <span className={`shrink-0 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_STYLE[req.status] ?? "bg-gray-50 text-gray-600"}`}>
                                {req.status.replace("_", " ")}
                              </span>
                            </div>
                            {req.editorNote && (
                              <p className="text-xs text-black/50 truncate">{req.editorNote}</p>
                            )}
                            <p className="text-[10px] font-mono text-black/30 mt-1">
                              {format(new Date(req.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ISSUES */}
            {activeTab === "issues" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold">Issues</h2>
                    <p className="text-sm text-black/50 mt-1">Assemble and manage publication issues.</p>
                  </div>
                  <button
                    onClick={() => setShowNewIssue(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-mono text-[10px] uppercase tracking-widest hover:bg-black/80"
                  >
                    <Plus size={12} />
                    New Issue
                  </button>
                </div>
                {issues.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">
                    No issues yet. Create your first issue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <div key={issue.id} className="flex items-start gap-4 p-4 rounded-2xl border border-black/5 hover:border-black/10 transition-all">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{issue.title}</p>
                            <span className={`shrink-0 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${issue.status === "published" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                              {issue.status}
                            </span>
                          </div>
                          {issue.subtitle && <p className="text-xs text-black/50 truncate">{issue.subtitle}</p>}
                          {issue.themeNote && <p className="text-xs text-black/40 truncate italic">{issue.themeNote}</p>}
                          <div className="flex items-center gap-3 text-[10px] font-mono text-black/30 mt-1">
                            {issue.publishDate && (
                              <span>Publish: {format(new Date(issue.publishDate), "MMM d, yyyy")}</span>
                            )}
                            <span>Created {format(new Date(issue.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-black text-white rounded-3xl p-6 space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActiveTab("issues"); setShowNewIssue(true); }}
                className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
              >
                <Plus size={20} />
                <span className="text-[9px] font-mono uppercase">New Issue</span>
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
              >
                <Send size={20} />
                <span className="text-[9px] font-mono uppercase">Requests</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">Active Insights</h3>
            <div className="space-y-4">
              {sidebarStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs text-black/60 font-mono">{stat.label}</span>
                  <span className="text-xs font-semibold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* New Issue Modal */}
      {showNewIssue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Create New Issue</h2>
              <button onClick={() => setShowNewIssue(false)} className="p-1.5 rounded-lg hover:bg-black/5">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-black/40 mb-2">Title *</label>
                <input
                  type="text"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  placeholder="Issue title..."
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-black/40 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={newIssueSubtitle}
                  onChange={(e) => setNewIssueSubtitle(e.target.value)}
                  placeholder="Subtitle or edition..."
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-black/40 mb-2">Theme Note</label>
                <textarea
                  value={newIssueTheme}
                  onChange={(e) => setNewIssueTheme(e.target.value)}
                  placeholder="Editorial theme or note..."
                  rows={3}
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewIssue(false)}
                  className="flex-1 border border-black/10 rounded-xl py-3 text-sm font-mono uppercase tracking-widest text-black/40 hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  disabled={!newIssueTitle.trim() || createIssueMutation.isPending}
                  onClick={() =>
                    createIssueMutation.mutate({
                      title: newIssueTitle,
                      subtitle: newIssueSubtitle || undefined,
                      themeNote: newIssueTheme || undefined,
                    })
                  }
                  className="flex-1 bg-black text-white rounded-xl py-3 text-sm font-mono uppercase tracking-widest hover:bg-black/80 disabled:opacity-50"
                >
                  {createIssueMutation.isPending ? "Creating…" : "Create Issue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
