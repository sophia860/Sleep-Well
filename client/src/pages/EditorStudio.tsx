/**
 * EditorStudio.tsx — The Page Gallery Journal
 * Editorial Desk · New York Writers Studio Aesthetic
 *
 * Five-section studio:
 *   Inbox · Kanban Desk · Issue Builder · Rights & Requests · Analytics
 *
 * Stack:
 *   @dnd-kit/core + @dnd-kit/sortable  — drag-and-drop Kanban & Issue Builder
 *   framer-motion                       — card animations, panel transitions
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import type { CSSProperties } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LucideIcon } from "lucide-react";
import {
  Inbox,
  LayoutGrid,
  BookOpen,
  FileCheck2,
  BarChart3,
  Plus,
  X,
  Check,
  BookMarked,
  Download,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type {
  Writing,
  Issue,
  GreenhouseEntry,
  PublishRequest,
} from "@shared/schema";
import { wordCountFromContent } from "@/components/garden/RichEditor";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

// ─── Local types ───────────────────────────────────────────────────────────────

type StudioBucket = "all" | "triage" | "development" | "ready" | "published";
type StudioNav   = "inbox" | "kanban" | "issue-builder" | "rights" | "analytics";

type WritingWithAuthor = Writing & {
  authorName:     string | null;
  authorImage:    string | null;
  resonanceCount: number;
};

type RequestWithTitle = PublishRequest & {
  writingTitle: string;
  authorName:   string | null;
  editorName:   string | null;
};

// ─── Kanban constants ──────────────────────────────────────────────────────────

const KANBAN_COLS = [
  { id: "triage"      as const, label: "Triage",      readiness: "raw_seed",      accent: "#8A8F6F" },
  { id: "development" as const, label: "Development",  readiness: "growing",       accent: "#c4a24d" },
  { id: "ready"       as const, label: "Ready",        readiness: "ready_to_show", accent: "#6B2A2A" },
  { id: "published"   as const, label: "Published",    readiness: "published",     accent: "#1C1208" },
] as const;

type KanbanColId = (typeof KANBAN_COLS)[number]["id"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Deterministic rotation −0.5°→+0.5°, derived from writing id */
function cardRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return ((Math.abs(h) % 100) / 100) - 0.5;
}

/** Assign a writing to its Kanban column */
function getWritingCol(w: WritingWithAuthor): KanbanColId {
  if (w.isPublished) return "published";
  if (w.readiness === "ready_to_show" || w.editorialAvailable) return "ready";
  if (w.readiness === "growing") return "development";
  return "triage";
}

