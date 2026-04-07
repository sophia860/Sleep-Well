import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarBackground from "@/components/StarBackground";
import { motion } from "framer-motion";
import { ChevronDown, BookOpen, Leaf, Eye, Sprout, Wind, Users } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen bg-transparent text-foreground selection:bg-secondary selection:text-background relative">
      <StarBackground />
      <Navigation />

      <main className="relative z-10" id="main-content">
        {/* Hero */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 relative">
          {/* Atmospheric glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(212,168,83,0.05) 0%, transparent 70%)" }}
          />

          <div className="text-center space-y-8 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="flex items-center justify-center gap-4"
            >
              <div className="h-px w-8" style={{ background: "rgba(212,168,83,0.4)" }} />
              <span className="section-eyebrow">About The Page Gallery Journal</span>
              <div className="h-px w-8" style={{ background: "rgba(212,168,83,0.4)" }} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-light tracking-tight italic text-balance"
              style={{ color: "#f0ede8" }}
              data-testid="about-title"
            >
              The Page Gallery Journal
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="font-serif italic text-lg leading-relaxed max-w-lg mx-auto"
              style={{ color: "rgba(240,237,232,0.5)" }}
            >
              A literary journal that discovers. A writing garden where drafts live, grow, and find their form.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="editorial-rule max-w-xs mx-auto"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2"
              style={{ color: "rgba(240,237,232,0.2)" }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Scroll</span>
              <ChevronDown size={16} />
            </motion.div>
          </motion.div>
        </section>

        {/* PART 1 — THE JOURNAL */}
        <section className="py-32 px-6 md:px-12" data-testid="section-the-journal">
          <div className="max-w-4xl mx-auto space-y-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="h-px w-8" style={{ background: "rgba(212,168,83,0.4)" }} />
                <span className="section-eyebrow">Literary Journal</span>
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-light italic leading-normal" style={{ color: "#f0ede8" }}>
                The Journal
              </h2>
              <p className="font-serif leading-relaxed text-lg max-w-2xl" style={{ color: "rgba(240,237,232,0.5)" }}>
                The Page Gallery Journal publishes writing that we can't stop thinking about. Each issue is assembled with care — selected, sequenced, and presented with the attention of a gallery exhibition. We believe every piece deserves to be held in context, not lost in a feed.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <BookOpen className="w-5 h-5" style={{ color: "rgba(212,168,83,0.7)" }} />,
                  title: "Writing First",
                  description: "Writing's most important life happens before it is presentable. The Garden exists for that life — the fragments, the rough edges, the ideas that haven't declared their form."
                },
                {
                  icon: <Eye className="w-5 h-5" style={{ color: "rgba(212,168,83,0.7)" }} />,
                  title: "Curatorial Eye",
                  description: "Every piece is chosen because an editor read it and couldn't leave it alone. We don't accept slush. We discover."
                }
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  className="surface-card rounded-2xl p-8 space-y-4"
                  data-testid={`journal-card-${i}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(212,168,83,0.06)", border: "1px solid rgba(212,168,83,0.15)" }}>
                    {card.icon}
                  </div>
                  <h3 className="font-display text-xl italic" style={{ color: "rgba(240,237,232,0.9)" }}>{card.title}</h3>
                  <p className="font-serif text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.4)" }}>{card.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-16 pt-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px w-8" style={{ background: "rgba(212,168,83,0.3)" }} />
                  <span className="section-eyebrow">Editorial Model</span>
                </div>
                <h3 className="font-display text-2xl md:text-4xl font-light italic" style={{ color: "#f0ede8" }}>How We Find Work</h3>
              </div>

              <div className="space-y-12">
                {[
                  { step: "01", title: "Open Calls", detail: "Each issue has a theme. When we open submissions, writers submit through their Gardens. Every submission is read by at least two editors." },
                  { step: "02", title: "Garden Scouting", detail: "Our editors also browse the Garden — reading freely, following their instincts. When they find something that resonates, they note it privately." },
                  { step: "03", title: "Invitation & Consent", detail: "If an editor wants to include your work, they reach out directly. Nothing is ever published without your explicit agreement. We ask. Always." },
                  { step: "04", title: "Publication", detail: "Selected work appears in the Journal — curated, sequenced, and presented as part of an issue. Your name, your words, given the context they deserve." },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true }}
                    className="flex gap-8 items-start"
                    data-testid={`editorial-step-${item.step}`}
                  >
                    <span className="font-mono text-3xl font-light shrink-0" style={{ color: "rgba(212,168,83,0.2)" }}>{item.step}</span>
                    <div className="space-y-2">
                      <h3 className="font-display text-2xl italic" style={{ color: "rgba(240,237,232,0.8)" }}>{item.title}</h3>
                      <p className="font-serif leading-relaxed" style={{ color: "rgba(240,237,232,0.4)" }}>{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-8 pt-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px w-8" style={{ background: "rgba(212,168,83,0.3)" }} />
                  <span className="section-eyebrow">Submitting Work</span>
                </div>
                <h3 className="font-display text-2xl md:text-4xl font-light italic" style={{ color: "#f0ede8" }}>How to Get Published</h3>
              </div>
              <div className="surface-card rounded-2xl p-8 md:p-12 space-y-6">
                <p className="font-serif leading-relaxed text-lg" style={{ color: "rgba(240,237,232,0.55)" }}>
                  To be considered for the Journal, you need to be part of the Garden — which is completely free to join. When we announce open calls for upcoming issues, you submit your work directly through your Garden.
                </p>
                <p className="font-serif leading-relaxed text-lg" style={{ color: "rgba(240,237,232,0.55)" }}>
                  Our editors also read the Gardens freely, following their instincts. When they find something that resonates, they note it privately. If they want to include your work, they reach out directly. Nothing is ever published without your explicit consent.
                </p>
                <p className="font-serif italic leading-relaxed text-lg" style={{ color: "rgba(212,168,83,0.6)" }}>
                  Join the Garden, write freely, and when the time is right — let your work bloom.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Visual separation */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="editorial-rule opacity-30" />
        </div>

        {/* PART 2 — THE GARDEN */}
        <section className="py-32 px-6 md:px-12" data-testid="section-the-garden-about">
          <div className="max-w-4xl mx-auto space-y-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="h-px w-8" style={{ background: "rgba(56,184,160,0.4)" }} />
                <span className="font-mono text-[0.6875rem] tracking-[0.35em] uppercase" style={{ color: "rgba(56,184,160,0.7)" }}>
                  The Writing Platform
                </span>
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-light italic leading-normal" style={{ color: "#f0ede8" }}>
                The Garden
              </h2>
              <p className="font-serif leading-relaxed text-lg max-w-2xl" style={{ color: "rgba(240,237,232,0.5)" }}>
                Alongside the Journal, we tend a collaborative writing platform — the Garden. It's where writers plant their work, nurture their practice, and connect with a community that values process over product.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Sprout className="w-5 h-5" style={{ color: "rgba(56,184,160,0.7)" }} />,
                  title: "Private by Default",
                  detail: "Your Garden is yours. Write drafts, fragments, experiments. Share when you're ready — or don't."
                },
                {
                  icon: <Users className="w-5 h-5" style={{ color: "rgba(56,184,160,0.7)" }} />,
                  title: "Community, Not Competition",
                  detail: "Circles, rituals, reading feeds. Writers supporting writers, without metrics or algorithms."
                },
                {
                  icon: <Leaf className="w-5 h-5" style={{ color: "rgba(56,184,160,0.7)" }} />,
                  title: "Courses & Feedback",
                  detail: "Learn from published writers. Get detailed editorial feedback. Grow under optimal conditions in the Greenhouse."
                },
                {
                  icon: <Wind className="w-5 h-5" style={{ color: "rgba(56,184,160,0.7)" }} />,
                  title: "No Algorithms",
                  detail: "Everything here is human-curated. No ranking, no trending, no popularity contest. Just writing."
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  className="surface-card rounded-xl p-6 space-y-3"
                  data-testid={`garden-card-${i}`}
                >
                  <div className="flex items-center gap-3">
                    {card.icon}
                    <h3 className="font-display text-lg italic" style={{ color: "rgba(240,237,232,0.85)" }}>{card.title}</h3>
                  </div>
                  <p className="font-serif text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.4)" }}>{card.detail}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-8 pt-12">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4">
                  <Sprout className="w-8 h-8 mx-auto" style={{ color: "rgba(56,184,160,0.5)" }} />
                  <h3 className="font-display text-3xl md:text-5xl font-light italic leading-normal" style={{ color: "#f0ede8" }}>
                    Why a Garden?
                  </h3>
                </div>
                <div className="surface-card rounded-2xl p-8 md:p-12 space-y-6">
                  <p className="font-serif leading-relaxed text-lg" style={{ color: "rgba(240,237,232,0.5)" }}>
                    A garden is patient. It doesn't demand perfection on a deadline. Seeds become sprouts, sprouts become blooms — each at their own pace.
                  </p>
                  <p className="font-serif leading-relaxed text-lg" style={{ color: "rgba(240,237,232,0.5)" }}>
                    We chose the garden metaphor because writing is cultivation, not manufacturing. Your Garden is where drafts live, where experiments grow, where half-formed ideas have permission to exist without judgment.
                  </p>
                  <div className="editorial-rule opacity-30" />
                  <p className="font-serif italic leading-relaxed text-lg" style={{ color: "rgba(212,168,83,0.6)" }}>
                    The garden doesn't rush. Neither do we.
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="text-center pt-12"
            >
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-3 font-mono text-sm uppercase tracking-widest transition-colors group"
                style={{ color: "rgba(56,184,160,0.6)" }}
                data-testid="link-see-how-garden-works"
              >
                See how the Garden works
                <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform rotate-[-90deg]" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
