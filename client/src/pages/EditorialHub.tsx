import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Inbox,
  Leaf,
  BookOpen,
  CheckSquare,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bell,
  Plus,
  X,
  Check,
  RotateCcw,
  Eye,
  Flag,
  ArrowUpRight,
  Menu,
  Crown,
  Search,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingScreen from "@/components/garden/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

type Panel =
  | "overview"
  | "inbox"
  | "greenhouse"
  | "issues"
  | "tasks"
  | "contributors"
  | "cms"
  | "financials"
  | "analytics";

interface OverviewStats {
  open_flags: number;
  greenhouse_total: number;
  greenhouse_high: number;
  greenhouse_featured: number;
  pending_requests: number;
  open_tasks: number;
  draft_issues: number;
  unread_inbox: number;
  flags_this_week: number;
}

interface InboxItem {
  id: string;
  writing_id: string;
  writing_title: string;
  writing_genre: string;
  writing_readiness: string;
  writing_char_count: number;
  author_first_name: string;
  author_last_name: string;
  author_email: string;
  decision: string;
  status: string;
  inbox_state: string;
  assigned_editor_first_name: string | null;
  assigned_editor_last_name: string | null;
  created_at: string;
  writing_content: string;
  free_note: string | null;
  editor_response: string | null;
  is_publishable: boolean;
}

interface GreenhouseEntry {
  id: string;
  writing_id: string;
  editor_id: string;
  priority: string;
  stage: string;
  internal_note: string | null;
  created_at: string;
  writing_title?: string;
  author_name?: string;
}

interface Issue {
  id: string;
  title: string;
  subtitle: string | null;
  theme_note: string | null;
  publish_date: string | null;
  status: string;
  created_at: string;
}

interface EditorialTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  board_column: string;
  priority: string;
  due_date: string | null;
  assigned_editor_id: string | null;
  issue_id: string | null;
  created_at: string;
}

interface Contributor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  display_name: string | null;
  submission_count: number;
  acceptance_count: number;
  last_submission_at: string | null;
  contributor_note: string | null;
}

interface FinancialsData {
  summary: {
    paid_orders: number;
    total_revenue_pence: number;
    waitlist_count: number;
    waitlist_paid: number;
    feedback_delivered: number;
    paid_feedback: number;
  };
  orders: any[];
  waitlist: any[];
  feedback: any[];
}

interface AnalyticsData {
  funnel: { month: string; submitted: number; decided: number; accepted: number; greenhouse: number }[];
  genres: { genre: string; submitted: number; accepted: number }[];
  workload: { id: string; editor_name: string; total_claimed: number; total_decided: number; open_tasks: number }[];
  topWriters: { id: string; writer_name: string; submissions: number; acceptances: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function wordCount(charCount: number) {
  return Math.round(charCount / 5);
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").slice(0, 400);
}

const DECISION_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  accept: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  reject: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  revise: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  decided: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  claimed: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-500/20 text-rose-300",
  medium: "bg-amber-500/20 text-amber-300",
  low: "bg-emerald-500/20 text-emerald-300",
  featured: "bg-violet-500/20 text-violet-300",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  open: "bg-emerald-500/20 text-emerald-300",
  closed: "bg-rose-500/20 text-rose-300",
  published: "bg-blue-500/20 text-blue-300",
};

const CHART_COLORS = ["#c4a24d", "#5eb5a0", "#8b7ec8", "#335B3B", "#e06b6b"];

// ── Sidebar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Panel; label: string; icon: React.ReactNode; eicOnly?: boolean }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "inbox", label: "Inbox", icon: <Inbox size={16} /> },
  { id: "greenhouse", label: "Greenhouse", icon: <Leaf size={16} /> },
  { id: "issues", label: "Issues", icon: <BookOpen size={16} /> },
  { id: "tasks", label: "Tasks", icon: <CheckSquare size={16} /> },
  { id: "contributors", label: "Contributors", icon: <Users size={16} /> },
  { id: "cms", label: "Content & CMS", icon: <FileText size={16} /> },
  { id: "financials", label: "Financials", icon: <CreditCard size={16} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} />, eicOnly: true },
];

