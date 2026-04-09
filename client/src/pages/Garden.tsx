import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Plus, Trash2, ChevronLeft, Feather, PenLine,
  Search, ChevronDown, BookOpen, Lock,
  Globe, Users, MapPin, Home, LogOut,
  Sprout, Sparkles, Flower2, Droplets, Zap, Leaf,
  Flame, Archive, NotebookPen,
  Bell, FileCheck, Heart, Bookmark, MessageCircle,
  Pin, PinOff, ArchiveRestore, Tag, X,
  TreePine, Glasses, Compass, Eye, Moon, Clock, Check, Send,
  Flag, ExternalLink, Camera, Crown, RotateCcw, Settings, GraduationCap, Trophy, Brain
} from "lucide-react";
import type { Writing, WritingSnapshot } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAccessibility } from "@/hooks/use-accessibility";
import GardenGateZoneComponent from "@/pages/garden/GardenGateZone";
import CollectionsRedirectComponent from "@/pages/garden/CollectionsRedirect";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import PlantingFlow, { VisibilityBadge } from "@/components/garden/PlantingFlow";
import { NotificationBell } from "@/components/garden/NotificationPanel";
import NotificationPanel from "@/components/garden/NotificationPanel";
import { ResonanceBar, MarginaliaSection, TendButton, BookmarkButton } from "@/components/garden/SocialFeatures";
import { TablesRoom, WorkshopRoom, SwapRoom, TheDeskRoom, FirstReaderRoom, ReadingShelfRoom } from "@/components/garden/CommunityRooms";
import RichEditor, { ContentRenderer, stripHtml, wordCountFromContent } from "@/components/garden/RichEditor";
import ExportMenu from "@/components/garden/ExportMenu";
import { EditorialFeedbackBanner } from "@/components/garden/EditorialFeedbackBanner";
import SendToEditors from "@/components/garden/SendToEditors";
import { WhosHereStrip } from "@/components/garden/WhosHereStrip";
import SubmissionsZone from "@/components/garden/SubmissionsZone";
import { GalleryFeedbackModal } from "@/components/GalleryFeedbackModal";
import { BloomCelebration } from "@/components/garden/BloomCelebration";
import { SeedIcon, SproutIcon, BloomIcon, stageIcons } from "@/components/garden/GardenIcons";
import { Skeleton, DeskSkeleton, ReadingRoomSkeleton, CommunityRoomSkeleton } from "@/components/garden/GardenSkeletons";
import { stageColors, stageAccent, stageGlow, stageCardBg, stageCardBorder, genreOptions, wordCount, timeAgo, Zone, ActiveRoom, GreenhouseTool } from "@/components/garden/GardenUtils";

const rooms = [
  { id: "tables", label: "Tables", icon: <Users size={13} />, desc: "Community discussions", comingSoon: false },
  { id: "workshop", label: "Workshop", icon: <BookOpen size={13} />, desc: "Writing exercises", comingSoon: false },
  { id: "the-desk", label: "The Desk", icon: <PenLine size={13} />, desc: "Shared writing space", comingSoon: false },
  { id: "swap", label: "Swap", icon: <MessageCircle size={13} />, desc: "Beta reading exchange", comingSoon: false },
  { id: "first-reader", label: "First Reader", icon: <Eye size={13} />, desc: "Drop fresh writing, get honest first impressions", comingSoon: false },
  { id: "shelf", label: "Reading Shelf", icon: <BookOpen size={13} />, desc: "What the community is reading", comingSoon: false },
];

