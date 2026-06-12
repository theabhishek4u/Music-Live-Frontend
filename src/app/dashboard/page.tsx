"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Play, Plus, UserPlus, Headset, Heart, Calendar } from "lucide-react";

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
    cover: "https://picsum.photos/seed/chillvibes/300/300",
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
    cover: "https://picsum.photos/seed/latenightjazz/300/300",
  },
  {
    id: "room-3",
    name: "Earth Tones Synth",
    inviteCode: "xyz789",
    type: "PUBLIC",
    members: 5,
    currentTrack: "Resonance",
    currentArtist: "Home",
    isPlaying: false,
    cover: "https://picsum.photos/seed/earthtones/300/300",
  },
  {
    id: "room-4",
    name: "Kollections Pop",
    inviteCode: "pop999",
    type: "PRIVATE",
    members: 8,
    currentTrack: "Levitating",
    currentArtist: "Dua Lipa",
    isPlaying: true,
    cover: "https://picsum.photos/seed/kollections/300/300",
  }
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-[#121216] border border-white/10 p-8 w-full max-w-md relative z-10 rounded-3xl shadow-2xl mx-4">
        <h2 className="text-2xl font-bold font-display text-white mb-6">Create a Room</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Room Name</label>
            <input 
              type="text" 
              value={roomName} 
              onChange={(e) => setRoomName(e.target.value)} 
              placeholder="e.g., Chill Vibes 🎧" 
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/5 text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/30 transition-all text-sm font-medium" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-3">Room Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "PRIVATE", label: "Private", emoji: "🔒" },
                { value: "FRIENDS", label: "Friends", emoji: "👥" },
                { value: "SOLO", label: "Solo", emoji: "🎧" },
              ].map((type) => (
                <button 
                  key={type.value} 
                  onClick={() => setRoomType(type.value)} 
                  className={`py-3 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    roomType === type.value 
                      ? "bg-[#ff6c37]/15 text-[#ff6c37] border border-[#ff6c37]/30" 
                      : "bg-zinc-900/50 text-zinc-400 border border-white/5 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  <span className="text-base">{type.emoji}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
            <button onClick={onClose} className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition-colors cursor-pointer">Cancel</button>
            <button 
              onClick={() => { onCreateRoom(roomName || "My Room", roomType); onClose(); }} 
              className="flex-1 py-3 bg-[#ff6c37] hover:bg-[#ff571e] text-white font-bold rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Create Room
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-[#121216] border border-white/10 p-8 w-full max-w-md relative z-10 rounded-3xl shadow-2xl mx-4">
        <h2 className="text-2xl font-bold font-display text-white mb-6">Join a Room</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Room Code or Invite Link</label>
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="e.g., abc123" 
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/5 text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/30 transition-all text-sm font-medium" 
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
            <button onClick={onClose} className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition-colors cursor-pointer">Cancel</button>
            <button 
              onClick={() => { router.push(`/room/${code || "abc123"}`); onClose(); }} 
              className="flex-1 py-3 bg-[#ff6c37] hover:bg-[#ff571e] text-white font-bold rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Join Room
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"rooms" | "trending" | "featured">("rooms");
  const [isBannerLiked, setIsBannerLiked] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#ff6c37]/30 border-t-[#ff6c37] rounded-full animate-spin" />
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Loading your vibes...</p>
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
    <div className="pb-12 px-8 select-none">
      {/* Top Navigation Bar */}
      <header className="h-16 flex items-center justify-between mb-6 sticky top-0 bg-[#070709]/80 backdrop-blur-md z-30 pt-4 pb-2 border-b border-white/3">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 hover:text-white text-zinc-400 flex items-center justify-center transition-all cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 hover:text-white text-zinc-400 flex items-center justify-center transition-all cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="text-xs font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 uppercase select-none">
            <span>Discover</span>
            <span className="text-zinc-600">/</span>
            <span className="text-white">Rooms</span>
          </div>
        </div>

        {/* Center Search / Header Menu */}
        <div className="flex items-center gap-8 flex-1 max-w-lg mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search rooms, playlists, tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 pl-11 pr-4 py-2 text-sm text-white rounded-full placeholder-zinc-500 focus:outline-none focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/20 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-5 text-xs font-bold text-zinc-400 shrink-0">
            {[
              { id: "rooms", label: "Rooms" },
              { id: "trending", label: "Trending" },
              { id: "featured", label: "Featured" }
            ].map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => setActiveSubTab(subTab.id as any)}
                className={`hover:text-white transition-all relative py-1 cursor-pointer ${
                  activeSubTab === subTab.id ? "text-white" : ""
                }`}
              >
                {subTab.label}
                {activeSubTab === subTab.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#ff6c37] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User Session Info */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-zinc-400">{userName.split(" ")[0]}</span>
          {session.user.image ? (
            <img src={session.user.image} alt={userName} className="w-8 h-8 rounded-full border border-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Curated Spotlight Hero Banner */}
      <section className="mb-8 relative rounded-3xl overflow-hidden bg-linear-to-r from-[#e34222] via-[#e85233] to-[#ff7d4b] h-72 md:h-80 shadow-2xl flex items-center group select-none">
        {/* Blended Portrait Background */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/2 md:w-2/5 bg-cover bg-center mix-blend-luminosity opacity-85 group-hover:scale-102 transition-transform duration-700 pointer-events-none"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop')",
            maskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)"
          }}
        />

        <div className="absolute inset-0 bg-linear-to-r from-[#e34222] via-[#e85233]/70 to-transparent pointer-events-none" />

        <div className="relative z-10 pl-8 md:pl-12 max-w-xl text-left">
          <span className="text-[10px] font-extrabold text-white/70 uppercase tracking-widest block mb-2 font-mono">
            CURATED PLAYLIST
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-white mb-3 tracking-tight leading-none">
            R&B Hits
          </h1>
          <p className="text-white/80 text-xs md:text-sm mb-6 leading-relaxed max-w-md font-medium">
            Hot Shot, Confessions, Beyonce, Usher, The-Dream, Mario, Akif, Princeton Michael... Enjoy absolute sync listening now.
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsBannerLiked(!isBannerLiked)}
              className={`w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer ${
                isBannerLiked ? "bg-white text-[#e34222] hover:bg-white" : ""
              }`}
            >
              <Heart size={16} fill={isBannerLiked ? "currentColor" : "none"} />
            </button>
            <span className="text-xs font-semibold text-white/90">
              50,056 Likes &bull; 213 Songs, 13 hr 7 min
            </span>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Buttons */}
      <section className="grid sm:grid-cols-3 gap-4 mb-8">
        <button 
          id="create-room-btn" 
          onClick={() => setShowCreate(true)} 
          className="bg-[#121216]/60 border border-white/5 rounded-2xl p-5 flex items-center gap-4 text-left group hover:bg-[#121216] hover:border-white/10 hover:-translate-y-px transition-all cursor-pointer shadow-lg shadow-black/20"
        >
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/10 group-hover:scale-105 transition-all">
            <Plus size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide">Create Room</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Start a synchronized live session</p>
          </div>
        </button>

        <button 
          id="join-room-btn" 
          onClick={() => setShowJoin(true)} 
          className="bg-[#121216]/60 border border-white/5 rounded-2xl p-5 flex items-center gap-4 text-left group hover:bg-[#121216] hover:border-white/10 hover:-translate-y-px transition-all cursor-pointer shadow-lg shadow-black/20"
        >
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-all">
            <UserPlus size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide">Join Room</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Connect with code or invite link</p>
          </div>
        </button>

        <button 
          id="solo-mode-btn" 
          onClick={() => handleCreateRoom("Solo Session 🎧", "SOLO")} 
          className="bg-[#121216]/60 border border-white/5 rounded-2xl p-5 flex items-center gap-4 text-left group hover:bg-[#121216] hover:border-white/10 hover:-translate-y-px transition-all cursor-pointer shadow-lg shadow-black/20"
        >
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-all">
            <Headset size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide">Solo Mode</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Listen privately on your own</p>
          </div>
        </button>
      </section>

      {/* Your Rooms: Album Style Grid */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5 select-none">
          <h2 className="text-lg font-bold font-display text-white tracking-wide">Active Rooms</h2>
          <button className="text-xs font-bold text-zinc-500 hover:text-[#ff6c37] transition-colors uppercase tracking-wider">
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {mockRooms.map((room) => (
            <Link 
              key={room.id} 
              href={`/room/${room.id}`} 
              className="group flex flex-col cursor-pointer" 
              id={`room-card-${room.id}`}
            >
              {/* Cover Container */}
              <div className="aspect-square w-full rounded-2xl overflow-hidden relative mb-3 bg-zinc-900 border border-white/5 shadow-xl shadow-black/35">
                <img 
                  src={room.cover} 
                  alt={room.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Overlay Play Indicator & Status */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <div className="w-12 h-12 rounded-full bg-[#ff6c37] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition-transform scale-90 group-hover:scale-100">
                    <Play size={18} fill="white" className="ml-0.5" />
                  </div>
                </div>

                {room.isPlaying && (
                  <div className="absolute bottom-3 right-3 bg-black/60 border border-white/10 px-2 py-1 rounded-md flex items-end gap-[2px] h-5 z-20">
                    <div className="w-[2px] bg-[#ff6c37] rounded-full animate-wave h-[5px]" />
                    <div className="w-[2px] bg-[#ff6c37] rounded-full animate-wave h-[10px]" style={{ animationDelay: "0.15s" }} />
                    <div className="w-[2px] bg-[#ff6c37] rounded-full animate-wave h-[4px]" style={{ animationDelay: "0.3s" }} />
                  </div>
                )}

                <span className="absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded bg-black/50 border border-white/10 text-white z-20 font-mono tracking-wider">
                  {room.inviteCode.toUpperCase()}
                </span>
              </div>

              {/* Text Info */}
              <div className="text-left px-1">
                <h3 className="font-bold text-sm text-zinc-100 truncate group-hover:text-[#ff6c37] transition-colors">
                  {room.name}
                </h3>
                <p className="text-xs text-zinc-500 truncate mt-0.5 font-medium">
                  {room.isPlaying ? `${room.currentTrack} &bull; ${room.currentArtist}` : "Inactive"}
                </p>
                <span className="text-[10px] font-bold text-zinc-600 block mt-1 uppercase font-mono tracking-wider">
                  {room.type} &bull; {room.members} member{room.members !== 1 && "s"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Played tracks */}
      <section className="select-none">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-display text-white tracking-wide">Recently Played</h2>
          <button className="text-xs font-bold text-zinc-500 hover:text-[#ff6c37] transition-colors uppercase tracking-wider">
            Clear History
          </button>
        </div>

        <div className="space-y-1 bg-[#121216]/30 border border-white/3 p-2 rounded-2xl shadow-xl">
          {recentlyPlayed.map((track, idx) => (
            <div 
              key={track.id} 
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors group cursor-pointer"
            >
              <span className="text-xs font-bold text-zinc-500 w-5 text-right font-mono">{idx + 1}</span>
              <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded-lg object-cover shadow border border-white/5 shrink-0" />
              
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white truncate group-hover:text-[#ff6c37] transition-colors">
                  {track.title}
                </p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {track.artist}
                </p>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <span className="text-xs text-zinc-500 font-medium font-mono">{track.playedAt}</span>
                
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white p-1 hover:bg-white/5 rounded-md">
                  <Play size={14} fill="currentColor" />
                </button>
              </div>
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
