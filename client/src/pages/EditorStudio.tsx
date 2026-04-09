import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Check, ExternalLink, FileCheck2, Filter, Search, 
  Send, Plus, ChevronRight, Inbox, Sprout, ClipboardCheck, 
  Clock, MessageSquare, Briefcase, Settings, BarChart3, User, BookOpen,
  BookMarked, X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Writing, Issue, GreenhouseEntry, PublishRequest, AuthorEditorConversation } from "@shared/schema";
import { stripHtml, wordCountFromContent } from "@/components/garden/RichEditor";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/garden/LoadingScreen";

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

export default function EditorStudio() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [bucket, setBucket] = useState<StudioBucket>("all");
  const [search, setSearch] = useState("");
  const [selectedWritingId, setSelectedWritingId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "greenhouse" | "requests" | "issues">("pipeline");
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueSubtitle, setNewIssueSubtitle] = useState("");

  // Core Data Queries
  const { data: writings = [], isFetching: isFetchingWritings } = useQuery<WritingWithAuthor[]>({
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

  const { data: requests = [] } = useQuery<RequestWithTitle[]>({
    queryKey: ["/api/editor/requests"],
    enabled: !!user,
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

  // Selected issue
  const selectedIssue = useMemo(() => issues.find(i => i.id === selectedIssueId) ?? null, [issues, selectedIssueId]);

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] flex items-center justify-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/40">Loading…</p>
      </main>
    );
  }

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
          {/* View Search/Filter — only relevant for Pipeline */}
          {activeTab === "pipeline" && (
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
            {activeTab === "pipeline" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Garden Stream</h2>
                  <div className="flex gap-2">
                    {['all', 'triage', 'development', 'ready', 'published'].map(f => (
                      <button key={f} onClick={() => setBucket(f as any)} className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest border ${bucket === f ? "bg-black text-white border-black" : "border-black/10 text-black/40"}`}>
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
                        onClick={() => { setSelectedWritingId(w.id); setActiveTab("pipeline"); }}
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
                          {w.createdAt && !isNaN(new Date(w.createdAt).getTime()) ? format(new Date(w.createdAt), "MMM d") : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "greenhouse" && (
              <div className="p-8">
                <h2 className="text-2xl font-semibold mb-2">The Greenhouse</h2>
                <p className="text-sm text-black/50 mb-8">Your private editorial shortlist. No authors are notified of activity here.</p>
                {greenhouse.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No pieces in the greenhouse yet</div>
                ) : (
                  <div className="space-y-3">
                    {greenhouse.map(entry => {
                      const writing = writings.find(w => w.id === entry.writingId);
                      return (
                        <div key={entry.id} className="flex items-start justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{writing?.title ?? entry.writingId}</p>
                            {writing?.authorName && (
                              <p className="text-[10px] font-mono text-black/40">{writing.authorName}</p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest border border-black/10 text-black/40">{entry.stage}</span>
                              <span className="px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest border border-black/10 text-black/40">{entry.priority}</span>
                              {entry.themeFolder && (
                                <span className="px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest border border-black/10 text-black/40">{entry.themeFolder}</span>
                              )}
                            </div>
                            {entry.internalNote && (
                              <p className="text-xs text-black/50 italic mt-1">{entry.internalNote}</p>
                            )}
                          </div>
                          <div className="text-[10px] font-mono ml-4 shrink-0 text-black/30">
                            {entry.createdAt ? format(new Date(entry.createdAt), "MMM d") : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "requests" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Publish Requests</h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">{requests.length} total</span>
                </div>
                {requests.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No publish requests yet</div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-[#f9f8f4] rounded-2xl border border-black/5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{req.writingTitle}</p>
                          {req.authorName && (
                            <p className="text-[10px] font-mono text-black/40">{req.authorName}</p>
                          )}
                          {req.proposedDate && (
                            <p className="text-[10px] font-mono text-black/40">Proposed: {req.proposedDate}</p>
                          )}
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

            {activeTab === "issues" && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">Issues</h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">{issues.length} total</span>
                </div>
                {issues.length === 0 ? (
                  <div className="text-center py-20 text-black/30 font-mono text-[10px] uppercase tracking-widest">No issues created yet</div>
                ) : (
                  <div className="space-y-3">
                    {issues.map(issue => (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssueId(selectedIssueId === issue.id ? null : issue.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selectedIssueId === issue.id ? "bg-black text-white border-black" : "bg-[#f9f8f4] border-black/5 hover:border-black/20"}`}
                      >
                        <div className="space-y-0.5">
                          <p className={`text-sm font-medium ${selectedIssueId === issue.id ? "text-white" : "text-black"}`}>{issue.title}</p>
                          {issue.subtitle && (
                            <p className={`text-xs ${selectedIssueId === issue.id ? "text-white/60" : "text-black/50"}`}>{issue.subtitle}</p>
                          )}
                          {issue.publishDate && (
                            <p className={`text-[10px] font-mono ${selectedIssueId === issue.id ? "text-white/50" : "text-black/40"}`}>{format(new Date(issue.publishDate), "MMM d, yyyy")}</p>
                          )}
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

        {/* Action Sidebar */}
        <aside className="space-y-6">
          {/* New Issue inline form */}
          {showNewIssueForm ? (
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
          ) : (
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
          )}

          {/* Selected issue detail + publish */}
          {selectedIssue && activeTab === "issues" ? (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-1">Selected Issue</h3>
                  <p className="font-semibold text-sm leading-snug">{selectedIssue.title}</p>
                  {selectedIssue.subtitle && <p className="text-xs text-black/50 mt-0.5">{selectedIssue.subtitle}</p>}
                </div>
                <button onClick={() => setSelectedIssueId(null)} className="text-black/30 hover:text-black/70 transition-colors mt-0.5 ml-2 shrink-0">
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
          ) : (
            <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">Active Insights</h3>
              <div className="space-y-4">
                {[
                  { label: "Total Seeds", value: `${writings.length}`, color: "#29493d" },
                  { label: "Ready Queue", value: `${writings.filter(w => w.readiness === "ready_to_show").length} Pieces`, color: "#d97706" },
                  { label: "Open Issues", value: `${issues.filter(i => i.status === "draft").length} Draft`, color: "#0284c7" }
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-xs text-black/60 font-mono">{stat.label}</span>
                    <span className="text-xs font-semibold">{stat.value}</span>
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
