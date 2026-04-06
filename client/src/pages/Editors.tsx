import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Mail } from "lucide-react";

interface PublicEditor {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  role: string | null;
}

function editorDisplayName(editor: PublicEditor): string {
  if (editor.displayName) return editor.displayName;
  if (editor.firstName || editor.lastName) {
    return [editor.firstName, editor.lastName].filter(Boolean).join(" ");
  }
  return "Editor";
}

function editorInitials(editor: PublicEditor): string {
  const name = editorDisplayName(editor);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function roleLabel(role: string | null): string {
  if (role === "editor_in_chief") return "Editor in Chief";
  return "Editor";
}

export default function Editors() {
  const { data: editors = [], isLoading } = useQuery<PublicEditor[]>({
    queryKey: ["/api/public/editors"],
    queryFn: async () => {
      const res = await fetch("/api/public/editors");
      if (!res.ok) throw new Error("Failed to fetch editors");
      return res.json();
    },
  });

  // Sort: editor_in_chief first, then editors alphabetically
  const sorted = [...editors].sort((a, b) => {
    if (a.role === "editor_in_chief" && b.role !== "editor_in_chief") return -1;
    if (b.role === "editor_in_chief" && a.role !== "editor_in_chief") return 1;
    return editorDisplayName(a).localeCompare(editorDisplayName(b));
  });

  return (
    <div className="min-h-screen bg-transparent text-foreground relative">
      <Navigation />

      <main className="relative z-10">
        {/* Hero */}
        <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="font-mono text-[10px] tracking-[0.4em] uppercase block mb-6"
          >
            The Page Gallery Journal
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-display font-light italic tracking-normal mb-6"
          >
            Our Editors
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.9, duration: 1 }}
            className="font-serif italic text-lg text-white/50 max-w-lg mx-auto leading-relaxed"
          >
            The people who read closely, choose carefully, and care deeply about every piece we publish.
          </motion.p>
        </section>

        {/* Editors grid */}
        <section className="py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 animate-pulse"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/10 mb-5" />
                    <div className="h-4 bg-white/10 rounded w-2/3 mb-3" />
                    <div className="h-3 bg-white/10 rounded w-1/3 mb-5" />
                    <div className="space-y-2">
                      <div className="h-3 bg-white/[0.05] rounded" />
                      <div className="h-3 bg-white/[0.05] rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <p className="text-center text-white/30 font-serif italic text-lg">
                No editors listed yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {sorted.map((editor, i) => (
                  <motion.div
                    key={editor.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true }}
                    className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-8 flex flex-col gap-5 hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 ring-1 ring-white/10">
                        {editor.profileImageUrl ? (
                          <AvatarImage
                            src={editor.profileImageUrl}
                            alt={editorDisplayName(editor)}
                          />
                        ) : null}
                        <AvatarFallback className="bg-accent-ornament/20 text-accent-ornament font-display text-lg">
                          {editorInitials(editor)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-display text-base font-light leading-snug truncate">
                          {editorDisplayName(editor)}
                        </p>
                        <span
                          className={`font-mono text-[9px] uppercase tracking-[0.25em] mt-1 block ${
                            editor.role === "editor_in_chief"
                              ? "text-accent-ornament"
                              : "text-white/40"
                          }`}
                        >
                          {roleLabel(editor.role)}
                        </span>
                      </div>
                    </div>

                    {editor.bio ? (
                      <p className="font-serif text-sm text-white/50 leading-relaxed line-clamp-4">
                        {editor.bio}
                      </p>
                    ) : (
                      <p className="font-serif text-sm text-white/20 italic leading-relaxed">
                        No bio yet.
                      </p>
                    )}

                    <div className="mt-auto pt-2">
                      <Link
                        href="/contact-editors"
                        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-accent-ornament transition-colors"
                      >
                        <Mail size={12} />
                        Contact the editors
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto space-y-6"
          >
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/30 block">
              Get in touch
            </span>
            <p className="font-serif italic text-white/40 text-lg leading-relaxed">
              Have a question about submissions, the journal, or anything else?
            </p>
            <Link
              href="/contact-editors"
              className="inline-block border border-white/20 hover:border-accent-ornament text-white/60 hover:text-accent-ornament font-mono text-[10px] uppercase tracking-[0.3em] px-8 py-3 rounded-full transition-all duration-300"
            >
              Contact Editors
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
