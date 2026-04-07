import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import StarTitle from "@/components/StarTitle";
import { Link } from "wouter";
import { gsap, prefersReducedMotion } from "@/lib/gsap-init";
import { useAuth } from "@/hooks/use-auth";

export default function Hero() {
  const textRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!textRef.current || prefersReducedMotion) return;
    const children = Array.from(textRef.current.children);
    gsap.fromTo(
      children,
      { opacity: 0, y: 40, filter: "blur(6px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.2,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.2,
      }
    );
  }, []);

  const writingHref = !authLoading && user ? "/garden" : "/sign-in";

  return (
    <div className="relative">
      <StarTitle />

      <section
        id="hero-content"
        className="relative z-10 min-h-[55vh] pt-20 pb-16 px-6 md:px-12 lg:px-24"
      >
        {/* Atmospheric gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(212,168,83,0.04) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <div ref={textRef} className="lg:col-span-7 space-y-10">
              {/* Eyebrow label */}
              <div className="flex items-center gap-4">
                <div className="h-px w-8 bg-[#d4a853]/40" />
                <p className="section-eyebrow">
                  A Literary Journal & Digital Writing Garden
                </p>
              </div>

              {/* Main heading */}
              <div className="space-y-3">
                <h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] font-light leading-[0.92] tracking-tight text-balance"
                  style={{ color: "#f0ede8" }}>
                  Writing<br />
                  <span style={{
                    fontStyle: "italic",
                    color: "#f0ede8",
                    opacity: 0.8
                  }}>that lingers.</span>
                </h1>
              </div>

              {/* Mission text */}
              <div className="space-y-4 max-w-xl">
                <p className="font-sans text-sm md:text-base leading-relaxed" style={{ color: "rgba(240,237,232,0.6)" }}
                  data-testid="text-hero-mission">
                  The Page Gallery publishes poetry, fiction, and essays that resist easy resolution.
                  We believe in writing that earns its silences — work that asks something of the reader.
                </p>
                <p className="font-sans text-sm md:text-base leading-relaxed" style={{ color: "rgba(240,237,232,0.38)" }}
                  data-testid="text-hero-garden-proposition">
                  No slush pile. No query letters. No waiting rooms.{" "}
                  Every writer gets a Garden — a private space for drafts, fragments, and work that isn't ready yet.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                {/* Primary CTA */}
                <Link
                  href="/in-bloom"
                  className="group inline-flex items-center gap-3 px-7 py-3 rounded-full border transition-all duration-400"
                  style={{
                    borderColor: "rgba(212,168,83,0.35)",
                    background: "rgba(212,168,83,0.06)",
                    color: "#d4a853",
                  }}
                  data-testid="cta-read-journal"
                >
                  <span className="font-sans text-sm tracking-[0.08em] uppercase">Read the Journal</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1 text-[#d4a853]/60">→</span>
                </Link>

                {/* Secondary CTA */}
                <Link
                  href={writingHref}
                  className="group inline-flex items-center gap-3 transition-all duration-400"
                  data-testid="cta-start-writing"
                >
                  <span className="font-display italic text-lg transition-colors duration-300"
                    style={{ color: "rgba(240,237,232,0.55)" }}>
                    {!authLoading && user ? "Open Your Garden" : "Start Writing"}
                  </span>
                  <span className="text-xs transition-all duration-300 group-hover:translate-x-1"
                    style={{ color: "rgba(240,237,232,0.3)" }}>
                    →
                  </span>
                </Link>

                {/* Tertiary */}
                <Link
                  href="/about"
                  className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] transition-colors duration-300"
                  style={{ color: "rgba(240,237,232,0.3)" }}
                  data-testid="cta-about-us"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.6)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.3)")}
                >
                  About Us
                </Link>
              </div>
            </div>

            {/* Right column: decorative element */}
            <div className="hidden lg:flex lg:col-span-5 items-center justify-center pt-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1.5 }}
                className="relative w-full max-w-xs"
              >
                {/* Decorative journal symbol */}
                <div className="text-center space-y-6">
                  <div className="mx-auto w-px h-24" style={{ background: "linear-gradient(to bottom, transparent, rgba(212,168,83,0.3), transparent)" }} />
                  <div className="space-y-2">
                    <p className="font-mono text-[0.6875rem] tracking-[0.4em] uppercase" style={{ color: "rgba(212,168,83,0.4)" }}>Issue</p>
                    <p className="font-display text-6xl font-light italic" style={{ color: "rgba(240,237,232,0.12)" }}>I</p>
                    <p className="font-mono text-[0.6875rem] tracking-[0.3em]" style={{ color: "rgba(240,237,232,0.2)" }}>2024–25</p>
                  </div>
                  <div className="mx-auto w-px h-24" style={{ background: "linear-gradient(to bottom, transparent, rgba(212,168,83,0.2), transparent)" }} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
