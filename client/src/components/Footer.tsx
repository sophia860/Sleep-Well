import { Link } from "wouter";
import { Instagram, Mail } from "lucide-react";

const footerLinks = {
  Read: [
    { label: "The Journal", href: "/in-bloom" },
    { label: "Current Issue", href: "/in-bloom" },
    { label: "Archive", href: "/publications" },
    { label: "Contributors", href: "/publications" },
    { label: "Exhibits", href: "/exhibits" },
  ],
  Write: [
    { label: "The Garden", href: "/garden" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Seasons", href: "/garden-info" },
    { label: "Field Guide", href: "/field-guide" },
    { label: "About", href: "/about" },
  ],
  Connect: [
    { label: "Contact Editors", href: "/contact-editors" },
    { label: "Opportunities", href: "/opportunities" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Submissions", href: "/submissions" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative py-24 px-6 md:px-12 overflow-hidden">
      {/* Top rule */}
      <div className="editorial-rule mb-16 opacity-60" />

      {/* Atmospheric overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(212,168,83,0.04) 0%, transparent 60%)" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Brand statement */}
        <div className="mb-20 max-w-lg">
          <p className="font-display text-2xl md:text-3xl font-light italic leading-relaxed" style={{ color: "rgba(240,237,232,0.7)" }}>
            A journal and a garden.
          </p>
          <p className="font-sans text-sm mt-4 leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
            The Page Gallery publishes poetry, fiction, and essays that resist easy resolution.
            Every writer gets a Garden — a private space to grow.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-5">
              <h3 className="font-mono text-[0.6875rem] tracking-[0.3em] uppercase" style={{ color: "rgba(240,237,232,0.35)" }}>
                {category}
              </h3>
              <div className="flex flex-col gap-3">
                {links.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="font-serif italic text-sm transition-colors duration-400 ink-underline"
                    style={{ color: "rgba(240,237,232,0.5)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.85)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.5)")}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Social column */}
          <div className="space-y-5">
            <h3 className="font-mono text-[0.6875rem] tracking-[0.3em] uppercase" style={{ color: "rgba(240,237,232,0.35)" }}>
              Social
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://instagram.com/pagegalleryjournal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 font-serif italic text-sm transition-all duration-400 group"
                style={{ color: "rgba(240,237,232,0.5)" }}
              >
                <Instagram size={13} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="group-hover:text-[#f0ede8]/85 transition-colors">@pagegalleryjournal</span>
              </a>
              <a
                href="mailto:submissions@pagegalleryjournal.com"
                className="flex items-center gap-2.5 font-serif italic text-sm transition-all duration-400 group"
                style={{ color: "rgba(240,237,232,0.5)" }}
              >
                <Mail size={13} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="group-hover:text-[#f0ede8]/85 transition-colors">Contact</span>
              </a>
            </div>
            <div className="flex flex-col gap-3 mt-6">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Accessibility", href: "/accessibility" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-serif italic text-sm transition-colors duration-400"
                  style={{ color: "rgba(240,237,232,0.35)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.65)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.35)")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="editorial-rule-thin pt-px">
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-mono text-[0.6875rem] tracking-[0.25em]" style={{ color: "rgba(240,237,232,0.25)" }}>
              THE PAGE GALLERY JOURNAL © 2026
            </p>
            <div className="flex items-center gap-6">
              <span className="font-mono text-[0.6875rem] tracking-[0.15em]" style={{ color: "rgba(240,237,232,0.2)" }}>
                Est. 2024
              </span>
              <div className="w-px h-3 bg-[#f0ede8]/10" />
              <span className="font-serif italic text-[0.6875rem]" style={{ color: "rgba(240,237,232,0.25)" }}>
                Writing that lingers.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