/** Compact number: 1200 → "1.2k" */
function fmtN(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Kanban card – visual layer ────────────────────────────────────────────────

interface KanbanCardContentProps {
  writing:    WritingWithAuthor;
  reduced:    boolean;
  isOverlay?: boolean;
  onClick?:   () => void;
}

function KanbanCardContent({
  writing,
  reduced,
  isOverlay = false,
  onClick,
}: KanbanCardContentProps) {
  const rot = cardRotation(writing.id);
  return (
    <motion.div
      className="studio-index-card rounded-lg p-3 relative"
      style={{ rotate: reduced ? 0 : rot }}
      whileHover={reduced ? {} : { scale: 1.025, rotate: 0 }}
      whileTap={reduced   ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Open details for "${writing.title}"` : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Genre — handwritten red-pen tag, top-right */}
      <span
        className="absolute top-2.5 right-2.5 font-handwritten text-[12px] leading-none text-[#6B2A2A] pointer-events-none"
        aria-hidden
      >
        {writing.genre}
      </span>

      {/* Author — Space Mono 9px */}
      {writing.authorName && (
        <p className="font-mono text-[9px] uppercase tracking-wider text-[#1C1208]/35 mb-1 pr-14 truncate">
          {writing.authorName}
        </p>
      )}

      {/* Title — Playfair Display italic */}
      <p className="font-display italic text-sm text-[#1C1208] leading-snug pr-12 line-clamp-2">
        {writing.title}
      </p>

      {/* Date */}
      {writing.createdAt && (
        <p className="font-mono text-[9px] text-[#1C1208]/20 mt-2">
          {format(new Date(writing.createdAt), "MMM d")}
        </p>
      )}
    </motion.div>
  );
}

// ─── Sortable kanban card ──────────────────────────────────────────────────────

function SortableKanbanCard({
  writing,
  reduced,
  onSelect,
}: {
  writing:  WritingWithAuthor;
  reduced:  boolean;
  onSelect: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: writing.id });

  const style: CSSProperties = {
    transform:   CSS.Transform.toString(transform),
    transition,
    opacity:     isDragging ? 0.3 : 1,
    touchAction: "none",
    cursor:      isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(listeners ?? {})}>
      <KanbanCardContent
        writing={writing}
        reduced={reduced}
        onClick={() => onSelect(writing.id)}
      />
    </div>
  );
}

// ─── Droppable kanban column ───────────────────────────────────────────────────

function KanbanColumn({
  col,
  writings,
  activeId,
  reduced,
  onSelect,
}: {
  col:      (typeof KANBAN_COLS)[number];
  writings: WritingWithAuthor[];
  activeId: string | null;
  reduced:  boolean;
  onSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div
      className="flex flex-col w-[228px] shrink-0"
      aria-label={`${col.label} — ${writings.length} piece${writings.length !== 1 ? "s" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: col.accent }}
            aria-hidden
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1C1208]/50">
            {col.label}
          </span>
        </div>
        <span className="font-mono text-[9px] text-[#1C1208]/30 bg-[#F0EBE0] border border-[rgba(107,42,42,0.1)] rounded-full px-1.5 py-0.5">
          {writings.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl p-2 space-y-2.5 transition-all duration-150 ${
          isOver && col.id !== "published"
            ? "bg-[rgba(107,42,42,0.05)] ring-1 ring-inset ring-[rgba(107,42,42,0.18)]"
            : "bg-[rgba(28,18,8,0.025)]"
        }`}
      >
        <SortableContext
          items={writings.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          {writings.map((w) => (
            <SortableKanbanCard
              key={w.id}
              writing={w}
              reduced={reduced}
              onSelect={onSelect}
            />
          ))}
        </SortableContext>

        {writings.length === 0 && (
          <div className="h-16 flex items-center justify-center">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#1C1208]/15">
              Empty
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kanban Desk view ──────────────────────────────────────────────────────────

function KanbanDeskView({
  writings,
  search,
  setSearch,
  updateReadiness,
  onSelectWriting,
}: {
  writings:        WritingWithAuthor[];
  search:          string;
  setSearch:       (v: string) => void;
  updateReadiness: (id: string, readiness: string) => void;
  onSelectWriting: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduced = useReducedMotion() ?? false;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return writings;
    const q = search.toLowerCase();
    return writings.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        (w.authorName ?? "").toLowerCase().includes(q) ||
        w.genre.toLowerCase().includes(q),
    );
  }, [writings, search]);

  const columnWritings = useMemo(
    () =>
      KANBAN_COLS.reduce(
        (acc, col) => {
          acc[col.id] = filtered.filter((w) => getWritingCol(w) === col.id);
          return acc;
        },
        {} as Record<KanbanColId, WritingWithAuthor[]>,
      ),
    [filtered],
  );

  const activeCard = useMemo(
    () => (activeId ? (filtered.find((w) => w.id === activeId) ?? null) : null),
    [activeId, filtered],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const activeWritingId = active.id as string;
      const overId          = over.id   as string;

      // Resolve target column: over.id is either a column id or a card id
      let targetColId: KanbanColId | null = null;
      const directCol = KANBAN_COLS.find((c) => c.id === overId);
      if (directCol) {
        targetColId = directCol.id;
      } else {
        for (const col of KANBAN_COLS) {
          if (columnWritings[col.id].some((w) => w.id === overId)) {
            targetColId = col.id;
            break;
          }
        }
      }

      if (!targetColId || targetColId === "published") return;

      const writing = filtered.find((w) => w.id === activeWritingId);
      if (!writing || getWritingCol(writing) === targetColId) return;

      const targetCol = KANBAN_COLS.find((c) => c.id === targetColId);
      if (!targetCol) return;

      updateReadiness(activeWritingId, targetCol.readiness);
    },
    [filtered, columnWritings, updateReadiness],
  );

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-xs">
        <input
          type="search"
          aria-label="Search submissions by title, author, or genre"
          placeholder="Search by title, author, genre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#F0EBE0] border border-[rgba(107,42,42,0.12)] rounded-full py-2 pl-4 pr-8 font-mono text-[11px] text-[#1C1208] placeholder-[#1C1208]/25 focus:outline-none focus:ring-2 focus:ring-[#6B2A2A]/15"
        />
        {search && (
          <button
            aria-label="Clear search"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C1208]/30 hover:text-[#6B2A2A] transition-colors"
          >
            <X size={10} aria-hidden />
          </button>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex gap-5 overflow-x-auto pb-4"
          role="region"
          aria-label="Editorial pipeline board"
        >
          {KANBAN_COLS.map((col) => (
            <KanbanColumn
              key={col.id}
              col={col}
              writings={columnWritings[col.id]}
              activeId={activeId}
              reduced={reduced}
              onSelect={onSelectWriting}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={reduced ? null : undefined}>
          {activeCard && (
            <KanbanCardContent writing={activeCard} reduced={reduced} isOverlay />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── Inbox view ────────────────────────────────────────────────────────────────

function InboxView({
  writings,
  greenhouse,
  writingsAll,
  onMoveToDesk,
}: {
  writings:     WritingWithAuthor[];
  greenhouse:   GreenhouseEntry[];
  writingsAll:  WritingWithAuthor[];
  onMoveToDesk: (id: string) => void;
}) {
  const reduced   = useReducedMotion() ?? false;
  const untriaged = useMemo(
    () => writings.filter((w) => w.readiness === "raw_seed" && !w.isPublished),
    [writings],
  );

  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl italic text-[#1C1208]">New Submissions</h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1C1208]/30">
            {untriaged.length} piece{untriaged.length !== 1 ? "s" : ""}
          </span>
        </div>

        {untriaged.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-handwritten text-2xl text-[#1C1208]/25">
              Inbox is clear. Well done.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {untriaged.map((w) => {
              const rot = cardRotation(w.id);
              return (
                <motion.div
                  key={w.id}
                  className="studio-index-card rounded-xl p-5 flex items-start gap-4"
                  style={{ rotate: reduced ? 0 : rot }}
                  whileHover={reduced ? {} : { scale: 1.01, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-handwritten text-[13px] text-[#6B2A2A] block mb-1">
                      {w.genre}
                    </span>
                    <p className="font-display italic text-base text-[#1C1208] leading-snug">
                      {w.title}
                    </p>
                    {w.authorName && (
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[#1C1208]/35 mt-1">
                        {w.authorName}
                      </p>
                    )}
                    {w.createdAt && (
                      <p className="font-mono text-[9px] text-[#1C1208]/20 mt-2">
                        Received {format(new Date(w.createdAt), "MMMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onMoveToDesk(w.id)}
                    className="shrink-0 flex items-center gap-1.5 bg-[#6B2A2A] text-[#F8F4EC] rounded-full px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider hover:bg-[#5a2222] transition-colors"
                    aria-label={`Move "${w.title}" to desk`}
                  >
                    Move to Desk <ChevronRight size={9} aria-hidden />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Shortlist notes from greenhouse */}
      {greenhouse.length > 0 && (
        <section>
          <div className="studio-section-divider mb-6" aria-hidden />
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl italic text-[#1C1208]">Shortlist Notes</h2>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1C1208]/30">
              {greenhouse.length} noted
            </span>
          </div>
          <div className="space-y-3">
            {greenhouse.map((entry) => {
              const writing = writingsAll.find((w) => w.id === entry.writingId);
              return (
                <div
                  key={entry.id}
                  className="studio-index-card rounded-xl p-4 flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-display italic text-sm text-[#1C1208] truncate">
                      {writing?.title ?? entry.writingId}
                    </p>
                    {writing?.authorName && (
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[#1C1208]/35">
                        {writing.authorName}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {([entry.stage, entry.priority, entry.themeFolder] as (string | null | undefined)[])
                        .filter((t): t is string => Boolean(t))
                        .map((tag) => (
                          <span
                            key={tag}
                            className="border border-[rgba(107,42,42,0.15)] text-[#1C1208]/40 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                    {entry.internalNote && (
                      <p className="font-handwritten text-base text-[#6B2A2A]/70 mt-1">
                        {entry.internalNote}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-[9px] text-[#1C1208]/25 shrink-0">
                    {entry.createdAt ? format(new Date(entry.createdAt), "MMM d") : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Available piece card (draggable, used inside Issue Builder) ───────────────

function AvailablePieceCard({
  writing,
  onAdd,
}: {
  writing: WritingWithAuthor;
  onAdd:   () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `avail-${writing.id}`,
  });

  const style: CSSProperties = {
    transform:   transform
      ? `translate3d(${transform.x}px,${transform.y}px,0)`
      : undefined,
    opacity:     isDragging ? 0.35 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(listeners ?? {})}
      className="studio-index-card rounded-lg p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing"
    >
      <div className="flex-1 min-w-0">
        <span className="font-handwritten text-[11px] text-[#6B2A2A] block leading-none mb-0.5">
          {writing.genre}
        </span>
        <p className="font-display italic text-sm text-[#1C1208] leading-snug truncate">
          {writing.title}
        </p>
        {writing.authorName && (
          <p className="font-mono text-[9px] uppercase tracking-wider text-[#1C1208]/35">
            {writing.authorName}
          </p>
        )}
      </div>
      {/* Stop pointer events so click doesn't trigger drag */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-[rgba(107,42,42,0.2)] text-[#6B2A2A]/50 hover:text-[#6B2A2A] hover:border-[#6B2A2A]/40 transition-colors"
        aria-label={`Add "${writing.title}" to issue`}
      >
        <Plus size={10} aria-hidden />
      </button>
    </div>
  );
}

// ─── Issue Builder view ────────────────────────────────────────────────────────

interface IssueBuilderViewProps {
  issues:              Issue[];
  writings:            WritingWithAuthor[];
  selectedIssueId:     string | null;
  setSelectedIssueId:  (id: string | null) => void;
  showNewIssueForm:    boolean;
  setShowNewIssueForm: (v: boolean) => void;
  newIssueTitle:       string;
  setNewIssueTitle:    (v: string) => void;
  newIssueSubtitle:    string;
  setNewIssueSubtitle: (v: string) => void;
  onCreateIssue:       (data: { title: string; subtitle?: string }) => void;
  isCreatingIssue:     boolean;
  onPublishIssue:      (id: string) => void;
  isPublishingIssue:   boolean;
}

function IssueBuilderView({
  issues,
  writings,
  selectedIssueId,
  setSelectedIssueId,
  showNewIssueForm,
  setShowNewIssueForm,
  newIssueTitle,
  setNewIssueTitle,
  newIssueSubtitle,
  setNewIssueSubtitle,
  onCreateIssue,
  isCreatingIssue,
  onPublishIssue,
  isPublishingIssue,
}: IssueBuilderViewProps) {
  const [tocItems,       setTocItems]       = useState<WritingWithAuthor[]>([]);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const selectedIssue = useMemo(
    () => issues.find((i) => i.id === selectedIssueId) ?? null,
    [issues, selectedIssueId],
  );

  const availablePieces = useMemo(
    () => writings.filter((w) => !w.isPublished && !tocItems.some((t) => t.id === w.id)),
    [writings, tocItems],
  );

  const totalWordCount = useMemo(
    () => tocItems.reduce((sum, w) => sum + wordCountFromContent(w.content), 0),
    [tocItems],
  );

  const TARGET_WORDS = 10000;
  const density      = Math.min((totalWordCount / TARGET_WORDS) * 100, 100);

  const { setNodeRef: setTocRef, isOver: isOverToc } = useDroppable({ id: "issue-toc" });

  // Reset TOC and confirm state when the selected issue changes
  useEffect(() => {
    setTocItems([]);
    setConfirmPublish(false);
  }, [selectedIssueId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || over.id !== "issue-toc") return;
    const writingId = (active.id as string).replace(/^avail-/, "");
    const writing   = availablePieces.find((w) => w.id === writingId);
    if (writing) {
      setTocItems((prev) => [...prev, writing]);
      toast({ title: `"${writing.title}" added to issue` });
    }
  }

  if (issues.length === 0 && !showNewIssueForm) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <p className="font-handwritten text-2xl text-[#1C1208]/30">
          No issues yet. Start your first.
        </p>
        <button
          onClick={() => setShowNewIssueForm(true)}
          className="flex items-center gap-2 bg-[#6B2A2A] text-[#F8F4EC] rounded-full px-5 py-2.5 font-mono text-[9px] uppercase tracking-wider hover:bg-[#5a2222] transition-colors"
        >
          <Plus size={12} aria-hidden /> New Issue
        </button>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="space-y-6">

        {/* Issue pills + export actions */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {issues.map((iss) => (
              <button
                key={iss.id}
                onClick={() => setSelectedIssueId(iss.id)}
                className={`font-display italic text-sm px-4 py-1.5 rounded-full border transition-all ${
                  selectedIssueId === iss.id
                    ? "bg-[#6B2A2A] text-[#F8F4EC] border-[#6B2A2A]"
                    : "border-[rgba(107,42,42,0.2)] text-[#1C1208]/55 hover:border-[rgba(107,42,42,0.4)]"
                }`}
              >
                {iss.title}
              </button>
            ))}
            <button
              onClick={() => setShowNewIssueForm(true)}
              className="flex items-center gap-1 text-[#6B2A2A]/40 hover:text-[#6B2A2A] font-mono text-[9px] uppercase tracking-wider transition-colors"
              aria-label="Create new issue"
            >
              <Plus size={10} aria-hidden /> New
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toast({ title: "Export Digital", description: "PDF generation — coming soon." })}
              className="flex items-center gap-1.5 border border-[rgba(107,42,42,0.15)] text-[#1C1208]/45 rounded-full px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider hover:border-[rgba(107,42,42,0.35)] transition-colors"
            >
              <Download size={9} aria-hidden /> Digital
            </button>
            <button
              onClick={() => toast({ title: "Export Print", description: "Print layout — coming soon." })}
              className="flex items-center gap-1.5 border border-[rgba(107,42,42,0.15)] text-[#1C1208]/45 rounded-full px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider hover:border-[rgba(107,42,42,0.35)] transition-colors"
            >
              <Download size={9} aria-hidden /> Print
            </button>
          </div>
        </div>

        {/* New issue inline form */}
        <AnimatePresence>
          {showNewIssueForm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-[#F0EBE0] border border-[rgba(107,42,42,0.12)] rounded-xl p-5 max-w-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1C1208]/40">
                  New Issue
                </span>
                <button
                  onClick={() => setShowNewIssueForm(false)}
                  className="text-[#1C1208]/25 hover:text-[#6B2A2A] transition-colors"
                  aria-label="Close new issue form"
                >
                  <X size={12} aria-hidden />
                </button>
              </div>
              <label className="sr-only" htmlFor="ib-title">Issue title</label>
              <input
                id="ib-title"
                type="text"
                placeholder="Issue title *"
                value={newIssueTitle}
                onChange={(e) => setNewIssueTitle(e.target.value)}
                className="w-full border border-[rgba(107,42,42,0.15)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2A2A]/15 bg-[#F8F4EC] font-sans placeholder-[#1C1208]/25"
              />
              <label className="sr-only" htmlFor="ib-subtitle">Issue subtitle</label>
              <input
                id="ib-subtitle"
                type="text"
                placeholder="Subtitle (optional)"
                value={newIssueSubtitle}
                onChange={(e) => setNewIssueSubtitle(e.target.value)}
                className="w-full border border-[rgba(107,42,42,0.15)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2A2A]/15 bg-[#F8F4EC] font-sans placeholder-[#1C1208]/25"
              />
              <button
                onClick={() => {
                  const payload: { title: string; subtitle?: string } = {
                    title: newIssueTitle.trim(),
                  };
                  if (newIssueSubtitle.trim()) payload.subtitle = newIssueSubtitle.trim();
                  onCreateIssue(payload);
                }}
                disabled={!newIssueTitle.trim() || isCreatingIssue}
                className="w-full bg-[#6B2A2A] text-[#F8F4EC] rounded-lg py-2 font-mono text-[9px] uppercase tracking-widest disabled:opacity-40 hover:bg-[#5a2222] transition-colors"
              >
                {isCreatingIssue ? "Creating…" : "Create Issue"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-column builder — wooden-desk magazine-spread aesthetic */}
        {selectedIssue ? (
          <div className="grid grid-cols-[1fr_300px] gap-6 items-start">

            {/* LEFT — TOC page */}
            <div
              className="bg-[#FAF6EE] rounded-xl border border-[rgba(107,42,42,0.1)] overflow-hidden"
              style={{
                boxShadow:
                  "4px 6px 24px rgba(28,18,8,0.07), -1px -1px 6px rgba(28,18,8,0.03)",
              }}
            >
              {/* Page header */}
              <div className="px-7 pt-7 pb-5 border-b border-[rgba(107,42,42,0.07)]">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#1C1208]/30 mb-2">
                  Table of Contents
                </p>
                <div className="flex items-start gap-2 group">
                  <h2 className="font-display italic text-2xl text-[#1C1208] leading-tight flex-1">
                    {selectedIssue.title}
                  </h2>
                  <Pencil
                    size={12}
                    className="mt-1.5 text-[#1C1208]/15 group-hover:text-[#6B2A2A]/30 transition-colors shrink-0"
                    aria-hidden
                  />
                </div>
                {selectedIssue.subtitle && (
                  <p className="font-mono text-[10px] text-[#1C1208]/35 mt-1 uppercase tracking-widest">
                    {selectedIssue.subtitle}
                  </p>
                )}
                {selectedIssue.themeNote && (
                  <p className="font-handwritten text-base text-[#6B2A2A]/65 mt-2">
                    {selectedIssue.themeNote}
                  </p>
                )}
              </div>

              {/* Droppable TOC area */}
              <div
                ref={setTocRef}
                className={`min-h-[280px] px-7 py-5 transition-colors duration-200 ${
                  isOverToc ? "bg-[rgba(107,42,42,0.03)]" : ""
                }`}
                role="region"
                aria-label="Issue table of contents — drag pieces here"
              >
                {tocItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-44 gap-4 text-center">
                    <div className="studio-section-divider w-full" aria-hidden />
                    <p
                      className={`font-handwritten text-lg transition-colors ${
                        isOverToc ? "text-[#6B2A2A]/55" : "text-[#1C1208]/22"
                      }`}
                    >
                      Drag pieces here to build the issue
                    </p>
                    <div className="studio-section-divider w-full" aria-hidden />
                  </div>
                ) : (
                  <ol className="space-y-4">
                    {tocItems.map((w, idx) => (
                      <li key={w.id} className="flex items-baseline gap-3 group">
                        <span className="font-mono text-[9px] text-[#6B2A2A]/40 w-5 shrink-0 text-right">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-display italic text-sm text-[#1C1208] leading-snug truncate">
                            {w.title}
                          </p>
                          {w.authorName && (
                            <p className="font-mono text-[9px] uppercase tracking-wider text-[#1C1208]/30 mt-0.5">
                              {w.authorName}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-[9px] text-[#1C1208]/20 shrink-0">
                          {fmtN(wordCountFromContent(w.content))} w
                        </span>
                        <button
                          onClick={() =>
                            setTocItems((prev) => prev.filter((p) => p.id !== w.id))
                          }
                          className="opacity-0 group-hover:opacity-100 text-[#1C1208]/20 hover:text-[#6B2A2A] transition-all shrink-0"
                          aria-label={`Remove "${w.title}" from issue`}
                        >
                          <X size={9} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ol>
                )}

                {/* Word count + density meter */}
                <div className="mt-8 pt-5 border-t border-[rgba(107,42,42,0.07)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#1C1208]/30">
                      Issue Density
                    </span>
                    <span className="font-mono text-[9px] text-[#6B2A2A]">
                      {totalWordCount.toLocaleString()} words
                    </span>
                  </div>
                  <div
                    className="progress-bar-studio"
                    role="progressbar"
                    aria-valuenow={Math.round(density)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Issue density: ${Math.round(density)}%`}
                  >
                    <div
                      className="progress-bar-studio-fill"
                      style={{ width: `${density}%` }}
                    />
                  </div>
                  <p className="font-mono text-[9px] text-[#1C1208]/20 mt-1.5 text-right">
                    {Math.round(density)}% of {fmtN(TARGET_WORDS)}-word target
                  </p>
                </div>
              </div>

              {/* Publish action */}
              <div className="px-7 pb-7">
                <AnimatePresence mode="wait">
                  {confirmPublish ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="bg-[#6B2A2A]/8 border border-[#6B2A2A]/15 rounded-xl p-4 space-y-3"
                    >
                      <p className="font-mono text-[10px] text-[#1C1208]/60 leading-relaxed">
                        Publish "{selectedIssue.title}"? All included pieces will
                        become publicly visible.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setConfirmPublish(false);
                            onPublishIssue(selectedIssue.id);
                          }}
                          disabled={isPublishingIssue}
                          className="flex-1 bg-[#6B2A2A] text-[#F8F4EC] rounded-lg py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-[#5a2222] disabled:opacity-40 transition-colors"
                        >
                          {isPublishingIssue ? "Publishing…" : "Confirm Publish"}
                        </button>
                        <button
                          onClick={() => setConfirmPublish(false)}
                          className="flex-1 border border-[rgba(107,42,42,0.15)] text-[#1C1208]/50 rounded-lg py-2 font-mono text-[9px] uppercase tracking-widest hover:border-[rgba(107,42,42,0.3)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : selectedIssue.status === "published" ? (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-[#8A8F6F] bg-[#8A8F6F]/8 rounded-xl px-4 py-3"
                    >
                      <Check size={13} aria-hidden />
                      <span className="font-mono text-[9px] uppercase tracking-widest">
                        Published
                      </span>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="action"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setConfirmPublish(true)}
                      className="w-full flex items-center justify-center gap-2 bg-[#6B2A2A] text-[#F8F4EC] rounded-xl py-2.5 font-mono text-[9px] uppercase tracking-widest hover:bg-[#5a2222] transition-colors"
                    >
                      <BookMarked size={12} aria-hidden /> Publish Issue
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT — Available Pieces */}
            <div className="flex flex-col gap-3 sticky top-[81px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1C1208]/40">
                  Available Pieces
                </span>
                <span className="font-mono text-[9px] text-[#1C1208]/25">
                  {availablePieces.length}
                </span>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[520px] pr-0.5">
                {availablePieces.map((w) => (
                  <AvailablePieceCard
                    key={w.id}
                    writing={w}
                    onAdd={() => {
                      setTocItems((prev) => [...prev, w]);
                      toast({ title: `"${w.title}" added to issue` });
                    }}
                  />
                ))}
                {availablePieces.length === 0 && (
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#1C1208]/20 text-center py-10">
                    All pieces added
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          issues.length > 0 && (
            <div className="flex items-center justify-center py-20">
              <p className="font-handwritten text-xl text-[#1C1208]/30">
                Select an issue above to begin building.
              </p>
            </div>
          )
        )}
      </div>
    </DndContext>
  );
}

