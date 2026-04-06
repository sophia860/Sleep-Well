import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Bookmark, Heart, Plus, Trash2, Check, ChevronDown, Sparkles, Eye, Flame, Star, Mic2, Tag } from "lucide-react";
import { timeAgo, apiFetch, GlassCard, PageHeader, ActionButton, LoadingSkeleton, EmptyState, TabGroup, FormField, inputClass, textareaClass, Badge } from "./GardenUI";
import { stripHtml } from "./RichEditor";

type GalleryWriting = {
  id: string;
  title: string;
  content: string;
  genre: string;
  stage: string;
  authorId: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type QueueItem = {
  id: string;
  userId: string;
  writingId: string;
  isRead: boolean;
  addedAt: string;
  writing?: GalleryWriting;
};

type SavedItem = {
  id: string;
  userId: string;
  writingId: string;
  savedAt: string;
  writing?: GalleryWriting;
};

type PollinationItem = {
  id: string;
  fromUserId: string;
  writingId: string;
  highlightText: string | null;
  affirmation: string;
  createdAt: string;
  writing?: GalleryWriting;
};

const genreFilters = ["all", "poetry", "fiction", "essay", "fragment"] as const;

const genreColorMap: Record<string, { accent: string; border: string; bg: string; glow: string; text: string }> = {
  poetry: { accent: "amber", border: "border-amber-500/20", bg: "bg-amber-500/10", glow: "rgba(245,158,11,0.06)", text: "text-amber-400/80" },
  fiction: { accent: "emerald", border: "border-emerald-500/20", bg: "bg-emerald-500/10", glow: "rgba(16,185,129,0.06)", text: "text-emerald-400/80" },
  essay: { accent: "blue", border: "border-blue-500/20", bg: "bg-blue-500/10", glow: "rgba(59,130,246,0.06)", text: "text-blue-400/80" },
  fragment: { accent: "purple", border: "border-purple-500/20", bg: "bg-purple-500/10", glow: "rgba(168,85,247,0.06)", text: "text-purple-400/80" },
  other: { accent: "white", border: "border-white/10", bg: "bg-white/[0.04]", glow: "rgba(255,255,255,0.03)", text: "text-white/50" },
  all: { accent: "white", border: "border-white/10", bg: "bg-white/[0.04]", glow: "rgba(255,255,255,0.03)", text: "text-white/50" },
};

function getGenreColors(genre: string) {
  return genreColorMap[genre] || genreColorMap.other;
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export function GalleryPage() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: writings = [], isLoading } = useQuery<GalleryWriting[]>({
    queryKey: ["gallery", search, genre],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (genre !== "all") params.set("genre", genre);
      const qs = params.toString();
      return apiFetch(`/api/gallery${qs ? `?${qs}` : ""}`);
    },
  });

  const addToQueue = useMutation({
    mutationFn: (writingId: string) =>
      apiFetch("/api/reading-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writingId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reading-queue"] }),
  });

  const savePiece = useMutation({
    mutationFn: (writingId: string) =>
      apiFetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writingId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved"] }),
  });

  return (
    <div className="max-w-5xl mx-auto" data-testid="gallery-page">
      <PageHeader
        icon={<Eye size={18} />}
        label="Discover"
        title="Gallery"
        subtitle="Published works from the community"
        accentColor="amber"
        data-testid="heading-gallery"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-grow">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search writings..."
            className={`${inputClass} pl-11`}
            data-testid="input-gallery-search"
          />
        </div>
        <div
          className="flex gap-1 p-1 rounded-xl border border-white/[0.06] backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.015)" }}
        >
          {genreFilters.map((f) => {
            const colors = getGenreColors(f);
            const isActive = genre === f;
            return (
              <motion.button
                key={f}
                onClick={() => setGenre(f)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-all ${
                  isActive ? `${colors.text}` : "text-white/30 hover:text-white/50"
                }`}
                data-testid={`filter-genre-${f}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="genreFilter"
                    className={`absolute inset-0 rounded-lg ${colors.bg} ${colors.border} border`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{f}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {isLoading && <LoadingSkeleton count={4} />}

      {!isLoading && writings.length === 0 && (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="No published writings found"
          description="Try adjusting your search or explore a different genre."
          data-testid="gallery-empty"
        />
      )}

      <motion.div
        className="grid gap-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {writings.map((w) => {
            const colors = getGenreColors(w.genre);
            return (
              <motion.div
                key={w.id}
                variants={staggerItem}
                exit={{ opacity: 0, y: -10 }}
                data-testid={`card-gallery-${w.id}`}
              >
                <GlassCard hoverGlow={colors.glow} className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-display font-light italic text-white/70 truncate">{w.title || "Untitled"}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge color={colors.accent}>{w.genre}</Badge>
                        <span className="font-mono text-[9px] text-white/15">{timeAgo(w.publishedAt || w.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-serif text-white/30 line-clamp-2 mb-4 leading-relaxed">{stripHtml(w.content || "").slice(0, 200)}</p>
                  <div className="flex gap-2">
                    <ActionButton
                      onClick={() => addToQueue.mutate(w.id)}
                      variant="ghost"
                      size="sm"
                      icon={<Plus size={12} />}
                      data-testid={`button-queue-${w.id}`}
                    >
                      Add to Queue
                    </ActionButton>
                    <ActionButton
                      onClick={() => savePiece.mutate(w.id)}
                      variant="accent"
                      size="sm"
                      icon={<Bookmark size={12} />}
                      data-testid={`button-save-${w.id}`}
                    >
                      Save
                    </ActionButton>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function ReadingQueuePage() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<QueueItem[]>({
    queryKey: ["reading-queue"],
    queryFn: () => apiFetch("/api/reading-queue"),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/reading-queue/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reading-queue"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/reading-queue/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reading-queue"] }),
  });

  return (
    <div className="max-w-4xl mx-auto" data-testid="reading-queue-page">
      <PageHeader
        icon={<BookOpen size={18} />}
        label="Your List"
        title="Reading Queue"
        subtitle={`${items.length} ${items.length === 1 ? "piece" : "pieces"} queued`}
        accentColor="emerald"
        data-testid="heading-reading-queue"
      />

      {isLoading && <LoadingSkeleton count={3} />}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="Your reading queue is empty"
          description="Browse the Gallery to add pieces you'd like to read."
          data-testid="queue-empty"
        />
      )}

      <motion.div
        className="space-y-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const colors = getGenreColors(item.writing?.genre || "other");
            return (
              <motion.div
                key={item.id}
                variants={staggerItem}
                exit={{ opacity: 0, x: -20 }}
                data-testid={`card-queue-${item.id}`}
              >
                <div
                  className={`relative rounded-2xl border backdrop-blur-sm p-5 transition-all overflow-hidden ${
                    item.isRead
                      ? "border-emerald-500/15"
                      : "border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                  style={{
                    background: item.isRead
                      ? "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(16,185,129,0.01) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  }}
                >
                  {item.isRead && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "radial-gradient(ellipse at 0% 50%, rgba(16,185,129,0.08) 0%, transparent 50%)",
                      }}
                    />
                  )}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
                    style={{
                      background: item.isRead
                        ? "linear-gradient(180deg, rgba(16,185,129,0.5) 0%, rgba(16,185,129,0.1) 100%)"
                        : `linear-gradient(180deg, ${colors.glow.replace("0.06", "0.4")} 0%, transparent 100%)`,
                    }}
                  />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        {item.isRead && <Check size={14} className="text-emerald-400/60 flex-shrink-0" />}
                        <h3 className={`text-lg font-display font-light italic truncate ${item.isRead ? "text-white/40" : "text-white/70"}`}>
                          {item.writing?.title || "Untitled"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge color={colors.accent}>{item.writing?.genre}</Badge>
                        <span className="font-mono text-[9px] text-white/15">{timeAgo(item.addedAt)}</span>
                        <Badge color={item.isRead ? "emerald" : "amber"}>
                          {item.isRead ? "read" : "unread"}
                        </Badge>
                      </div>
                      {item.writing?.content && (
                        <p className="text-sm font-serif text-white/25 line-clamp-1 mt-2.5 leading-relaxed">{stripHtml(item.writing.content || "").slice(0, 150)}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!item.isRead && (
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => markRead.mutate(item.id)}
                          className="p-2.5 rounded-xl border border-white/[0.06] text-white/30 hover:text-emerald-400/70 hover:border-emerald-500/20 hover:bg-emerald-500/[0.05] transition-all"
                          title="Mark as read"
                          data-testid={`button-mark-read-${item.id}`}
                        >
                          <Check size={14} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => remove.mutate(item.id)}
                        className="p-2.5 rounded-xl border border-white/[0.06] text-white/30 hover:text-pink-400/70 hover:border-pink-500/20 hover:bg-pink-500/[0.05] transition-all"
                        title="Remove"
                        data-testid={`button-remove-queue-${item.id}`}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function ExplorePage() {
  const { data: writings = [], isLoading } = useQuery<GalleryWriting[]>({
    queryKey: ["gallery"],
    queryFn: () => apiFetch("/api/gallery"),
  });

  const grouped = writings.reduce<Record<string, GalleryWriting[]>>((acc, w) => {
    const g = w.genre || "other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(w);
    return acc;
  }, {});

  const shelfOrder = ["poetry", "fiction", "essay", "fragment", "other"];
  const shelves = shelfOrder.filter((g) => grouped[g]?.length);

  return (
    <div className="max-w-6xl mx-auto" data-testid="explore-page">
      <PageHeader
        icon={<Sparkles size={18} />}
        label="Browse"
        title="Explore"
        subtitle="Browse by genre"
        accentColor="purple"
        data-testid="heading-explore"
      />

      {isLoading && <LoadingSkeleton count={3} />}

      {!isLoading && shelves.length === 0 && (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="Nothing to explore yet"
          description="No published writings to explore. Check back soon."
          data-testid="explore-empty"
        />
      )}

      <div className="space-y-12">
        {shelves.map((genre, si) => {
          const colors = getGenreColors(genre);
          return (
            <motion.div
              key={genre}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              data-testid={`shelf-${genre}`}
            >
              <div className="flex items-center gap-4 mb-5">
                <h2 className="text-xl font-display font-light italic text-white/60 capitalize">{genre}</h2>
                <div
                  className="flex-grow h-px"
                  style={{
                    background: `linear-gradient(90deg, ${colors.glow.replace("0.06", "0.3")} 0%, transparent 100%)`,
                  }}
                />
                <span className="font-mono text-[9px] tracking-widest text-white/15 uppercase">
                  {grouped[genre].length} {grouped[genre].length === 1 ? "piece" : "pieces"}
                </span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
                {grouped[genre].map((w, wi) => (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: si * 0.1 + wi * 0.05, duration: 0.5 }}
                    whileHover={{ scale: 1.04, y: -6 }}
                    className="flex-shrink-0 w-64 relative rounded-2xl border border-white/[0.06] hover:border-white/[0.12] backdrop-blur-sm overflow-hidden cursor-default transition-all group"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    }}
                    data-testid={`card-explore-${w.id}`}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at 50% 0%, ${colors.glow} 0%, transparent 70%)`,
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${colors.glow.replace("0.06", "0.4")}, transparent)`,
                      }}
                    />
                    <div className="relative z-10 p-5">
                      <h3 className="text-base font-display font-light italic text-white/70 truncate mb-2">{w.title || "Untitled"}</h3>
                      <p className="text-xs font-serif text-white/25 line-clamp-3 mb-3 leading-relaxed">{stripHtml(w.content || "").slice(0, 120)}</p>
                      <span className="font-mono text-[9px] text-white/15">{timeAgo(w.publishedAt || w.createdAt)}</span>
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                      style={{
                        background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.3))",
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function SavedPage() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<SavedItem[]>({
    queryKey: ["saved"],
    queryFn: () => apiFetch("/api/saved"),
  });

  const unsave = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/saved/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved"] }),
  });

  return (
    <div className="max-w-5xl mx-auto" data-testid="saved-page">
      <PageHeader
        icon={<Bookmark size={18} />}
        label="Collection"
        title="Saved"
        subtitle={`${items.length} saved ${items.length === 1 ? "piece" : "pieces"}`}
        accentColor="amber"
        data-testid="heading-saved"
      />

      {isLoading && <LoadingSkeleton count={3} />}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={<Bookmark size={36} />}
          title="No saved pieces yet"
          description="Save writings from the Gallery to revisit later."
          data-testid="saved-empty"
        />
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const colors = getGenreColors(item.writing?.genre || "other");
            return (
              <motion.div
                key={item.id}
                variants={staggerItem}
                exit={{ opacity: 0, scale: 0.9 }}
                data-testid={`card-saved-${item.id}`}
              >
                <motion.div
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="relative rounded-2xl border border-white/[0.06] hover:border-white/[0.12] backdrop-blur-sm overflow-hidden h-full flex flex-col transition-all group"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, ${colors.glow} 0%, transparent 70%)`,
                    }}
                  />
                  <div className="relative z-10 p-5 flex-grow">
                    <h3 className="text-base font-display font-light italic text-white/70 truncate mb-1.5">{item.writing?.title || "Untitled"}</h3>
                    <div className="flex items-center gap-2.5 mb-3">
                      <Badge color={colors.accent}>{item.writing?.genre}</Badge>
                      <span className="font-mono text-[9px] text-white/15">{timeAgo(item.savedAt)}</span>
                    </div>
                    <p className="text-xs font-serif text-white/25 line-clamp-3 leading-relaxed">{stripHtml(item.writing?.content || "").slice(0, 150)}</p>
                  </div>
                  <div className="relative z-10 mt-auto px-5 pb-5 pt-3 border-t border-white/[0.04]">
                    <ActionButton
                      onClick={() => unsave.mutate(item.id)}
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={11} />}
                      data-testid={`button-unsave-${item.id}`}
                    >
                      Unsave
                    </ActionButton>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function PollinationPage() {
  const [tab, setTab] = useState<"give" | "received">("give");
  const [selectedWritingId, setSelectedWritingId] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [highlightText, setHighlightText] = useState("");
  const queryClient = useQueryClient();

  const { data: gallery = [] } = useQuery<GalleryWriting[]>({
    queryKey: ["gallery"],
    queryFn: () => apiFetch("/api/gallery"),
  });

  const { data: received = [], isLoading: loadingReceived } = useQuery<PollinationItem[]>({
    queryKey: ["pollinations-received"],
    queryFn: () => apiFetch("/api/pollinations/received"),
    enabled: tab === "received",
  });

  const sendPollination = useMutation({
    mutationFn: () =>
      apiFetch("/api/pollinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writingId: selectedWritingId,
          affirmation,
          highlightText: highlightText || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pollinations-received"] });
      setSelectedWritingId("");
      setAffirmation("");
      setHighlightText("");
    },
  });

  return (
    <div className="max-w-4xl mx-auto" data-testid="pollination-page">
      <PageHeader
        icon={<Heart size={18} />}
        label="Connect"
        title="Pollination"
        subtitle="Share affirmations on writings you love"
        accentColor="pink"
        data-testid="heading-pollination"
      />

      <div className="mb-8">
        <TabGroup
          tabs={[
            { id: "give", label: "Give" },
            { id: "received", label: "Received" },
          ]}
          active={tab}
          onChange={(id) => setTab(id as "give" | "received")}
          data-testid="tabs-pollination"
        />
      </div>

      <AnimatePresence mode="wait">
        {tab === "give" && (
          <motion.div
            key="give"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            data-testid="pollination-give-form"
          >
            <GlassCard className="p-6 md:p-8">
              <div className="space-y-6">
                <FormField label="Select a piece">
                  <div className="relative">
                    <select
                      value={selectedWritingId}
                      onChange={(e) => setSelectedWritingId(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer pr-10`}
                      data-testid="select-writing"
                    >
                      <option value="" className="bg-neutral-900">Choose a writing...</option>
                      {gallery.map((w) => (
                        <option key={w.id} value={w.id} className="bg-neutral-900">
                          {w.title || "Untitled"} — {w.genre}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                </FormField>

                <FormField label="Highlight text (optional)">
                  <input
                    type="text"
                    value={highlightText}
                    onChange={(e) => setHighlightText(e.target.value)}
                    placeholder="A line or phrase that resonated..."
                    className={inputClass}
                    data-testid="input-highlight"
                  />
                </FormField>

                <FormField label="Your affirmation">
                  <textarea
                    value={affirmation}
                    onChange={(e) => setAffirmation(e.target.value)}
                    placeholder="What moved you about this piece..."
                    rows={4}
                    className={textareaClass}
                    data-testid="input-affirmation"
                  />
                </FormField>

                <ActionButton
                  onClick={() => sendPollination.mutate()}
                  disabled={!selectedWritingId || !affirmation.trim() || sendPollination.isPending}
                  variant="accent"
                  icon={<Heart size={14} />}
                  data-testid="button-send-pollination"
                >
                  {sendPollination.isPending ? "Sending..." : "Send Affirmation"}
                </ActionButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {tab === "received" && (
          <motion.div
            key="received"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {loadingReceived && <LoadingSkeleton count={3} />}

            {!loadingReceived && received.length === 0 && (
              <EmptyState
                icon={<Heart size={36} />}
                title="No affirmations received yet"
                description="When someone resonates with your work, it'll appear here."
                data-testid="pollination-received-empty"
              />
            )}

            <motion.div
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {received.map((p) => (
                <motion.div
                  key={p.id}
                  variants={staggerItem}
                  data-testid={`card-pollination-${p.id}`}
                >
                  <div
                    className="relative rounded-2xl overflow-hidden backdrop-blur-sm"
                    style={{
                      background: "linear-gradient(135deg, rgba(236,72,153,0.04) 0%, rgba(236,72,153,0.01) 100%)",
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        border: "1px solid transparent",
                        backgroundClip: "padding-box",
                        borderImage: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.1), rgba(236,72,153,0.15)) 1",
                        borderRadius: "1rem",
                      }}
                    />
                    <div className="border border-pink-500/15 rounded-2xl p-5 md:p-6">
                      <div className="flex items-center gap-2.5 mb-4">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Heart size={14} className="text-pink-400/60" fill="rgba(236,72,153,0.3)" />
                        </motion.div>
                        <Badge color="pink">Affirmation</Badge>
                        <span className="font-mono text-[9px] text-white/15 ml-auto">{timeAgo(p.createdAt)}</span>
                      </div>
                      {p.highlightText && (
                        <div
                          className="pl-4 mb-4 border-l-2"
                          style={{
                            borderImage: "linear-gradient(180deg, rgba(236,72,153,0.3), rgba(168,85,247,0.1)) 1",
                          }}
                        >
                          <p className="text-sm font-serif italic text-white/45 leading-relaxed">"{p.highlightText}"</p>
                        </div>
                      )}
                      <p className="text-sm font-serif text-white/60 leading-relaxed">{p.affirmation}</p>
                      {p.writing && (
                        <div className="mt-4 pt-3 border-t border-white/[0.04]">
                          <span className="font-mono text-[9px] text-white/20">on "{p.writing.title || "Untitled"}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Discover Page ───────────────────────────────────────────────────────────

type DiscoverWriting = {
  id: string;
  title: string;
  content: string;
  genre: string;
  authorId: string;
  authorName: string | null;
  publishedAt: string | null;
  createdAt: string;
  tags: string[] | null;
  resonanceCount?: number;
  readCount?: number;
};

const discoverGenres = ["all", "poetry", "fiction", "essay", "fragment", "hybrid", "other"] as const;

function DiscoverCard({
  writing,
  index,
  onViewProfile,
}: {
  writing: DiscoverWriting;
  index: number;
  onViewProfile?: (userId: string) => void;
}) {
  const colors = getGenreColors(writing.genre);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="flex-shrink-0 w-60 relative rounded-2xl border border-white/[0.06] hover:border-white/[0.12] backdrop-blur-sm overflow-hidden cursor-default transition-all group"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
      data-testid={`discover-card-${writing.id}`}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${colors.glow} 0%, transparent 70%)` }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${colors.glow.replace("0.06", "0.4")}, transparent)` }}
      />
      <div className="relative z-10 p-5">
        <h3 className="text-base font-display font-light italic text-white/70 truncate mb-1.5">
          {writing.title || "Untitled"}
        </h3>
        {writing.authorName && (
          <button
            onClick={() => onViewProfile?.(writing.authorId)}
            className="font-serif text-xs text-white/35 hover:text-white/60 transition-colors mb-2 truncate block w-full text-left"
            data-testid={`discover-author-${writing.id}`}
          >
            {writing.authorName}
          </button>
        )}
        <p className="text-xs font-serif text-white/25 line-clamp-3 mb-3 leading-relaxed">
          {stripHtml(writing.content || "").slice(0, 120)}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge color={colors.accent}>{writing.genre}</Badge>
          {writing.tags && writing.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="font-mono text-[8px] text-white/20 border border-white/[0.06] rounded px-1.5 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <span className="mt-2 block font-mono text-[8px] text-white/15">
          {timeAgo(writing.publishedAt || writing.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

function DiscoverShelf({
  label,
  icon,
  writings,
  isLoading,
  onViewProfile,
  testId,
}: {
  label: string;
  icon: React.ReactNode;
  writings: DiscoverWriting[];
  isLoading: boolean;
  onViewProfile?: (userId: string) => void;
  testId: string;
}) {
  if (isLoading) {
    return (
      <div className="mb-10" data-testid={`${testId}-skeleton`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-white/20">{icon}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/20">{label}</span>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-60 h-36 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (writings.length === 0) return null;

  return (
    <div className="mb-10" data-testid={testId}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white/30">{icon}</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">{label}</span>
        <div className="flex-grow h-px bg-white/[0.04]" />
        <span className="font-mono text-[8px] text-white/15">{writings.length} pieces</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {writings.map((w, i) => (
          <DiscoverCard key={w.id} writing={w} index={i} onViewProfile={onViewProfile} />
        ))}
      </div>
    </div>
  );
}

export function DiscoverPage({ onViewProfile }: { onViewProfile?: (userId: string) => void }) {
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");

  const { data: featured = [], isLoading: loadingFeatured } = useQuery<DiscoverWriting[]>({
    queryKey: ["/api/gallery/featured"],
    queryFn: () => apiFetch("/api/gallery/featured"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: newVoices = [], isLoading: loadingNewVoices } = useQuery<DiscoverWriting[]>({
    queryKey: ["/api/gallery/new-voices"],
    queryFn: () => apiFetch("/api/gallery/new-voices"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trending = [], isLoading: loadingTrending } = useQuery<DiscoverWriting[]>({
    queryKey: ["/api/gallery/trending"],
    queryFn: () => apiFetch("/api/gallery/trending"),
    staleTime: 5 * 60 * 1000,
  });

  function filterWritings(list: DiscoverWriting[]) {
    let result = list;
    if (genreFilter !== "all") {
      result = result.filter((w) => w.genre === genreFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          (w.title || "").toLowerCase().includes(q) ||
          (w.authorName || "").toLowerCase().includes(q) ||
          (w.content || "").toLowerCase().includes(q) ||
          (w.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }

  const filteredFeatured = filterWritings(featured);
  const filteredNewVoices = filterWritings(newVoices);
  const filteredTrending = filterWritings(trending);

  const isLoading = loadingFeatured || loadingNewVoices || loadingTrending;
  const isEmpty =
    !isLoading &&
    filteredFeatured.length === 0 &&
    filteredNewVoices.length === 0 &&
    filteredTrending.length === 0;

  return (
    <div className="max-w-5xl mx-auto" data-testid="discover-page">
      {/* Search + genre filters */}
      <div className="mb-8 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or keyword..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-9 pr-4 text-sm text-white/80 placeholder:text-white/30 outline-none transition-all focus:border-white/[0.16]"
            data-testid="input-discover-search"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap" data-testid="discover-genre-filters">
          {discoverGenres.map((g) => {
            const colors = getGenreColors(g);
            const isActive = genreFilter === g;
            return (
              <button
                key={g}
                onClick={() => setGenreFilter(g)}
                className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all border ${
                  isActive
                    ? `${colors.text} ${colors.bg} ${colors.border}`
                    : "border-transparent text-white/35 hover:text-white/60"
                }`}
                data-testid={`discover-filter-${g}`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {isEmpty && (
        <div className="border border-dashed border-white/[0.06] rounded-2xl p-16 text-center space-y-3">
          <Sparkles size={28} className="mx-auto text-white/15" />
          <p className="font-serif text-sm text-white/30 italic">
            {search || genreFilter !== "all"
              ? "No pieces match this search. Try different keywords or clear the filters."
              : "No published pieces in the gallery yet. Check back soon."}
          </p>
        </div>
      )}

      <DiscoverShelf
        label="Featured"
        icon={<Star size={12} />}
        writings={filteredFeatured}
        isLoading={loadingFeatured}
        onViewProfile={onViewProfile}
        testId="discover-featured"
      />

      <DiscoverShelf
        label="New Voices"
        icon={<Mic2 size={12} />}
        writings={filteredNewVoices}
        isLoading={loadingNewVoices}
        onViewProfile={onViewProfile}
        testId="discover-new-voices"
      />

      <DiscoverShelf
        label="Trending"
        icon={<Flame size={12} />}
        writings={filteredTrending}
        isLoading={loadingTrending}
        onViewProfile={onViewProfile}
        testId="discover-trending"
      />

      {/* Tag-based browsing — unique tags across all pieces */}
      {!isLoading && (() => {
        const allTags = Array.from(
          new Set([...featured, ...newVoices, ...trending].flatMap((w) => w.tags || []))
        ).slice(0, 20);
        if (allTags.length === 0) return null;
        return (
          <div className="mt-4" data-testid="discover-tags">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={11} className="text-white/25" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/25">Browse by tag</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="font-mono text-[9px] text-white/30 border border-white/[0.06] hover:border-white/[0.15] hover:text-white/60 rounded-lg px-2.5 py-1 transition-all"
                  data-testid={`discover-tag-${tag}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
