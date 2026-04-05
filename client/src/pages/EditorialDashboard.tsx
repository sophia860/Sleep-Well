import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  genre: string;
  manuscriptType: string;
  estimatedWordCount: number | null;
  brief: string | null;
  status: string;
  sophiaNote: string | null;
  quotedPrice: number | null;
  paymentConfirmed: boolean;
  createdAt: string;
};
export default function EditorialDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useQuery<WaitlistEntry[]>({
    queryKey: ["/api/editorial-waitlist"],
    enabled: user?.email === "sophiamaybea@gmail.com",
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiRequest("PATCH", `/api/editorial-waitlist/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/editorial-waitlist"] }),
  });
  if (authLoading) {
    return <div className="min-h-screen bg-[#0a0908] text-[#e8e0d4] flex items-center justify-center">Loading...</div>;
  }
  if (user?.email !== "sophiamaybea@gmail.com") {
    return <div className="min-h-screen bg-[#0a0908] text-[#e8e0d4] flex items-center justify-center">Not authorized.</div>;
  }
  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0908] text-[#e8e0d4] flex items-center justify-center">Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-[#0a0908] text-[#e8e0d4]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif mb-8">Editorial Waitlist</h1>
        <p className="text-[#8a8078] mb-8">{entries.length} entries</p>
        <div className="space-y-6">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onUpdate={(data) => updateMutation.mutate({ id: entry.id, ...data })} />
          ))}
        </div>
      </div>
    </div>
  );
}
function EntryCard({ entry, onUpdate }: { entry: WaitlistEntry; onUpdate: (data: any) => void }) {
  const [note, setNote] = useState(entry.sophiaNote || "");
  const [price, setPrice] = useState(entry.quotedPrice?.toString() || "");
  const paymentUrl = `${window.location.origin}/editorial-payment?id=${entry.id}`;
  return (
    <div className="border border-[#2a2520] rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-serif">{entry.name}</h3>
          <p className="text-sm text-[#8a8078]">{entry.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {entry.paymentConfirmed && <span className="text-green-400 text-sm">Paid</span>}
          <select
            value={entry.status}
            onChange={(e) => onUpdate({ status: e.target.value })}
            className="bg-[#0a0908] border border-[#2a2520] rounded px-3 py-1 text-sm text-[#e8e0d4]"
          >
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="invited">Invited</option>
            <option value="paid">Paid</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm text-[#b8b0a4]">
        <div>Genre: {entry.genre}</div>
        <div>Type: {entry.manuscriptType}</div>
        <div>Words: {entry.estimatedWordCount || "\u2014"}</div>
      </div>
      {entry.brief && <p className="text-sm text-[#b8b0a4] italic">{entry.brief}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[#8a8078] mb-1">Private note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onUpdate({ sophiaNote: note })}
            rows={2}
            className="w-full bg-transparent border border-[#2a2520] rounded px-3 py-2 text-sm text-[#e8e0d4] resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8a8078] mb-1">Quoted price (GBP)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => price && onUpdate({ quotedPrice: parseInt(price) })}
            className="w-full bg-transparent border border-[#2a2520] rounded px-3 py-2 text-sm text-[#e8e0d4]"
          />
        </div>
      </div>
      {entry.status === "invited" && entry.quotedPrice && (
        <div className="flex items-center gap-3">
          <input
            readOnly
            value={paymentUrl}
            className="flex-1 bg-[#1a1815] border border-[#2a2520] rounded px-3 py-2 text-xs text-[#8a8078]"
          />
          <button
            onClick={() => navigator.clipboard.writeText(paymentUrl)}
            className="bg-[#2a2520] hover:bg-[#3a3530] px-4 py-2 rounded text-sm transition-colors"
          >
            Copy link
          </button>
        </div>
      )}
      <p className="text-xs text-[#5a5248]">Joined {new Date(entry.createdAt).toLocaleDateString()}</p>
    </div>
  );
}
