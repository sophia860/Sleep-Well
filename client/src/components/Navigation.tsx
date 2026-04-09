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
  const isEIC = roleData?.role === "editor_in_chief";

  const [showNotifs, setShowNotifs] = useState(false);

  const { data: notifData, isLoading: isNotifsLoading } = useQuery<{ unread: number; notifications: any[] }>({
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

    // Navigation menu items — Mind Walks removed
  const publicMenuItems = [
    { label: "Home", href: "/", isPage: true },
    { label: "The Journal", href: "/in-bloom", isPage: true, tooltip: "Published Work" },
    { label: "About", href: "/about", isPage: true },
        { label: "Exhibits", href: "/exhibits", isPage: true, tooltip: "Digital Exhibits" },
  ];

  const writerMenuItems = [
    { label: "Home", href: "/", isPage: true },
    { label: "The Journal", href: "/in-bloom", isPage: true, tooltip: "Published Work" },
    { label: "My Garden", href: "/garden", isPage: true, tooltip: "Write & Grow Your Work" },
      { label: "Marketplace", href: "/marketplace", isPage: true, tooltip: "Services & Tip Jars" },
        { label: "Exhibits", href: "/exhibits", isPage: true, tooltip: "Digital Exhibits" },
  ];

  const editorMenuItems = [
        ...writerMenuItems,
    { label: "Editor Studio", href: "/editor-studio", isPage: true },
  ];

  const activeMenuItems = !isAuthenticated 
    ? publicMenuItems 
    : (isEditorOrEIC ? editorMenuItems : writerMenuItems);

  return (
    <>
      {/* Skip-to-content link — visible on keyboard focus for screen reader / keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#060a10] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:tracking-widest focus:text-white focus:ring-2 focus:ring-[#c4a24d]/50 focus:outline-none"
      >
        Skip to main content
      </a>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="relative group">
<img src="/logo%20(2).png" alt="The Page Gallery Journal" className="h-10 w-auto" />
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
          </Link>

          <div className={`hidden lg:flex items-center gap-4 font-mono text-[length:var(--text-label)] tracking-[0.15em] transition-all duration-500 ${scrolled ? 'bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10' : ''}`}>
            {activeMenuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`transition-colors relative group ${item.label === "Editor Studio" ? "text-accent-ornament/70 hover:text-accent-ornament" : "text-white/90 hover:text-white"}`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                title={(item as any).tooltip}
                aria-current={location === item.href ? "page" : undefined}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-1/2 w-0 h-[1px] transition-all duration-300 group-hover:w-full group-hover:left-0 ${item.label === "Editor Studio" ? "bg-accent-ornament" : "bg-white"}`} />
              </Link>
            ))}
            
            <button
              onClick={() => setIsLight(!isLight)}
              className="p-2 text-white/90 hover:text-white/80 transition-colors"
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}               data-testid="button-theme-toggle"
              title={isLight ? "Switch to dark mode" : "Switch to light mode"}
            >
              {isLight ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 text-white/90 hover:text-white/80 transition-colors relative"
                  aria-label={`Notifications${(notifData?.unread || 0) > 0 ? `, ${notifData!.unread} unread` : ''}`}               data-testid="button-notifications"
                >
                  <Bell size={16} />
                  {(notifData?.unread || 0) > 0 && (
                    <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-[8px] font-mono text-black flex items-center justify-center">
                      {notifData!.unread > 9 ? "9+" : notifData!.unread}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-popover/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 z-50 max-h-80 overflow-y-auto">
                    <div className="p-3 border-b border-white/[0.06]">
                      <h3 className="font-display text-sm text-white/90 italic">Notifications</h3>
                      <p className="font-serif text-[length:var(--text-label)] text-white/90 italic mt-0.5">Recent activity on your work.</p>
                    </div>
                    <div className="p-2">
                      {(notifData?.notifications || []).length === 0 ? (
                        <p className="text-center py-4 font-serif text-sm text-white/90 italic">No new notifications</p>
                      ) : (
                        (notifData?.notifications || []).map((n: any) => (
                          <div key={n.id} className={`p-3 rounded-lg mb-1 ${n.isRead ? "opacity-60" : "bg-white/[0.03]"}`} data-testid={`notification-${n.id}`}>
                            <p className="font-serif text-xs text-white/90">{n.message}</p>
                            <span className="font-mono text-[length:var(--text-label)] text-white/90 mt-1 block">
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

            <span className="w-[1px] h-4 bg-white/10" />

            {!isLoading && (
              isAuthenticated && user ? (
                <div className="relative group/user">
                  <button className="flex items-center gap-2 p-1 pl-3 rounded-full border border-white/10 hover:border-white/20 transition-all bg-white/5" data-testid="nav-user-dropdown">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                      <span className="text-[length:var(--text-label)] text-white/90">{(user as any).username?.slice(0, 1).toUpperCase() || (user as any).email?.slice(0, 1).toUpperCase() || "U"}</span>
                    </div>
                  </button>
                  
                  <div className="absolute right-0 top-full mt-0 pt-2 w-48 bg-popover/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 z-50 py-2 opacity-0 translate-y-2 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all duration-300">
                    <Link href={`/writer/${user.id}`} className="block px-4 py-2 text-white/90 hover:text-white hover:bg-white/5 transition-colors font-mono text-[length:var(--text-label)] tracking-[0.15em]">
                      Profile
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-white/90 hover:text-white hover:bg-white/5 transition-colors font-mono text-[length:var(--text-label)] tracking-[0.15em]">
                      Settings
                    </Link>
                    <div className="h-[1px] bg-white/5 my-1" />
                    <a href="/api/logout" className="block px-4 py-2 text-white/90 hover:text-white/90 hover:bg-white/5 transition-colors font-mono text-[length:var(--text-label)] tracking-[0.15em]" data-testid="nav-logout">
                      Sign Out
                    </a>
                  </div>
                </div>
              ) : (
                <Link href="/sign-in" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all font-mono text-[length:var(--text-label)] tracking-[0.15em]" data-testid="nav-login">
                  Sign In
                </Link>
              )
            )}
          </div>

          <button 
            onClick={() => setIsOpen(true)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors mix-blend-difference"           aria-label="Open menu"
          >
            <Menu />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : undefined}
            className="fixed inset-0 z-[60] bg-popover/95 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 p-2 text-white/90 hover:text-white transition-colors"             aria-label="Close menu"
            >
              <X size={32} />
            </button>

            <div className="flex flex-col gap-8 text-center">
              {activeMenuItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={shouldReduceMotion ? {} : { y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { delay: i * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`font-display text-4xl italic hover:scale-105 transition-transform ${item.label === "Editor Studio" ? "text-accent-ornament/80 hover:text-accent-ornament" : "text-white/80 hover:text-white"}`}
                    aria-current={location === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              
              <div className="w-12 h-[1px] bg-white/10 mx-auto my-4" />
              
              {!isLoading && (
                isAuthenticated && user ? (
                  <>
                    <motion.div initial={shouldReduceMotion ? {} : { y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.5 }}>
                      <Link href={`/writer/${user.id}`} onClick={() => setIsOpen(false)} className="font-display text-3xl text-white/90 hover:text-white italic hover:scale-105 transition-transform">
                        Profile
                      </Link>
                    </motion.div>
                    <motion.div initial={shouldReduceMotion ? {} : { y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.55 }}>
                      <Link href="/settings" onClick={() => setIsOpen(false)} className="font-display text-3xl text-white/90 hover:text-white italic hover:scale-105 transition-transform">
                        Settings
                      </Link>
                    </motion.div>
                    <motion.a 
                      href="/api/logout"
                      initial={shouldReduceMotion ? {} : { y: 20, opacity: 0 }} 
                      animate={{ y: 0, opacity: 1 }} 
                      transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.6 }}
                      className="font-mono text-[length:var(--text-label)] text-white/90 hover:text-white/90 lowercase tracking-[0.15em] transition-colors"
                    >
                      Sign Out
                    </motion.a>
                  </>
                ) : (
                  <motion.div initial={shouldReduceMotion ? {} : { y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.5 }}>
                    <Link
                      href="/sign-in"
                      onClick={() => setIsOpen(false)}
                      className="font-display text-4xl text-white/80 hover:text-white italic hover:scale-105 transition-transform"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
