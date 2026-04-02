import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// ─── Feature 2: Bloom Map ───────────────────────────────────────────────────
// CSS-only 30-cell contribution grid for the Gallery page.
// Each cell = one April day. Filled = user has a writing seeded that day.
// Reads from existing writings — no new DB columns needed.

interface DayBucket {
  day: number; // 1-30
  count: number;
}

interface Writing {
  id: string;
  createdAt: string | null;
}

export default function BloomMap() {
  const isApril = new Date().getMonth() === 3;

  const { data: writings = [] } = useQuery<Writing[]>({
    queryKey: ["/api/writings"],
    queryFn: async () => {
      const res = await fetch("/api/writings", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isApril,
  });

  if (!isApril) return null;

  // Bucket writings by April day
  const buckets: Record<number, number> = {};
  for (const w of writings) {
    if (!w.createdAt) continue;
    const d = new Date(w.createdAt);
    if (d.getMonth() !== 3) continue; // only April
    const day = d.getDate(); // 1-30
    buckets[day] = (buckets[day] || 0) + 1;
  }

  const today = new Date().getDate();

  return (
    <div className="mb-8" data-testid="bloom-map">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-pink-400/40">
          April Bloom Map
        </span>
        <span className="font-mono text-[8px] text-white/20">
          {Object.keys(buckets).length} / 30 days
        </span>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
      >
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          const count = buckets[day] || 0;
          const isFuture = day > today;
          const isToday = day === today;

          let bg = "bg-white/[0.04]";
          if (count >= 3) bg = "bg-pink-400/70";
          else if (count === 2) bg = "bg-pink-400/45";
          else if (count === 1) bg = "bg-pink-400/25";

          return (
            <Tooltip key={day}>
              <TooltipTrigger asChild>
                <div
                  className={`aspect-square rounded-sm transition-all ${
                    isFuture ? "opacity-30" : ""
                  } ${
                    isToday ? "ring-1 ring-pink-400/40" : ""
                  } ${bg}`}
                  data-testid={`bloom-day-${day}`}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs font-mono">
                  April {day} {count > 0 ? `— ${count} piece${count !== 1 ? "s" : ""}` : "— no entries"}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