// ─── Rights & Requests view ────────────────────────────────────────────────────

function RightsView({ requests }: { requests: RequestWithTitle[] }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl italic text-[#1C1208]">Publish Requests</h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1C1208]/30">
          {requests.length} total
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-handwritten text-2xl text-[#1C1208]/25">
            No publish requests yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="studio-index-card rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <p className="font-display italic text-sm text-[#1C1208] truncate">
                  {req.writingTitle}
                </p>
                {req.authorName && (
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#1C1208]/35">
                    {req.authorName}
                  </p>
                )}
                {req.editorName && (
                  <p className="font-mono text-[9px] text-[#1C1208]/25">
                    via {req.editorName}
                  </p>
                )}
                {req.proposedDate && (
                  <p className="font-mono text-[9px] text-[#1C1208]/30">
                    Proposed: {req.proposedDate}
                  </p>
                )}
                {req.rightsDuration && (
                  <p className="font-mono text-[9px] text-[#1C1208]/25">
                    Rights: {req.rightsDuration}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 inline-block px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest border ${
                  req.status === "approved"
                    ? "bg-[#8A8F6F]/10 border-[#8A8F6F]/30 text-[#8A8F6F]"
                    : req.status === "rejected"
                    ? "bg-[#6B2A2A]/8 border-[#6B2A2A]/20 text-[#6B2A2A]"
                    : "border-[rgba(107,42,42,0.15)] text-[#1C1208]/45"
                }`}
              >
                {req.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analytics view ────────────────────────────────────────────────────────────

function AnalyticsView({
  writings,
  issues,
}: {
  writings: WritingWithAuthor[];
  issues:   Issue[];
}) {
  const stats = useMemo(
    () => [
      {
        label: "Total Submissions",
        value: writings.length,
        note:  "all time",
      },
      {
        label: "Ready to Publish",
        value: writings.filter((w) => w.readiness === "ready_to_show" && !w.isPublished).length,
        note:  "editorial queue",
      },
      {
        label: "Draft Issues",
        value: issues.filter((i) => i.status === "draft").length,
        note:  "in progress",
      },
      {
        label: "Published Issues",
        value: issues.filter((i) => i.status === "published").length,
        note:  "live",
      },
    ],
    [writings, issues],
  );

  const readinessBars = useMemo(
    () => [
      { label: "Triage",      color: "#8A8F6F", count: writings.filter((w) => w.readiness === "raw_seed"      && !w.isPublished).length },
      { label: "Development", color: "#c4a24d", count: writings.filter((w) => w.readiness === "growing"       && !w.isPublished).length },
      { label: "Ready",       color: "#6B2A2A", count: writings.filter((w) => w.readiness === "ready_to_show" && !w.isPublished).length },
      { label: "Published",   color: "#1C1208", count: writings.filter((w) => w.isPublished).length                                     },
    ],
    [writings],
  );
  const maxReadiness = Math.max(...readinessBars.map((r) => r.count), 1);

  const genreBars = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of writings) map.set(w.genre, (map.get(w.genre) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [writings]);
  const maxGenre = genreBars.length > 0 ? Math.max(...genreBars.map(([, n]) => n)) : 1;

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="studio-index-card rounded-xl p-5 flex flex-col gap-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#1C1208]/35">
              {s.label}
            </span>
            <span className="font-display italic text-3xl text-[#6B2A2A] leading-none">
              {s.value}
            </span>
            <span className="font-mono text-[8px] text-[#1C1208]/25 uppercase tracking-wider">
              {s.note}
            </span>
          </div>
        ))}
      </div>

      {/* Pipeline distribution sparklines */}
      <section>
        <div className="studio-section-divider mb-6" aria-hidden />
        <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1C1208]/40 mb-5">
          Pipeline Distribution
        </h3>
        <div className="space-y-3">
          {readinessBars.map((r) => (
            <div key={r.label} className="flex items-center gap-4">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#1C1208]/45 w-24 shrink-0">
                {r.label}
              </span>
              <div className="flex-1 h-2 bg-[#E8E2D4] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: r.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.count / maxReadiness) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  role="meter"
                  aria-valuenow={r.count}
                  aria-valuemin={0}
                  aria-valuemax={maxReadiness}
                  aria-label={`${r.label}: ${r.count} pieces`}
                />
              </div>
              <span className="font-mono text-[9px] text-[#1C1208]/30 w-5 text-right shrink-0">
                {r.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Genre sparklines */}
      {genreBars.length > 0 && (
        <section>
          <div className="studio-section-divider mb-6" aria-hidden />
          <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1C1208]/40 mb-5">
            By Genre
          </h3>
          <div className="space-y-3">
            {genreBars.map(([genre, count]) => (
              <div key={genre} className="flex items-center gap-4">
                <span className="font-handwritten text-base text-[#6B2A2A]/70 w-28 shrink-0 truncate">
                  {genre}
                </span>
                <div className="flex-1 h-1.5 bg-[#E8E2D4] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#6B2A2A] to-[#c4a24d]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxGenre) * 100}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
                <span className="font-mono text-[9px] text-[#1C1208]/30 w-5 text-right shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Writing detail panel ──────────────────────────────────────────────────────

function WritingDetailPanel({
  writing,
  onClose,
}: {
  writing: WritingWithAuthor;
  onClose: () => void;
}) {
  const reduced = useReducedMotion() ?? false;

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  // Focus panel on mount via callback ref
  const handleFocusRef = useCallback((node: HTMLElement | null) => {
    node?.focus();
  }, []);

  const wc = wordCountFromContent(writing.content);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for "${writing.title}"`}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <motion.aside
        ref={handleFocusRef}
        initial={{ x: reduced ? 0 : 384, opacity: reduced ? 0 : 1 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: reduced ? 0 : 384, opacity: reduced ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        className="relative w-96 max-w-[90vw] bg-[#F8F4EC] h-full overflow-y-auto shadow-2xl flex flex-col"
        tabIndex={-1}
        style={{ outline: "none" }}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 ink-smudge-border">
          <div className="flex items-start justify-between gap-3 mb-1">
            <span className="font-handwritten text-[14px] text-[#6B2A2A]">
              {writing.genre}
            </span>
            <button
              onClick={onClose}
              className="text-[#1C1208]/25 hover:text-[#6B2A2A] transition-colors mt-0.5 shrink-0"
              aria-label="Close panel"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
          <h2 className="font-display italic text-xl text-[#1C1208] leading-snug">
            {writing.title}
          </h2>
          {writing.authorName && (
            <p className="font-mono text-[9px] uppercase tracking-wider text-[#1C1208]/40 mt-1">
              {writing.authorName}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="px-7 py-5 space-y-2.5 border-b border-[rgba(107,42,42,0.07)]">
          {(
            [
              { label: "Readiness",   value: writing.readiness.replace(/_/g, " ") },
              { label: "Word Count",  value: wc.toLocaleString()                  },
              ...(writing.createdAt
                ? [{ label: "Submitted", value: format(new Date(writing.createdAt), "MMMM d, yyyy") }]
                : []),
            ] as { label: string; value: string }[]
          ).map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#1C1208]/30">
                {label}
              </span>
              <span className="font-mono text-[9px] text-[#1C1208]/55 border border-[rgba(107,42,42,0.1)] rounded-full px-2 py-0.5">
                {value}
              </span>
            </div>
          ))}
          {writing.editorialAvailable && (
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#1C1208]/30">
                Status
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A8F6F] border border-[#8A8F6F]/25 rounded-full px-2 py-0.5">
                Open for editorial
              </span>
            </div>
          )}
        </div>

        {/* Version Notes — red-pen markup aesthetic */}
        <div className="px-7 py-5 border-b border-[rgba(107,42,42,0.07)]">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1C1208]/35 mb-4">
            Version Notes
          </h3>
          <div className="space-y-5">
            <div className="relative pl-4 border-l-2 border-[#6B2A2A]/20">
              <p className="font-mono text-[8px] uppercase tracking-widest text-[#1C1208]/25 mb-0.5">
                Working title
              </p>
              <p className="font-serif text-sm text-[#1C1208]/40 leading-snug line-through decoration-[#6B2A2A]/35 truncate">
                {writing.title}
              </p>
              <p className="font-handwritten text-base text-[#6B2A2A] mt-1 leading-snug">
                Confirm with author before final copy
              </p>
            </div>
            <div className="relative pl-4 border-l-2 border-[#6B2A2A]/20">
              <p className="font-mono text-[8px] uppercase tracking-widest text-[#1C1208]/25 mb-0.5">
                Genre
              </p>
              <p className="font-serif text-sm text-[#1C1208]/40 leading-snug line-through decoration-[#6B2A2A]/35">
                {writing.genre}
              </p>
              <p className="font-handwritten text-base text-[#6B2A2A] mt-1 leading-snug">
                Worth discussing category specificity
              </p>
            </div>
          </div>
        </div>

        {/* Editor Comments — handwritten margin notes */}
        <div className="px-7 py-5 flex-1">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1C1208]/35 mb-4">
            Editor Notes
          </h3>
          <div className="space-y-4">
            <div
              className="handwritten-note rounded-lg p-4 leading-relaxed"
              style={{ transform: "rotate(-0.8deg)" }}
            >
              <p className="font-handwritten text-base text-[#1C1208]/65">
                Strong voice throughout — distinctive and assured. Consider
                mid-issue placement for pacing contrast.
              </p>
            </div>
            <div
              className="handwritten-note rounded-lg p-4 leading-relaxed"
              style={{ transform: "rotate(0.5deg)" }}
            >
              <p className="font-handwritten text-base text-[#1C1208]/65">
                <span className="text-[#6B2A2A] font-semibold">@author</span> —
                does the ending land as intended? The pivot reads abruptly on
                first pass.
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function EditorStudio() {
  const { user, isLoading } = useAuth();
  const [, navigate]        = useLocation();
  const queryClient         = useQueryClient();

  // ── Preserved state variables ────────────────────────────────────────────────
  const [bucket,            setBucket]            = useState<StudioBucket>("all");
  const [search,            setSearch]            = useState("");
  const [selectedWritingId, setSelectedWritingId] = useState<string | null>(null);
  const [selectedIssueId,   setSelectedIssueId]   = useState<string | null>(null);
  const [activeTab,         setActiveTab]         = useState<StudioNav>("kanban");
  const [showNewIssueForm,  setShowNewIssueForm]  = useState(false);
  const [newIssueTitle,     setNewIssueTitle]     = useState("");
  const [newIssueSubtitle,  setNewIssueSubtitle]  = useState("");

  // ── Preserved queries ─────────────────────────────────────────────────────────
  const { data: writings = [], isFetching: isFetchingWritings } =
    useQuery<WritingWithAuthor[]>({
      queryKey: ["/api/editor/garden-stream"],
      enabled:  !!user,
    });

  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: ["/api/editor/issues"],
    enabled:  !!user,
  });

  const { data: greenhouse = [] } = useQuery<GreenhouseEntry[]>({
    queryKey: ["/api/editor/greenhouse"],
    enabled:  !!user,
  });

  const { data: requests = [] } = useQuery<RequestWithTitle[]>({
    queryKey: ["/api/editor/requests"],
    enabled:  !!user,
  });

  // ── Preserved mutations ───────────────────────────────────────────────────────
  const publishIssueMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const res = await apiRequest("POST", `/api/editor/issues/${issueId}/publish`);
      return res.json() as Promise<unknown>;
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
      return res.json() as Promise<unknown>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/issues"] });
      toast({ title: "Issue created" });
      setShowNewIssueForm(false);
      setNewIssueTitle("");
      setNewIssueSubtitle("");
      setActiveTab("issue-builder");
    },
    onError: () => {
      toast({ title: "Failed to create issue", variant: "destructive" });
    },
  });

  // ── Readiness update mutation ─────────────────────────────────────────────────
  const updateReadinessMutation = useMutation({
    mutationFn: async ({ id, readiness }: { id: string; readiness: string }) => {
      const res = await apiRequest("PATCH", `/api/writings/${id}`, { readiness });
      return res.json() as Promise<unknown>;
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editor/garden-stream"] });
      toast({ title: "Could not move piece", variant: "destructive" });
    },
  });

  // ── Preserved derived data ─────────────────────────────────────────────────────
  const filteredWritings = useMemo(() => {
    let list = writings;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          (w.authorName ?? "").toLowerCase().includes(q) ||
          w.genre.toLowerCase().includes(q),
      );
    }
    if (bucket === "triage")      return list.filter((w) => w.readiness === "raw_seed");
    if (bucket === "development") return list.filter((w) => w.readiness === "growing");
    if (bucket === "ready")       return list.filter((w) => w.readiness === "ready_to_show" || w.editorialAvailable);
    if (bucket === "published")   return list.filter((w) => w.isPublished);
    return list;
  }, [writings, bucket, search]);

  // ── Callbacks ─────────────────────────────────────────────────────────────────
  const updateReadiness = useCallback(
    (id: string, readiness: string) => {
      // Optimistic update
      queryClient.setQueryData<WritingWithAuthor[]>(
        ["/api/editor/garden-stream"],
        (old) => old?.map((w) => (w.id === id ? { ...w, readiness } : w)) ?? [],
      );
      updateReadinessMutation.mutate({ id, readiness });
    },
    [queryClient, updateReadinessMutation],
  );

  const handleMoveToDesk = useCallback(
    (id: string) => {
      updateReadiness(id, "growing");
      setActiveTab("kanban");
    },
    [updateReadiness],
  );

  // ── Auth guards ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen studio-paper flex items-center justify-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#1C1208]/35">
          Opening the studio…
        </p>
      </main>
    );
  }

  if (!user || (user.role !== "editor" && user.role !== "editor_in_chief")) {
    return (
      <main className="min-h-screen studio-paper flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#1C1208]/35">
            Access Restricted
          </p>
          <h1 className="font-display text-3xl italic text-[#1C1208]">
            The Editor Studio is members-only
          </h1>
          <button
            onClick={() => navigate("/")}
            className="rounded-full border border-[rgba(107,42,42,0.2)] bg-[#F0EBE0] px-6 py-2.5 font-mono text-[9px] uppercase tracking-wider text-[#6B2A2A] hover:bg-[#EDE7D9] transition-colors"
          >
            Return to Journal
          </button>
        </div>
      </main>
    );
  }

  // ── Sidebar config ─────────────────────────────────────────────────────────────
  const inboxCount = writings.filter(
    (w) => w.readiness === "raw_seed" && !w.isPublished,
  ).length;

  type NavItem = {
    id:    StudioNav;
    label: string;
    Icon:  LucideIcon;
    badge: number | null;
  };

  const navItems: NavItem[] = [
    { id: "inbox",         label: "Inbox",            Icon: Inbox,      badge: inboxCount > 0 ? inboxCount : null },
    { id: "kanban",        label: "Kanban Desk",       Icon: LayoutGrid, badge: null },
    { id: "issue-builder", label: "Issue Builder",     Icon: BookOpen,   badge: null },
    { id: "rights",        label: "Rights & Requests", Icon: FileCheck2, badge: null },
    { id: "analytics",     label: "Analytics",         Icon: BarChart3,  badge: null },
  ];

  const viewTitles: Record<StudioNav, string> = {
    inbox:           "Inbox",
    kanban:          "Kanban Desk",
    "issue-builder": "Issue Builder",
    rights:          "Rights & Requests",
    analytics:       "Analytics",
  };

  const selectedWriting = selectedWritingId
    ? (writings.find((w) => w.id === selectedWritingId) ?? null)
    : null;

  const editorLabel =
    user.displayName ?? user.firstName ?? user.email ?? "Editor";

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen studio-paper overflow-hidden text-[#1C1208]">

      {/* ── Sidebar ── */}
      <aside
        className="w-[240px] shrink-0 flex flex-col border-r border-[rgba(107,42,42,0.1)] bg-[#F0EBE0]"
        aria-label="Studio navigation"
      >
        {/* Monogram / wordmark */}
        <div className="px-6 py-6 ink-smudge-border">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 bg-[#6B2A2A] rounded-lg flex items-center justify-center text-[#F8F4EC] font-display italic text-base font-bold select-none shrink-0"
              aria-hidden
            >
              P
            </div>
            <div className="min-w-0">
              <p className="font-display italic text-sm text-[#1C1208] leading-none">
                The Page
              </p>
              <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-[#1C1208]/35 leading-none mt-0.5">
                Gallery Journal · Desk
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-3 pt-4 pb-2 space-y-0.5"
          aria-label="Studio sections"
        >
          {navItems.map(({ id, label, Icon, badge }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-[0.14em] transition-all text-left group ${
                  active
                    ? "bg-[#6B2A2A] text-[#F8F4EC] shadow-sm"
                    : "text-[#1C1208]/45 hover:text-[#1C1208]/80 hover:bg-[rgba(107,42,42,0.06)]"
                }`}
              >
                <Icon
                  size={13}
                  className={
                    active
                      ? "text-[#F8F4EC]"
                      : "text-[#1C1208]/35 group-hover:text-[#1C1208]/60"
                  }
                  aria-hidden
                />
                <span className="flex-1">{label}</span>
                {badge !== null && (
                  <span
                    className={`text-[8px] font-mono rounded-full px-1.5 py-0.5 leading-none ${
                      active
                        ? "bg-[#F8F4EC]/20 text-[#F8F4EC]"
                        : "bg-[#6B2A2A] text-[#F8F4EC]"
                    }`}
                    aria-label={`${badge} unread`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer — editor identity */}
        <div className="px-5 py-4 border-t border-[rgba(107,42,42,0.08)]">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#8A8F6F] shrink-0"
              aria-hidden
            />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1C1208]/25 truncate">
              {editorLabel}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main canvas ── */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

        {/* Sticky top bar */}
        <header className="sticky top-0 z-10 px-8 py-5 bg-[#F8F4EC]/96 backdrop-blur-sm ink-smudge-border flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-display text-2xl italic tracking-tight text-[#1C1208]">
              {viewTitles[activeTab]}
            </h1>
            {isFetchingWritings && (
              <span
                className="font-mono text-[8px] uppercase tracking-widest text-[#1C1208]/25"
                aria-live="polite"
                aria-label="Updating submissions"
              >
                Updating…
              </span>
            )}
          </div>

          {/* Contextual quick-action */}
          {activeTab === "issue-builder" && (
            <button
              onClick={() => setShowNewIssueForm(true)}
              className="flex items-center gap-2 bg-[#6B2A2A] text-[#F8F4EC] rounded-full px-4 py-2 font-mono text-[9px] uppercase tracking-wider hover:bg-[#5a2222] transition-colors shrink-0"
            >
              <Plus size={10} aria-hidden /> New Issue
            </button>
          )}
        </header>

        {/* Active view */}
        <div className="flex-1 px-8 py-7">
          {activeTab === "kanban" && (
            <KanbanDeskView
              writings={writings}
              search={search}
              setSearch={setSearch}
              updateReadiness={updateReadiness}
              onSelectWriting={setSelectedWritingId}
            />
          )}

          {activeTab === "inbox" && (
            <InboxView
              writings={filteredWritings}
              greenhouse={greenhouse}
              writingsAll={writings}
              onMoveToDesk={handleMoveToDesk}
            />
          )}

          {activeTab === "issue-builder" && (
            <IssueBuilderView
              issues={issues}
              writings={writings}
              selectedIssueId={selectedIssueId}
              setSelectedIssueId={setSelectedIssueId}
              showNewIssueForm={showNewIssueForm}
              setShowNewIssueForm={setShowNewIssueForm}
              newIssueTitle={newIssueTitle}
              setNewIssueTitle={setNewIssueTitle}
              newIssueSubtitle={newIssueSubtitle}
              setNewIssueSubtitle={setNewIssueSubtitle}
              onCreateIssue={(data) => createIssueMutation.mutate(data)}
              isCreatingIssue={createIssueMutation.isPending}
              onPublishIssue={(id) => publishIssueMutation.mutate(id)}
              isPublishingIssue={publishIssueMutation.isPending}
            />
          )}

          {activeTab === "rights" && <RightsView requests={requests} />}

          {activeTab === "analytics" && (
            <AnalyticsView writings={writings} issues={issues} />
          )}
        </div>
      </main>

      {/* ── Writing detail panel (slides from right) ── */}
      <AnimatePresence>
        {selectedWriting && (
          <WritingDetailPanel
            writing={selectedWriting}
            onClose={() => setSelectedWritingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
