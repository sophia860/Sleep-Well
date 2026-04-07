import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X, Sun, Moon, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isLight, setIsLight] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "light";
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    }
  }, [isLight]);

  const { data: roleData } = useQuery<{ role: string; tier: string }>({
    queryKey: ["/api/user/role"],
    queryFn: async () => {
      const res = await fetch("/api/user/role", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const isEditorOrEIC = roleData?.role === "editor" || roleData?.role === "editor_in_chief";

  const [showNotifs, setShowNotifs] = useState(false);

  const { data: notifData } = useQuery<{ unread: number; notifications: any[] }>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const [notifRes, countRes] = await Promise.all([
        fetch("/api/notifications", { credentials: "include" }),
        fetch("/api/notifications/unread-count", { credentials: "include" }),
      ]);
      const notifications = notifRes.ok ? await notifRes.json() : [];
      const countData = countRes.ok ? await countRes.json() : { count: 0 };
      return { unread: countData.count, notifications: notifications.slice(0, 10) };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const publicMenuItems = [
    { label: "Home", href: "/" },
    { label: "The Journal", href: "/in-bloom", tooltip: "Published Work" },
    { label: "About", href: "/about" },
    { label: "Exhibits", href: "/exhibits", tooltip: "Digital Exhibits" },
  ];

  const writerMenuItems = [
    { label: "Home", href: "/" },
    { label: "The Journal", href: "/in-bloom", tooltip: "Published Work" },
    { label: "My Garden", href: "/garden", tooltip: "Write & Grow Your Work" },
    { label: "Marketplace", href: "/marketplace", tooltip: "Services & Tip Jars" },
    { label: "Exhibits", href: "/exhibits", tooltip: "Digital Exhibits" },
  ];

  const editorMenuItems = [
    ...writerMenuItems,
    { label: "Editor Studio", href: "/editor-studio" },
  ];

  const activeMenuItems = !isAuthenticated
    ? publicMenuItems
    : isEditorOrEIC ? editorMenuItems : writerMenuItems;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#060b14] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:tracking-widest focus:text-white focus:ring-2 focus:ring-[#d4a853]/50 focus:outline-none"
      >
        Skip to main content
      </a>

      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${
          scrolled ? "py-3" : "py-6"
        }`}
        style={{
          background: scrolled
            ? "rgba(6,11,20,0.85)"
            : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(240,237,232,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="relative group flex items-center gap-3">
            <img
              src="/logo%20(2).png"
              alt="The Page Gallery Journal"
              className="h-9 w-auto transition-opacity duration-300 group-hover:opacity-90"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {activeMenuItems.map((item) => {
              const isActive = location === item.href;
              const isEditor = item.label === "Editor Studio";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative font-mono text-[0.6875rem] tracking-[0.18em] uppercase transition-colors duration-300 group ${
                    isEditor
                      ? "text-[#d4a853]/80 hover:text-[#d4a853]"
                      : isActive
                      ? "text-[#f0ede8]"
                      : "text-[#f0ede8]/60 hover:text-[#f0ede8]/90"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  title={(item as any).tooltip}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-[1px] transition-all duration-500 ${
                      isActive
                        ? "w-full bg-[#d4a853]/60"
                        : isEditor
                        ? "w-0 group-hover:w-full bg-[#d4a853]"
                        : "w-0 group-hover:w-full bg-[#f0ede8]/40"
                    }`}
                  />
                </Link>
              );
            })}

            <div className="w-px h-4 bg-[#f0ede8]/10 mx-1" />

            {/* Theme toggle */}
            <button
              onClick={() => setIsLight(!isLight)}
              className="p-1.5 text-[#f0ede8]/50 hover:text-[#f0ede8]/80 transition-colors rounded-full hover:bg-white/5"
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
              data-testid="button-theme-toggle"
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-1.5 text-[#f0ede8]/50 hover:text-[#f0ede8]/80 transition-colors rounded-full hover:bg-white/5"
                  aria-label={`Notifications${(notifData?.unread || 0) > 0 ? `, ${notifData!.unread} unread` : ""}`}
                  data-testid="button-notifications"
                >
                  <Bell size={14} />
                  {(notifData?.unread || 0) > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#d4a853] text-[8px] font-mono text-[#060b14] flex items-center justify-center font-bold"
                    >
                      {notifData!.unread > 9 ? "9+" : notifData!.unread}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl shadow-black/60 z-50 max-h-80 overflow-y-auto border border-[#f0ede8]/[0.08]"
                    style={{ background: "rgba(10,21,32,0.97)", backdropFilter: "blur(20px)" }}>
                    <div className="p-4 border-b border-[#f0ede8]/[0.06]">
                      <h3 className="font-display text-sm text-[#f0ede8]/90 italic">Notifications</h3>
                    </div>
                    <div className="p-2">
                      {(notifData?.notifications || []).length === 0 ? (
                        <p className="text-center py-6 font-serif text-sm text-[#f0ede8]/40 italic">No new notifications</p>
                      ) : (
                        (notifData?.notifications || []).map((n: any) => (
                          <div key={n.id} className={`p-3 rounded-lg mb-1 ${n.isRead ? "opacity-50" : "bg-white/[0.03]"}`}>
                            <p className="font-sans text-xs text-[#f0ede8]/80">{n.message}</p>
                            <span className="font-mono text-[0.6875rem] text-[#f0ede8]/30 mt-1 block">
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth */}
            {!isLoading && (
              isAuthenticated && user ? (
                <div className="relative group/user">
                  <button
                    className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border border-[#f0ede8]/10 hover:border-[#d4a853]/30 transition-all bg-white/[0.04] hover:bg-white/[0.07]"
                    data-testid="nav-user-dropdown"
                  >
                    <span className="font-mono text-[0.6875rem] tracking-[0.15em] text-[#f0ede8]/70">
                      {(user as any).username?.slice(0, 8) || (user as any).email?.split("@")[0]?.slice(0, 8) || "Writer"}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4a853]/30 to-[#38b8a0]/30 border border-[#f0ede8]/10 flex items-center justify-center">
                      <span className="text-[0.6875rem] text-[#f0ede8]/80 font-medium">
                        {(user as any).username?.slice(0, 1).toUpperCase() || (user as any).email?.slice(0, 1).toUpperCase() || "W"}
                      </span>
                    </div>
                  </button>

                  <div className="absolute right-0 top-full mt-1 pt-1 w-44 rounded-xl shadow-2xl shadow-black/60 z-50 py-2 opacity-0 translate-y-2 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all duration-300 border border-[#f0ede8]/[0.08]"
                    style={{ background: "rgba(10,21,32,0.97)", backdropFilter: "blur(20px)" }}>
                    <Link href={`/writer/${(user as any).id}`} className="block px-4 py-2 text-[#f0ede8]/70 hover:text-[#f0ede8] hover:bg-white/[0.04] transition-colors font-mono text-[0.6875rem] tracking-[0.12em]">
                      Profile
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-[#f0ede8]/70 hover:text-[#f0ede8] hover:bg-white/[0.04] transition-colors font-mono text-[0.6875rem] tracking-[0.12em]">
                      Settings
                    </Link>
                    <div className="h-px bg-[#f0ede8]/[0.06] my-1 mx-3" />
                    <a href="/api/logout" className="block px-4 py-2 text-[#f0ede8]/50 hover:text-[#f0ede8]/80 hover:bg-white/[0.04] transition-colors font-mono text-[0.6875rem] tracking-[0.12em]" data-testid="nav-logout">
                      Sign Out
                    </a>
                  </div>
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="px-5 py-2 rounded-full border border-[#d4a853]/30 text-[#d4a853]/80 hover:text-[#d4a853] hover:border-[#d4a853]/60 hover:bg-[#d4a853]/5 transition-all font-mono text-[0.6875rem] tracking-[0.15em]"
                  data-testid="nav-login"
                >
                  Sign In
                </Link>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden p-2 text-[#f0ede8]/70 hover:text-[#f0ede8] hover:bg-white/[0.06] rounded-full transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col"
            style={{ background: "rgba(6,11,20,0.97)", backdropFilter: "blur(24px)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(212,168,83,0.4), transparent)" }} />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 text-[#f0ede8]/50 hover:text-[#f0ede8] transition-colors"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col gap-1 px-8 pt-24 pb-12 overflow-y-auto">
              {activeMenuItems.map((item, i) => {
                const isActive = location === item.href;
                const isEditor = item.label === "Editor Studio";
                return (
                  <motion.div
                    key={item.label}
                    initial={shouldReduceMotion ? {} : { x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { delay: i * 0.07, duration: 0.4 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block py-4 font-display text-3xl italic transition-colors border-b border-[#f0ede8]/[0.06] ${
                        isEditor
                          ? "text-[#d4a853]/80"
                          : isActive
                          ? "text-[#f0ede8]"
                          : "text-[#f0ede8]/50 hover:text-[#f0ede8]/80"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="mt-8 pt-8 border-t border-[#f0ede8]/[0.06]">
                {!isLoading && (
                  isAuthenticated && user ? (
                    <div className="flex flex-col gap-4">
                      <Link
                        href={`/writer/${(user as any).id}`}
                        onClick={() => setIsOpen(false)}
                        className="font-display text-2xl text-[#f0ede8]/60 hover:text-[#f0ede8]/80 italic"
                      >
                        Profile
                      </Link>
                      <a
                        href="/api/logout"
                        className="font-mono text-[0.6875rem] text-[#f0ede8]/40 hover:text-[#f0ede8]/60 uppercase tracking-[0.2em] transition-colors"
                      >
                        Sign Out
                      </a>
                    </div>
                  ) : (
                    <Link
                      href="/sign-in"
                      onClick={() => setIsOpen(false)}
                      className="block font-display text-3xl text-[#d4a853]/70 hover:text-[#d4a853] italic"
                    >
                      Sign In
                    </Link>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
