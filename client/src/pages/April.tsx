import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "../hooks/use-auth";
import AprilPromptBanner from "../components/AprilPromptBanner";
import BloomMap from "../components/BloomMap";
import { Flower2, BookOpen, ExternalLink } from "lucide-react";

// ─── Feature 3: /april public page ─────────────────────────────────────────────────────────
// Displays the full 30-day April prompt sequence for National Poetry Month,
// with the AprilPromptBanner (today's prompt) and BloomMap (writing grid).
interface AprilPrompt {
  id: string;
  day: number;
  text: string;
  category: string;
}

export default function April() {
  const { user } = useAuth();

  const { data: prompts = [] } = useQuery<AprilPrompt[]>({
    queryKey: ["/api/april/all-prompts"],
    queryFn: async () => {
      const res = await fetch("/api/april/all-prompts");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 60 * 24, // cache 24h
  });

  const today = new Date();
  const isApril = today.getMonth() === 3;
  const currentDay = today.getDate();

  return (
    <div className="min-h-screen bg-[#0d1e2d] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Flower2 size={14} className="text-pink-400/60" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-pink-400/50">
              National Poetry Month
            </span>
          </div>
          <h1 className="font-display text-4xl text-white/90 mb-3">
            April Writing Sequence
          </h1>
          <p className="font-body text-sm text-white/50 leading-relaxed max-w-xl">
            Thirty prompts for thirty days. Write one piece each day in April
            and let your garden bloom.
          </p>
        </div>

        {/* Today's banner — only shows in April for logged-in users */}
        {user && (
          <div className="mb-10">
            <AprilPromptBanner
              onWriteFromPrompt={(text) => {
                // Navigate to garden with prompt pre-filled
                window.location.href = `/garden?prompt=${encodeURIComponent(text)}`;
              }}
            />
          </div>
        )}

        {/* Bloom Map — only visible in April for logged-in users */}
        {user && isApril && (
          <div className="mb-12">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4">
              Your April Bloom Map
            </h2>
            <BloomMap />
          </div>
        )}

        {/* Prompt List */}
        <div className="mb-12">
          <h2 className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-6">
            The 30 Prompts
          </h2>
          <div className="space-y-3">
            {prompts.map((prompt) => {
              const isToday = isApril && prompt.day === currentDay;
              const isPast  = isApril && prompt.day < currentDay;
              return (
                <div
                  key={prompt.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isToday
                      ? "border-pink-500/30 bg-pink-950/20"
                      : isPast
                      ? "border-white/5 bg-white/[0.02] opacity-60"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <span className="font-mono text-[10px] text-white/25 w-6 shrink-0 mt-0.5">
                    {String(prompt.day).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className="font-body text-sm text-white/70 leading-relaxed">
                      {prompt.text}
                    </p>
                    <span className="inline-block mt-1.5 font-mono text-[8px] uppercase tracking-widest text-white/25">
                      {prompt.category}
                    </span>
                  </div>
                  {isToday && (
                    <span className="shrink-0 font-mono text-[8px] uppercase tracking-widest text-pink-400/60 px-2 py-1 rounded-full border border-pink-500/20">
                      Today
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pocket Link */}
        {user && (
          <div className="border border-white/5 rounded-2xl p-6 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={13} className="text-white/40" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
                Your April Pocket
              </span>
            </div>
            <p className="font-body text-sm text-white/50 mb-4">
              Share your April writings with a public pocket page.
            </p>
            <Link
              href={`/april/pocket/${(user as any).username || (user as any).displayName}`}
              className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors border border-white/10 hover:border-white/20 rounded-full px-4 py-2"
            >
              <ExternalLink size={11} />
              View my pocket
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
