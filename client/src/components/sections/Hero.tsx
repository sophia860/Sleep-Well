import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import StarTitle from "@/components/StarTitle";
import { useLocation, Link } from "wouter";
import { gsap, prefersReducedMotion } from "@/lib/gsap-init";
import { useAuth } from "@/hooks/use-auth";

type GardenNavStatus = "idle" | "loading" | "auth-required" | "error";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [navStatus, setNavStatus] = useState<GardenNavStatus>("idle");

  const openGarden = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (navStatus === "loading") return;
    setNavStatus("loading");
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) {
        setNavStatus("auth-required");
        navigate("/sign-in?next=/garden");
        return;
      }
      if (!res.ok) throw new Error("Session check failed");
      setNavStatus("idle");
      navigate("/garden");
    } catch {
      setNavStatus("error");
    }
  }, [navStatus, navigate]);

  // Framer-motion mouse tilt (original)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    // T36: skip mouse tilt when reduced motion is preferred
    if (prefersReducedMotion) return;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  const textX = useTransform(mouseX, [-0.5, 0.5], ["2%", "-2%"]);
  const textY = useTransform(mouseY, [-0.5, 0.5], ["2%", "-2%"]);

  // GSAP: stagger entrance of hero text elements when section scrolls into view
  useEffect(() => {
    if (!textRef.current) return;
    // T36: skip GSAP entrance animation when reduced motion is preferred
    if (prefersReducedMotion) return;

    const children = Array.from(textRef.current.children);
    gsap.fromTo(
      children,
      { opacity: 0, y: 36, filter: "blur(4px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.1,
        stagger: 0.18,
        ease: "power3.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  const writingLabel =
    navStatus === "loading" ? "Opening\u2026" :
    !authLoading && user ? "Open the Garden editor" : "Start Writing \u2014 it\u2019s free";

  return (
    <div ref={heroRef} className="relative">
      {/* StarTitle: full-height illustrated splash with GSAP depth layers */}
      <StarTitle />

      {/* Hero text content: below the splash */}
      <section
        id="hero-content"
        className="relative z-10 min-h-[50vh] pt-16 pb-12 px-6 md:px-12 lg:px-24"
      >
        <div
          className="max-w-7xl mx-auto relative z-10"
          onMouseMove={handleMouseMove}
        >
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div ref={textRef} className="lg:col-span-8 space-y-8">
              {/* Label */}
              <div>
                <motion.p
                  style={{ x: textX, y: textY }}
                  className="font-sans text-[length:var(--text-label)] uppercase tracking-[0.06em] text-amber-200/60 uppercase mb-6 block"
                >
                  A Literary Journal & Digital Writing Garden
                </motion.p>
                <h1 className="font-display text-[clamp(2.5rem,8vw,6rem)] font-light leading-[0.95] tracking-tight text-white">
                  Writing that lingers.
                </h1>
              </div>

              {/* Mission statement */}
              <div className="space-y-3">
                <p
                  className="max-w-lg text-sm md:text-base leading-relaxed font-sans text-white/60"
                  data-testid="text-hero-mission"
                >
                  The Page Gallery publishes poetry, fiction, and essays that resist easy resolution.
                  We believe in writing that earns its silences — work that asks something of the reader.
                </p>
                <p
                  className="max-w-lg text-sm md:text-base leading-relaxed font-sans text-white/40"
                  data-testid="text-hero-garden-proposition"
                >
                  No slush pile. No query letters. No waiting rooms.{" "}
                  Every writer gets a Garden — a private space for drafts,
                  fragments, and work that isn't ready yet.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-6">
                {/* Primary: read the journal */}
                <Link
                  href="/in-bloom"
                  className="group flex items-center gap-3"
                  data-testid="cta-read-journal"
                >
                  <span className="font-display italic text-lg text-white group-hover:text-amber-100 transition-colors">
                    Read the Journal
                  </span>
                  <span className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </Link>

                {/* Secondary: start writing */}
                <div className="flex flex-col items-start gap-1.5">
                  <button
                    onClick={openGarden}
                    disabled={navStatus === "loading" || authLoading}
                    className="group flex items-center gap-3"
                    data-testid="cta-start-writing"
                    aria-busy={navStatus === "loading"}
                  >
                    <span
                      className="
                      font-sans text-[length:var(--text-label)] uppercase tracking-[0.08em]
                      px-5 py-2.5 rounded-full
                      border border-amber-500/30 text-amber-200/80
                      bg-amber-900/10 hover:bg-amber-900/20
                      hover:border-amber-500/60 hover:text-amber-100
                      transition-all duration-300
                      disabled:cursor-wait disabled:opacity-60
                      "
                    >
                      {writingLabel}
                    </span>
                  </button>
                  {navStatus === "error" && (
                    <p
                      data-garden-status
                      role="alert"
                      className="font-sans text-xs text-red-400/70"
                    >
                      We could not open your Garden. Please try again.
                    </p>
                  )}
                </div>

                {/* Tertiary: about */}
                <Link
                  href="/about"
                  className="font-sans text-[length:var(--text-label)] uppercase tracking-[0.06em] text-white/40 hover:text-white/70 transition-colors"
                  data-testid="cta-about-us"
                >
                  About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
