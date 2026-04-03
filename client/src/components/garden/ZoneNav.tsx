import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout, Glasses, TreePine, Send, BookOpen,
  Users, Compass, ChevronDown, Eye, PenLine, X,
  MessageCircle, Repeat2, BookMarked,
} from "lucide-react";

export type Zone = "desk" | "reading-room" | "greenhouse" | "submissions" | "garden-gate" | "collections";
export type ActiveRoom = "tables" | "workshop" | "swap" | "the-desk" | "first-reader" | "shelf" | null;

export const rooms = [
  { id: "tables", label: "Tables", icon: <Users size={13} />, desc: "Community discussions", comingSoon: false },
  { id: "workshop", label: "Workshop", icon: <BookOpen size={13} />, desc: "Writing exercises", comingSoon: false },
  { id: "the-desk", label: "The Desk", icon: <PenLine size={13} />, desc: "Shared writing space", comingSoon: false },
  { id: "swap", label: "Swap", icon: <Repeat2 size={13} />, desc: "Beta reading exchange", comingSoon: false },
  { id: "first-reader", label: "First Reader", icon: <Eye size={13} />, desc: "Drop fresh writing, get honest first impressions", comingSoon: false },
  { id: "shelf", label: "Reading Shelf", icon: <BookMarked size={13} />, desc: "What the community is reading", comingSoon: false },
];

export function ZoneNav({ active, onChange }: { active: Zone; onChange: (z: Zone) => void }) {
  const zones: { id: Zone; label: string; desc: string; icon: React.ReactNode; activeColor: string }[] = [
    { id: "desk", label: "Desk", desc: "Your writing space", icon: <PenLine size={14} />, activeColor: "bg-emerald-900/60" },
    { id: "reading-room", label: "Reading Room", desc: "Read and discover", icon: <Glasses size={14} />, activeColor: "bg-sky-900/60" },
    { id: "greenhouse", label: "Greenhouse", desc: "Grow your practice", icon: <Sprout size={14} />, activeColor: "bg-green-900/60" },
    { id: "submissions", label: "Submissions", desc: "Submit your work", icon: <Send size={14} />, activeColor: "bg-violet-900/60" },
    { id: "garden-gate", label: "Garden Gate", desc: "Explore the garden", icon: <TreePine size={14} />, activeColor: "bg-teal-900/60" },
    { id: "collections", label: "Collections", desc: "Your saved collections", icon: <BookMarked size={14} />, activeColor: "bg-amber-900/60" },
  ];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex gap-1 p-1.5 rounded-full border border-emerald-800/20 bg-emerald-950/20 backdrop-blur-xl max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-hide">
        {zones.map((z) => (
          <button
            key={z.id}
            onClick={() => onChange(z.id)}
            className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-mono text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all whitespace-nowrap ${
              active === z.id ? "text-white/90" : "text-white/90 hover:text-white/90"
            }`}
            data-testid={`zone-tab-${z.id}`}
          >
            {active === z.id && (
              <motion.div
                layoutId="activeZone"
                className={`absolute inset-0 rounded-full ${z.activeColor}`}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              {z.icon}
              <span className="text-[8px] sm:text-[10px]">{z.label}</span>
            </span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={active}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="font-serif text-[12px] text-white/45 text-center italic"
        >
          {zones.find(z => z.id === active)?.desc}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function RoomsStrip({ activeRoom, onSelectRoom }: { activeRoom: ActiveRoom; onSelectRoom: (room: ActiveRoom) => void }) {
  const activeRoomData = rooms.find(r => r.id === activeRoom);
  return (
    <div className="relative">
      {/* Always-visible social room pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {rooms.map((room) => {
          const isActive = activeRoom === room.id;
          return (
            <motion.button
              key={room.id}
              onClick={() => onSelectRoom(isActive ? null : room.id as ActiveRoom)}
              title={room.desc}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[9px] uppercase tracking-widest whitespace-nowrap transition-all ${
                isActive
                  ? "border-emerald-500/40 bg-emerald-900/35 text-emerald-200/90 shadow-[0_0_10px_rgba(52,211,153,0.15)]"
                  : "border-white/10 text-white/60 hover:text-white/85 hover:border-emerald-700/30 hover:bg-emerald-950/30"
              }`}
              data-testid={`room-${room.id}`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeRoom"
                  className="absolute inset-0 rounded-full bg-emerald-900/40"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {room.icon}
                <span>{room.label}</span>
              </span>
              {isActive && (
                <X
                  size={9}
                  className="relative z-10 ml-0.5 opacity-50"
                  onClick={(e) => { e.stopPropagation(); onSelectRoom(null); }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