function ZoneNav({ active, onChange }: { active: Zone; onChange: (z: Zone) => void }) {
  const zones: { id: Zone; label: string; desc: string; icon: React.ReactNode; activeColor: string }[] = [
    { id: "desk", label: "Write", desc: "Private soil for your seeds", icon: <Sprout size={14} />, activeColor: "border-amber-600/25 bg-amber-900/20 text-amber-200/90" },
    { id: "reading-room", label: "Read", desc: "The public garden — what blooms here, others can tend", icon: <Glasses size={14} />, activeColor: "border-emerald-600/25 bg-emerald-900/20 text-emerald-200/90" },
    { id: "studio", label: "Studio", desc: "Editorial triage, revision planning, and publication flow", icon: <FileCheck size={14} />, activeColor: "border-sky-600/25 bg-sky-900/20 text-sky-200/90" },
    { id: "greenhouse", label: "Practice", desc: "A sheltered bed for practice and growth", icon: <TreePine size={14} />, activeColor: "border-teal-600/25 bg-teal-900/20 text-teal-200/90" },
    { id: "submissions", label: "Journal", desc: "Submissions, credits, and cover letters", icon: <Send size={14} />, activeColor: "border-amber-600/25 bg-amber-900/20 text-amber-200/90" },
      { id: "garden-gate", label: "Gate", desc: "Your public garden — writing you've opened to the world", icon: <TreePine size={14} />, activeColor: "border-emerald-500/25 bg-emerald-900/20 text-emerald-200/90" }, 
      ];

  return (
    <div className="w-full max-w-3xl">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2 sm:grid-cols-5">
        {zones.map((z) => (
          <button
            key={z.id}
            onClick={() => onChange(z.id)}
            className={`relative flex min-h-[4rem] flex-col items-start justify-center gap-1 rounded-xl border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
              active === z.id
                ? "border-emerald-500/30 bg-white/[0.08] text-white/90"
                : "border-white/[0.06] bg-transparent text-white/65 hover:border-white/[0.14] hover:text-white/85"
            }`}
            data-testid={`zone-tab-${z.id}`}
          >
            {active === z.id && (
              <motion.div
                layoutId="activeZone"
                className={`absolute inset-0 rounded-xl ${z.activeColor}`}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 font-sans text-xs font-medium">
              {z.icon}
              <span>{z.label}</span>
            </span>
            <span className="relative z-10 text-xs leading-4 text-white/60">{z.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoomsStrip({ activeRoom, onSelectRoom }: { activeRoom: ActiveRoom; onSelectRoom: (room: ActiveRoom) => void }) {
  
  const activeRoomData = rooms.find(r => r.id === activeRoom);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {activeRoomData && (
          <button
            onClick={() => onSelectRoom(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-600/25 bg-emerald-900/20 text-emerald-200/80 font-mono text-[9px] uppercase tracking-widest whitespace-nowrap transition-all"
            data-testid={`room-${activeRoomData.id}`}
          >
            {activeRoomData.icon}
            {activeRoomData.label}
            <X size={10} className="ml-1 opacity-60" />
          </button>
        )}
        <button
          onClick={() => void 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[9px] uppercase tracking-widest whitespace-nowrap transition-all ${
            true
              ? "border-white/20 bg-white/[0.06] text-white/90"
              : "border-emerald-800/12 text-white/90 hover:text-white/90 hover:border-emerald-700/20"
          }`}
          data-testid="button-discover-rooms" hidden
        >
          <Compass size={12} />
          Discover
          <ChevronDown size={10} className={`transition-transform ${true ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {true && (
          <motion.div
            initial={{ opacity: 1, y: 0, height: "auto" }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-2">
              {rooms.map((room) => {
                const isActive = activeRoom === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => { onSelectRoom(isActive ? null : room.id as ActiveRoom); ; }}
                    title={room.desc}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border font-mono text-[9px] uppercase tracking-widest whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                      isActive
                        ? "border-emerald-600/25 bg-emerald-900/20 text-emerald-200/80"
                        : "border-emerald-800/20 text-white/70 hover:text-white/90 hover:border-emerald-600/40 hover:bg-emerald-900/20"
                    }`}
                    data-testid={`room-${room.id}`}
                  >
                    {room.icon}
                    <span className="truncate">{room.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type StageFilter = "all" | "raw_seed" | "growing" | "ready_to_show" | "dormant";

function PublishInvitations() {
  const queryClient = useQueryClient();
  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ["/api/author/requests"],
    queryFn: async () => {
      const res = await fetch("/api/author/requests", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/author/requests/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
    },
  });

  const pending = requests.filter((r: any) => r.status === "sent");
  if (pending.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/60 flex items-center gap-2">
        <Sparkles size={12} />
        Journal Invitations
      </h3>
      {pending.map((r: any) => (
        <div key={r.id} className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4" data-testid={`invite-${r.id}`}>
          <p className="font-serif text-sm text-white/80 mb-1">
            The journal would like to publish <span className="font-display italic text-amber-200/90">"{r.writingTitle}"</span>.
          </p>
          {r.editorNote && <p className="font-serif text-xs text-white/90 italic mb-2">"{r.editorNote}"</p>}
          {r.proposedDate && <p className="font-mono text-[8px] text-white/90 mb-2">Proposed: {r.proposedDate}</p>}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => respondMutation.mutate({ id: r.id, status: "accepted" })}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400/80 font-mono text-[10px] uppercase tracking-wider hover:bg-emerald-500/30 transition-colors"
              data-testid={`btn-accept-${r.id}`}
            >
              Accept
            </button>
            <button
              onClick={() => respondMutation.mutate({ id: r.id, status: "declined" })}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400/60 font-mono text-[10px] uppercase tracking-wider hover:bg-rose-500/20 transition-colors"
              data-testid={`btn-decline-${r.id}`}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeskResonanceCount({ writingId }: { writingId: string }) {
  const { data: resonances = [] } = useQuery<any[]>({
    queryKey: ["/api/resonances", writingId],
    queryFn: async () => {
      const res = await fetch(`/api/resonances/${writingId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
  if (resonances.length === 0) return null;
  return (
    <span className="flex items-center gap-1 font-mono text-[8px] text-emerald-400/50" data-testid={`resonance-count-${writingId}`} title={`${resonances.length} resonance${resonances.length === 1 ? '' : 's'}`}>
      <Heart size={9} />
      {resonances.length}
    </span>
  );
}

function DailyPromptCard({ onWriteFromPrompt }: { onWriteFromPrompt: (prompt: string) => void }) {
  const { data: prompt } = useQuery<{ id: string; text: string; category: string }>({
    queryKey: ["/api/daily-prompt"],
    queryFn: async () => {
      const res = await fetch("/api/daily-prompt", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (!prompt) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
      data-testid="card-daily-prompt"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-amber-400/60" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/55">Today's Prompt</span>
        <span className="ml-auto rounded-full border border-white/[0.08] px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/60">{prompt.category}</span>
      </div>
      <p className="text-base text-white/80 leading-7 mb-4">{prompt.text}</p>
      <button
        onClick={() => onWriteFromPrompt(prompt.text)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-white/75 hover:bg-white/[0.08] hover:text-white transition-all"
        data-testid="button-write-from-prompt"
      >
        <PenLine size={11} />
        Write from this prompt
      </button>
    </motion.div>
  );
}

function DeskZone({ writings, onOpenWriting, onCreateNew, onOpenPlanting, onQuickUpdate, isCreating, myFlags, flagMutation, userTier, onWriteFromPrompt }: {
  writings: Writing[];
  onOpenWriting: (w: Writing) => void;
  onCreateNew: () => void;
  onOpenPlanting: (w: Writing) => void;
  onQuickUpdate: (id: string, data: Record<string, any>) => void;
  isCreating: boolean;
  myFlags: any[];
  flagMutation: any;
  userTier: string;
  onWriteFromPrompt: (prompt: string) => void;
}) {
  const queryClient = useQueryClient();
  const [showDeskStats, setShowDeskStats] = useState(false);
    const [showDeskHeader, setShowDeskHeader] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<StageFilter>("all");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const emptyDraftCount = writings.filter(w => {
    const title = (w.title || "").trim();
    const content = w.content.includes("<") ? stripHtml(w.content).trim() : (w.content || "").trim();
    const isUntitled = title === "" || title.toLowerCase() === "untitled";
    return isUntitled && content === "";
  }).length;

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/writings/bulk/empty");
      return res.json();
    },
    onSuccess: (data: { deleted: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
      toast({ title: `Cleaned up ${data.deleted} empty ${data.deleted === 1 ? "draft" : "drafts"}` });
    },
    onError: () => {
      toast({ title: "Failed to clean up drafts", variant: "destructive" });
    },
  });

  const readinessKey = (w: Writing) => w.readiness || "raw_seed";

  const allTags = Array.from(new Set(writings.flatMap(w => (w as any).tags || [])));

  const activeWritings = writings.filter(w => !(w as any).isArchived);
  const archivedWritings = writings.filter(w => (w as any).isArchived);
  const baseWritings = showArchived ? archivedWritings : activeWritings;

  const filteredWritings = baseWritings
    .filter(w => activeFilter === "all" || readinessKey(w) === activeFilter)
    .filter(w => !activeTag || ((w as any).tags || []).includes(activeTag))
    .filter(w => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const plainContent = w.content.includes("<") ? stripHtml(w.content) : w.content;
      return w.title.toLowerCase().includes(q) || plainContent.toLowerCase().includes(q) || ((w as any).tags || []).some((t: string) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const pinA = (a as any).isPinned ? 1 : 0;
      const pinB = (b as any).isPinned ? 1 : 0;
      if (pinB !== pinA) return pinB - pinA;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });

  const searchAndTagFiltered = baseWritings
    .filter(w => !activeTag || ((w as any).tags || []).includes(activeTag))
    .filter(w => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const plainContent = w.content.includes("<") ? stripHtml(w.content) : w.content;
      return w.title.toLowerCase().includes(q) || plainContent.toLowerCase().includes(q) || ((w as any).tags || []).some((t: string) => t.toLowerCase().includes(q));
    });

  const seedCount = searchAndTagFiltered.filter(w => readinessKey(w) === "raw_seed").length;
  const growingCount = searchAndTagFiltered.filter(w => readinessKey(w) === "growing").length;
  const readyCount = searchAndTagFiltered.filter(w => readinessKey(w) === "ready_to_show").length;
  const dormantCount = searchAndTagFiltered.filter(w => readinessKey(w) === "dormant").length;

  const filters: { id: StageFilter; label: string; count: number; tip: string }[] = [
    { id: "all", label: "All", count: searchAndTagFiltered.length, tip: "All your pieces" },
    { id: "raw_seed", label: "Seeds", count: seedCount, tip: "Early ideas and fragments" },
    { id: "growing", label: "Growing", count: growingCount, tip: "Works in progress" },
    { id: "ready_to_show", label: "Ready", count: readyCount, tip: "Polished and ready to share" },
    { id: "dormant", label: "Dormant", count: dormantCount, tip: "Sleeping pieces — not abandoned, just waiting" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 space-y-4">
        <PublishInvitations />
        <DailyPromptCard onWriteFromPrompt={onWriteFromPrompt} />
      </div>

      {writings.length > 0 && showDeskStats && (() => {
        const totalWords = writings.reduce((a, w) => a + wordCount(w.content), 0);
        const avgLength = Math.round(totalWords / writings.length);
        const longestPiece = writings.reduce((best, w) => {
          const wc = wordCount(w.content);
          return wc > (best.wc || 0) ? { title: w.title, wc } : best;
        }, { title: "", wc: 0 } as { title: string; wc: number });
        const readingTimeMin = Math.max(1, Math.round(totalWords / 200));
        return (
          <div className="mb-6 p-4 rounded-xl border border-emerald-800/15 bg-emerald-950/10" data-testid="writing-analytics">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-emerald-400/50" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/90">Writing Analytics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]" data-testid="stat-pieces">
                <span className="font-mono text-lg text-emerald-300/70 block">{writings.length}</span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/90">{writings.length === 1 ? "Piece" : "Pieces"}</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]" data-testid="stat-words">
                <span className="font-mono text-lg text-amber-300/70 block">{totalWords.toLocaleString()}</span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/90">Words</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]" data-testid="stat-avg-length">
                <span className="font-mono text-lg text-teal-300/70 block">{avgLength.toLocaleString()}</span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/90">Avg Words</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]" data-testid="stat-reading-time">
                <span className="font-mono text-lg text-violet-300/70 block">{readingTimeMin}</span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/90">Min Read</span>
              </div>
            </div>
            {longestPiece.wc > 0 && (
              <p className="font-serif text-[10px] text-white/90 mt-2 italic text-center" data-testid="stat-longest">
                Longest piece: "{longestPiece.title || "Untitled"}" — {longestPiece.wc.toLocaleString()} words
              </p>
            )}
          </div>
        );
      })()}

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Feather size={16} className="text-amber-400/50" />
            <h2 className="text-xl font-semibold tracking-tight text-white/90">Your Desk</h2>
          </div>
          <p className="text-sm text-white/65">A clearer list of your drafts, works in progress, and pieces ready to share.</p>
          <p className="mt-2 text-xs text-white/55">
            {writings.length} {writings.length === 1 ? "piece" : "pieces"} · {writings.reduce((a, w) => a + wordCount(w.content), 0).toLocaleString()} words
          </p>
        </div>
        <div className="flex items-center gap-2">
          {emptyDraftCount > 0 && (
            <button
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-white/60 hover:border-red-400/25 hover:text-red-300/75 transition-all"
              data-testid="button-cleanup-drafts"
              title={`Remove ${emptyDraftCount} untitled ${emptyDraftCount === 1 ? "draft" : "drafts"}`}
            >
              <Trash2 size={10} />
              {cleanupMutation.isPending ? "Cleaning" : `Clear ${emptyDraftCount} empty`}
            </button>
          )}
          <motion.button
            onClick={onCreateNew}
            disabled={isCreating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-white/[0.06] px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white/85 hover:bg-white/[0.1] transition-all"
            data-testid="button-new-piece"
          >
            <Plus size={14} />
            New Piece
          </motion.button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-grow">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your pieces..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:border-white/[0.16] transition-colors"
            data-testid="input-search"
          />
        </div>
        <div className="flex flex-wrap gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              title={f.tip}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-[9px] uppercase tracking-widest transition-all ${
                activeFilter === f.id
                  ? "border-emerald-500/25 bg-white/[0.08] text-white/90"
                  : "border-transparent text-white/60 hover:border-white/[0.08] hover:text-white/85"
              }`}
              data-testid={`filter-${f.id}`}
            >
              {f.label}
              <span className={`text-[8px] ${activeFilter === f.id ? "text-white/70" : "text-white/40"}`}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {allTags.length > 0 && (
          <>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest border transition-all ${
                  activeTag === tag
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-300/80"
                    : "border-white/[0.08] text-white/90 hover:text-white/90 hover:border-white/15"
                }`}
                data-testid={`tag-filter-${tag}`}
              >
                <Tag size={9} />
                {tag}
              </button>
            ))}
            {activeTag && (
              <button onClick={() => setActiveTag(null)} className="text-white/90 hover:text-white/90 transition-colors" data-testid="clear-tag-filter">
                <X size={12} />
              </button>
            )}
            <span className="w-px h-4 bg-white/[0.06]" />
          </>
        )}
        {archivedWritings.length > 0 && (
          <button
            onClick={() => { setShowArchived(!showArchived); setActiveFilter("all"); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest border transition-all ${
              showArchived
                ? "border-stone-400/25 bg-stone-500/10 text-stone-300/70"
                : "border-white/[0.08] text-white/90 hover:text-white/55"
            }`}
            data-testid="toggle-archived"
          >
            <Archive size={9} />
            Archived ({archivedWritings.length})
          </button>
        )}
      </div>

      {writings.length === 0 && (
        <div className="relative border border-dashed border-emerald-700/20 rounded-3xl p-16 text-center space-y-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(6,78,59,0.08) 0%, transparent 60%)" }} />
          <div className="relative flex items-center justify-center gap-6">
            <SeedIcon className="w-8 h-8 text-amber-400/20" />
            <SproutIcon className="w-10 h-10 text-emerald-400/20" />
            <BloomIcon className="w-8 h-8 text-pink-400/20" />
          </div>
          <div className="relative space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-white/90">Your desk is empty</h3>
            <p className="font-serif text-sm text-white/90 max-w-md mx-auto leading-relaxed">
              Start with a note, a fragment, or a full draft. You can organize and share it later.
            </p>
          </div>
          <motion.button
            onClick={onCreateNew}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="relative inline-flex items-center gap-2 px-6 py-3 bg-emerald-950/30 hover:bg-emerald-900/30 border border-emerald-700/20 hover:border-emerald-600/30 rounded-full font-mono text-[10px] uppercase tracking-widest text-emerald-200/60 hover:text-emerald-100/80 transition-all"
            data-testid="button-plant-seed"
          >
            <Sparkles size={13} />
            Start Your First Piece
          </motion.button>
        </div>
      )}

      {filteredWritings.length === 0 && writings.length > 0 && (
        <p className="text-center py-12 font-serif text-white/90 text-sm">No pieces match your search.</p>
      )}

      <div className="space-y-2">
        {filteredWritings.map((w, i) => {
          const isExpanded = expandedCard === w.id;
          const readiness = readinessKey(w);
          const vis = w.visibility || "personal";
          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              data-testid={`card-piece-${w.id}`}
            >
              <div
                className={`relative group/card rounded-2xl border overflow-hidden transition-all duration-300 ${
                  isExpanded
                    ? `${stageColors[readiness]?.split(" ")[0] || "border-white/25"} bg-emerald-950/20`
                    : `${stageCardBorder[readiness] || "border-emerald-800/15 hover:border-emerald-700/25"} ${stageCardBg[readiness] || "bg-emerald-950/10"}`
                } ${readiness === "dormant" ? "opacity-75" : ""}`}
              >
                <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
                  background: isExpanded
                    ? `linear-gradient(135deg, ${stageGlow[readiness] || "transparent"} 0%, transparent 50%)`
                    : `radial-gradient(ellipse at 80% 0%, ${stageGlow[readiness]?.replace("0.15", "0.06") || "transparent"} 0%, transparent 60%)`,
                }} />

                <button
                  onClick={() => setExpandedCard(isExpanded ? null : w.id)}
                  className="w-full text-left p-4 md:p-5 relative z-10"
                  data-testid={`button-expand-${w.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${stageColors[readiness] || "border-white/20 text-white/90"} ${stageAccent[readiness] || ""}`}>
                      {stageIcons[readiness] || stageIcons.raw_seed}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        {(w as any).isPinned && <Pin size={10} className="text-amber-400/50 flex-shrink-0" />}
                        <h3 className="text-base font-semibold truncate text-white/90">
                          {w.title || "Untitled"}
                        </h3>
                        {(w as any).isPublished && (
                          <span className="flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest text-amber-400/60 bg-amber-400/[0.08] px-1.5 py-0.5 rounded-full flex-shrink-0" data-testid={`badge-exhibited-${w.id}`}>
                            <Sparkles size={8} />
                            Exhibited
                          </span>
                        )}
                        {vis !== "personal" && (
                          <span className={`text-[9px] ${vis === "circle" ? "text-violet-400/40" : "text-emerald-400/40"}`}>
                            {vis === "circle" ? <Users size={10} /> : <Globe size={10} />}
                          </span>
                        )}
                        {vis === "garden" && <QuietlyReadIndicator writingId={w.id} />}
                      </div>
                      {((w as any).tags || []).length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {((w as any).tags as string[]).map((tag: string) => (
                            <span key={tag} className="font-mono text-[7px] uppercase tracking-widest text-violet-400/40 bg-violet-500/[0.06] px-1.5 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-white/90">
                      {vis === "garden" && <DeskResonanceCount writingId={w.id} />}
                      <span className="font-mono text-[9px] uppercase tracking-widest hidden sm:inline">{w.genre}</span>
                      <span className="font-mono text-[9px]">{timeAgo(w.updatedAt)}</span>
                      <ChevronDown size={13} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  {!isExpanded && w.content && (
                    <ContentRenderer content={w.content} maxLength={120} className="text-sm font-serif text-white/55 line-clamp-1 mt-1 ml-10" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 md:px-5 pb-4 md:pb-5 ml-10 space-y-3 relative z-10">
                        {w.content && (
                          <ContentRenderer content={w.content} maxLength={400} className="text-sm font-serif text-white/55 leading-relaxed line-clamp-4" />
                        )}
                        <div className="flex items-center gap-3 text-white/90">
                          <span className="font-mono text-[9px] tracking-widest">{wordCount(w.content)} words</span>
                          <VisibilityBadge visibility={vis} readiness={readiness} editorialAvailable={w.editorialAvailable} compact />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenWriting(w); }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/20 hover:border-white/20 rounded-lg font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-white transition-all"
                            data-testid={`button-edit-${w.id}`}
                          >
                            <PenLine size={11} />
                            Open
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenPlanting(w); }}
                            className="flex items-center gap-1.5 px-3.5 py-2 border border-white/[0.20] hover:border-white/25 rounded-lg font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-white/75 transition-all"
                            data-testid={`button-plant-${w.id}`}
                          >
                            <MapPin size={11} />
                            Share
                          </button>
                          <div onClick={(e) => e.stopPropagation()}>
                            <ExportMenu title={w.title} content={w.content} writingId={w.id} />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onQuickUpdate(w.id, { isPinned: !(w as any).isPinned }); }}
                            className="flex items-center gap-1.5 px-3.5 py-2 border border-white/[0.15] hover:border-amber-500/20 rounded-lg font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-amber-400/70 transition-all"
                            data-testid={`button-pin-${w.id}`}
                          >
                            {(w as any).isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                            {(w as any).isPinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onQuickUpdate(w.id, { isArchived: !(w as any).isArchived }); }}
                            className="flex items-center gap-1.5 px-3.5 py-2 border border-white/[0.15] hover:border-stone-400/20 rounded-lg font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-stone-400/70 transition-all"
                            data-testid={`button-archive-${w.id}`}
                          >
                            {(w as any).isArchived ? <ArchiveRestore size={11} /> : <Archive size={11} />}
                            {(w as any).isArchived ? "Restore" : "Archive"}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 pt-1 flex-wrap opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickUpdate(w.id, { isPublicGarden: !(w as any).isPublicGarden });
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest transition-all border ${
                                (w as any).isPublicGarden
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300/80"
                                  : "border-white/[0.06] text-white/90 hover:text-white/90 hover:border-white/15"
                              }`}
                              data-testid={`toggle-public-${w.id}`}
                            >
                              <Globe size={10} />
                              {(w as any).isPublicGarden ? "Public" : "Make Public"}
                            </button>
                          </div>
                          {userTier === "paid" ? (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const note = prompt("Optional note for this snapshot:");
                              const res = await fetch(`/api/writings/${w.id}/snapshot`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ note: note || undefined }),
                              });
                              if (res.ok) {
                                queryClient.invalidateQueries({ queryKey: [`/api/writings/${w.id}/snapshots`] });
                                toast({ title: "Snapshot saved", description: note ? `"${note}"` : "Current state preserved" });
                              }
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest transition-all border border-white/[0.06] text-white/90 hover:text-amber-300/60 hover:border-amber-500/20"
                            data-testid={`button-snapshot-${w.id}`}
                          >
                            <Camera size={10} />
                            Save this state
                          </button>
                          ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest text-amber-300/25">
                            <Camera size={10} />
                            <Crown size={8} />
                            Snapshots
                          </span>
                          )}
                          {readiness === "ready_to_show" && (() => {
                            const existingFlag = myFlags.find((f: any) => f.writingId === w.id);
                            if (existingFlag) {
                              const stepIndex = existingFlag.status === "flagged" ? 0 : existingFlag.status === "seen" ? 1 : 2;
                              const steps = ["Requested", "In review", "Received"];
                              if (existingFlag.isPaidFlag) {
                                return (
                                  <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full mt-2 rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-3"
                                    data-testid={`flag-card-${w.id}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-violet-300/70">
                                        <Flag size={10} />
                                         {existingFlag.status === "flagged" ? "Review requested" :
                                          existingFlag.status === "seen" ? "In review" :
                                          "Review received"}
                                      </div>
                                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                        <Crown size={8} className="text-amber-400/80" />
                                        <span className="font-mono text-[7px] uppercase tracking-widest text-amber-300/80">Guaranteed read</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-0 my-2">
                                      {steps.map((step, i) => (
                                        <div key={step} className="flex items-center">
                                          <div className="flex flex-col items-center gap-1">
                                            <div
                                              className={`w-[6px] h-[6px] rounded-full ${
                                                i < stepIndex ? "bg-violet-400/60" :
                                                i === stepIndex ? "bg-violet-400/60 ring-2 ring-violet-400/30" :
                                                "bg-white/15"
                                              }`}
                                            />
                                            <span className={`font-mono text-[6px] uppercase tracking-wider ${
                                              i <= stepIndex ? "text-violet-300/60" : "text-white/90"
                                            }`}>{step}</span>
                                          </div>
                                          {i < steps.length - 1 && (
                                            <div className={`w-[16px] h-[2px] mb-3 mx-0.5 ${
                                              i < stepIndex ? "bg-violet-400/30" : "bg-white/10"
                                            }`} />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                      <span className="font-mono text-[7px] text-white/90">Requested {timeAgo(existingFlag.createdAt)}</span>
                                      {existingFlag.seenAt && (
                                        <span className="font-mono text-[7px] text-white/90">In review {timeAgo(existingFlag.seenAt)}</span>
                                      )}
                                    </div>
                                    {existingFlag.editorResponse && (
                                      <div className="mt-2 px-2 py-1.5 rounded-lg bg-violet-500/[0.05] border border-violet-500/10">
                                        <p className="font-serif text-[10px] text-violet-200/50 italic leading-relaxed">
                                          "{existingFlag.editorResponse.length > 80 ? existingFlag.editorResponse.slice(0, 80) + "…" : existingFlag.editorResponse}"
                                        </p>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              }
                              return (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest border border-violet-500/20 bg-violet-500/5 text-violet-300/70">
                                  <Flag size={10} />
                                  {existingFlag.status === "flagged" ? "Review requested" : 
                                   existingFlag.status === "seen" ? "In review" : 
                                   "Review received"}
                                  <span className="text-[7px] text-white/90 normal-case tracking-normal ml-1">{timeAgo(existingFlag.createdAt)}</span>
                                </div>
                              );
                            }
                            return (
                              <button
                                onClick={(e) => { e.stopPropagation(); flagMutation.mutate(w.id); }}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest transition-all border border-white/[0.06] text-white/90 hover:text-violet-300/60 hover:border-violet-500/20"
                                data-testid={`button-flag-${w.id}`}
                              >
                                <Flag size={10} />
                                Request review
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {myFlags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-xl border border-violet-500/10 bg-violet-500/[0.02] p-4"
          data-testid="flag-summary-section"
        >
          <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-violet-300/50 mb-3 flex items-center gap-2">
            <Flag size={12} />
            Journal Review
          </h3>
          <div className="space-y-3">
            {myFlags.map((flag: any) => {
              const stepIndex = flag.status === "flagged" ? 0 : flag.status === "seen" ? 1 : 2;
              const steps = ["Requested", "In review", "Received"];
              return (
                <div key={flag.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-violet-500/10 bg-violet-500/[0.02]" data-testid={`flag-summary-${flag.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-serif text-[11px] text-white/90 truncate">{flag.writingTitle}</span>
                      {flag.isPaidFlag && (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0">
                          <Crown size={7} className="text-amber-400/80" />
                          <span className="font-mono text-[6px] uppercase tracking-widest text-amber-300/80">Paid</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-0">
                      {steps.map((step, i) => (
                        <div key={step} className="flex items-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <div
                              className={`w-[6px] h-[6px] rounded-full ${
                                i < stepIndex ? "bg-violet-400/60" :
                                i === stepIndex ? "bg-violet-400/60 ring-2 ring-violet-400/30" :
                                "bg-white/15"
                              }`}
                            />
                            <span className={`font-mono text-[5px] uppercase tracking-wider ${
                              i <= stepIndex ? "text-violet-300/60" : "text-white/90"
                            }`}>{step}</span>
                          </div>
                          {i < steps.length - 1 && (
                            <div className={`w-[16px] h-[2px] mb-2 mx-0.5 ${
                              i < stepIndex ? "bg-violet-400/30" : "bg-white/10"
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className="font-mono text-[7px] text-white/90 shrink-0">{timeAgo(flag.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StudioZone({ writings, onOpenWriting }: { writings: Writing[]; onOpenWriting: (w: Writing) => void }) {
  const [activeBucket, setActiveBucket] = useState<"triage" | "development" | "ready">("triage");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    voice: false,
    structure: false,
    clarity: false,
    pacing: false,
  });

  const now = Date.now();
  const withMeta = writings.map((w) => {
    const plain = w.content.includes("<") ? stripHtml(w.content) : w.content;
    const words = wordCount(plain || "");
    const updatedMs = new Date(w.updatedAt || 0).getTime();
    const staleDays = Math.floor((now - updatedMs) / (1000 * 60 * 60 * 24));
    return {
      writing: w,
      words,
      staleDays,
      readiness: w.readiness || "raw_seed",
      hasTitle: Boolean((w.title || "").trim() && (w.title || "").trim().toLowerCase() !== "untitled"),
    };
  });

  const queue = withMeta
    .filter((item) => {
      if (activeBucket === "triage") return item.readiness === "raw_seed" || !item.hasTitle;
      if (activeBucket === "development") return item.readiness === "growing" || item.staleDays > 10;
      return item.readiness === "ready_to_show";
    })
    .sort((a, b) => {
      if (activeBucket === "triage") return a.words - b.words;
      if (activeBucket === "development") return b.staleDays - a.staleDays;
      return new Date(b.writing.updatedAt || 0).getTime() - new Date(a.writing.updatedAt || 0).getTime();
    });

  const selected = queue.find((item) => item.writing.id === selectedId) || queue[0] || null;
  const completedChecks = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="studio-zone">
      <section className="rounded-2xl border border-sky-800/20 bg-sky-950/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-sky-300/60">Editing Studio</p>
            <h2 className="font-display text-2xl italic text-white/85">Functional editorial workflow for the garden</h2>
            <p className="font-serif text-xs text-white/50 mt-1">Triage drafts, shape revisions, and move strong pieces toward publication.</p>
          </div>
          <a
            href="/editor-studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-200/80 hover:text-sky-100 hover:bg-sky-500/15 transition-all font-mono text-[9px] uppercase tracking-widest"
            data-testid="open-full-editor-studio"
          >
            <ExternalLink size={12} />
            Open full studio
          </a>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3" data-testid="studio-stat-triage">
          <p className="font-mono text-[8px] uppercase tracking-widest text-amber-300/60">Needs triage</p>
          <p className="font-display text-2xl italic text-amber-100/80 mt-1">{withMeta.filter((x) => x.readiness === "raw_seed" || !x.hasTitle).length}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3" data-testid="studio-stat-development">
          <p className="font-mono text-[8px] uppercase tracking-widest text-emerald-300/60">In development</p>
          <p className="font-display text-2xl italic text-emerald-100/80 mt-1">{withMeta.filter((x) => x.readiness === "growing").length}</p>
        </div>
        <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.05] p-3" data-testid="studio-stat-ready">
          <p className="font-mono text-[8px] uppercase tracking-widest text-fuchsia-300/60">Ready to show</p>
          <p className="font-display text-2xl italic text-fuchsia-100/80 mt-1">{withMeta.filter((x) => x.readiness === "ready_to_show").length}</p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3" data-testid="studio-stat-stale">
          <p className="font-mono text-[8px] uppercase tracking-widest text-violet-300/60">Stale drafts</p>
          <p className="font-display text-2xl italic text-violet-100/80 mt-1">{withMeta.filter((x) => x.staleDays > 14).length}</p>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.1fr,1fr] gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/55">Editing Queue</p>
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-full p-1">
              {[
                { id: "triage", label: "Triage" },
                { id: "development", label: "Develop" },
                { id: "ready", label: "Ready" },
              ].map((bucket) => (
                <button
                  key={bucket.id}
                  onClick={() => setActiveBucket(bucket.id as "triage" | "development" | "ready")}
                  className={`px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest transition-colors ${
                    activeBucket === bucket.id ? "bg-white/[0.12] text-white/80" : "text-white/50 hover:text-white/75"
                  }`}
                  data-testid={`studio-bucket-${bucket.id}`}
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[28rem] overflow-auto pr-1">
            {queue.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/[0.12] p-6 text-center">
                <p className="font-serif text-sm text-white/45 italic">No pieces in this bucket yet.</p>
              </div>
            )}
            {queue.map((item) => {
              const isSelected = selected?.writing.id === item.writing.id;
              return (
                <button
                  key={item.writing.id}
                  onClick={() => setSelectedId(item.writing.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-sky-400/35 bg-sky-500/[0.08]"
                      : "border-white/[0.08] bg-white/[0.01] hover:border-white/[0.15]"
                  }`}
                  data-testid={`studio-item-${item.writing.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-sm text-white/80 truncate italic">{item.writing.title || "Untitled"}</h3>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">{item.words}w</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-white/35 uppercase tracking-widest">
                    <span>{item.readiness.replaceAll("_", " ")}</span>
                    <span>•</span>
                    <span>{Math.max(0, item.staleDays)}d quiet</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/55 mb-3">Revision Plan</p>
          {!selected ? (
            <p className="font-serif text-sm text-white/45 italic">Pick a piece from the queue to start planning edits.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-xl italic text-white/85">{selected.writing.title || "Untitled"}</h3>
                <p className="font-mono text-[9px] uppercase tracking-widest text-white/45 mt-1">
                  {selected.readiness.replaceAll("_", " ")} • {selected.words} words
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "voice", label: "Voice" },
                  { key: "structure", label: "Structure" },
                  { key: "clarity", label: "Clarity" },
                  { key: "pacing", label: "Pacing" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left ${
                      checklist[item.key]
                        ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                        : "border-white/[0.08] bg-white/[0.01]"
                    }`}
                    data-testid={`studio-check-${item.key}`}
                  >
                    <span className="font-serif text-sm text-white/75">{item.label}</span>
                    {checklist[item.key] ? <Check size={13} className="text-emerald-300/80" /> : <div className="w-3 h-3 rounded-full border border-white/25" />}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/45 block mb-2">Session Notes</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Outline the next editorial pass: cuts, rewrites, focus questions..."
                  className="w-full min-h-[120px] rounded-xl border border-white/[0.10] bg-black/20 px-3 py-2 font-serif text-sm text-white/80 placeholder:text-white/35 focus:outline-none focus:border-sky-400/35"
                  data-testid="studio-session-notes"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">Checklist {completedChecks}/4 complete</span>
                <button
                  onClick={() => onOpenWriting(selected.writing)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-200/80 hover:text-sky-100 transition-all font-mono text-[9px] uppercase tracking-widest"
                  data-testid="studio-open-piece"
                >
                  <PenLine size={11} />
                  Open in editor
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function WriteEditor({ writing, onBack, onSave, onDelete, onOpenPlanting, onRequestFeedback }: {
  writing: Writing;
  onBack: () => void;
  onSave: (data: { title: string; content: string; genre: string; readiness?: string; tags?: string[] }) => void;
  onDelete: () => void;
  onOpenPlanting: () => void;   onRequestFeedback?: () => void;
}) {
  const [editTitle, setEditTitle] = useState(writing.title);
  const [editContent, setEditContent] = useState(writing.content);
  const [editGenre, setEditGenre] = useState(writing.genre);
  const [editStage, setEditStage] = useState(writing.readiness || "raw_seed");
  const [editTags, setEditTags] = useState<string[]>((writing as any).tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("saved");
  const [fontSizeValue, setFontSizeValue] = useState(18);
  const [editorFont, setEditorFont] = useState<"serif" | "display" | "typewriter" | "mono" | "sans">("serif");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompostConfirm, setShowCompostConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<WritingSnapshot | null>(null);
  const [showBloomCelebration, setShowBloomCelebration] = useState(false);
  const hasMounted = useRef(false);
  const prevStageRef = useRef(writing.readiness || "raw_seed");

  const { data: snapshots = [] } = useQuery<WritingSnapshot[]>({
    queryKey: [`/api/writings/${writing.id}/snapshots`],
    queryFn: async () => {
      const res = await fetch(`/api/writings/${writing.id}/snapshots`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const doSave = useCallback(() => {
    onSave({ title: editTitle, content: editContent, genre: editGenre, readiness: editStage, tags: editTags });
  }, [editTitle, editContent, editGenre, editStage, editTags, onSave]);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    setSaveStatus("idle");
    const timer = setTimeout(() => {
      setSaveStatus("saving");
      doSave();
      setTimeout(() => {
        setSaveStatus("saved");
        toast({ title: "Saved", description: "Your writing has been saved.", duration: 2000 });
      }, 600);
    }, 800);
    return () => clearTimeout(timer);
  }, [editTitle, editContent, editGenre, editStage, editTags]);

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (t && !editTags.includes(t) && editTags.length < 5) {
      setEditTags([...editTags, t]);
      setTagInput("");
    }
  }

  
  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence>
        {showBloomCelebration && (
          <BloomCelebration onComplete={() => setShowBloomCelebration(false)} />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => { doSave(); onBack(); }}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/90 hover:text-white/80 transition-colors group"
          data-testid="button-back"
        >
          <ChevronLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-[9px] tracking-widest transition-all duration-300 flex items-center gap-1 ${
            saveStatus === "saving" ? "text-amber-400/70" : saveStatus === "saved" ? "text-emerald-400/70" : "text-white/90"
          }`}>
            {saveStatus === "saved" && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Check size={11} strokeWidth={3} />
              </motion.span>
            )}
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Editing..."}
          </span>
          <span className="font-mono text-[9px] tracking-widest text-white/90">{wordCount(editContent)} words</span>
          <ExportMenu title={editTitle} content={editContent} compact writingId={writing.id} />
          <button
            onClick={() => setShowCompostConfirm(true)}
            className="p-1.5 text-white/90 hover:text-amber-400/70 transition-colors"
            title="Compost — return this piece to the communal soil"
            data-testid="button-compost"
          >
            <Leaf size={14} />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-white/90 hover:text-red-400/70 transition-colors"
            data-testid="button-delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4 flex items-center justify-between">
              <p className="font-serif text-sm text-red-300/70">Delete this writing permanently?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-white" data-testid="button-cancel-delete">Cancel</button>
                <button onClick={onDelete} className="px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest bg-red-500/20 text-red-300 rounded-full hover:bg-red-500/30" data-testid="button-confirm-delete">Delete</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompostConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="border border-amber-500/20 bg-amber-950/10 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Leaf size={16} className="text-amber-400/60" />
                <p className="font-display text-base text-amber-200/70 italic">Return to the soil?</p>
              </div>
              <p className="font-serif text-xs text-white/45 leading-relaxed">
                Composting dissolves this piece into fragments that drift into the communal compost pile.
                Other writers can visit and find sparks in what you've let go. The original will be removed from your garden.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCompostConfirm(false)} className="px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-white" data-testid="button-cancel-compost">Keep</button>
                <button
                  onClick={async () => {
                    try {
                      await apiRequest("POST", `/api/writings/${writing.id}/compost`);
                      toast({ title: "Composted", description: "Your piece has been returned to the communal soil." });
                      onBack();
                    } catch (e) {
                      toast({ title: "Error", description: "Failed to compost", variant: "destructive" });
                    }
                  }}
                  className="px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest bg-amber-500/15 text-amber-300/80 rounded-full hover:bg-amber-500/25 border border-amber-500/20"
                  data-testid="button-confirm-compost"
                >
                  Compost
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

<EditorialFeedbackBanner onRequestFeedback={() => {}} />
                <div className="space-y-6">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Title..."
          className="w-full bg-transparent text-3xl md:text-4xl font-display font-light tracking-normal text-white/90 placeholder:text-white/90 focus:outline-none border-none italic"
          data-testid="input-title"
        />

        <div className="flex items-center gap-3 pb-5 border-b border-white/[0.15] flex-wrap">
          <div className="flex gap-0.5">
            {([
              { id: "raw_seed", label: "Seed", tip: "Early ideas and fragments — just planted" },
              { id: "growing", label: "Growing", tip: "Works in progress — actively developing" },
              { id: "ready_to_show", label: "Ready", tip: "Polished and ready to share with the world" },
              { id: "dormant", label: "Dormant", tip: "Sleeping pieces — not abandoned, just waiting" },
            ] as const).map((s) => (
            <Tooltip key={s.id}>
              <TooltipTrigger asChild>
              <button
                onClick={() => {
                  const prev = prevStageRef.current;
                  setEditStage(s.id);
                  prevStageRef.current = s.id;
                  if (s.id === "ready_to_show" && prev !== "ready_to_show") {
                    setShowBloomCelebration(true);
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all border ${
                  editStage === s.id
                    ? `${stageColors[s.id]} ${stageAccent[s.id]}`
                    : "border-transparent text-white/55 hover:text-white/90"
                }`}
                data-testid={`button-stage-${s.id}`}
              >
                {stageIcons[s.id]}
                {s.label}
              </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px] text-center">
                <p className="text-xs">{s.tip}</p>
              </TooltipContent>
            </Tooltip>
            ))}
          </div>
          <span className="w-px h-4 bg-white/[0.04]" />
          <select
            value={editGenre}
            onChange={(e) => setEditGenre(e.target.value)}
            className="bg-transparent text-white/90 font-mono text-[9px] uppercase tracking-widest border border-white/[0.15] rounded-full px-3 py-1.5 focus:outline-none hover:border-white/25 transition-colors cursor-pointer"
            data-testid="select-genre"
          >
            {genreOptions.map((g) => (
              <option key={g} value={g} className="bg-[#0b101a]">{g}</option>
            ))}
          </select>
          <span className="w-px h-4 bg-white/[0.04]" />
          <button
            onClick={onOpenPlanting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest border border-white/[0.15] text-white/90 hover:text-white/90 hover:border-white/25 transition-all"
            data-testid="button-open-planting"
          >
            <MapPin size={11} />
            {(writing.visibility || "personal") === "personal" ? "Private" : (writing.visibility || "personal") === "circle" ? "Circle" : "Gallery"}
          </button>
        </div>

        <div className="flex items-center gap-2 pb-4 flex-wrap">
          {editTags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[8px] uppercase tracking-widest border border-violet-500/20 bg-violet-500/[0.06] text-violet-300/70">
              {tag}
              <button onClick={() => setEditTags(editTags.filter(t => t !== tag))} className="hover:text-violet-200 transition-colors" data-testid={`remove-tag-${tag}`}>
                <X size={9} />
              </button>
            </span>
          ))}
          {editTags.length < 5 && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder={editTags.length === 0 ? "Add tags..." : "Add..."}
                className="w-24 bg-transparent font-mono text-[9px] uppercase tracking-widest text-white/90 placeholder:text-white/90 focus:outline-none border-b border-transparent focus:border-white/20 transition-colors py-1"
                data-testid="input-tag"
              />
              {tagInput.trim() && (
                <button onClick={addTag} className="text-white/90 hover:text-white/90 transition-colors">
                  <Plus size={11} />
                </button>
              )}
            </div>
          )}
        </div>

        
        <div className="pb-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-white/55 transition-colors"
            data-testid="btn-version-history"
          >
            <Clock size={12} />
            Version History
            {snapshots.length > 0 && <span className="text-white/90">({snapshots.length})</span>}
            <ChevronDown size={10} className={`transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-0 relative pl-4" style={{ borderLeft: 'none' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, rgba(52, 211, 153, 0.2), transparent)' }} />
                  <div className="relative py-2" data-testid="snapshot-current">
                    <div className="absolute -left-[17px] top-3 w-2 h-2 rounded-full bg-emerald-400/60 ring-2 ring-emerald-400/20 animate-pulse" />
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400/70">Current</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest border ${stageColors[editStage] || "border-white/10 text-white/90"}`}>
                        {editStage === "raw_seed" ? "Seed" : editStage === "growing" ? "Growing" : editStage === "ready_to_show" ? "Ready" : "Dormant"}
                      </span>
                      <span className="font-mono text-[8px] text-white/90">{wordCount(editContent)} words</span>
                    </div>
                  </div>

                  {snapshots.length === 0 && (
                    <p className="py-2 font-serif text-[11px] text-white/90 italic">No snapshots yet. Snapshots are saved when you change the readiness stage.</p>
                  )}

                  {snapshots.map((snap, i) => {
                    const compareCount = i === 0 ? wordCount(editContent) : snapshots[i - 1].wordCount;
                    const diff = compareCount - snap.wordCount;
                    return (
                    <button
                      key={snap.id}
                      onClick={() => setPreviewSnapshot(snap)}
                      className="relative w-full text-left py-2 group/snap hover:bg-white/[0.02] rounded-r-lg px-2 -ml-2 transition-colors"
                      data-testid={`snapshot-${snap.id}`}
                    >
                      <div className={`absolute -left-[15px] top-3.5 w-1.5 h-1.5 rounded-full transition-colors ${(snap as any).isManual ? "bg-amber-400/40 group-hover/snap:bg-amber-400/60" : "bg-white/20 group-hover/snap:bg-white/40"}`} />
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest border ${stageColors[snap.readiness] || "border-white/10 text-white/90"}`}>
                          {snap.readiness === "raw_seed" ? "Seed" : snap.readiness === "growing" ? "Growing" : snap.readiness === "ready_to_show" ? "Ready" : "Dormant"}
                        </span>
                        <span className="font-mono text-[8px] text-white/90">{snap.wordCount} words</span>
                        {diff > 0 && <span className="font-mono text-[8px] text-emerald-400/50">+{diff}</span>}
                        {diff < 0 && <span className="font-mono text-[8px] text-rose-400/50">{diff}</span>}
                        <span className="font-mono text-[8px] text-white/90">{timeAgo(snap.createdAt)}</span>
                        {(snap as any).isManual && <span className="font-mono text-[7px] uppercase tracking-widest text-amber-300/50 ml-2">manual</span>}
                      </div>
                      {(snap as any).snapshotNote && <p className="font-mono text-[8px] text-white/90 mt-0.5 italic">"{(snap as any).snapshotNote}"</p>}
                    </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {previewSnapshot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setPreviewSnapshot(null)}
              data-testid="snapshot-preview-overlay"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-popover border border-white/[0.08] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest border ${stageColors[previewSnapshot.readiness] || "border-white/10 text-white/90"}`}>
                      {previewSnapshot.readiness === "raw_seed" ? "Seed" : previewSnapshot.readiness === "growing" ? "Growing" : previewSnapshot.readiness === "ready_to_show" ? "Ready" : "Dormant"}
                    </span>
                    <span className="font-mono text-[9px] text-white/90">{previewSnapshot.wordCount} words</span>
                    <span className="font-mono text-[9px] text-white/90">{timeAgo(previewSnapshot.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditTitle(previewSnapshot.title);
                        setEditContent(previewSnapshot.content);
                        setEditStage(previewSnapshot.readiness);
                        toast({ title: `Restored to snapshot from ${timeAgo(previewSnapshot.createdAt)}` });
                        setPreviewSnapshot(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 font-mono text-[9px] uppercase tracking-widest text-amber-300/80 hover:text-amber-200 transition-all flex items-center gap-1.5"
                      data-testid="btn-restore-snapshot"
                    >
                      <RotateCcw size={11} />
                      Restore this version
                    </button>
                    <button
                      onClick={() => setPreviewSnapshot(null)}
                      className="p-1.5 text-white/90 hover:text-white/90 transition-colors"
                      data-testid="btn-close-preview"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto">
                  <h3 className="font-display text-xl font-light italic text-white/90 mb-4">{previewSnapshot.title || "Untitled"}</h3>
                  <ContentRenderer content={previewSnapshot.content} className="font-serif text-white/55 leading-[1.9]" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mt-4">
          <div className="flex items-center gap-4 mb-3 px-1 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/90">Size</span>
              <input
                type="range"
                min="14"
                max="24"
                value={fontSizeValue}
                onChange={(e) => setFontSizeValue(parseInt(e.target.value))}
                className="w-20 h-1 appearance-none bg-white/10 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/60 [&::-webkit-slider-thumb]:hover:bg-white/80 [&::-webkit-slider-thumb]:transition-colors"
                data-testid="slider-fontsize"
              />
              <span className="font-mono text-[9px] text-white/90 w-6">{fontSizeValue}</span>
            </div>
            <span className="w-px h-4 bg-white/[0.04]" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/90">Font</span>
              <div className="flex gap-1">
                {([
                  { id: "serif", label: "Serif", font: "'Lora', serif" },
                  { id: "display", label: "Display", font: "'Cormorant Garamond', serif" },
                  { id: "typewriter", label: "Typewriter", font: "'Special Elite', 'Courier New', monospace" },
                  { id: "mono", label: "Mono", font: "'Space Mono', monospace" },
                  { id: "sans", label: "Sans", font: "'Inter', sans-serif" },
                ] as const).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEditorFont(f.id)}
                    className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider transition-colors ${
                      editorFont === f.id
                        ? "bg-white/10 text-white/90 border border-white/15"
                        : "text-white/90 hover:text-white/90 border border-transparent"
                    }`}
                    style={{ fontFamily: f.font }}
                    data-testid={`button-font-${f.id}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ fontSize: `${fontSizeValue}px`, fontFamily: editorFont === "serif" ? "'Lora', serif" : editorFont === "display" ? "'Cormorant Garamond', serif" : editorFont === "typewriter" ? "'Special Elite', 'Courier New', monospace" : editorFont === "mono" ? "'Space Mono', monospace" : "'Inter', sans-serif" }}>
            <RichEditor
              content={editContent}
              onChange={setEditContent}
              placeholder="Begin writing..."
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type FeedWriting = Writing & { authorName: string | null };

function MarginaliaCount({ writingId }: { writingId: string }) {
  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ["/api/marginalia", writingId],
    queryFn: async () => {
      const res = await fetch(`/api/marginalia/${writingId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
  if (notes.length === 0) return null;
  return (
    <span className="flex items-center gap-1 font-mono text-[8px] text-white/90" data-testid={`marginalia-count-${writingId}`}>
      <MessageCircle size={10} />
      {notes.length}
    </span>
  );
}

function PauseStoneButton({ writingId }: { writingId: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery<{ count: number; hasPaused: boolean }>({
    queryKey: ["/api/pause-stones", writingId],
    queryFn: async () => {
      const res = await fetch(`/api/writings/${writingId}/pause-stones`, { credentials: "include" });
      if (!res.ok) return { count: 0, hasPaused: false };
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/writings/${writingId}/pause-stone`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pause-stones", writingId] });
    },
  });

  const count = data?.count || 0;
  const hasPaused = data?.hasPaused || false;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!hasPaused) mutation.mutate(); }}
      className={`flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest transition-all group/stone ${
        hasPaused
          ? "text-amber-400/60 cursor-default"
          : "text-white/90 hover:text-amber-400/60 cursor-pointer"
      }`}
      disabled={hasPaused}
      title={hasPaused ? "You paused here" : "Leave a stone — 'someone paused here'"}
      data-testid={`pause-stone-${writingId}`}
    >
      <span className="relative">
        <svg width="12" height="10" viewBox="0 0 12 10" className={`transition-all ${hasPaused ? "text-amber-400/60" : "text-white/90 group-hover/stone:text-amber-400/40"}`}>
          <ellipse cx="6" cy="6" rx="5.5" ry="3.5" fill="currentColor" opacity="0.6" />
          <ellipse cx="6" cy="5" rx="4.5" ry="3" fill="currentColor" />
        </svg>
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function QuietReadButton({ writingId }: { writingId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ hasRead: boolean }>({
    queryKey: ["/api/quiet-read", writingId],
    queryFn: async () => {
      const res = await fetch(`/api/quiet-read/${writingId}`, { credentials: "include" });
      if (!res.ok) return { hasRead: false };
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quiet-read/${writingId}`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/quiet-read", writingId], { hasRead: true });
    },
  });

  const hasRead = data?.hasRead || false;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!hasRead) mutation.mutate(); }}
      className={`group/quiet relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
        hasRead
          ? "text-amber-300/40 hover:text-amber-300/50"
          : "text-white/90 hover:text-white/90"
      }`}
      title={hasRead ? "You were here" : "I was here"}
      data-testid={`button-quiet-read-${writingId}`}
      disabled={isLoading}
    >
      <Eye size={14} />
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] tracking-widest text-white/90 opacity-0 group-hover/quiet:opacity-100 transition-opacity pointer-events-none">
        {hasRead ? "you were here" : "I was here"}
      </span>
    </button>
  );
}

function QuietlyReadIndicator({ writingId }: { writingId: string }) {
  const [showWhispers, setShowWhispers] = useState(false);
  const whisperRef = useRef<HTMLDivElement>(null);
  const { data } = useQuery<{ hasBeenRead: boolean }>({
    queryKey: ["/api/quietly-read", writingId],
    queryFn: async () => {
      const res = await fetch(`/api/quietly-read/${writingId}`, { credentials: "include" });
      if (!res.ok) return { hasBeenRead: false };
      return res.json();
    },
  });

  const { data: whispers = [] } = useQuery<{ whisper: string; createdAt: string | null }[]>({
    queryKey: ["/api/writings", writingId, "whispers"],
    queryFn: async () => {
      const res = await fetch(`/api/writings/${writingId}/whispers`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!data?.hasBeenRead,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (whisperRef.current && !whisperRef.current.contains(e.target as Node)) {
        setShowWhispers(false);
      }
    }
    if (showWhispers) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showWhispers]);

  if (!data?.hasBeenRead) return null;

  return (
    <div className="relative" ref={whisperRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowWhispers(!showWhispers); }}
        className="flex items-center gap-1 text-[8px] font-mono tracking-widest text-amber-300/25 italic hover:text-amber-300/40 transition-colors cursor-pointer"
        data-testid={`indicator-quietly-read-${writingId}`}
      >
        <Eye size={10} className="text-amber-300/30" />
        {whispers.length > 0 ? `${whispers.length} whisper${whispers.length !== 1 ? "s" : ""}` : "someone was here"}
      </button>

      <AnimatePresence>
        {showWhispers && whispers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-50 min-w-[220px] max-w-[300px] rounded-xl border border-amber-500/10 bg-[#0a0a0a]/95 backdrop-blur-xl p-3 shadow-xl"
            data-testid="whispers-list"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {whispers.map((w, i) => (
                <p key={i} className="font-serif italic text-xs text-white/90 leading-relaxed" data-testid={`whisper-${i}`}>
                  {w.whisper}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ReadingRoomSort = "recent" | "quiet" | "tended" | "saved";
const readingRoomGenres = ["all", "poetry", "fiction", "essay", "hybrid", "fragment", "other"];

function CuratedOpportunitiesBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: opps = [] } = useQuery<any[]>({
    queryKey: ["/api/curated-opportunities"],
    queryFn: async () => {
      const res = await fetch("/api/curated-opportunities", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (dismissed || opps.length === 0) return null;

  const display = opps.slice(0, 2);

  return (
    <div className="mb-6 relative" data-testid="curated-opportunities-banner">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/55">From the editors</span>
          <button onClick={() => setDismissed(true)} className="text-white/50 hover:text-white/80 transition-colors" data-testid="btn-dismiss-opps">
            <X size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {display.map((opp: any) => (
            <div key={opp.id} className="flex items-baseline justify-between gap-3" data-testid={`garden-opp-${opp.id}`}>
              <div className="min-w-0">
                {opp.link ? (
                  <a href={opp.link} target="_blank" rel="noopener noreferrer" className="text-sm text-white/85 hover:text-white underline underline-offset-2 decoration-white/20 hover:decoration-white/40 transition-colors">{opp.title}</a>
                ) : (
                  <span className="text-sm text-white/85">{opp.title}</span>
                )}
                {opp.outlet && <span className="ml-2 font-mono text-[8px] uppercase tracking-widest text-white/50">{opp.outlet}</span>}
              </div>
              {opp.deadline && <span className="font-mono text-[8px] text-white/55 whitespace-nowrap flex-shrink-0">{opp.deadline}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type DailyLetterPiece = Writing & { authorName: string | null; authorImage: string | null };

function DailyNudge({ onGoToCafe, onGoToWorkshop }: { onGoToCafe: () => void; onGoToWorkshop: () => void }) {
  const { data: todayQuestion } = useQuery<{ id: string; question: string } | null>({
    queryKey: ["/api/cafe/today"],
    queryFn: async () => {
      const res = await fetch("/api/cafe/today", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: promptOfDay } = useQuery<{ id: string; title: string; prompt: string } | null>({
    queryKey: ["/api/workshop/prompt-of-day"],
    queryFn: async () => {
      const res = await fetch("/api/workshop/prompt-of-day", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: liveCounts } = useQuery<{ cafeResponses: number; workshopResponses: number }>({
    queryKey: ["/api/community/live-counts"],
    queryFn: async () => {
      const res = await fetch("/api/community/live-counts", { credentials: "include" });
      if (!res.ok) return { cafeResponses: 0, workshopResponses: 0 };
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (!todayQuestion && !promptOfDay) return null;

  return (
    <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 hidden" data-testid="daily-nudge">
      <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/90">Daily Nudge</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {todayQuestion && (
          <button
            onClick={onGoToCafe}
            className="text-left p-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-all group"
            data-testid="nudge-cafe"
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/50 flex items-center gap-1.5 mb-1.5">
              <Compass size={10} />
              The Cafe
            </span>
            <p className="font-display text-sm font-light italic text-white/90 group-hover:text-white/75 transition-colors leading-snug line-clamp-2">
              "{todayQuestion.question}"
            </p>
            {liveCounts && liveCounts.cafeResponses > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="relative flex h-1 w-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400/40" />
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-amber-400/60" />
                </span>
                <span className="font-mono text-[8px] text-amber-400/40">{liveCounts.cafeResponses} writing today</span>
              </div>
            )}
          </button>
        )}
        {promptOfDay && (
          <button
            onClick={onGoToWorkshop}
            className="text-left p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] transition-all group"
            data-testid="nudge-workshop"
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-emerald-400/50 flex items-center gap-1.5 mb-1.5">
              <Feather size={10} />
              Workshop
            </span>
            <p className="font-serif text-sm text-white/55 group-hover:text-white/90 transition-colors leading-snug line-clamp-2">
              {promptOfDay.title || promptOfDay.prompt}
            </p>
            {liveCounts && liveCounts.workshopResponses > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="relative flex h-1 w-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/40" />
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-400/60" />
                </span>
                <span className="font-mono text-[8px] text-emerald-400/40">{liveCounts.workshopResponses} writing today</span>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ReadingRoomZone({ onViewProfile, onGoToRoom }: { onViewProfile?: (userId: string) => void; onGoToRoom?: (room: ActiveRoom) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dailyLetterExpanded, setDailyLetterExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [activeSort, setActiveSort] = useState<ReadingRoomSort>("recent");     const [readingRoomSearch, setReadingRoomSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const perPage = 8;

  const { data: dailyLetter, isLoading: loadingDailyLetter } = useQuery<DailyLetterPiece | null>({
    queryKey: ["/api/daily-letter"],
    queryFn: async () => {
      const res = await fetch("/api/daily-letter", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: tendingFeed = [], isLoading: loadingTending } = useQuery<FeedWriting[]>({
    queryKey: ["/api/tending-feed"],
    queryFn: async () => {
      const res = await fetch("/api/tending-feed", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: gardenFeed = [], isLoading: loadingGarden } = useQuery<FeedWriting[]>({
    queryKey: ["/api/garden-feed"],
    queryFn: async () => {
      const res = await fetch("/api/garden-feed", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  type BookshelfEntry = { id: string; writingId: string; savedAt: string; title: string | null; content: string; genre: string | null; authorId: string; authorName: string | null };
  const { data: bookshelf = [], isLoading: loadingBookshelf } = useQuery<BookshelfEntry[]>({
    queryKey: ["/api/bookshelf"],
    queryFn: async () => {
      const res = await fetch("/api/bookshelf", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookshelf");
      return res.json();
    },
    enabled: activeSort === "saved",
  });

  if (loadingTending || loadingGarden || loadingDailyLetter || (activeSort === "saved" && loadingBookshelf)) return <ReadingRoomSkeleton />;

  const tendedAuthorIds = new Set(tendingFeed.map(p => p.authorId));

  const seen = new Set<string>();
  const allPieces: FeedWriting[] = [];
  for (const piece of tendingFeed) {
    if (!seen.has(piece.id) && piece.readiness !== "dormant") { seen.add(piece.id); allPieces.push(piece); }
  }
  for (const piece of gardenFeed) {
    if (!seen.has(piece.id) && piece.readiness !== "dormant") { seen.add(piece.id); allPieces.push(piece); }
  }

  let filteredPieces = genreFilter === "all"
    ? [...allPieces]
    : allPieces.filter(p => p.genre === genreFilter);

  if (readingRoomSearch.trim()) {     const q = readingRoomSearch.toLowerCase();     filteredPieces = filteredPieces.filter(p => (p.title || "").toLowerCase().includes(q) || (p.authorName || "").toLowerCase().includes(q) || (p.content || "").toLowerCase().includes(q));   }
      if (activeSort === "tended") {  
  filteredPieces = filteredPieces.filter(p => tendedAuthorIds.has(p.authorId));
  }

  if (activeSort === "recent" || activeSort === "tended") {
    filteredPieces.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  } else if (activeSort === "quiet") {
    filteredPieces.sort((a, b) => new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime());
  }

  if (dailyLetter) {
    filteredPieces = filteredPieces.filter(p => p.id !== dailyLetter.id);
  }

  const visiblePieces = filteredPieces.slice(0, page * perPage);
  const hasMore = filteredPieces.length > visiblePieces.length;

  const sortOptions: { id: ReadingRoomSort; label: string }[] = [
    { id: "recent", label: "Recent" },
    { id: "quiet", label: "Quiet" },
    { id: "tended", label: "Tended" },
    { id: "saved", label: "Saved" },
  ];

  const dailyLetterContentWords = dailyLetter ? wordCount(dailyLetter.content) : 0;
  const shouldTruncateDailyLetter = dailyLetterContentWords > 500 && !dailyLetterExpanded;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 border-b border-white/[0.06] pb-5">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen size={16} className="text-emerald-400/50" />
          <h2 className="text-xl font-semibold tracking-tight text-white/90">Reading Room</h2>
        </div>
        <p className="text-sm text-white/60">Recent writing from gardens you follow, plus new pieces worth reading.</p>
        <div className="mt-3">
          <WhosHereStrip />
        </div>
      </div>

              <DailyNudge
        onGoToCafe={() => onGoToRoom?.("tables")}
        onGoToWorkshop={() => onGoToRoom?.("workshop")}
      />

      {dailyLetter && (
        <div className="mb-10" data-testid="daily-letter-card">
          <div className="rounded-2xl border border-amber-500/10 bg-amber-950/[0.06] p-7 md:p-9 space-y-5"
            style={{ boxShadow: "0 0 40px rgba(245, 158, 11, 0.03)" }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/50">
              Today's Letter
            </span>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => onViewProfile?.(dailyLetter.authorId)}
                className="flex items-center gap-2.5 text-white/55 hover:text-white/75 transition-colors"
                data-testid="daily-letter-author"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500/[0.08] border border-amber-500/20 flex items-center justify-center text-amber-300/60 font-mono text-[10px] uppercase">
                  {dailyLetter.authorName?.[0] || "?"}
                </div>
                <span className="font-serif text-sm">{dailyLetter.authorName || "Anonymous"}</span>
              </button>
              <span className="font-mono text-[8px] text-white/90">{timeAgo(dailyLetter.createdAt)}</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white/90 leading-snug" data-testid="daily-letter-title">
              {dailyLetter.title || "Untitled"}
            </h3>

            <div className="pt-2">
              <ContentRenderer
                content={dailyLetter.content}
                maxLength={shouldTruncateDailyLetter ? 2500 : undefined}
                className="text-[15px] leading-8 text-white/75"
              />
              {shouldTruncateDailyLetter && (
                <button
                  onClick={() => setDailyLetterExpanded(true)}
                  className="mt-4 font-mono text-[10px] uppercase tracking-widest text-amber-400/50 hover:text-amber-400/70 transition-colors"
                  data-testid="daily-letter-continue-reading"
                >
                  Continue reading →
                </button>
              )}
            </div>

            <div className="pt-3 space-y-4">
              <div className="flex items-center gap-3">
                <QuietReadButton writingId={dailyLetter.id} />
                <span className="w-px h-3 bg-white/[0.06]" />
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/90">{dailyLetter.genre}</span>
                <span className="font-mono text-[8px] text-white/90">{dailyLetterContentWords} words</span>
                <div className="ml-auto">
                  <TendButton gardenerId={dailyLetter.authorId} size="sm" />
                </div>
              </div>
              <ResonanceBar writingId={dailyLetter.id} />
              {dailyLetterExpanded && (
                <MarginaliaSection writingId={dailyLetter.id} authorId={dailyLetter.authorId} />
              )}
            </div>
          </div>

          {(allPieces.length > 1 || (allPieces.length === 1 && allPieces[0].id !== dailyLetter.id)) && (
            <div className="flex items-center gap-4 mt-10 mb-2">
              <div className="flex-1 border-t border-white/[0.04]" />
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/55">More from the Garden</span>
              <div className="flex-1 border-t border-white/[0.04]" />
            </div>
          )}
        </div>
      )}

      <div className="relative mb-4"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" /><input type="text" value={readingRoomSearch} onChange={(e) => { setReadingRoomSearch(e.target.value); setPage(1); }} placeholder="Search by title, author, or keyword..." className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-9 pr-4 text-sm text-white/80 placeholder:text-white/35 outline-none transition-all focus:border-white/[0.16]" data-testid="input-reading-room-search" /></div><CuratedOpportunitiesBanner />

      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {sortOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSort(s.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all border ${
                activeSort === s.id
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300/90"
                  : "border-white/[0.06] text-white/60 hover:text-white/85 hover:border-white/15"
              }`}
              data-testid={`sort-${s.id}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {readingRoomGenres.map((g) => (
            <button
              key={g}
              onClick={() => { setGenreFilter(g); setPage(1); }}
              className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all border ${
                genreFilter === g
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300/90"
                  : "border-transparent text-white/55 hover:text-white/85"
              }`}
              data-testid={`genre-filter-${g}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {activeSort === "saved" ? (
        <>
          {bookshelf.length === 0 ? (
            <div className="border border-dashed border-white/[0.06] rounded-2xl p-16 text-center space-y-4" data-testid="saved-pieces-empty">
              <Bookmark size={32} className="mx-auto text-white/20" />
              <h3 className="text-lg font-semibold tracking-tight text-white/70">Nothing saved yet</h3>
              <p className="font-serif text-sm text-white/50 italic max-w-xs mx-auto leading-relaxed">
                Hover a piece in the Reading Room and click the bookmark icon to save it here.
              </p>
            </div>
          ) : (
            <div className="space-y-6" data-testid="saved-pieces-list">
              {bookshelf.map((entry) => {
                const isExpanded = expandedId === entry.writingId;
                return (
                  <motion.article
                    key={entry.writingId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group/card relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden"
                    onClick={() => setExpandedId(isExpanded ? null : entry.writingId)}
                    data-testid={`saved-piece-${entry.writingId}`}
                  >
                    <div className="px-5 md:px-6 py-5 md:py-6">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewProfile?.(entry.authorId); }}
                          className="font-mono text-[10px] uppercase tracking-widest text-white/55 hover:text-white/80 transition-colors"
                        >
                          {entry.authorName || "Unknown"}
                        </button>
                        <BookmarkButton writingId={entry.writingId} />
                      </div>
                      <h3 className="mb-2 text-lg md:text-xl font-semibold tracking-tight text-white/90 leading-snug">
                        {entry.title || "Untitled"}
                      </h3>
                      {isExpanded ? (
                        <ContentRenderer content={entry.content} maxLength={2000} className="text-white/75 leading-8" />
                      ) : (
                        <ContentRenderer content={entry.content} maxLength={250} className="text-white/70 leading-7 line-clamp-3" />
                      )}
                      {!isExpanded && (
                        <div className="flex items-center gap-3 mt-3 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">{entry.genre}</span>
                          <ResonanceBar writingId={entry.writingId} compact />
                        </div>
                      )}
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">{entry.genre}</span>
                              <TendButton gardenerId={entry.authorId} size="sm" />
                            </div>
                            <ResonanceBar writingId={entry.writingId} />
                            <MarginaliaSection writingId={entry.writingId} authorId={entry.authorId} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {allPieces.length === 0 && (
            <div className="relative border border-dashed border-emerald-700/15 rounded-3xl p-16 text-center space-y-4 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(6,78,59,0.06) 0%, transparent 60%)" }} />
              <Feather size={32} className="relative mx-auto text-emerald-500/25" />
              <h3 className="relative text-xl font-semibold tracking-tight text-white/90">No letters yet</h3>
              <p className="relative font-serif text-sm text-white/90 max-w-sm mx-auto leading-relaxed">
                When writers share their work to the garden, or you tend someone's garden, their pieces will appear here like letters slid under your door.
              </p>
            </div>
          )}

          {allPieces.length > 0 && filteredPieces.length === 0 && (
            <div className="border border-dashed border-white/[0.06] rounded-2xl p-12 text-center space-y-3">
3588
3588

              <Eye size={24} className="mx-auto text-white/90" />
              <p className="font-serif text-sm text-white/90 italic">
                {activeSort === "tended"
                  ? "No pieces from writers you're tending yet. Tend a garden to see their work here."
                  : "No pieces match this filter."}
              </p>
            </div>
          )}

          <div className="space-y-6">
        {visiblePieces.map((piece, i) => {
          const isExpanded = expandedId === piece.id;
          return (
            <motion.article
              key={piece.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              className="group group/card"
              data-testid={`letter-${piece.id}`}
            >
              <div className={`rounded-2xl border transition-all duration-300 ${
                isExpanded ? "border-emerald-700/20 bg-emerald-950/20" : "border-transparent hover:border-emerald-800/15"
              }`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : piece.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedId(isExpanded ? null : piece.id); }}
                  className="w-full text-left p-5 md:p-6 cursor-pointer"
                  data-testid={`button-open-letter-${piece.id}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); onViewProfile?.(piece.authorId); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onViewProfile?.(piece.authorId); } }}
                      className="flex items-center gap-2 text-white/90 hover:text-white/75 transition-colors cursor-pointer"
                      data-testid={`link-author-${piece.id}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.15] flex items-center justify-center text-white/90 font-mono text-[8px] uppercase">
                        {piece.authorName?.[0] || "?"}
                      </div>
                      <span className="font-serif text-xs">{piece.authorName || "Anonymous"}</span>
                    </span>
                    <span className="font-mono text-[8px] text-white/90">{timeAgo(piece.updatedAt)}</span>
                  </div>

                  <h3 className="mb-2 text-lg md:text-xl font-semibold tracking-tight text-white/90 leading-snug">
                    {piece.title || "Untitled"}
                  </h3>

                  {isExpanded ? (
                    <ContentRenderer content={piece.content} maxLength={2000} className="text-white/75 leading-8" />
                  ) : (
                    <ContentRenderer content={piece.content} maxLength={250} className="text-white/70 leading-7 line-clamp-3" />
                  )}

                  {!isExpanded && (
                    <div className="flex items-center gap-3 mt-3 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                      <div onClick={(e) => e.stopPropagation()}>
                        <QuietReadButton writingId={piece.id} />
                      </div>
                      <span className="w-px h-3 bg-white/[0.06]" />
                      <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">{piece.genre}</span>
                      <ResonanceBar writingId={piece.id} compact />
                      <MarginaliaCount writingId={piece.id} /><BookmarkButton writingId={piece.id} />
                      <PauseStoneButton writingId={piece.id} />
                                          <TendButton gardenerId={piece.authorId} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(piece.id); }}
                        className="flex items-center gap-1 font-mono text-[8px] text-white/90 hover:text-white/90 transition-colors"
                        data-testid={`button-respond-${piece.id}`}
                      >
                        <MessageCircle size={9} />
                        respond
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <QuietReadButton writingId={piece.id} />
                            <PauseStoneButton writingId={piece.id} />
                            <span className="w-px h-3 bg-white/[0.06]" />
                            <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">{piece.genre}</span>
                            <span className="font-mono text-[8px] text-white/90">{wordCount(piece.content)} words</span>
                          </div>
                          <TendButton gardenerId={piece.authorId} size="sm" />
                        </div>
                        <ResonanceBar writingId={piece.id} />
                        <MarginaliaSection writingId={piece.id} authorId={piece.authorId} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!isExpanded && <div className="border-b border-white/[0.03] mx-6 mt-2" />}
            </motion.article>
          );
        })}
      </div>

      {hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={() => setPage(p => p + 1)}
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/[0.20] hover:border-white/25 rounded-full font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-white/90 transition-all"
            data-testid="button-more-letters"
          >
            <Feather size={12} />
            More letters
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
}

const greenhouseTools = [
  { id: "freewrite" as const, label: "Freewrite", desc: "A typewriter with optional timer — pure flow writing with timed sessions to build your practice.", icon: <PenLine size={20} />, color: "warmGray" },
  { id: "growth-journal" as const, label: "Growth Journal", desc: "A private space to reflect on your writing journey — celebrate progress, note struggles, track what you're learning", icon: <NotebookPen size={20} />, color: "emerald" },
  { id: "circles" as const, label: "Circles", desc: "Create or join small writing groups for ongoing conversation and mutual support", icon: <Users size={20} />, color: "indigo" },
  { id: "compost" as const, label: "The Compost Pile", desc: "Browse fragments from composted writings — one person's abandoned darling becomes another's spark", icon: <Leaf size={20} />, color: "amber" },
];

const toolColorMap: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  emerald: { border: "border-emerald-400/25", text: "text-emerald-400/80", bg: "hover:bg-emerald-500/[0.08]", glow: "rgba(16,185,129,0.15)" },
  sky: { border: "border-sky-400/25", text: "text-sky-400/80", bg: "hover:bg-sky-500/[0.08]", glow: "rgba(14,165,233,0.15)" },
  amber: { border: "border-amber-400/25", text: "text-amber-400/80", bg: "hover:bg-amber-500/[0.08]", glow: "rgba(245,158,11,0.15)" },
  violet: { border: "border-violet-400/25", text: "text-violet-400/80", bg: "hover:bg-violet-500/[0.08]", glow: "rgba(139,92,246,0.15)" },
  pink: { border: "border-pink-400/25", text: "text-pink-400/80", bg: "hover:bg-pink-500/[0.08]", glow: "rgba(236,72,153,0.15)" },
  indigo: { border: "border-indigo-400/25", text: "text-indigo-400/80", bg: "hover:bg-indigo-500/[0.08]", glow: "rgba(99,102,241,0.15)" },
  warmGray: { border: "border-stone-400/25", text: "text-stone-300/80", bg: "hover:bg-stone-500/[0.08]", glow: "rgba(168,162,158,0.15)" },
};

function GreenhouseZone() {
  const [activeTool, setActiveTool] = useState<GreenhouseTool>(null);

  if (activeTool) {
    return <GreenhouseToolView tool={activeTool} onBack={() => setActiveTool(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 border-b border-white/[0.06] pb-5">
        <div className="mb-2 flex items-center gap-2">
          <TreePine size={18} className="text-teal-400/60" />
          <h2 className="text-2xl font-semibold tracking-tight text-white/90">Practice</h2>
        </div>
        <p className="max-w-2xl text-sm text-white/60 leading-relaxed">
          A private space just for you. Tend your practice, track your energy, and nurture your creative life. No one else can see what's here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {greenhouseTools.map((tool, i) => {
          const colors = toolColorMap[tool.color];
          return (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              onClick={() => setActiveTool(tool.id)}
              className={`relative overflow-hidden rounded-2xl border bg-white/[0.03] p-6 text-left transition-all duration-300 group ${colors.border}`}
              data-testid={`tool-${tool.id}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                background: `radial-gradient(ellipse at 30% 80%, ${colors.glow} 0%, rgba(6,78,59,0.05) 50%, transparent 80%)`,
              }} />
              <div className="absolute bottom-0 right-0 w-32 h-20 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none" style={{
                background: `radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.3) 0%, transparent 70%)`,
              }} />
              <div className="relative z-10">
                <div className={`${colors.text} mb-3 w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:bg-white/[0.08] transition-all`}>
                  {tool.icon}
                </div>
                <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-white/85 group-hover:text-white transition-colors">
                  {tool.label}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed group-hover:text-white/75 transition-colors">{tool.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function CompostPileView() {
  const queryClient = useQueryClient();
  const { data: compostPile = [], isLoading } = useQuery<{ id: string; content: string; createdAt: string; isRecycled: boolean }[]>({
    queryKey: ["/api/compost/pile"],
    queryFn: async () => {
      const res = await fetch("/api/compost/pile", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: stats } = useQuery<{ totalFragments: number; todayFragments: number }>({
    queryKey: ["/api/compost/stats"],
    queryFn: async () => {
      const res = await fetch("/api/compost/stats", { credentials: "include" });
      if (!res.ok) return { totalFragments: 0, todayFragments: 0 };
      return res.json();
    },
  });

  const recycleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/compost/${id}/recycle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compost/pile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compost/stats"] });
      toast({ title: "Fragment gathered", description: "This fragment has been picked from the compost pile." });
    },
  });

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-white/[0.03] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {stats && (
        <div className="flex items-center gap-6 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/90">Total fragments</span>
            <span className="font-mono text-sm text-amber-400/60">{stats.totalFragments}</span>
          </div>
          {stats.todayFragments > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/90">Today's compost</span>
              <span className="font-mono text-sm text-amber-400/60">{stats.todayFragments}</span>
            </div>
          )}
        </div>
      )}

      {compostPile.length === 0 ? (
        <div className="border border-dashed border-amber-700/15 rounded-3xl p-16 text-center space-y-4">
          <Leaf size={32} className="mx-auto text-amber-500/20" />
          <h3 className="text-xl font-display font-light italic text-white/90">The compost pile is empty</h3>
          <p className="font-serif text-sm text-white/90 max-w-sm mx-auto leading-relaxed">
            When writers compost pieces they're letting go of, fragments of language drift here.
            One person's abandoned darling becomes another's spark.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {compostPile.map((fragment, i) => (
            <motion.div
              key={fragment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="group/fragment relative rounded-xl border border-amber-500/10 bg-amber-950/[0.04] p-5 hover:border-amber-500/20 hover:bg-amber-950/[0.08] transition-all"
            >
              <p className="font-serif text-sm text-white/90 italic leading-relaxed pr-8">
                "{fragment.content}"
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-mono text-[8px] text-white/90">
                  {new Date(fragment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                {!fragment.isRecycled && (
                  <button
                    onClick={() => recycleMutation.mutate(fragment.id)}
                    className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest text-amber-400/40 hover:text-amber-300/70 transition-colors opacity-0 group-hover/fragment:opacity-100"
                    title="Pick this fragment — save it to spark new work"
                    data-testid={`recycle-fragment-${fragment.id}`}
                  >
                    <Sparkles size={10} />
                    Gather this spark
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function GreenhouseToolView({ tool, onBack }: { tool: NonNullable<GreenhouseTool>; onBack: () => void }) {
  const toolInfo = greenhouseTools.find(t => t.id === tool)!;

  const toolContent: Record<string, React.ReactNode> = {
    "freewrite": <FreewriteView />,
    "growth-journal": <GrowthJournalView />,
    "circles": <CirclesView />,
    "compost": <CompostPileView />,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/90 hover:text-white/75 transition-colors group mb-6"
        data-testid="button-back-greenhouse"
      >
        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Greenhouse
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className={`${toolColorMap[toolInfo.color].text}`}>{toolInfo.icon}</div>
        <h2 className="text-2xl font-display font-light italic text-white/80">{toolInfo.label}</h2>
      </div>
      <p className="font-serif text-sm text-white/55 leading-relaxed mt-1 max-w-lg">{toolInfo.desc}</p>
      {toolContent[tool]}
    </div>
  );
}

function useTypewriterSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const sr = ctx.sampleRate;

      const len = sr * 0.5;
      const buf = ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      noiseBufferRef.current = buf;

      const revLen = sr * 0.4;
      const revBuf = ctx.createBuffer(1, revLen, sr);
      const revData = revBuf.getChannelData(0);
      for (let i = 0; i < revLen; i++) {
        revData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.12));
      }
      const conv = ctx.createConvolver();
      conv.buffer = revBuf;
      convolverRef.current = conv;

      const master = ctx.createGain();
      master.gain.value = 0.55;
      masterGainRef.current = master;

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.15;
      conv.connect(wetGain).connect(master);
      master.connect(ctx.destination);
    }
    return audioCtxRef.current;
  }, []);

  const noise = useCallback((ctx: AudioContext) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBufferRef.current;
    return src;
  }, []);

  const getDest = useCallback(() => {
    return masterGainRef.current || getCtx().destination;
  }, [getCtx]);

  const getWet = useCallback(() => {
    return convolverRef.current || getCtx().destination;
  }, [getCtx]);

  const playKey = useCallback(() => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      const dest = getDest();
      const wet = getWet();
      const p = 0.6 + Math.random() * 0.25;

      const tick = noise(ctx);
      const tickLp = ctx.createBiquadFilter();
      tickLp.type = "lowpass";
      tickLp.frequency.value = 3200 + Math.random() * 400;
      tickLp.Q.value = 0.3;
      const tickG = ctx.createGain();
      tickG.gain.setValueAtTime(0, t);
      tickG.gain.linearRampToValueAtTime(0.04 * p, t + 0.002);
      tickG.gain.exponentialRampToValueAtTime(0.003 * p, t + 0.015);
      tickG.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
      tick.connect(tickLp).connect(tickG);
      tickG.connect(dest);
      tickG.connect(wet);
      tick.start(t);
      tick.stop(t + 0.08);

      const body = noise(ctx);
      const bodyLp = ctx.createBiquadFilter();
      bodyLp.type = "lowpass";
      bodyLp.frequency.value = 220 + Math.random() * 80;
      bodyLp.Q.value = 1.8;
      const bodyG = ctx.createGain();
      bodyG.gain.setValueAtTime(0, t);
      bodyG.gain.linearRampToValueAtTime(0.12 * p, t + 0.003);
      bodyG.gain.exponentialRampToValueAtTime(0.02 * p, t + 0.035);
      bodyG.gain.exponentialRampToValueAtTime(0.0005, t + 0.18);
      body.connect(bodyLp).connect(bodyG);
      bodyG.connect(dest);
      bodyG.connect(wet);
      body.start(t + 0.001);
      body.stop(t + 0.2);

      const hum = ctx.createOscillator();
      hum.type = "sine";
      hum.frequency.value = 110 + Math.random() * 30;
      const humG = ctx.createGain();
      humG.gain.setValueAtTime(0, t);
      humG.gain.linearRampToValueAtTime(0.012 * p, t + 0.005);
      humG.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      hum.connect(humG);
      humG.connect(dest);
      hum.start(t + 0.003);
      hum.stop(t + 0.15);
    } catch {}
  }, [getCtx, noise, getDest, getWet]);

  const playSpace = useCallback(() => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      const dest = getDest();
      const wet = getWet();

      const tap = noise(ctx);
      const tapBp = ctx.createBiquadFilter();
      tapBp.type = "bandpass";
      tapBp.frequency.value = 900;
      tapBp.Q.value = 0.4;
      const tapG = ctx.createGain();
      tapG.gain.setValueAtTime(0, t);
      tapG.gain.linearRampToValueAtTime(0.045, t + 0.002);
      tapG.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
      tap.connect(tapBp).connect(tapG);
      tapG.connect(dest);
      tapG.connect(wet);
      tap.start(t);
      tap.stop(t + 0.06);

      const cushion = noise(ctx);
      const cushionLp = ctx.createBiquadFilter();
      cushionLp.type = "lowpass";
      cushionLp.frequency.value = 180;
      cushionLp.Q.value = 2.0;
      const cushionG = ctx.createGain();
      cushionG.gain.setValueAtTime(0, t);
      cushionG.gain.linearRampToValueAtTime(0.16, t + 0.003);
      cushionG.gain.exponentialRampToValueAtTime(0.03, t + 0.05);
      cushionG.gain.exponentialRampToValueAtTime(0.0005, t + 0.22);
      cushion.connect(cushionLp).connect(cushionG);
      cushionG.connect(dest);
      cushionG.connect(wet);
      cushion.start(t + 0.001);
      cushion.stop(t + 0.25);

      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 75;
      const subG = ctx.createGain();
      subG.gain.setValueAtTime(0, t);
      subG.gain.linearRampToValueAtTime(0.025, t + 0.006);
      subG.gain.exponentialRampToValueAtTime(0.0005, t + 0.2);
      sub.connect(subG);
      subG.connect(dest);
      sub.start(t + 0.003);
      sub.stop(t + 0.22);
    } catch {}
  }, [getCtx, noise, getDest, getWet]);

  const playReturn = useCallback(() => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      const dest = getDest();
      const wet = getWet();

      const click = noise(ctx);
      const clickLp = ctx.createBiquadFilter();
      clickLp.type = "lowpass";
      clickLp.frequency.value = 2400;
      clickLp.Q.value = 0.4;
      const clickG = ctx.createGain();
      clickG.gain.setValueAtTime(0, t);
      clickG.gain.linearRampToValueAtTime(0.06, t + 0.002);
      clickG.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
      click.connect(clickLp).connect(clickG);
      clickG.connect(dest);
      clickG.connect(wet);
      click.start(t);
      click.stop(t + 0.06);

      const slide = noise(ctx);
      const slideBp = ctx.createBiquadFilter();
      slideBp.type = "bandpass";
      slideBp.frequency.setValueAtTime(500, t + 0.02);
      slideBp.frequency.exponentialRampToValueAtTime(180, t + 0.3);
      slideBp.Q.value = 0.25;
      const slideG = ctx.createGain();
      slideG.gain.setValueAtTime(0, t + 0.02);
      slideG.gain.linearRampToValueAtTime(0.035, t + 0.06);
      slideG.gain.exponentialRampToValueAtTime(0.0005, t + 0.35);
      slide.connect(slideBp).connect(slideG);
      slideG.connect(dest);
      slideG.connect(wet);
      slide.start(t + 0.02);
      slide.stop(t + 0.4);

      const chime = ctx.createOscillator();
      chime.type = "sine";
      chime.frequency.value = 1200;
      const chimeG = ctx.createGain();
      chimeG.gain.setValueAtTime(0, t + 0.04);
      chimeG.gain.linearRampToValueAtTime(0.015, t + 0.06);
      chimeG.gain.exponentialRampToValueAtTime(0.0005, t + 0.7);
      chime.connect(chimeG);
      chimeG.connect(dest);
      chimeG.connect(wet);
      chime.start(t + 0.04);
      chime.stop(t + 0.75);

      const settle = noise(ctx);
      const settleLp = ctx.createBiquadFilter();
      settleLp.type = "lowpass";
      settleLp.frequency.value = 200;
      settleLp.Q.value = 1.5;
      const settleG = ctx.createGain();
      settleG.gain.setValueAtTime(0, t + 0.25);
      settleG.gain.linearRampToValueAtTime(0.05, t + 0.28);
      settleG.gain.exponentialRampToValueAtTime(0.0005, t + 0.45);
      settle.connect(settleLp).connect(settleG);
      settleG.connect(dest);
      settle.start(t + 0.25);
      settle.stop(t + 0.5);
    } catch {}
  }, [getCtx, noise, getDest, getWet]);

  return { playKey, playSpace, playReturn };
}

function FreewriteView() {
  const [text, setText] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [planted, setPlanted] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { playKey, playSpace, playReturn } = useTypewriterSound();

  function startTimer(minutes: number) {
    setTimerDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimerRunning(false);
          fetch("/api/rituals", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: "timed_write", duration: minutes, wordsWritten: 0, notes: "" }) })
            .then(() => queryClient.invalidateQueries({ queryKey: ["/api/rituals"] }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setTimerDuration(null);
    setTimeLeft(0);
  }

  const timerMins = Math.floor(timeLeft / 60);
  const timerSecs = timeLeft % 60;

  const plantMutation = useMutation({
    mutationFn: async () => {
      const firstLine = text.trim().split("\n")[0].slice(0, 60);
      const title = firstLine || "Freewrite";
      const res = await fetch("/api/writings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, content: text, genre: "fragment", stage: "raw_seed", readiness: "raw_seed", visibility: "personal" }),
      });
      if (!res.ok) throw new Error("Failed to plant");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
      setPlanted(true);
    },
  });

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, [isFullscreen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!soundEnabled) return;
    if (e.key === "Enter") playReturn();
    else if (e.key === " ") playSpace();
    else if (e.key.length === 1) playKey();
  }, [soundEnabled, playKey, playSpace, playReturn]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const editorContent = (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-[#1a1612]" : ""}`}>
      {isFullscreen && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-600/30 to-transparent" />
      )}
      <div className={`flex items-center justify-between flex-wrap gap-2 ${isFullscreen ? "px-8 pt-6 pb-2" : "mb-4"}`}>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-stone-500">
            {wordCount} words
          </span>
          <span className="text-stone-700">|</span>
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-stone-500">
            {charCount} chars
          </span>
          {isTimerRunning && (
            <>
              <span className="text-stone-700">|</span>
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-amber-400/80 tabular-nums">
                {timerMins}:{timerSecs.toString().padStart(2, "0")}
              </span>
              <button onClick={stopTimer} className="font-mono text-[8px] tracking-widest uppercase text-stone-600 hover:text-stone-400 transition-colors" data-testid="button-stop-timer">stop</button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isTimerRunning && (
            <div className="flex items-center gap-1">
              <Flame size={11} className="text-stone-600" />
              {[5, 10, 15, 25].map(d => (
                <button key={d} onClick={() => startTimer(d)} className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full text-stone-600 hover:text-amber-400/80 hover:bg-amber-500/[0.06] transition-all" data-testid={`button-timer-${d}`} title={`${d} minute timed session`}>{d}m</button>
              ))}
            </div>
          )}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`font-mono text-[9px] tracking-widest uppercase px-3 py-1 rounded-full border transition-all ${
              soundEnabled
                ? "border-stone-500/30 text-stone-400 bg-stone-500/10"
                : "border-stone-700/30 text-stone-600"
            }`}
            data-testid="button-toggle-sound"
          >
            {soundEnabled ? "sound on" : "sound off"}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="font-mono text-[9px] tracking-widest uppercase px-3 py-1 rounded-full border border-stone-600/20 text-stone-500 hover:text-stone-300 hover:border-stone-500/30 transition-all"
            data-testid="button-toggle-fullscreen"
          >
            {isFullscreen ? "exit" : "focus mode"}
          </button>
        </div>
      </div>

      <div
        className={`relative ${
          isFullscreen
            ? "h-[calc(100vh-80px)] px-8"
            : "min-h-[400px]"
        }`}
        style={{
          background: isFullscreen
            ? "radial-gradient(ellipse at 50% 30%, rgba(168,162,158,0.04) 0%, transparent 70%)"
            : undefined,
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing. Don't think. Don't stop. Just let the words come..."
          className={`w-full h-full bg-transparent border-none outline-none resize-none leading-[2] tracking-wide ${
            isFullscreen
              ? "text-lg text-stone-300/90 placeholder:text-stone-600/50 max-w-2xl mx-auto pt-8"
              : "text-sm text-stone-300/80 placeholder:text-stone-600/40 p-4 border border-stone-600/15 rounded-xl bg-stone-900/20 min-h-[400px]"
          }`}
          style={{ fontFamily: "'Special Elite', 'Courier New', monospace" }}
          data-testid="textarea-freewrite"
          spellCheck={false}
        />

        {text.length === 0 && (
          <div className={`absolute pointer-events-none ${isFullscreen ? "bottom-16 left-1/2 -translate-x-1/2" : "bottom-6 left-1/2 -translate-x-1/2"}`}>
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="font-mono text-[8px] tracking-[0.4em] uppercase text-stone-600"
            >
              just begin
            </motion.div>
          </div>
        )}
      </div>

      {text.length > 0 && (
        <div className={`flex items-center justify-between ${isFullscreen ? "px-8 pb-4" : "mt-3"}`}>
          <button
            onClick={() => { if (confirm("Clear everything? This freewrite is meant to be ephemeral — the words served their purpose.")) { setText(""); setPlanted(false); } }}
            className="font-mono text-[9px] tracking-widest uppercase text-stone-600 hover:text-stone-400 transition-colors"
            data-testid="button-clear-freewrite"
          >
            clear page
          </button>
          {planted ? (
            <span className="font-mono text-[9px] tracking-widest uppercase text-emerald-400/70">
              Planted in your desk
            </span>
          ) : (
            <button
              onClick={() => plantMutation.mutate()}
              disabled={plantMutation.isPending || text.trim().length < 10}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] font-mono text-[9px] tracking-widest uppercase text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/[0.1] hover:border-emerald-500/40 disabled:opacity-30 transition-all"
              data-testid="button-plant-freewrite"
            >
              <Sprout size={13} />
              {plantMutation.isPending ? "Planting..." : "Plant this"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return editorContent;
}

function GrowthJournalView() {
  const [tab, setTab] = useState<"journal" | "prompts">("journal");
  const { data: entries = [] } = useQuery<any[]>({
    queryKey: ["/api/growth-journal"],
    queryFn: async () => { const r = await fetch("/api/growth-journal", { credentials: "include" }); return r.ok ? r.json() : []; },
  });
  const { data: reflectionEntries = [] } = useQuery<any[]>({
    queryKey: ["/api/reflections"],
    queryFn: async () => { const r = await fetch("/api/reflections", { credentials: "include" }); return r.ok ? r.json() : []; },
  });
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * reflectionPrompts.length));
  const currentPrompt = reflectionPrompts[promptIndex];

  const addMutation = useMutation({
    mutationFn: async () => {
      if (tab === "prompts") {
        const r = await fetch("/api/reflections", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ title: currentPrompt, content, category: "craft" }) });
        if (!r.ok) throw new Error("Failed"); return r.json();
      }
      const r = await fetch("/api/growth-journal", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ content, mood: "reflective" }) });
      if (!r.ok) throw new Error("Failed"); return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/growth-journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reflections"] });
      setContent("");
      if (tab === "prompts") setPromptIndex((promptIndex + 1) % reflectionPrompts.length);
    },
  });

  const allEntries = tab === "journal" ? entries : reflectionEntries;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06] w-fit">
        <button onClick={() => setTab("journal")} className={`px-3 py-1.5 rounded-md font-mono text-[9px] uppercase tracking-widest transition-all ${tab === "journal" ? "bg-white/[0.08] text-white/80" : "text-white/90 hover:text-white/90"}`} data-testid="tab-journal">Journal</button>
        <button onClick={() => setTab("prompts")} className={`px-3 py-1.5 rounded-md font-mono text-[9px] uppercase tracking-widest transition-all ${tab === "prompts" ? "bg-white/[0.08] text-white/80" : "text-white/90 hover:text-white/90"}`} data-testid="tab-prompts">Prompts</button>
      </div>

      {tab === "prompts" && (
        <div className="border border-pink-500/10 bg-pink-500/[0.02] rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-base font-light italic text-pink-200/60 leading-relaxed">{currentPrompt}</p>
            <button onClick={() => setPromptIndex((promptIndex + 1) % reflectionPrompts.length)} className="flex-shrink-0 p-1.5 text-white/90 hover:text-white/90 transition-colors" title="New prompt" data-testid="button-next-prompt">
              <Sparkles size={14} />
            </button>
          </div>
        </div>
      )}

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={tab === "prompts" ? "Reflect on this prompt..." : "What's growing in your practice today..."}
          className="w-full bg-white/[0.05] border border-white/[0.20] rounded-xl px-4 py-3 text-sm font-serif text-white/75 placeholder:text-white/45 focus:outline-none focus:border-white/40 resize-none h-28 transition-colors"
          data-testid="input-journal-entry"
        />
        <button onClick={() => addMutation.mutate()} disabled={!content.trim()} className="mt-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/20 rounded-lg font-mono text-[9px] uppercase tracking-widest text-white/90 hover:text-white disabled:opacity-30 transition-all" data-testid="button-add-journal">
          {tab === "prompts" ? "Save Reflection" : "Add Entry"}
        </button>
      </div>
      {allEntries.map((e: any) => (
        <div key={e.id} className="border border-white/[0.15] rounded-xl p-4">
          {e.title && <h4 className="font-display text-sm font-light italic text-white/45 mb-2">{e.title}</h4>}
          <p className="font-serif text-sm text-white/90 leading-relaxed">{e.content}</p>
          <span className="font-mono text-[8px] text-white/45 mt-2 block">{timeAgo(e.createdAt)}</span>
        </div>
      ))}
      {allEntries.length === 0 && <p className="font-serif text-sm text-white/90 italic py-6 text-center">{tab === "prompts" ? "Your reflections will gather here over time." : "No entries yet. Start reflecting on your growth."}</p>}
    </div>
  );
}

const reflectionPrompts = [
  "What surprised you about your writing this week?",
  "Describe a sentence you wrote that felt true. Why did it work?",
  "What are you avoiding in your writing? What would happen if you went there?",
  "Name a writer whose voice you envy. What specifically draws you to them?",
  "What's the difference between your writing voice and your speaking voice?",
  "What recurring images or themes keep appearing in your work?",
  "When do you feel most honest in your writing? What conditions enable that?",
  "What did you read recently that changed how you think about craft?",
  "Describe a piece you abandoned. What was it trying to do?",
  "What's a technique you've been wanting to try but haven't yet?",
  "When does revision feel like discovery vs. obligation?",
  "What does your writing need more of? Less of?",
  "Who is the ideal reader for what you're writing now?",
  "What are you learning about pacing, rhythm, or silence in your work?",
  "If your current project were a room, what would be in it?",
];

function CirclesView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedCircle, setExpandedCircle] = useState<string | null>(null);
  const [selectedWritingId, setSelectedWritingId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDescription, setNewCircleDescription] = useState("");
  const [newCircleTheme, setNewCircleTheme] = useState("");

  const { data: circles = [] } = useQuery<any[]>({
    queryKey: ["/api/circles"],
    queryFn: async () => { const r = await fetch("/api/circles", { credentials: "include" }); return r.ok ? r.json() : []; },
  });

  const { data: writings = [] } = useQuery<any[]>({
    queryKey: ["/api/writings"],
    queryFn: async () => { const r = await fetch("/api/writings", { credentials: "include" }); return r.ok ? r.json() : []; },
  });

  const createCircleMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; theme?: string }) => {
      const r = await fetch("/api/circles", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      setShowCreateForm(false);
      setNewCircleName("");
      setNewCircleDescription("");
      setNewCircleTheme("");
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const r = await fetch(`/api/circles/${circleId}/join`, { method: "POST", credentials: "include" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/circles"] }),
  });

  const shareMutation = useMutation({
    mutationFn: async ({ circleId, writingId }: { circleId: string; writingId: string }) => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNum = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 86400000));
      const weekOf = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      const r = await fetch(`/api/circles/${circleId}/shares`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ writingId, weekOf }),
      });
      if (!r.ok) throw new Error("Failed to share");
      return r.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${vars.circleId}/shares`] });
      setSelectedWritingId("");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/90 font-mono text-[10px] uppercase tracking-widest hover:text-white/80 hover:border-white/15 hover:bg-white/[0.06] transition-all"
          data-testid="button-create-circle"
        >
          <Plus size={12} />
          Create Circle
        </button>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border border-white/[0.06] rounded-xl p-4 space-y-3 bg-white/[0.02]" data-testid="form-create-circle">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest text-white/90 mb-1 block">Name</label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="Circle name"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/90 font-serif focus:outline-none focus:border-white/20 transition-colors"
                  data-testid="input-circle-name"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest text-white/90 mb-1 block">Description (optional)</label>
                <textarea
                  value={newCircleDescription}
                  onChange={(e) => setNewCircleDescription(e.target.value)}
                  placeholder="What is this circle about?"
                  rows={2}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/90 font-serif focus:outline-none focus:border-white/20 transition-colors resize-none"
                  data-testid="input-circle-description"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest text-white/90 mb-1 block">Theme (optional)</label>
                <input
                  type="text"
                  value={newCircleTheme}
                  onChange={(e) => setNewCircleTheme(e.target.value)}
                  placeholder="e.g. poetry, memoir, craft"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/90 font-serif focus:outline-none focus:border-white/20 transition-colors"
                  data-testid="input-circle-theme"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (!newCircleName.trim()) return;
                    createCircleMutation.mutate({
                      name: newCircleName.trim(),
                      description: newCircleDescription.trim() || undefined,
                      theme: newCircleTheme.trim() || undefined,
                    });
                  }}
                  disabled={!newCircleName.trim() || createCircleMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400/80 font-mono text-[10px] uppercase tracking-wider hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  data-testid="button-submit-circle"
                >
                  {createCircleMutation.isPending ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => { setShowCreateForm(false); setNewCircleName(""); setNewCircleDescription(""); setNewCircleTheme(""); }}
                  className="px-3 py-1.5 rounded-lg text-white/90 font-mono text-[10px] uppercase tracking-wider hover:text-white/90 transition-colors"
                  data-testid="button-cancel-circle"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {circles.map((c: any) => {
        const isFull = (c.memberCount || 0) >= (c.maxMembers || 5);
        const isExpanded = expandedCircle === c.id;

        return (
          <div key={c.id} className="border border-white/[0.20] rounded-xl overflow-hidden" data-testid={`circle-card-${c.id}`}>
            <button
              onClick={() => setExpandedCircle(isExpanded ? null : c.id)}
              className="w-full p-4 text-left hover:bg-white/[0.02] transition-colors"
              data-testid={`circle-toggle-${c.id}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-light italic text-white/75">{c.name}</h4>
                <div className="flex items-center gap-2">
                  {isFull && (
                    <span className="font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400/70 border border-amber-500/20" data-testid={`badge-full-${c.id}`}>
                      Full
                    </span>
                  )}
                  <ChevronDown size={14} className={`text-white/90 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>
              {c.description && <p className="font-serif text-xs text-white/90 mt-1">{c.description}</p>}
              {c.theme && (
                <p className="font-mono text-[8px] uppercase tracking-widest text-amber-300/30 mt-1">{c.theme}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Users size={10} className="text-white/90" />
                <span className="font-mono text-[8px] text-white/90" data-testid={`text-member-count-${c.id}`}>
                  {c.memberCount || 0}/{c.maxMembers || 5} members
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CircleDetail circle={c} userId={user?.id || ""} writings={writings} isFull={isFull}
                    onJoin={() => joinMutation.mutate(c.id)}
                    onShare={(writingId) => shareMutation.mutate({ circleId: c.id, writingId })}
                    isJoining={joinMutation.isPending}
                    isSharing={shareMutation.isPending}
                    selectedWritingId={selectedWritingId}
                    onSelectWriting={setSelectedWritingId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      {circles.length === 0 && <p className="font-serif text-sm text-white/90 italic py-6 text-center">No circles yet. Writing circles are intimate groups for sharing and discussion.</p>}
    </div>
  );
}

function CircleDetail({ circle, userId, writings, isFull, onJoin, onShare, isJoining, isSharing, selectedWritingId, onSelectWriting }: {
  circle: any; userId: string; writings: any[]; isFull: boolean;
  onJoin: () => void; onShare: (writingId: string) => void;
  isJoining: boolean; isSharing: boolean;
  selectedWritingId: string; onSelectWriting: (id: string) => void;
}) {
  const { data: members = [] } = useQuery<any[]>({
    queryKey: [`/api/circles/${circle.id}/members`],
    queryFn: async () => { const r = await fetch(`/api/circles/${circle.id}/members`, { credentials: "include" }); return r.ok ? r.json() : []; },
  });

  const { data: currentSharer } = useQuery<any>({
    queryKey: [`/api/circles/${circle.id}/current-sharer`],
    queryFn: async () => { const r = await fetch(`/api/circles/${circle.id}/current-sharer`, { credentials: "include" }); return r.ok ? r.json() : null; },
  });

  const { data: shares = [] } = useQuery<any[]>({
    queryKey: [`/api/circles/${circle.id}/shares`],
    queryFn: async () => { const r = await fetch(`/api/circles/${circle.id}/shares`, { credentials: "include" }); return r.ok ? r.json() : []; },
  });

  const { data: microPrompt, refetch: refetchPrompt } = useQuery<any>({
    queryKey: [`/api/circles/${circle.id}/micro-prompt`],
    queryFn: async () => { const r = await fetch(`/api/circles/${circle.id}/micro-prompt`, { credentials: "include" }); return r.ok ? r.json() : null; },
    enabled: members.some((m: any) => m.userId === userId),
  });

  const queryClient = useQueryClient();
  const [microResponse, setMicroResponse] = useState("");
  const respondMutation = useMutation({
    mutationFn: async (content: string) => {
      const r = await fetch(`/api/circles/${circle.id}/micro-prompt/respond`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ promptId: microPrompt?.id, content }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { setMicroResponse(""); refetchPrompt(); },
  });

  const isMember = members.some((m: any) => m.userId === userId);
  const isMyTurn = currentSharer?.userId === userId;
  const hasResponded = microPrompt?.responses?.some((r: any) => r.userId === userId);
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 86400000));
  const currentWeek = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  const thisWeekShare = shares.find((s: any) => s.weekOf === currentWeek);

  return (
    <div className="px-4 pb-4 space-y-4 border-t border-white/[0.08]">
      {isMember && currentSharer && (
        <div className="pt-3 space-y-3">
          <h5 className="font-mono text-[9px] uppercase tracking-[0.3em] text-teal-400/60 flex items-center gap-2">
            <Clock size={11} />
            This Week
          </h5>

          {thisWeekShare ? (
            <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-3" data-testid={`share-this-week-${circle.id}`}>
              <p className="font-serif text-xs text-white/90">
                <span className="text-emerald-400/80 font-display italic">{thisWeekShare.userName}</span> shared
                {thisWeekShare.writingTitle && (
                  <> — <span className="italic text-white/90">"{thisWeekShare.writingTitle}"</span></>
                )}
              </p>
              <p className="font-mono text-[8px] text-emerald-400/40 mt-1 uppercase tracking-widest">Read & Respond</p>
            </div>
          ) : isMyTurn ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3" data-testid={`share-your-turn-${circle.id}`}>
              <p className="font-serif text-xs text-amber-200/80 mb-2">It's your turn to share — pick a piece</p>
              <div className="flex gap-2">
                <select
                  value={selectedWritingId}
                  onChange={(e) => onSelectWriting(e.target.value)}
                  className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1.5 font-serif text-xs text-white/90 focus:outline-none focus:border-amber-500/30"
                  data-testid={`select-writing-${circle.id}`}
                >
                  <option value="">Choose a writing...</option>
                  {writings.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
                <button
                  onClick={() => selectedWritingId && onShare(selectedWritingId)}
                  disabled={!selectedWritingId || isSharing}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300/80 font-mono text-[9px] uppercase tracking-wider hover:bg-amber-500/30 transition-colors disabled:opacity-40"
                  data-testid={`btn-share-${circle.id}`}
                >
                  Share
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3" data-testid={`share-waiting-${circle.id}`}>
              <p className="font-serif text-xs text-white/55">
                Waiting for <span className="text-teal-400/70 font-display italic">{currentSharer.userName}</span> to share this week
              </p>
            </div>
          )}

          {members.length > 1 && (
            <div className="flex items-center gap-1 flex-wrap" data-testid={`rotation-order-${circle.id}`}>
              <span className="font-mono text-[7px] text-white/90 uppercase tracking-widest mr-1">Rotation:</span>
              {members.map((m: any, i: number) => (
                <span
                  key={m.id}
                  className={`font-mono text-[8px] px-1.5 py-0.5 rounded-full ${
                    m.userId === currentSharer?.userId
                      ? "bg-teal-500/15 text-teal-400/70 border border-teal-500/20"
                      : "text-white/90"
                  }`}
                >
                  {m.userName || "?"}
                  {i < members.length - 1 && <span className="text-white/90 ml-1">→</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {isMember && microPrompt && (
        <div className="pt-1 space-y-2" data-testid={`micro-prompt-${circle.id}`}>
          <h5 className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/50 flex items-center gap-2">
            <Sparkles size={10} />
            This week's prompt
          </h5>
          <p className="font-serif italic text-sm text-amber-200/70 leading-relaxed">{microPrompt.prompt}</p>

          {microPrompt.responses?.length > 0 && (
            <div className="space-y-1.5">
              {microPrompt.responses.map((r: any) => (
                <div key={r.id} className="flex items-start gap-2" data-testid={`micro-response-${r.id}`}>
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400/60 font-mono text-[8px] uppercase flex-shrink-0 mt-0.5">
                    {r.userName?.[0] || "?"}
                  </span>
                  <div className="min-w-0">
                    <span className="font-mono text-[8px] text-white/90 uppercase tracking-wider">{r.userName}</span>
                    <p className="font-serif text-xs text-white/90 leading-snug">{r.content}</p>
                  </div>
                  {r.userId === userId && (
                    <Check size={10} className="text-emerald-400/50 flex-shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}

          {!hasResponded && (
            <div className="flex gap-1.5" data-testid={`micro-prompt-input-${circle.id}`}>
              <input
                type="text"
                value={microResponse}
                onChange={(e) => setMicroResponse(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && microResponse.trim()) respondMutation.mutate(microResponse.trim()); }}
                placeholder="Your response..."
                className="flex-1 bg-white/[0.04] border border-amber-500/10 rounded-lg px-2.5 py-1.5 font-serif text-xs text-white/90 placeholder:text-white/90 focus:outline-none focus:border-amber-500/25 transition-colors"
                data-testid={`input-micro-response-${circle.id}`}
              />
              <button
                onClick={() => microResponse.trim() && respondMutation.mutate(microResponse.trim())}
                disabled={!microResponse.trim() || respondMutation.isPending}
                className="px-2 py-1.5 rounded-lg bg-amber-500/15 text-amber-300/70 hover:bg-amber-500/25 transition-colors disabled:opacity-30"
                data-testid={`btn-micro-respond-${circle.id}`}
              >
                <Send size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {!isMember && (
        <div className="pt-3">
          <button
            onClick={onJoin}
            disabled={isFull || isJoining}
            className={`px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors ${
              isFull
                ? "bg-white/[0.04] text-white/90 cursor-not-allowed border border-white/[0.08]"
                : "bg-emerald-500/15 text-emerald-400/80 border border-emerald-500/20 hover:bg-emerald-500/25"
            }`}
            data-testid={`btn-join-circle-${circle.id}`}
          >
            {isFull ? "Circle is full" : isJoining ? "Joining..." : "Join Circle"}
          </button>
        </div>
      )}
    </div>
  );
}


export default function Garden() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeZone, setActiveZone] = useState<Zone>("desk");
    const [showDeskStats, setShowDeskStats] = useState(false);
    const [hasVisited] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('garden_hasVisited'));
  const [activeWriting, setActiveWriting] = useState<Writing | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [plantingTarget, setPlantingTarget] = useState<Writing | null>(null);
  const [showPlantingFlow, setShowPlantingFlow] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showA11yPanel, setShowA11yPanel] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom>(null);
    const [showGalleryFeedback, setShowGalleryFeedback] = useState(false);
  const [feedbackWritingId, setFeedbackWritingId] = useState<string | null>(null);
        const [showEditorialModal, setShowEditorialModal] = useState(false);
  const { settings: a11y, toggle: toggleA11y } = useAccessibility();

  const { data: writings = [], isLoading } = useQuery<Writing[]>({
    queryKey: ["/api/writings"],
    queryFn: async () => {
      const res = await fetch("/api/writings", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: gardenPulse } = useQuery<{ activeWriters: number; newSeeds: number; bloomedPieces: number; totalWriters: number }>({
    queryKey: ["/api/garden-pulse"],
    queryFn: async () => {
      const res = await fetch("/api/garden-pulse", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

    useEffect(() => {
          localStorage.setItem('garden_hasVisited', 'true');
        }, []);

          // Deep-link: open a specific piece from ?pieceId=<id> query param
            useEffect(() => {
                  if (!writings.length) return;
                      const params = new URLSearchParams(window.location.search);
                          const pieceId = params.get('pieceId');
                              if (!pieceId) return;
                                  const target = writings.find((w) => String(w.id) === pieceId);
                                      if (target) {
                                              setActiveWriting(target);
                                                    setIsEditing(true);
                                                          window.history.replaceState({}, '', '/garden');
                                                              }
                                                                }, [writings]);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    const sendHeartbeat = () => {
      fetch("/api/garden/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ zone: activeZone }),
      }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, activeZone]);

  const { data: struggleSignals } = useQuery<{ dormantThisWeek: number; movedBackward: number; revisitedSeeds: number }>({
    queryKey: ["/api/struggle-signals"],
    queryFn: async () => {
      const res = await fetch("/api/struggle-signals", { credentials: "include" });
      if (!res.ok) return { dormantThisWeek: 0, movedBackward: 0, revisitedSeeds: 0 };
      return res.json();
    },
    enabled: !!user,
  });

  const { data: tierData } = useQuery<{ tier: string }>({
    queryKey: ["/api/user/tier"],
    queryFn: async () => {
      const res = await fetch("/api/user/tier", { credentials: "include" });
      if (!res.ok) return { tier: "free" };
      return res.json();
    },
    enabled: !!user,
  });
  const userTier = tierData?.tier || "free";

  const { data: myFlags = [] } = useQuery<any[]>({
    queryKey: ["/api/editorial-flags/mine"],
    queryFn: async () => {
      const res = await fetch("/api/editorial-flags/mine", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const { data: activeWalk } = useQuery<any>({
    queryKey: ["/api/editors-walk/active"],
    queryFn: async () => {
      const res = await fetch("/api/editors-walk/active", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: currentSeason } = useQuery<{ name: string; theme: string; description: string } | null>({
    queryKey: ["/api/garden/season"],
    queryFn: async () => {
      const res = await fetch("/api/garden/season", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return data || null;
    },
  });

  const flagMutation = useMutation({
    mutationFn: async (writingId: string) => {
      const res = await fetch("/api/editorial-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ writingId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial-flags/mine"] });
    },
    onError: (err: any) => {
      toast({ title: "Cannot flag", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const sendHeartbeat = () => {
      fetch("/api/presence", { method: "POST", credentials: "include" }).catch(() => {});
      fetch("/api/garden/presence", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone: activeZone }),
      }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, activeZone]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/writings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "Untitled", content: "", genre: "poetry", stage: "raw_seed", readiness: "raw_seed", visibility: "personal" }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: (data: Writing) => {
      queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
      setActiveWriting(data);
      setIsEditing(true);
      toast({ title: "New piece created", description: "Start writing your new piece.", duration: 2000 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await fetch(`/api/writings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (data: Writing) => {
      queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
      if (activeWriting && data.id === activeWriting.id) setActiveWriting(data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/writings/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
      setActiveWriting(null);
      setIsEditing(false);
      toast({ title: "Deleted", description: "Your writing has been permanently removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete writing. Please try again.", variant: "destructive" });
    },
  });

  function openWriting(w: Writing) { setActiveWriting(w); setIsEditing(true); }
  function openPlanting(w: Writing) { setPlantingTarget(w); setShowPlantingFlow(true); }
  function handlePlantingSave(data: { visibility: string; readiness: string; editorialAvailable: boolean }) {
    if (plantingTarget) updateMutation.mutate({ id: plantingTarget.id, ...data });
        if (plantingTarget && (data.visibility === 'gallery' || data.visibility === 'gallery_opt_in')) {      setFeedbackWritingId(plantingTarget.id);
      const [showGalleryFeedback, setShowGalleryFeedback] = useState(false);       const [showEditorialModal, setShowEditorialModal] = useState(false);
    }
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen garden-bg text-foreground relative overflow-x-hidden">
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-8 max-w-md"
          >
            <div className="w-16 h-16 mx-auto border border-white/10 rounded-full flex items-center justify-center">
              <Feather size={24} className="text-white/90" />
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl text-white/85 italic">The Garden</h1>
              <p className="font-body text-sm text-white/90 leading-relaxed">
                A quiet place to write, grow, and tend your work. Sign in to enter.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
              <div className="w-1 h-1 rotate-45 border border-white/10" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <button
              onClick={() => { window.location.href = "/sign-in"; }}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-white/[0.12] bg-white/[0.04] text-white/90 hover:text-white/90 hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-500 font-mono text-xs uppercase tracking-[0.2em]"
              data-testid="button-garden-login"
            >
              Sign in to enter
            </button>
            <p className="font-mono text-[9px] text-white/90 tracking-widest uppercase">
              The Page Gallery Journal
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen garden-bg text-foreground relative overflow-x-hidden">
          <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border border-white/20 rounded-full flex items-center justify-center">
              <Feather size={20} className="text-white/90 animate-pulse" />
            </div>
            <p className="font-mono text-[10px] tracking-widest text-white/90 uppercase">Opening your garden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showNotifications) {
    return (
      <div className="min-h-screen garden-bg text-foreground relative overflow-x-hidden">
        <div className="relative z-10 pt-20 pb-24 px-6 max-w-2xl mx-auto">
          <button
            onClick={() => setShowNotifications(false)}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/90 hover:text-white/75 transition-colors group mb-6"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <NotificationPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen garden-bg text-foreground relative overflow-x-hidden">
      <div className="relative z-10">
        <header className="sticky top-0 z-50 border-b border-white/[0.08] garden-header-bg">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <a href="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group" data-testid="link-home">
                <Home size={14} className="text-white/65 group-hover:text-white transition-colors" />
                <span className="hidden sm:inline">Home</span>
              </a>

              <div className="flex flex-col items-center">
                {!isEditing && <ZoneNav active={activeZone} onChange={(z) => { setActiveZone(z); setActiveRoom(null); setProfileUserId(null); window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }} />}
                {isEditing && <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/55">Writing</span>}
                {!isEditing && gardenPulse && gardenPulse.activeWriters > 0 && (
                  <div className="flex flex-col items-center gap-0.5 mt-1.5 hidden" data-testid="garden-pulse">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/40" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400/60" />
                      </span>
                      <span className="font-mono text-[9px] text-white/90">
                        {gardenPulse.activeWriters} {gardenPulse.activeWriters === 1 ? "writer" : "writers"} in the garden
                      </span>
                    </div>
                    {(gardenPulse.newSeeds > 0 || gardenPulse.bloomedPieces > 0) && (
                      <p className="font-serif italic text-[9px] text-white/90 hidden">
                        This month: {gardenPulse.newSeeds > 0 && <>{gardenPulse.newSeeds} {gardenPulse.newSeeds === 1 ? "writer" : "writers"} planted new seeds</>}{gardenPulse.newSeeds > 0 && gardenPulse.bloomedPieces > 0 && ". "}{gardenPulse.bloomedPieces > 0 && <>{gardenPulse.bloomedPieces} {gardenPulse.bloomedPieces === 1 ? "piece" : "pieces"} bloomed</>}.
                      </p>
                    )}
                    {struggleSignals && (struggleSignals.dormantThisWeek > 0 || struggleSignals.revisitedSeeds > 0) && (
                      <div className="flex items-center gap-3 font-mono text-[8px] text-white/90 mt-1">
                        {struggleSignals.dormantThisWeek > 0 && (
                          <span>{struggleSignals.dormantThisWeek} {struggleSignals.dormantThisWeek === 1 ? "piece" : "pieces"} went dormant this week</span>
                        )}
                        {struggleSignals.revisitedSeeds > 0 && (
                          <span>{struggleSignals.revisitedSeeds} old {struggleSignals.revisitedSeeds === 1 ? "seed" : "seeds"} revisited</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowA11yPanel(!showA11yPanel)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    showA11yPanel
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                      : "bg-white/[0.04] border border-white/[0.1] text-white/90 hover:text-white/90 hover:border-white/20"
                  }`}
                  data-testid="button-a11y-panel"
                  title="Appearance & Accessibility"
                >
                  <Settings size={13} />
                </button>
                <NotificationBell onClick={() => setShowNotifications(true)} />
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.15] flex items-center justify-center text-white/90 font-mono text-[9px] uppercase hover:border-white/20 transition-colors"
                    data-testid="button-profile-menu"
                  >
                    {user?.firstName?.[0] || "?"}
                  </button>
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-emerald-800/20 shadow-2xl z-[100] overflow-y-auto max-h-[80vh] scrollbar-hide garden-dropdown-bg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 border-b border-emerald-900/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center text-white/90 font-display text-lg italic">
                              {user?.firstName?.[0] || "?"}
                            </div>
                            <div>
                              <p className="font-display text-sm text-white/85 italic">{user?.firstName} {user?.lastName}</p>
                              <p className="font-mono text-[8px] text-white/90 uppercase tracking-widest">{user?.role === "editor" ? "Editor" : "Writer"}</p>
                              {userTier === "paid" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 text-amber-300/60">
                                  <Crown size={9} />
                                  Cultivator
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/public-garden/${user?.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400/50 hover:text-emerald-400/80 transition-colors mt-2"
                            data-testid="link-public-garden"
                          >
                            <ExternalLink size={10} />
                            Your Public Garden
                          </a>
                        </div>
                        <div className="p-3 border-b border-emerald-900/20 space-y-2">
                          <a
                            href={`/writer/${user?.id}`}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg text-white/90 hover:text-white/80 hover:bg-white/[0.05] transition-all font-serif text-sm"
                            data-testid="nav-my-profile"
                          >
                            <Feather size={14} />
                            My Public Garden
                          </a>
                          {user?.role === "editor" && (
                            <a
                              href="/editor-studio"
                              className="flex items-center gap-2 px-2 py-2 rounded-lg text-amber-400/70 hover:text-amber-400 hover:bg-amber-400/[0.05] transition-all font-serif text-sm"
                              data-testid="nav-editor-studio"
                            >
                              <FileCheck size={14} />
                              Editor Studio
                            </a>
                          )}
                          {user?.role === "writer" && (
              <a
                href="/drafts"
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                data-testid="nav-drafts"
              >
                <NotebookPen size={14} />
                Drafts
              </a>
            )}
                          <a
                            href="/courses"
                            className="flex items-center gap-2 px-2 py-2 rounded-lg text-emerald-400/60 hover:text-emerald-400/90 hover:bg-emerald-400/[0.05] transition-all font-serif text-sm"
                            data-testid="nav-courses"
                          >
                            <GraduationCap size={14} />
                            Courses
                          </a>
                          <a
                            href="/challenges"
                            className="flex items-center gap-2 px-2 py-2 rounded-lg text-amber-400/60 hover:text-amber-400/90 hover:bg-amber-400/[0.05] transition-all font-serif text-sm"
                            data-testid="nav-challenges"
                          >
                            <Trophy size={14} />
                            Challenges
                          </a>
                                              <a
                      href="/grove"
                      className="flex items-center gap-2 px-2 py-2 rounded-lg text-green-400/60 hover:text-green-400/90 hover:bg-green-400/[0.05] transition-all font-serif text-sm"
                      data-testid="nav-grove"
                    >
                      <TreePine size={14} />
                      The Grove
                    </a>
                          <button
                            onClick={() => { setActiveZone("desk"); setShowProfileMenu(false); }}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/90 hover:text-white/80 hover:bg-white/[0.05] transition-all font-serif text-sm text-left"
                            data-testid="nav-my-desk"
                          >
                            <PenLine size={14} />
                            My Writings
                          </button>
                          <button
                            onClick={() => { setShowNotifications(true); setShowProfileMenu(false); }}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/90 hover:text-white/80 hover:bg-white/[0.05] transition-all font-serif text-sm text-left"
                            data-testid="nav-whispers"
                          >
                            <Bell size={14} />
                            Whispers
                          </button>
                        </div>
                        <div className="p-2">
                          <a href="/api/logout" className="flex items-center gap-2 px-2 py-2 rounded-lg text-white/90 hover:text-red-400/80 hover:bg-white/[0.03] transition-all font-serif text-sm" data-testid="nav-logout">
                            <LogOut size={13} />
                            Sign Out
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {!isEditing && (
              <div className="mt-2 -mb-1">
                <RoomsStrip activeRoom={activeRoom} onSelectRoom={(r) => { setActiveRoom(r); window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }} />
              </div>
            )}
          </div>
        </header>

                {hasVisited && (
                <div className="max-w-5xl mx-auto px-6 pt-3 pb-1">
                              <p className="font-serif text-xs text-amber-400/40 italic hidden" data-testid="returning-user-greeting">Welcome back.</p>
                            </div>
              )}
        <AnimatePresence>
          {showA11yPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="sticky top-[57px] z-40 overflow-hidden border-b border-emerald-900/15 backdrop-blur-xl a11y-panel-bg"
            >
              <div className="max-w-5xl mx-auto px-6 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/90">
                    <Glasses size={12} />
                    Appearance & Accessibility
                  </span>
                  <button onClick={() => setShowA11yPanel(false)} className="text-white/90 hover:text-white/90 transition-colors" data-testid="button-close-a11y">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "gardenLight" as const, label: "Light Mode", icon: <Sparkles size={11} /> },
                    { key: "reducedMotion" as const, label: "Reduce Motion", icon: <Eye size={11} /> },
                    { key: "highContrast" as const, label: "High Contrast", icon: <Eye size={11} /> },
                    { key: "largerText" as const, label: "Larger Text", icon: null },
                    { key: "dyslexiaFont" as const, label: "Dyslexia Font", icon: null },
                    { key: "widerSpacing" as const, label: "Wider Spacing", icon: null },
                    { key: "focusMode" as const, label: "Focus Mode", icon: <Moon size={11} /> },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => toggleA11y(opt.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all border ${
                        a11y[opt.key]
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-white/[0.03] border-white/[0.08] text-white/90 hover:bg-white/[0.06] hover:text-white/90"
                      }`}
                      data-testid={`a11y-toggle-${opt.key}`}
                    >
                      {opt.icon}
                      {opt.label}
                      {a11y[opt.key] && <Check size={10} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="pt-8 pb-24 px-6" onClick={() => { showProfileMenu && setShowProfileMenu(false); }}>
          {currentSeason && !isEditing && (
            <div className="mb-6 rounded-2xl border border-emerald-500/10 bg-emerald-950/[0.04] p-4 text-center max-w-5xl mx-auto" data-testid="season-banner">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-emerald-400/40">{currentSeason.theme}</span>
              <p className="font-display text-sm font-light italic text-white/90 mt-1">{currentSeason.name}</p>
              {currentSeason.description && <p className="font-serif text-[11px] text-white/90 mt-1 max-w-md mx-auto leading-relaxed">{currentSeason.description}</p>}
            </div>
          )}
          {activeWalk && (
            <div className="mb-6 rounded-2xl border border-violet-500/15 bg-violet-950/[0.08] p-5 text-center max-w-5xl mx-auto" data-testid="editors-walk-banner">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-violet-400/60 animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-300/70">Open Review Window</span>
              </div>
              <p className="font-display text-lg font-light italic text-white/90">{activeWalk.title}</p>
              {activeWalk.description && <p className="font-serif text-xs text-white/45 mt-1">{activeWalk.description}</p>}
              <p className="font-mono text-[9px] text-violet-300/50 mt-3">
                Editors are reviewing requested pieces. You can submit up to {activeWalk.flagLimit} pieces during this window.
              </p>
              <p className="font-mono text-[8px] text-white/90 mt-1">
                Ends {new Date(activeWalk.endsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeRoom ? `room-${activeRoom}` : (isEditing ? `editor-${activeWriting?.id}` : activeZone)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ minHeight: "50vh" }}
            >
              {activeRoom === "tables" ? (
                <TablesRoom onBack={() => setActiveRoom(null)} />
              ) : activeRoom === "workshop" ? (
                <WorkshopRoom onBack={() => setActiveRoom(null)} />
              ) : activeRoom === "swap" ? (
                <SwapRoom onBack={() => setActiveRoom(null)} />
              ) : activeRoom === "the-desk" ? (
                <TheDeskRoom onBack={() => setActiveRoom(null)} />
              ) : activeRoom === "first-reader" ? (
                <FirstReaderRoom onBack={() => setActiveRoom(null)} />
              ) : activeRoom === "shelf" ? (
                <ReadingShelfRoom onBack={() => setActiveRoom(null)} />
              ) : isEditing && activeWriting ? (
                <WriteEditor
                  key={activeWriting.id}
                  writing={activeWriting}
                  onBack={() => { setIsEditing(false); setActiveWriting(null); }}
                  onSave={(data) => updateMutation.mutate({ id: activeWriting.id, ...data })}
                  onDelete={() => deleteMutation.mutate(activeWriting.id)}
                  onOpenPlanting={() => openPlanting(activeWriting)}
                                onRequestFeedback={() => setShowEditorialModal(true)}
                />
              ) : activeZone === "desk" ? (
                <DeskZone
                  writings={writings}
                  onOpenWriting={openWriting}
                  onCreateNew={() => createMutation.mutate()}
                  onOpenPlanting={openPlanting}
                  onQuickUpdate={(id, data) => updateMutation.mutate({ id, ...data })}
                  isCreating={createMutation.isPending}
                  myFlags={myFlags}
                  flagMutation={flagMutation}
                  userTier={userTier}
                  onWriteFromPrompt={async (promptText: string) => {
                    const res = await fetch("/api/writings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ title: "Untitled", content: `<p>${promptText}</p><p></p>`, genre: "poetry", stage: "raw_seed", readiness: "raw_seed", visibility: "personal" }),
                    });
                    if (!res.ok) { toast({ title: "Failed to create piece", variant: "destructive" }); return; }
                    const data = await res.json();
                    queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
                    setActiveWriting(data);
                    setIsEditing(true);
                    toast({ title: "Writing from prompt", description: "Start writing!", duration: 2000 });
                  }}
                />
              ) : activeZone === "studio" ? (
                <StudioZone writings={writings} onOpenWriting={openWriting} />
              ) : activeZone === "reading-room" ? (
                <ReadingRoomZone onViewProfile={(id) => setProfileUserId(id)} onGoToRoom={(room) => setActiveRoom(room)} />
              ) : activeZone === "submissions" ? (
                <SubmissionsZone userTier={userTier as "free" | "paid"} />
                    ) : activeZone === "garden-gate" ? (
                        <GardenGateZoneComponent />
                  ) : activeZone === "collections" ? (
                          <CollectionsRedirectComponent />
                          ) : (<GreenhouseZone />)}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <PlantingFlow
        isOpen={showPlantingFlow}
        onClose={() => { setShowPlantingFlow(false); setPlantingTarget(null); }}
        currentVisibility={(plantingTarget?.visibility as any) || "personal"}
        currentReadiness={(plantingTarget?.readiness as any) || "raw_seed"}
        currentEditorialAvailable={plantingTarget?.editorialAvailable || false}
        onSave={handlePlantingSave}
        title={plantingTarget?.title}
      />
            <GalleryFeedbackModal
                      isOpen={showGalleryFeedback}
                                onClose={() => { setShowGalleryFeedback(false); setFeedbackWritingId(null); }}
          writingId={feedbackWritingId || ""}               writingTitle={""}
      />
    </div>
  );
}

function CollectionsRedirect() {   const [, navigate] = useLocation(); useEffect(() => { navigate("/collections"); }, []);   return <div className="flex items-center justify-center py-20"><p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Opening your beds...</p></div>; } function GardenGateZone() {
  const { user } = useAuth();
  const { data: writings = [] } = useQuery({
    queryKey: ["/api/writings"],
    enabled: !!user,
  });

  const publicWritings = (writings as any[]).filter(
    (w: any) => w.visibility === "public" || w.visibility === "garden_gate"
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TreePine size={18} className="text-emerald-400/70" />
          <h2 className="font-display text-xl font-light italic text-white/80">Garden Gate</h2>
        </div>
        <p className="font-serif text-xs text-white/40 italic">
          Writing you've opened to the world. Quiet, shared, unhurried.
        </p>
      </div>

      {publicWritings.length === 0 ? (
        <div className="text-center py-16">
          <TreePine size={32} className="mx-auto mb-4 text-emerald-900/50" />
          <p className="font-serif text-sm text-white/30 italic">
            Nothing has passed through the gate yet.
          </p>
          <p className="font-mono text-[10px] text-white/20 mt-2 tracking-widest uppercase">
            Open a piece from your desk to share it here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {publicWritings.map((w: any) => (
            <div
              key={w.id}
              className="group p-4 rounded-lg border border-emerald-900/30 bg-emerald-950/20 hover:border-emerald-800/40 transition-all"
            >
              <h3 className="font-serif text-sm text-white/70 italic mb-1">
                {w.title || "Untitled"}
              </h3>
              <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                {w.readiness || "raw seed"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
