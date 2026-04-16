import { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { gsap, prefersReducedMotion } from "@/lib/gsap-init";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

const FUNDING_GOAL = 5000;

function FoundingProgressBar() {
  const { data } = useQuery<{ raised: number }>({
    queryKey: ["/api/funding/progress"],
    queryFn: async () => {
      const res = await fetch("/api/funding/progress", { credentials: "include" });
      if (!res.ok) return { raised: 0 };
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const raised = data?.raised ?? 0;
  const pct = Math.min((raised / FUNDING_GOAL) * 100, 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-handwritten text-base text-[#6B2A2A]">
          £{raised.toLocaleString()} raised
        </span>
        <span className="font-mono text-[length:var(--text-label)] text-[#1C1208]/50 uppercase tracking-wider">
          Goal: £{FUNDING_GOAL.toLocaleString()}
        </span>
      </div>
      <div className="progress-bar-studio">
        <div className="progress-bar-studio-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="font-mono text-[length:var(--text-label)] text-[#1C1208]/40 uppercase tracking-wider">
        {pct.toFixed(0)}% funded — first print run
      </p>
    </div>
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { user, isLoading: authLoading } = useAuth();
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    if (!headlineRef.current || prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 30, filter: "blur(2px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power3.out", delay: 0.2 }
      );
    });
    return () => ctx.revert();
  }, []);

  const writingHref = !authLoading && user ? "/garden" : "/sign-in";

  return (
    <div ref={heroRef} className="relative min-h-screen studio-paper flex flex-col">
      {/* Founding Digital Edition Banner */}
      {bannerVisible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.1 }}
          className="w-full bg-[#6B2A2A] text-[#F8F4EC] py-2.5 px-6 flex items-center justify-between z-40"
        >
          <p className="font-mono text-[length:var(--text-label)] tracking-[0.12em] uppercase text-center flex-1">
            <span className="font-handwritten text-base normal-case tracking-normal mr-2">✦</span>
            Founding Digital Edition Live — Digital drops now. First print run funded by you.
            <Link href="/editions/founding" className="ml-3 underline underline-offset-2 hover:text-[#F8F4EC]/80 transition-colors">
              Claim yours →
            </Link>
          </p>
          <button
            onClick={() => setBannerVisible(false)}
            className="ml-4 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* Hero Content */}
      <section
        id="hero-content"
        className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full"
      >
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Main headline column */}
          <div className="lg:col-span-7 space-y-8">
            <motion.p
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.05 }}
              className="font-mono text-[length:var(--text-label)] tracking-[0.2em] uppercase text-[#6B2A2A]/80"
            >
              The Page Gallery Journal — Est. 2024
            </motion.p>

            <h1
              ref={headlineRef}
              className="font-display text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-[#1C1208]"
              style={{ opacity: prefersReducedMotion ? 1 : 0 }}
            >
              Once an{" "}
              <span className="italic text-[#6B2A2A]">ENTREPRENEUR,</span>
              <br />
              always an{" "}
              <span className="italic text-[#6B2A2A]">ENTREPRENEUR.</span>
            </h1>

            {/* Mission copy */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5 }}
              className="space-y-4 max-w-xl"
            >
              <p className="font-sans text-[1.0625rem] leading-[1.75] text-[#1C1208]/80">
                The Page Gallery publishes poetry, fiction, and essays that resist easy resolution.
                We believe in writing that earns its silences — work that asks something of the reader.
              </p>
              <p className="font-sans text-[0.9375rem] leading-[1.7] text-[#1C1208]/60">
                No slush pile. No query letters. No waiting rooms.
                Every writer gets a Desk — a private space for drafts, fragments, and work that isn't ready yet.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.65 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href="/editions/founding"
                className="px-7 py-3 bg-[#6B2A2A] text-[#F8F4EC] rounded-full font-mono text-[length:var(--text-label)] tracking-[0.15em] uppercase hover:bg-[#5a2222] transition-colors shadow-md"
                data-testid="cta-founding-editions"
              >
                Founding Editions
              </Link>

              <Link
                href="/in-bloom"
                className="group flex items-center gap-2 font-display italic text-lg text-[#1C1208]/70 hover:text-[#6B2A2A] transition-colors"
                data-testid="cta-read-journal"
              >
                Read the Journal
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <Link
                href={writingHref}
                className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[#1C1208]/50 hover:text-[#6B2A2A] transition-colors border-b border-transparent hover:border-[#6B2A2A]/40 pb-0.5"
                data-testid="cta-start-writing"
              >
                {!authLoading && user ? "Open Your Desk" : "Start Writing — it's free"}
              </Link>
            </motion.div>

            {/* Funding progress */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8 }}
              className="max-w-sm pt-2"
            >
              <FoundingProgressBar />
            </motion.div>
          </div>

          {/* Gallery Frame — Founder's note as a gallery exhibit */}
          <motion.aside
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative flex items-start justify-center lg:justify-end"
            aria-label="Founder's note"
          >
            <div className="relative w-full max-w-[400px] lg:max-w-none">
              {/* Warm parchment fill visible through the frame opening */}
              <div
                className="absolute z-0 rounded-sm"
                style={{
                  top: "15.5%",
                  left: "21%",
                  right: "21%",
                  bottom: "15.5%",
                  background: "linear-gradient(160deg, #FFF8F0 0%, #F5EBD8 100%)",
                  boxShadow: "inset 0 2px 16px rgba(28, 18, 8, 0.07)",
                }}
              />

              {/* Founder's note positioned inside the frame opening */}
              <div
                className="absolute z-[5] flex flex-col justify-center"
                style={{
                  top: "19%",
                  left: "25%",
                  right: "25%",
                  bottom: "19%",
                }}
              >
                <p className="font-handwritten text-[clamp(0.85rem,1.5vw,1.05rem)] text-[#1C1208]/85 leading-relaxed mb-3">
                  1992. I was eleven, going door to door selling chocolate bars for the school.
                </p>
                <p className="font-handwritten text-[clamp(0.8rem,1.4vw,0.95rem)] text-[#1C1208]/75 leading-relaxed mb-3">
                  My mum said I didn't need to. I did it anyway —
                  something in me already knew: if you don't ask, the answer is always no.
                </p>
                <p className="font-handwritten text-[clamp(0.8rem,1.4vw,0.95rem)] text-[#1C1208]/75 leading-relaxed mb-3">
                  That kid never left. She just found better things to sell.
                </p>
                <p className="font-handwritten text-[clamp(0.8rem,1.4vw,0.95rem)] text-[#6B2A2A] leading-relaxed">
                  This journal is one of them. — S.
                </p>
                <div className="mt-4 border-t border-[#c4a24d]/20 pt-3">
                  <span className="font-mono text-[9px] text-[#1C1208]/35 uppercase tracking-widest">
                    Founder's Desk — Pinned
                  </span>
                </div>
              </div>

              {/* Ornate gold frame overlay — sits on top, transparent interior shows parchment */}
              <img
                src="/gold-frame.png"
                alt=""
                aria-hidden="true"
                className="relative z-10 w-full pointer-events-none select-none drop-shadow-xl"
                draggable={false}
                loading="eager"
              />
            </div>
          </motion.aside>
        </div>
      </section>

      {/* Studio section divider */}
      <div className="studio-section-divider mx-6 md:mx-12" />
    </div>
  );
}

