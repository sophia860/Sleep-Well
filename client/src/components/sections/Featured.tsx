import { Section } from "@/components/ui/section";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap-init";

interface GalleryItem {
  id: string;
  title: string;
  genre: string;
  authorName: string | null;
  content: string | null;
}

function getExcerpt(content: string | null, maxLen = 120): string {
  if (!content) return "";
  const plain = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return plain.length > maxLen ? plain.slice(0, maxLen).trimEnd() + "\u2026" : plain;
}

export default function Featured() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: gallery = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
    queryFn: async () => {
      const res = await fetch("/api/gallery");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const featured = gallery.slice(0, 3);

  // GSAP scroll animation for dreamy entrance
  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;

    gsap.fromTo(
      sectionRef.current.children,
      { opacity: 0, y: 60, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.2,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <Section id="featured" className="bg-transparent text-primary py-32 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(196,162,77,0.04) 0%, transparent 55%)" }}
      />
      <div ref={sectionRef} className="max-w-4xl mx-auto w-full px-6 space-y-16 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="space-y-5"
        >
          <div className="flex items-center gap-4">
            <div className="h-px w-8" style={{ background: "rgba(212,168,83,0.4)" }} />
            <span className="section-eyebrow">Latest from the Journal</span>
          </div>
          <h2 className="font-display text-[clamp(2.5rem,5vw,3.75rem)] font-light tracking-tight" style={{ color: "#f0ede8" }}>
            From the Journal
          </h2>
          <p className="font-sans text-sm leading-relaxed max-w-md" style={{ color: "rgba(240,237,232,0.5)" }}>
            Published stories and poems, selected by our editors
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px w-12" style={{ background: "rgba(212,168,83,0.2)" }} />
            <div className="w-1 h-1 rotate-45" style={{ background: "rgba(212,168,83,0.4)" }} />
            <div className="h-px w-12" style={{ background: "rgba(212,168,83,0.2)" }} />
          </div>
        </motion.div>

        {/* Piece cards */}
        {isLoading ? (
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse border border-white/5 rounded-sm p-6 space-y-3">
                <div className="h-3 w-20 bg-white/10 rounded" />
                <div className="h-6 w-2/3 bg-white/10 rounded" />
                <div className="h-4 w-full bg-white/5 rounded" />
                <div className="h-3 w-24 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? null : (
          <div className="space-y-px">
            {featured.map((piece, i) => (
              <motion.div
                key={piece.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
              >
                <Link href={`/piece/${piece.id}`}>
                  <div className="group border-t border-[#f0ede8]/[0.06] py-8 px-2 flex flex-col md:flex-row md:items-start gap-4 cursor-pointer hover:bg-[#d4a853]/[0.02] transition-all duration-500">
                    {/* Genre + index */}
                    <div className="flex-shrink-0 w-28">
                      <span className="font-sans text-[length:var(--text-label)] tracking-[0.06em] text-amber-300/60 uppercase">
                        {piece.genre || "Piece"}
                      </span>
                    </div>
                    {/* Title + excerpt */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-display text-xl md:text-2xl font-light text-white group-hover:text-amber-100 transition-colors leading-snug">
                        {piece.title}
                      </h3>
                      {piece.content && (
                        <p className="font-sans text-[length:var(--text-small)] text-white/40 leading-relaxed line-clamp-2">
                          {getExcerpt(piece.content, 140)}
                        </p>
                      )}
                    </div>
                    {/* Author + arrow */}
                    <div className="flex-shrink-0 flex items-center gap-3 md:pt-1">
                      {piece.authorName && (
                        <span className="font-sans text-[length:var(--text-label)] text-white/30 tracking-wide">
                          {piece.authorName}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            <div className="border-t border-[#f0ede8]/[0.06]" />
          </div>
        )}

        {/* Read all CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex justify-center pt-4"
        >
          <Link href="/in-bloom">
            <button
              className="flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.25em] uppercase transition-all duration-300 border px-7 py-3 rounded-full hover:border-[#d4a853]/50 hover:text-[#f0ede8]/80"
              style={{ borderColor: "rgba(212,168,83,0.25)", color: "rgba(240,237,232,0.5)" }}
            >
              Read Published Work
              <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
