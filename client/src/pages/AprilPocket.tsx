import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Flower2, ArrowLeft, BookOpen } from "lucide-react";

// ─── Feature 5: /april/pocket/:username ─────────────────────────────────────────────────
// Public page showing a writer's April writings (isPublicGarden=true pieces
// created during April of the current year). No auth required.
interface PocketWriting {
  id: string;
  title: string;
  content: string;
  genre: string;
  stage: string;
  createdAt: string | null;
  tags: string[] | null;
}

interface PocketUser {
  id: string;
  displayName: string;
  username: string;
}

interface PocketData {
  user: PocketUser;
  pieces: PocketWriting[];
  year: number;
}

export default function AprilPocket() {
  const { username } = useParams<{ username: string }>();

  const { data, isLoading, isError } = useQuery<PocketData>({
    queryKey: ["/api/april/pocket", username],
    queryFn: async () => {
      const res = await fetch(`/api/april/pocket/${username}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1e2d] flex items-center justify-center">
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/30 animate-pulse">
          Loading…
        </span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#0d1e2d] flex flex-col items-center justify-center gap-4">
        <p className="font-body text-sm text-white/40">Writer not found.</p>
        <Link
          href="/april"
          className="font-mono text-[9px] uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors"
        >
          ← Back to April
        </Link>
      </div>
    );
  }

  const { user, pieces, year } = data;

  return (
    <div className="min-h-screen bg-[#0d1e2d] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link
          href="/april"
          className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/25 hover:text-white/45 transition-colors mb-10"
        >
          <ArrowLeft size={10} />
          April
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Flower2 size={13} className="text-pink-400/50" />
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-pink-400/40">
              April {year} — National Poetry Month
            </span>
          </div>
          <h1 className="font-display text-3xl text-white/85 mb-1">
            {user.displayName || user.username}
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/25">
            @{user.username}
          </p>
        </div>

        {/* Piece count */}
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-8">
          {pieces.length} piece{pieces.length !== 1 ? "s" : ""} in the garden this April
        </p>

        {/* Writings */}
        {pieces.length === 0 ? (
          <div className="border border-white/5 rounded-2xl p-10 text-center">
            <BookOpen size={20} className="mx-auto mb-4 text-white/15" />
            <p className="font-body text-sm text-white/30">
              No public April writings yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pieces.map((piece) => (
              <article
                key={piece.id}
                className="border border-white/5 rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/25">
                    {piece.genre}
                  </span>
                  {piece.createdAt && (
                    <span className="font-mono text-[8px] text-white/20">
                      {new Date(piece.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-xl text-white/80 mb-3">
                  {piece.title || "Untitled"}
                </h2>
                <p className="font-body text-sm text-white/50 leading-relaxed line-clamp-4 whitespace-pre-line">
                  {piece.content}
                </p>
                {piece.tags && piece.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {piece.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[7px] uppercase tracking-widest text-white/20 border border-white/5 rounded-full px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
