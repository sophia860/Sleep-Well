import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, PenLine, X } from "lucide-react";
import { useState } from "react";

// ─── Feature 1: April Prompt Sequence ────────────────────────────────────────
// Renders a dismissible banner above the Garden writing environment during April.
// Fetches today's April prompt from /api/april/prompt-of-day (same endpoint
// used by the server/routes/april.ts route). Only renders in April (month === 3).

export interface AprilPrompt {
  id: string;
  day: number;
  text: string;
  category: string;
}

interface Props {
  onWriteFromPrompt?: (promptText: string) => void;
}

export default function AprilPromptBanner({ onWriteFromPrompt }: Props) {
  const [dismissed, setDismissed] = useState(false);

  const isApril = new Date().getMonth() === 3; // 0-indexed

  const { data: prompt } = useQuery<AprilPrompt | null>({
    queryKey: ["/api/april/prompt-of-day"],
    queryFn: async () => {
      const res = await fetch("/api/april/prompt-of-day", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isApril,
    staleTime: 1000 * 60 * 60, // cache 1 hour
  });

  if (!isApril || !prompt || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="april-prompt-banner"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="mb-6 relative rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-950/20 via-transparent to-rose-950/10 p-5"
        data-testid="april-prompt-banner"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors"
          data-testid="btn-dismiss-april-banner"
        >
          <X size={13} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={12} className="text-pink-400/60" />
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-pink-400/50">
            National Poetry Month — Day {prompt.day}
          </span>
          <span className="ml-auto font-mono text-[8px] uppercase tracking-widest text-white/30">
            {prompt.category}
          </span>
        </div>

        <p className="font-display text-lg text-white/75 italic leading-relaxed mb-4">
          {prompt.text}
        </p>

        {onWriteFromPrompt && (
          <button
            onClick={() => onWriteFromPrompt(prompt.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest border border-pink-500/20 text-pink-400/60 hover:text-pink-400/80 hover:border-pink-500/30 transition-all"
            data-testid="btn-write-from-april-prompt"
          >
            <PenLine size={11} />
            Write from this prompt
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
