"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

/* ===== MOCK DATA ===== */
const mockRooms = [
  {
    id: "room-1",
    name: "Chill Vibes 🎧",
    inviteCode: "abc123",
    type: "PRIVATE",
    members: 2,
    currentTrack: "Blinding Lights",
    currentArtist: "The Weeknd",
    isPlaying: true,
  },
  {
    id: "room-2",
    name: "Late Night Jazz",
    inviteCode: "def456",
    type: "FRIENDS",
    members: 3,
    currentTrack: "Take Five",
    currentArtist: "Dave Brubeck",
    isPlaying: true,
  },
];

const recentlyPlayed = [
  { id: "t1", title: "Blinding Lights", artist: "The Weeknd", thumbnail: "https://picsum.photos/seed/track1/60/60", playedAt: "2 min ago" },
  { id: "t2", title: "Levitating", artist: "Dua Lipa", thumbnail: "https://picsum.photos/seed/track2/60/60", playedAt: "15 min ago" },
  { id: "t3", title: "Save Your Tears", artist: "The Weeknd", thumbnail: "https://picsum.photos/seed/track3/60/60", playedAt: "32 min ago" },
];

/* ===== CREATE ROOM MODAL ===== */
function CreateRoomModal({ open, onClose, onCreateRoom }: { open: boolean; onClose: () => void; onCreateRoom: (name: string, type: string) => void }) {
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("PRIVATE");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card p-8 w-full max-w-md relative z-10 animate-slide-up mx-4">
        <h2 className="text-2xl font-bold font-(family-name:--font-outfit) text-white mb-6">Create a Room</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Room Name</label>
            <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g., Chill Vibes 🎧" className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Room Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "PRIVATE", label: "Private", emoji: "🔒" },
                { value: "FRIENDS", label: "Friends", emoji: "👥" },
                { value: "SOLO", label: "Solo", emoji: "🎧" },
              ].map((type) => (
                <button key={type.value} onClick={() => setRoomType(type.value)} className={`py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${roomType === type.value ? "bg-primary-500/15 text-primary-300 border border-primary-500/20" : "bg-surface-800/50 text-zinc-400 border border-white/5 hover:bg-surface-700/50"}`}>
                  <span className="text-lg">{type.emoji}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm py-3">Cancel</button>
            <button onClick={() => { onCreateRoom(roomName || "My Room", roomType); onClose(); }} className="btn-primary flex-1 text-sm py-3 relative z-10">
              <span className="relative z-10">Create Room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== JOIN ROOM MODAL ===== */
function JoinRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card p-8 w-full max-w-md relative z-10 animate-slide-up mx-4">
        <h2 className="text-2xl font-bold font-(family-name:--font-outfit) text-white mb-6">Join a Room</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Room Code or Invite Link</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., abc123" className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm py-3">Cancel</button>
            <button onClick={() => { router.push(`/room/${code || "abc123"}`); onClose(); }} className="btn-primary flex-1 text-sm py-3 relative z-10">
              <span className="relative z-10">Join Room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== DASHBOARD PAGE ===== */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading your vibes...</p>
        </div>
      </div>
    );
  }

  const userName = session.user.name || "User";

  const handleCreateRoom = (name: string, type: string) => {
    const roomId = `room-${Date.now().toString(36)}`;
    router.push(`/room/${roomId}?name=${encodeURIComponent(name)}&type=${type}&host=true`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-(family-name:--font-outfit) text-white mb-2">
          Welcome back, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-zinc-400">Ready to vibe? Create a room or join one.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <button id="create-room-btn" onClick={() => setShowCreate(true)} className="glass-card p-6 flex items-center gap-4 text-left group cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Create Room</h3>
            <p className="text-sm text-zinc-400">Start a new session</p>
          </div>
        </button>

        <button id="join-room-btn" onClick={() => setShowJoin(true)} className="glass-card p-6 flex items-center gap-4 text-left group cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-accent-600 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-accent-500/20 group-hover:shadow-accent-500/40 transition-shadow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Join Room</h3>
            <p className="text-sm text-zinc-400">Enter with a code</p>
          </div>
        </button>

        <button id="solo-mode-btn" onClick={() => handleCreateRoom("Solo Session 🎧", "SOLO")} className="glass-card p-6 flex items-center gap-4 text-left group cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Solo Mode</h3>
            <p className="text-sm text-zinc-400">Listen on your own</p>
          </div>
        </button>
      </div>

      {/* Active Rooms */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold font-(family-name:--font-outfit) text-white">Your Rooms</h2>
          <button className="text-sm text-zinc-400 hover:text-primary-400 transition-colors">View All</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockRooms.map((room) => (
            <Link key={room.id} href={`/room/${room.id}`} className="glass-card p-5 group" id={`room-card-${room.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">{room.name}</h3>
                  <span className="text-xs text-zinc-500 mt-1 inline-block">{room.type === "PRIVATE" ? "🔒 Private" : "👥 Friends"} • {room.members} member{room.members !== 1 && "s"}</span>
                </div>
                {room.isPlaying && (
                  <div className="flex items-end gap-[2px] h-4">
                    <div className="w-[2px] bg-green-400 rounded-full animate-[wave_1s_ease-in-out_infinite] h-[6px]" />
                    <div className="w-[2px] bg-green-400 rounded-full animate-[wave_1s_ease-in-out_infinite] h-[10px]" style={{ animationDelay: "0.15s" }} />
                    <div className="w-[2px] bg-green-400 rounded-full animate-[wave_1s_ease-in-out_infinite] h-[4px]" style={{ animationDelay: "0.3s" }} />
                  </div>
                )}
              </div>
              {room.currentTrack ? (
                <div className="flex items-center gap-3 mt-3 p-2.5 rounded-lg bg-surface-800/50">
                  <div className="w-8 h-8 rounded-md bg-linear-to-br from-primary-600 to-accent-500 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{room.currentTrack}</p>
                    <p className="text-xs text-zinc-500 truncate">{room.currentArtist}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-3 p-2.5 rounded-lg bg-surface-800/30">
                  <div className="w-8 h-8 rounded-md bg-surface-700 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  </div>
                  <p className="text-sm text-zinc-600">No track playing</p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-zinc-600 bg-surface-800/50 px-2 py-1 rounded-md font-mono">{room.inviteCode}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Played */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold font-(family-name:--font-outfit) text-white">Recently Played</h2>
          <button className="text-sm text-zinc-400 hover:text-primary-400 transition-colors">See All</button>
        </div>
        <div className="space-y-2">
          {recentlyPlayed.map((track, idx) => (
            <div key={track.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors group cursor-pointer">
              <span className="text-sm text-zinc-600 w-5 text-right">{idx + 1}</span>
              <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-primary-300 transition-colors">{track.title}</p>
                <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
              </div>
              <span className="text-xs text-zinc-600">{track.playedAt}</span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white">
                <Play size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      <CreateRoomModal open={showCreate} onClose={() => setShowCreate(false)} onCreateRoom={handleCreateRoom} />
      <JoinRoomModal open={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  );
}
