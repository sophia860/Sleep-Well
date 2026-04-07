import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { gsap, prefersReducedMotion } from "@/lib/gsap-init";
import { useAuth } from "@/hooks/use-auth";

function SeedDoodle() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 35 Q20 32 20 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 26 Q14 18 16 12 Q18 6 22 8 Q26 10 26 16 Q26 22 20 26Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 8 Q16 4 18 2 Q20 0 22 2 Q24 4 22 8" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function SproutDoodle() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 38 Q20 35 20 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 28 Q12 20 10 18 Q8 16 10 14 Q14 12 18 18 L20 22Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 22 Q28 14 30 12 Q32 10 34 12 Q36 16 30 18 L20 22Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 18 Q19 10 20 6 Q21 2 23 4 Q25 8 22 14 L20 18Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BloomDoodle() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 38 Q20 35 20 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 20 Q14 10 10 8 Q6 7 8 12 Q10 16 18 20Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M20 20 Q26 10 30 8 Q34 7 32 12 Q30 16 22 20Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M20 20 Q20 8 18 4 Q16 0 20 0 Q24 0 22 4 Q20 8 20 20Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M20 20 Q10 16 6 18 Q2 20 6 22 Q10 24 20 20Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M20 20 Q30 16 34 18 Q38 20 34 22 Q30 24 20 20Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
      <path d="M16 30 Q14 26 12 28" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const stages = [
  {
    stage: "Seed",
    icon: <SeedDoodle />,
    color: "text-amber-400/70",
    desc: "A private space for first drafts, fragments, and rough edges. Yours alone until you decide otherwise.",
  },
  {
    stage: "Sprout",
    icon: <SproutDoodle />,
    color: "text-emerald-400/70",
    desc: "Revise, reshape, let the work find its form. Still private, still yours.",
  },
  {
    stage: "Bloom",
    icon: <BloomDoodle />,
    color: "text-pink-400/70",
            desc: "When you're ready, share your work. Our editors browse the Garden. When something stops them, they reach out.",
  },
];

function StageRow({ item, index }: { item: typeof stages[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const glowBackground = useTransform(
    [springX, springY],
    ([x, y]: number[]) => `radial-gradient(circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(255,255,255,0.03) 0%, transparent 60%)`
  );

  // GSAP parallax and float for icon
  useEffect(() => {
    if (!iconRef.current || prefersReducedMotion) return;

    const tl = gsap.timeline();

    // Parallax
    tl.fromTo(
      iconRef.current,
      { y: 50 },
      {
        y: -50,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );

    // Subtle float
    tl.to(
      iconRef.current,
      {
        y: "-10px",
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
      },
      0
    );
  }, []);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 + index * 0.15 }}
      viewport={{ once: true, margin: "-50px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); mouseX.set(0.5); mouseY.set(0.5); }}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -4 }}
      className={`flex items-start gap-8 md:gap-12 py-8 md:py-12 relative cursor-default ${
        index % 2 === 1 ? "md:flex-row-reverse md:text-right" : ""
      }`}
      data-testid={`card-stage-${item.stage.toLowerCase()}`}
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: glowBackground }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon */}
      <motion.div
        ref={iconRef}
        className={`flex-shrink-0 ${item.color} mt-1 relative z-10`}
        animate={{
          scale: hovered ? 1.3 : 1,
          rotate: hovered ? [0, -5, 5, 0] : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
      >
        {item.icon}
      </motion.div>

      {/* Text */}
      <div className="space-y-3 relative z-10">
        <h3 className={`font-display text-2xl md:text-3xl font-light italic ${item.color}`}>
          {item.stage}
        </h3>
        <p className="font-sans text-base md:text-lg leading-relaxed text-white/50 max-w-md">
          {item.desc}
        </p>
      </div>
    </motion.div>
  );
}

type GardenNavStatus = "idle" | "loading" | "auth-required" | "error";

export default function GardenIntro() {
  const { isLoading: authLoading } = useAuth();
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
      if (!res.ok) throw new Error(`Session check failed: ${res.status} ${res.statusText}`);
      setNavStatus("idle");
      navigate("/garden");
    } catch {
      setNavStatus("error");
    }
  }, [navStatus, navigate]);

  function gardenStatusMessage(status: GardenNavStatus): string | null {
    switch (status) {
      case "loading": return "Opening your Garden\u2026";
      case "auth-required": return "Please sign in to open your Garden.";
      case "error": return "We could not open your Garden. Please try again.";
      default: return null;
    }
  }

  const statusMessage = gardenStatusMessage(navStatus);

  return (
    <section className="relative py-32 md:py-48 px-6 md:px-12 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-24">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="font-sans text-[length:var(--text-label)] tracking-[0.06em] text-white/25 block mb-6"
          >
                        YOUR WRITING GARDEN
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="font-display text-5xl md:text-7xl font-light italic text-white"
          >
            The Garden
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="font-display italic text-lg md:text-xl text-white/30 mt-6 max-w-xl mx-auto"
          >
            A private space for drafts, fragments, and half-formed ideas.
            Yours alone, until you decide otherwise.
          </motion.p>
        </div>

        {/* Stages — flowing vertical layout with scroll animations */}
        <div className="space-y-4 md:space-y-0 divide-y divide-white/5">
          {stages.map((item, i) => (
            <StageRow key={item.stage} item={item} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          viewport={{ once: true }}
          className="text-center mt-24 space-y-3"
        >
          <button
            onClick={openGarden}
            disabled={navStatus === "loading" || authLoading}
            className="inline-block font-display italic text-lg text-white/40 hover:text-white/80 transition-colors duration-700 border-b border-white/10 hover:border-white/30 pb-1 disabled:cursor-wait disabled:opacity-60"
            data-testid="link-enter-garden"
            aria-busy={navStatus === "loading"}
          >
            {navStatus === "loading" ? "Opening\u2026" : "Open the Garden editor"} &rarr;
          </button>
          <p className="font-sans text-xs text-white/25">
            The editor opens in your Garden workspace.
          </p>
          {statusMessage && navStatus !== "loading" && (
            <p
              data-garden-status
              role="status"
              className={`font-sans text-sm mt-2 ${navStatus === "error" ? "text-red-400/70" : "text-white/50"}`}
            >
              {statusMessage}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