function Sidebar({
  active,
  onSelect,
  isEIC,
  collapsed,
  onToggle,
}: {
  active: Panel;
  onSelect: (p: Panel) => void;
  isEIC: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const items = NAV_ITEMS.filter((i) => !i.eicOnly || isEIC);
  return (
    <aside
      className={`flex flex-col shrink-0 bg-popover border-r border-border transition-all duration-200 ${collapsed ? "w-14" : "w-52"}`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-border">
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Editorial
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-white/5 text-muted-foreground"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left w-full ${
              active === item.id
                ? "bg-accent-cta/20 text-accent-ornament font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
            {!collapsed && item.eicOnly && (
              <Crown size={10} className="ml-auto text-accent-ornament shrink-0" />
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  accent,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`bg-popover border-border cursor-pointer hover:border-accent-ornament/40 transition-colors ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-3xl font-display font-light ${accent ?? "text-foreground"}`}>
              {value}
            </p>
          </div>
          <span className="text-muted-foreground mt-1">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── PanelHeader ───────────────────────────────────────────────────────────────

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-display font-light text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Panel A: Overview ─────────────────────────────────────────────────────────

function OverviewPanel({ onNavigate }: { onNavigate: (p: Panel) => void }) {
  const { data: stats, isLoading } = useQuery<OverviewStats>({
    queryKey: ["/api/editorial/overview"],
  });

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;
  if (!stats) return null;

  return (
    <div>
      <PanelHeader
        title="Editorial Overview"
        subtitle={`Today — ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Unread submissions"
          value={stats.unread_inbox}
          icon={<Inbox size={18} />}
          accent="text-accent-ornament"
          onClick={() => onNavigate("inbox")}
        />
        <MetricCard
          label="Open flags"
          value={stats.open_flags}
          icon={<Flag size={18} />}
          onClick={() => onNavigate("inbox")}
        />
        <MetricCard
          label="In greenhouse"
          value={stats.greenhouse_total}
          icon={<Leaf size={18} />}
          onClick={() => onNavigate("greenhouse")}
        />
        <MetricCard
          label="High priority"
          value={stats.greenhouse_high + stats.greenhouse_featured}
          icon={<ArrowUpRight size={18} />}
          accent="text-rose-300"
          onClick={() => onNavigate("greenhouse")}
        />
        <MetricCard
          label="Pending requests"
          value={stats.pending_requests}
          icon={<Bell size={18} />}
          onClick={() => onNavigate("issues")}
        />
        <MetricCard
          label="Open tasks"
          value={stats.open_tasks}
          icon={<CheckSquare size={18} />}
          onClick={() => onNavigate("tasks")}
        />
        <MetricCard
          label="Draft issues"
          value={stats.draft_issues}
          icon={<BookOpen size={18} />}
          onClick={() => onNavigate("issues")}
        />
        <MetricCard
          label="Flags this week"
          value={stats.flags_this_week}
          icon={<BarChart3 size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-popover border-border">
          <CardContent className="pt-5 pb-4 px-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</p>
            <button
              onClick={() => onNavigate("inbox")}
              className="flex items-center gap-2 text-sm text-foreground hover:text-accent-ornament transition-colors w-full"
            >
              <Inbox size={14} /> Review inbox
            </button>
            <button
              onClick={() => onNavigate("tasks")}
              className="flex items-center gap-2 text-sm text-foreground hover:text-accent-ornament transition-colors w-full"
            >
              <CheckSquare size={14} /> View task board
            </button>
            <button
              onClick={() => onNavigate("issues")}
              className="flex items-center gap-2 text-sm text-foreground hover:text-accent-ornament transition-colors w-full"
            >
              <BookOpen size={14} /> Manage issues
            </button>
            <button
              onClick={() => onNavigate("contributors")}
              className="flex items-center gap-2 text-sm text-foreground hover:text-accent-ornament transition-colors w-full"
            >
              <Users size={14} /> Browse contributors
            </button>
          </CardContent>
        </Card>
        <Card className="bg-popover border-border sm:col-span-2">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Status at a glance</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inbox unread</span>
                <span className="text-foreground font-medium">{stats.unread_inbox}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending decisions</span>
                <span className="text-foreground font-medium">{stats.open_flags}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Greenhouse pieces</span>
                <span className="text-foreground font-medium">{stats.greenhouse_total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Publish requests open</span>
                <span className="text-foreground font-medium">{stats.pending_requests}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active tasks</span>
                <span className="text-foreground font-medium">{stats.open_tasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Panel B: Inbox ────────────────────────────────────────────────────────────

function InboxPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const { data, isLoading } = useQuery<{ items: InboxItem[]; total: number }>({
    queryKey: ["/api/editorial/inbox", filter],
    queryFn: () =>
      fetch(`/api/editorial/inbox?limit=50&status=${filter}`, { credentials: "include" }).then((r) => r.json()),
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/editorial/flags/${id}/claim`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/overview"] });
      toast({ description: "Flag claimed." });
    },
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: string; note: string }) =>
      apiRequest("PATCH", `/api/editorial/flags/${id}/decide`, {
        decision,
        editorResponse: note,
        isPublishable: decision === "accept",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/overview"] });
      setSelected(null);
      setDecisionNote("");
      toast({ description: "Decision recorded." });
    },
  });

  const items = data?.items ?? [];

  return (
    <div>
      <PanelHeader
        title="Submission Inbox"
        subtitle={`${data?.total ?? 0} total submissions`}
      />

      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList className="bg-popover border border-border">
          {["all", "pending", "claimed", "decided"].map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize text-xs data-[state=active]:bg-white/10">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-muted-foreground text-sm py-8 text-center">No submissions.</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-accent-ornament/30 cursor-pointer transition-colors"
              onClick={() => { setSelected(item); setDecisionNote(item.editor_response ?? ""); }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-sm text-foreground truncate">
                    {item.writing_title || "Untitled"}
                  </span>
                  {item.writing_genre && (
                    <Badge variant="outline" className="text-xs">{item.writing_genre}</Badge>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${DECISION_COLORS[item.inbox_state || item.decision] ?? "bg-white/10 text-white/60"}`}
                  >
                    {item.inbox_state || item.decision}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.author_first_name} {item.author_last_name} · ~{wordCount(item.writing_char_count).toLocaleString()} words · {timeAgo(item.created_at)}
                </p>
                {item.assigned_editor_first_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Claimed by {item.assigned_editor_first_name} {item.assigned_editor_last_name}
                  </p>
                )}
              </div>
              <button
                className="shrink-0 text-xs px-3 py-1 rounded border border-border hover:border-accent-ornament text-muted-foreground hover:text-accent-ornament transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  claimMutation.mutate(item.id);
                }}
              >
                Claim
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-popover border-l border-border overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="font-display font-light text-lg">
                  {selected.writing_title || "Untitled"}
                </SheetTitle>
                <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                  <span>{selected.author_first_name} {selected.author_last_name}</span>
                  {selected.writing_genre && <Badge variant="outline" className="text-xs">{selected.writing_genre}</Badge>}
                  <span>~{wordCount(selected.writing_char_count).toLocaleString()} words</span>
                </div>
              </SheetHeader>

              {/* Excerpt */}
              <div className="mb-5 p-4 rounded-lg bg-card border border-border">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Excerpt</p>
                <p className="text-sm text-muted-foreground font-serif leading-relaxed">
                  {stripHtml(selected.writing_content ?? "")}…
                </p>
                <a
                  href={`/piece/${selected.writing_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-ornament mt-2 hover:underline"
                >
                  Open full piece <ExternalLink size={11} />
                </a>
              </div>

              {/* Decision bar */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Decision</p>
                <Textarea
                  placeholder="Editor response / note (optional)"
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  className="mb-3 text-sm bg-card border-border"
                  rows={3}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => decideMutation.mutate({ id: selected.id, decision: "accept", note: decisionNote })}
                    disabled={decideMutation.isPending}
                  >
                    <Check size={13} /> Accept
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white gap-1"
                    onClick={() => decideMutation.mutate({ id: selected.id, decision: "reject", note: decisionNote })}
                    disabled={decideMutation.isPending}
                  >
                    <X size={13} /> Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => decideMutation.mutate({ id: selected.id, decision: "revise", note: decisionNote })}
                    disabled={decideMutation.isPending}
                  >
                    <RotateCcw size={13} /> Request Revision
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => claimMutation.mutate(selected.id)}
                    disabled={claimMutation.isPending}
                  >
                    Claim
                  </Button>
                </div>
              </div>

              {/* Existing editor response */}
              {selected.free_note && (
                <div className="mb-5 p-4 rounded-lg bg-card border border-border">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Free note sent</p>
                  <p className="text-sm text-muted-foreground">{selected.free_note}</p>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Panel C: Greenhouse ───────────────────────────────────────────────────────

function GreenhousePanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<GreenhouseEntry | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: entries = [], isLoading } = useQuery<GreenhouseEntry[]>({
    queryKey: ["/api/editor/greenhouse/all"],
    queryFn: () =>
      fetch("/api/editor/greenhouse/all", { credentials: "include" }).then((r) => r.json()),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/editor/greenhouse/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/greenhouse/all"] });
      toast({ description: "Updated." });
    },
  });

  const columns = ["low", "medium", "high", "featured"] as const;

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div>
      <PanelHeader
        title="Greenhouse"
        subtitle={`${entries.length} pieces under consideration`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colEntries = entries.filter((e) => e.priority === col);
          return (
            <div key={col} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[col]}`}>
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </span>
                <span className="text-xs text-muted-foreground">{colEntries.length}</span>
              </div>
              {colEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg bg-card border border-border hover:border-accent-ornament/30 cursor-pointer transition-colors"
                  onClick={() => { setSelected(entry); setNoteText(entry.internal_note ?? ""); }}
                >
                  <p className="text-sm font-medium text-foreground truncate">{entry.writing_title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.author_name || "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Stage: {entry.stage}</p>
                  {entry.internal_note && (
                    <p className="text-xs text-muted-foreground/70 mt-1 italic line-clamp-2">{entry.internal_note}</p>
                  )}
                </div>
              ))}
              {colEntries.length === 0 && (
                <p className="text-xs text-muted-foreground/50 text-center py-4">Empty</p>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-popover border-l border-border overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="font-display font-light">{selected.writing_title || "Untitled"}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Priority</p>
                  <Select
                    value={selected.priority}
                    onValueChange={(val) => updateMutation.mutate({ id: selected.id, priority: val })}
                  >
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "featured"].map((p) => (
                        <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Stage</p>
                  <Select
                    value={selected.stage}
                    onValueChange={(val) => updateMutation.mutate({ id: selected.id, stage: val })}
                  >
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["uncontacted", "request_sent", "accepted", "declined"].map((s) => (
                        <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Internal note</p>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={4}
                    className="bg-card border-border text-sm"
                    placeholder="Notes for the editorial team…"
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => updateMutation.mutate({ id: selected.id, internalNote: noteText })}
                    disabled={updateMutation.isPending}
                  >
                    Save note
                  </Button>
                </div>
                <a
                  href={`/piece/${selected.writing_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-ornament hover:underline"
                >
                  Open piece <ExternalLink size={11} />
                </a>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Panel D: Issues ───────────────────────────────────────────────────────────

function IssuesPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/editor/issues"],
    queryFn: () => fetch("/api/editor/issues", { credentials: "include" }).then((r) => r.json()),
  });

  const { data: pieces = [] } = useQuery<any[]>({
    queryKey: ["/api/editor/issues", selectedIssue?.id, "pieces"],
    queryFn: () =>
      fetch(`/api/editor/issues/${selectedIssue!.id}/pieces`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!selectedIssue,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/editor/issues", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/overview"] });
      setCreating(false);
      setNewTitle("");
      setNewTheme("");
      toast({ description: "Issue created." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/editor/issues/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      toast({ description: "Issue updated." });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/editor/issues/${id}/publish`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/overview"] });
      setSelectedIssue(null);
      toast({ description: "Issue published." });
    },
  });

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div>
      <PanelHeader
        title="Issue Manager"
        subtitle={`${issues.length} issues`}
        action={
          <Button size="sm" className="gap-1" onClick={() => setCreating(true)}>
            <Plus size={13} /> New Issue
          </Button>
        }
      />

      <div className="space-y-2 mb-6">
        {issues.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No issues yet.</p>}
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-accent-ornament/30 cursor-pointer transition-colors"
            onClick={() => setSelectedIssue(issue)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground">{issue.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[issue.status] ?? "bg-white/10 text-white/60"}`}>
                  {issue.status}
                </span>
              </div>
              {issue.theme_note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{issue.theme_note}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(issue.created_at)}</p>
            </div>
            <Eye size={14} className="text-muted-foreground shrink-0" />
          </div>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="font-display font-light">New Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Issue title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-card border-border"
            />
            <Textarea
              placeholder="Theme / editorial note"
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              className="bg-card border-border"
              rows={3}
            />
            <Button
              onClick={() => createMutation.mutate({ title: newTitle, themeNote: newTheme })}
              disabled={!newTitle.trim() || createMutation.isPending}
              className="w-full"
            >
              Create Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue detail drawer */}
      <Sheet open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-popover border-l border-border overflow-y-auto">
          {selectedIssue && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="font-display font-light">{selectedIssue.title}</SheetTitle>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedIssue.status] ?? "bg-white/10 text-white/60"}`}>
                    {selectedIssue.status}
                  </span>
                </div>
              </SheetHeader>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Pieces ({pieces.length})
                  </p>
                  {pieces.length === 0 && <p className="text-xs text-muted-foreground">No pieces added yet.</p>}
                  {pieces.map((piece: any) => (
                    <div key={piece.id} className="flex items-center gap-3 py-2 border-b border-border">
                      <span className="flex-1 text-sm text-foreground">{piece.writing_title || piece.writingId}</span>
                      <span className="text-xs text-muted-foreground">{piece.workflow_state?.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
                {selectedIssue.status !== "published" && (
                  <Button
                    onClick={() => publishMutation.mutate(selectedIssue.id)}
                    disabled={publishMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Publish Issue
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => updateMutation.mutate({ id: selectedIssue.id, status: "open" })}
                  disabled={selectedIssue.status === "open"}
                >
                  Mark as Open
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Panel E: Tasks ────────────────────────────────────────────────────────────

function TasksPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: tasks = [], isLoading } = useQuery<EditorialTask[]>({
    queryKey: ["/api/editorial/tasks"],
    queryFn: () => fetch("/api/editorial/tasks", { credentials: "include" }).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/editorial/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/overview"] });
      setCreating(false);
      setNewTitle("");
      setNewDesc("");
      toast({ description: "Task created." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/editorial/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/editorial/tasks"] }),
  });

  const columns: { key: string; label: string }[] = [
    { key: "inbox", label: "Inbox" },
    { key: "in_progress", label: "In Progress" },
    { key: "review", label: "Review" },
    { key: "done", label: "Done" },
  ];

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div>
      <PanelHeader
        title="Task Board"
        subtitle={`${tasks.filter((t) => t.status !== "done" && t.status !== "completed").length} open tasks`}
        action={
          <Button size="sm" className="gap-1" onClick={() => setCreating(true)}>
            <Plus size={13} /> New Task
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => (t.board_column || "inbox") === col.key);
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{col.label}</span>
                <span className="text-xs text-muted-foreground">{colTasks.length}</span>
              </div>
              {colTasks.map((task) => (
                <div key={task.id} className="p-3 rounded-lg bg-card border border-border">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {task.priority && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] ?? "bg-white/10 text-white/60"}`}>
                        {task.priority}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    )}
                  </div>
                  <Select
                    value={task.board_column || "inbox"}
                    onValueChange={(val) => updateMutation.mutate({ id: task.id, boardColumn: val })}
                  >
                    <SelectTrigger className="mt-2 h-7 text-xs bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((c) => <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {colTasks.length === 0 && <p className="text-xs text-muted-foreground/50 text-center py-4">Empty</p>}
            </div>
          );
        })}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="font-display font-light">New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input placeholder="Task title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-card border-border" />
            <Textarea placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="bg-card border-border" rows={3} />
            <Button
              onClick={() => createMutation.mutate({ title: newTitle, description: newDesc || undefined })}
              disabled={!newTitle.trim() || createMutation.isPending}
              className="w-full"
            >
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Panel F: Contributors ─────────────────────────────────────────────────────

function ContributorsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<Contributor | null>(null);
  const [noteText, setNoteText] = useState("");

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    const t = setTimeout(() => setDebouncedSearch(val), 400);
    return () => clearTimeout(t);
  }, []);

  const { data, isLoading } = useQuery<{ items: Contributor[]; total: number }>({
    queryKey: ["/api/editorial/contributors", debouncedSearch],
    queryFn: () =>
      fetch(`/api/editorial/contributors?limit=50&search=${encodeURIComponent(debouncedSearch)}`, { credentials: "include" }).then((r) => r.json()),
  });

  const { data: detail } = useQuery({
    queryKey: ["/api/editorial/contributors", selected?.id, "detail"],
    queryFn: () =>
      fetch(`/api/editorial/contributors/${selected!.id}`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!selected,
  });

  const noteMutation = useMutation({
    mutationFn: ({ contributorId, note }: { contributorId: string; note: string }) =>
      apiRequest("POST", `/api/editorial/contributors/${contributorId}/notes`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/contributors", selected?.id, "detail"] });
      setNoteText("");
      toast({ description: "Note saved." });
    },
  });

  const items = data?.items ?? [];

  return (
    <div>
      <PanelHeader title="Contributor Hub" subtitle={`${data?.total ?? 0} writers`} />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contributors…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Name</th>
                <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Submissions</th>
                <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Accepted</th>
                <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Last submission</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/50 hover:bg-white/3 cursor-pointer transition-colors"
                  onClick={() => { setSelected(c); setNoteText(""); }}
                >
                  <td className="py-2.5 px-3">
                    <p className="text-foreground font-medium">{c.display_name || `${c.first_name} ${c.last_name}`}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground">{c.submission_count}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">{c.acceptance_count}</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground hidden sm:table-cell">{timeAgo(c.last_submission_at)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No contributors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-popover border-l border-border overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="font-display font-light">
                  {selected.display_name || `${selected.first_name} ${selected.last_name}`}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
              </SheetHeader>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 rounded-lg bg-card border border-border text-center">
                  <p className="text-xl font-display font-light">{selected.submission_count}</p>
                  <p className="text-xs text-muted-foreground">Submissions</p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border text-center">
                  <p className="text-xl font-display font-light text-emerald-400">{selected.acceptance_count}</p>
                  <p className="text-xs text-muted-foreground">Accepted</p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border text-center">
                  <p className="text-xl font-display font-light">
                    {selected.submission_count > 0
                      ? Math.round((selected.acceptance_count / selected.submission_count) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Rate</p>
                </div>
              </div>

              {detail?.submissions?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Submission history</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {detail.submissions.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-border/50">
                        <span className="flex-1 text-sm text-foreground truncate">{s.writing_title || "Untitled"}</span>
                        <span className="text-xs text-muted-foreground">{s.writing_genre}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${DECISION_COLORS[s.decision] ?? "bg-white/10 text-white/60"}`}>
                          {s.decision}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail?.notes?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Editor notes</p>
                  <div className="space-y-2">
                    {detail.notes.map((n: any) => (
                      <div key={n.id} className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-sm text-foreground">{n.note}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.editor_name} · {timeAgo(n.updated_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Add note</p>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Note about this contributor…"
                  rows={3}
                  className="bg-card border-border text-sm mb-2"
                />
                <Button
                  size="sm"
                  onClick={() => noteMutation.mutate({ contributorId: selected.id, note: noteText })}
                  disabled={!noteText.trim() || noteMutation.isPending}
                >
                  Save note
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Panel G: CMS ──────────────────────────────────────────────────────────────

function CMSPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: takeoverScreens = [] } = useQuery<any[]>({
    queryKey: ["/api/takeover-screens"],
    queryFn: () => fetch("/api/takeover-screens", { credentials: "include" }).then((r) => r.json()),
  });

  const { data: submissionCalls = [] } = useQuery<any[]>({
    queryKey: ["/api/editor/submission-calls"],
    queryFn: () => fetch("/api/editor/submission-calls", { credentials: "include" }).then((r) => r.json()),
  });

  const { data: editorialLetters = [] } = useQuery<any[]>({
    queryKey: ["/api/editorial-letters"],
    queryFn: async () => {
      const r = await fetch("/api/editorial-letters", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const toggleCallMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/editor/submission-calls/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/submission-calls"] });
      toast({ description: "Submission call updated." });
    },
  });

  return (
    <div>
      <PanelHeader title="Content & CMS" subtitle="Manage site content, submission calls, and editorial letters" />

      <div className="space-y-8">
        {/* Submission calls */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Submission Calls</h3>
            <a href="/editor-studio" className="text-xs text-accent-ornament hover:underline flex items-center gap-1">
              Manage in Studio <ExternalLink size={10} />
            </a>
          </div>
          {submissionCalls.length === 0 && <p className="text-xs text-muted-foreground">No submission calls.</p>}
          <div className="space-y-2">
            {submissionCalls.map((call: any) => (
              <div key={call.id} className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{call.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {call.theme && `${call.theme} · `}
                    Ends {new Date(call.ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${call.status === "open" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}>
                  {call.status}
                </span>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => toggleCallMutation.mutate({ id: call.id, status: call.status === "open" ? "closed" : "open" })}
                >
                  {call.status === "open" ? "Close" : "Open"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Takeover screens */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Takeover Screens</h3>
          </div>
          {takeoverScreens.length === 0 && <p className="text-xs text-muted-foreground">No takeover screens.</p>}
          <div className="space-y-2">
            {takeoverScreens.map((screen: any) => (
              <div key={screen.id} className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{screen.headline}</p>
                  {screen.body_text && <p className="text-xs text-muted-foreground line-clamp-1">{screen.body_text}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${screen.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}>
                  {screen.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Editorial letters */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Editorial Letters</h3>
          </div>
          {editorialLetters.length === 0 && <p className="text-xs text-muted-foreground">No editorial letters.</p>}
          <div className="space-y-2">
            {editorialLetters.map((letter: any) => (
              <div key={letter.id} className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{letter.subject || letter.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(letter.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${letter.published ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}>
                  {letter.published ? "Published" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Panel H: Financials ───────────────────────────────────────────────────────

function FinancialsPanel() {
  const { data, isLoading } = useQuery<FinancialsData>({
    queryKey: ["/api/editorial/financials"],
    queryFn: () => fetch("/api/editorial/financials", { credentials: "include" }).then((r) => r.json()),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;
  if (!data) return null;

  const { summary, orders, waitlist, feedback } = data;

  return (
    <div>
      <PanelHeader title="Financials" subtitle="Revenue from editorial services, waitlist, and feedback" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Revenue (paid orders)"
          value={`£${((summary.total_revenue_pence ?? 0) / 100).toFixed(2)}`}
          icon={<CreditCard size={18} />}
          accent="text-accent-ornament"
        />
        <MetricCard label="Paid service orders" value={summary.paid_orders} icon={<CheckSquare size={18} />} />
        <MetricCard label="Waitlist signups" value={summary.waitlist_count} icon={<Users size={18} />} />
        <MetricCard label="Waitlist paid" value={summary.waitlist_paid} icon={<Check size={18} />} />
        <MetricCard label="Feedback delivered" value={summary.feedback_delivered} icon={<FileText size={18} />} />
        <MetricCard label="Paid feedback" value={summary.paid_feedback} icon={<CreditCard size={18} />} />
      </div>

      {/* Service orders */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3">Service Orders ({orders.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Scope</th>
                <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Amount</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 20).map((o: any) => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="py-2 px-3">
                    <p className="text-foreground">{o.name}</p>
                    <p className="text-xs text-muted-foreground">{o.email}</p>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell">{o.service_scope?.replace("_", " ")}</td>
                  <td className="py-2 px-3 text-right text-foreground">£{((o.quoted_price_pence ?? 0) / 100).toFixed(2)}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.payment_confirmed ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-sm">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Waitlist */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-3">Editorial Waitlist ({waitlist.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Genre</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.slice(0, 20).map((w: any) => (
                <tr key={w.id} className="border-b border-border/50">
                  <td className="py-2 px-3">
                    <p className="text-foreground">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.email}</p>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell">{w.genre}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.payment_confirmed ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{timeAgo(w.created_at)}</td>
                </tr>
              ))}
              {waitlist.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-sm">No waitlist entries.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rejection feedback */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Rejection Feedback Requests ({feedback.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Author</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Piece</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tier</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {feedback.slice(0, 20).map((f: any) => (
                <tr key={f.id} className="border-b border-border/50">
                  <td className="py-2 px-3 text-foreground">{f.author_name}</td>
                  <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell truncate max-w-xs">{f.writing_title || "—"}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.tier === "paid" ? "bg-accent-ornament/20 text-accent-ornament" : "bg-white/10 text-white/60"}`}>
                      {f.tier}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.status === "delivered" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              {feedback.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-sm">No requests.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ── Panel I: Analytics (EIC only) ─────────────────────────────────────────────

function AnalyticsPanel() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/editorial/analytics"],
    queryFn: () => fetch("/api/editorial/analytics", { credentials: "include" }).then((r) => r.json()),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;
  if (!data) return null;

  const { funnel, genres, workload, topWriters } = data;

  return (
    <div>
      <PanelHeader title="Analytics" subtitle="Submission funnel, genre breakdown, editor workload" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Funnel */}
        <Card className="bg-popover border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Submission Funnel (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a8b8c8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#a8b8c8" }} />
                <Tooltip
                  contentStyle={{ background: "#0d1e2d", border: "1px solid #1a3040", borderRadius: 6 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="submitted" fill={CHART_COLORS[0]} name="Submitted" radius={[2, 2, 0, 0]} />
                <Bar dataKey="decided" fill={CHART_COLORS[1]} name="Decided" radius={[2, 2, 0, 0]} />
                <Bar dataKey="accepted" fill={CHART_COLORS[2]} name="Accepted" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Genres */}
        <Card className="bg-popover border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Genre Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={genres}
                  dataKey="submitted"
                  nameKey="genre"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ genre, percent }) => `${genre} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {genres.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0d1e2d", border: "1px solid #1a3040", borderRadius: 6 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Editor workload */}
        <Card className="bg-popover border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Editor Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Editor</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Claimed</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decided</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open tasks</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((e) => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{e.editor_name}</td>
                    <td className="py-2 text-right text-muted-foreground">{e.total_claimed}</td>
                    <td className="py-2 text-right text-muted-foreground">{e.total_decided}</td>
                    <td className="py-2 text-right text-muted-foreground">{e.open_tasks}</td>
                  </tr>
                ))}
                {workload.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">No data.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Top writers */}
        <Card className="bg-popover border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Top 10 Submitters</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Writer</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subs</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Accepted</th>
                </tr>
              </thead>
              <tbody>
                {topWriters.map((w) => (
                  <tr key={w.id} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{w.writer_name}</td>
                    <td className="py-2 text-right text-muted-foreground">{w.submissions}</td>
                    <td className="py-2 text-right text-emerald-400">{w.acceptances}</td>
                  </tr>
                ))}
                {topWriters.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground text-sm">No data.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EditorialHub() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activePanel, setActivePanel] = useState<Panel>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isEditor = user?.role === "editor" || user?.role === "editor_in_chief";
  const isEIC = user?.role === "editor_in_chief";

  if (authLoading) return <LoadingScreen />;

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  if (!isEditor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-serif text-muted-foreground text-lg">Editorial access only.</p>
      </div>
    );
  }

  function renderPanel() {
    switch (activePanel) {
      case "overview":    return <OverviewPanel onNavigate={setActivePanel} />;
      case "inbox":       return <InboxPanel />;
      case "greenhouse":  return <GreenhousePanel />;
      case "issues":      return <IssuesPanel />;
      case "tasks":       return <TasksPanel />;
      case "contributors":return <ContributorsPanel />;
      case "cms":         return <CMSPanel />;
      case "financials":  return <FinancialsPanel />;
      case "analytics":   return isEIC ? <AnalyticsPanel /> : (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Editor-in-Chief access only.
        </div>
      );
      default:            return null;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="h-14 shrink-0 bg-popover border-b border-border flex items-center px-4 gap-3 z-10">
        <button
          className="sm:hidden p-1.5 rounded hover:bg-white/5 text-muted-foreground"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <span className="font-display font-light text-sm text-foreground hidden sm:block">
          Editorial Hub
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {isEIC && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent-ornament/15 text-accent-ornament border border-accent-ornament/30">
              <Crown size={10} /> EIC
            </span>
          )}
          {!isEIC && (
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
              Editor
            </span>
          )}
          <span className="text-xs text-muted-foreground hidden sm:block">
            {user?.firstName} {user?.lastName}
          </span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden sm:flex">
          <Sidebar
            active={activePanel}
            onSelect={setActivePanel}
            isEIC={isEIC}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
          />
        </div>

        {/* Mobile nav sheet */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-56 bg-popover border-r border-border p-0">
            <div className="p-4 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Editorial Hub</span>
            </div>
            <nav className="flex flex-col gap-0.5 p-2">
              {NAV_ITEMS.filter((i) => !i.eicOnly || isEIC).map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActivePanel(item.id); setMobileNavOpen(false); }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left w-full ${
                    activePanel === item.id
                      ? "bg-accent-cta/20 text-accent-ornament font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.eicOnly && <Crown size={10} className="ml-auto text-accent-ornament" />}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderPanel()}
                </motion.div>
              </AnimatePresence>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
