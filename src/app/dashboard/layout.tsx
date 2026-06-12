"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import {
  Home,
  Users,
  Music,
  History,
  User,
  Settings,
  LogOut,
  CreditCard,
  Shield,
  ChevronRight,
  Play,
  Pause,
  Heart,
  Share2,
  Volume2,
  Maximize2,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  ListMusic,
  Music4,
  AlignLeft
} from "lucide-react";

const dungenTrack = {
  id: "dungen_1",
  title: "Dungen Live",
  artist: "Dungen",
  album: "LP • 2020",
  duration: 180,
  thumbnail: "https://picsum.photos/seed/dungen/100/100",
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
};

const defaultTrack = {
  id: "track_1",
  title: "Lady Magnolia",
  artist: "Piero Umiliani",
  album: "Piero Umiliani Hits",
  duration: 240,
  thumbnail: "https://picsum.photos/seed/ladymagnolia/100/100",
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const player = usePlayerStore();
  const [activeTab, setActiveTab] = useState<"playlists" | "podcasts" | "albums">("playlists");
  const [isLiked, setIsLiked] = useState(false);

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || null;

  const track = player.currentTrack || defaultTrack;
  const isPlaying = player.isPlaying;
  const position = player.position;
  const volume = player.isMuted ? 0 : player.volume;

  // Synchronize audio tag with store state when NOT inside a room page
  const isRoomPage = pathname.includes("/room/");
  
  useEffect(() => {
    if (isRoomPage || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch((e) => console.log("Playback interrupted:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, track.id, isRoomPage]);

  useEffect(() => {
    if (isRoomPage || !audioRef.current) return;
    audioRef.current.volume = volume / 100;
  }, [volume, isRoomPage]);

  const handleTimeUpdate = () => {
    if (isRoomPage || !audioRef.current) return;
    if (isPlaying) {
      player.setPosition(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    if (isRoomPage) return;
    player.next();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      // If store is empty, set default queue
      if (!player.currentTrack) {
        player.setQueue([defaultTrack, dungenTrack]);
      } else {
        player.play();
      }
    }
  };

  const handlePlayDungen = () => {
    // Check if currently playing this track
    if (player.currentTrack?.id === dungenTrack.id) {
      player.togglePlay();
    } else {
      player.setTrack(dungenTrack);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const navSections = [
    {
      title: "Browse Music",
      items: [
        { label: "Home", href: "/dashboard", icon: <Home size={18} /> },
        { label: "Rooms", href: "/dashboard/rooms", icon: <Users size={18} /> },
        { label: "Playlists", href: "/dashboard/playlists", icon: <Music size={18} /> },
        { label: "History", href: "/dashboard/history", icon: <History size={18} /> },
      ],
    },
    {
      title: "Library",
      items: [
        { label: "Billing", href: "/dashboard/billing", icon: <CreditCard size={18} /> },
        { label: "Admin", href: "/dashboard/admin", icon: <Shield size={18} /> },
        { label: "Profile", href: "/dashboard/profile", icon: <User size={18} /> },
        { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-zinc-100 font-sans antialiased overflow-hidden">
      {!isRoomPage && track.audioUrl && (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Main Container */}
      <div className="flex flex-1 flex-row h-[calc(100vh-80px)] overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-black flex flex-col shrink-0 border-r border-white/5 select-none">
          {/* Logo */}
          <div className="p-6 pb-2">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <span className="text-xl font-bold font-display text-white tracking-tight">Syncora</span>
            </Link>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-7 scrollbar-hide">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h3 className="px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  {section.title}
                </h3>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-zinc-900 text-white font-semibold border border-white/5 shadow-md shadow-black/30"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Profile Card & Sign Out */}
          <div className="p-4 border-t border-white/5 bg-black">
            <div className="flex items-center gap-3">
              {userImage ? (
                <img src={userImage} alt={userName} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-zinc-900/10 overflow-y-auto h-full scrollbar-hide">
          {children}
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 bg-black flex flex-col shrink-0 border-l border-white/5 select-none p-5 overflow-y-auto scrollbar-hide">
          {/* Header Activity */}
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-4 font-semibold uppercase tracking-wider">
            <span>Posted by Dungen • 5m</span>
            <ChevronRight size={14} className="cursor-pointer hover:text-white" />
          </div>

          {/* Activity Widget Card */}
          <div className="bg-[#121216] border border-white/5 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden shadow-2xl mb-6 group">
            {/* Spotlight background blur */}
            <div className="absolute -inset-10 bg-orange-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <img
                src={dungenTrack.thumbnail}
                className="w-12 h-12 rounded-lg object-cover shadow-lg"
                alt="Dungen"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{dungenTrack.title}</p>
                <p className="text-xs text-zinc-400 truncate">{dungenTrack.album}</p>
              </div>
              <button className="text-zinc-500 hover:text-white p-1 rounded-md">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </div>

            {/* Simulated Animated Waveform */}
            <div className="h-14 flex items-end justify-between gap-[3px] px-1 relative z-10">
              {Array.from({ length: 26 }).map((_, idx) => {
                const heights = [30, 45, 60, 20, 15, 40, 55, 75, 50, 35, 65, 80, 45, 30, 60, 70, 25, 40, 50, 30, 65, 80, 55, 35, 20, 10];
                const h = heights[idx % heights.length];
                return (
                  <div
                    key={idx}
                    className="w-[6px] rounded-full transition-all duration-300"
                    style={{
                      height: `${h}%`,
                      backgroundColor: player.currentTrack?.id === dungenTrack.id && isPlaying ? "#ff6c37" : "rgba(255, 255, 255, 0.12)",
                      animation: player.currentTrack?.id === dungenTrack.id && isPlaying
                        ? `equalizer 1.2s ease-in-out infinite alternate`
                        : "none",
                      animationDelay: `${idx * 0.04}s`
                    }}
                  />
                );
              })}
            </div>

            {/* Interactive Widget Action Buttons */}
            <div className="flex items-center justify-between relative z-10 pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition-all ${
                    isLiked ? "text-orange-500" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
                  <Share2 size={16} />
                </button>
              </div>

              {/* Spotlight Orange Play Button */}
              <button
                onClick={handlePlayDungen}
                className="w-10 h-10 rounded-full bg-[#ff6c37] hover:bg-[#ff571e] text-white flex items-center justify-center shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {player.currentTrack?.id === dungenTrack.id && isPlaying ? (
                  <Pause size={18} fill="white" />
                ) : (
                  <Play size={18} fill="white" className="ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Right Sidebar Tabs */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs List */}
            <div className="flex border-b border-white/5 gap-4 mb-4 text-xs font-semibold text-zinc-500 select-none pb-2">
              {[
                { id: "playlists", label: "Playlists" },
                { id: "podcasts", label: "Podcasts" },
                { id: "albums", label: "Albums" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`hover:text-white transition-all relative ${
                    activeTab === tab.id ? "text-white" : ""
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute top-[21px] left-0 right-0 h-[2px] bg-[#ff6c37] rounded-full animate-fade-in" />
                  )}
                </button>
              ))}
            </div>

            {/* Tabs Content */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-hide">
              {activeTab === "playlists" && (
                <>
                  {[
                    { title: "Indie Sadie", time: "2d", color: "from-purple-600 to-indigo-700" },
                    { title: "Boards of Canada (Full)", time: "4 Oct", color: "from-amber-600 to-red-700" },
                    { title: "IC122 at Prince Bar", time: "22 Sep", color: "from-blue-600 to-cyan-700" },
                    { title: "Kwes. Playlist", time: "14 Sep", color: "from-emerald-600 to-teal-700" },
                    { title: "Library Music", time: "11 Sep", color: "from-pink-600 to-rose-700" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 hover:bg-white/3 p-1.5 rounded-xl transition-all cursor-pointer group">
                      <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${item.color} flex items-center justify-center shrink-0`}>
                        <Music4 size={16} className="text-white/80 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-[#ff6c37] transition-colors">{item.title}</p>
                        <p className="text-[11px] text-zinc-500">Playlist</p>
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-500 shrink-0">{item.time}</span>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "podcasts" && (
                <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                  <AlignLeft size={24} className="text-zinc-600 mb-2 animate-pulse" />
                  <p className="text-xs text-zinc-500">No subscribed podcasts yet.</p>
                </div>
              )}

              {activeTab === "albums" && (
                <>
                  {[
                    { title: "Geogaddi", artist: "Boards of Canada", time: "12 Oct", cover: "https://picsum.photos/seed/geogaddi/50/50" },
                    { title: "Tomboy", artist: "Panda Bear", time: "8 Oct", cover: "https://picsum.photos/seed/tomboy/50/50" },
                    { title: "Person Pitch", artist: "Panda Bear", time: "25 Sep", cover: "https://picsum.photos/seed/personpitch/50/50" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 hover:bg-white/3 p-1.5 rounded-xl transition-all cursor-pointer group">
                      <img src={item.cover} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="Cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-[#ff6c37] transition-colors">{item.title}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{item.artist}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-500 shrink-0">{item.time}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Global Playback Bar */}
      <footer className="h-20 bg-black border-t border-white/5 flex items-center justify-between px-6 z-50 select-none">
        {/* Track Details */}
        <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
          <img
            src={track.thumbnail}
            className={`w-12 h-12 rounded-lg object-cover shadow-lg transition-transform duration-500 ${
              isPlaying ? "scale-105 shadow-orange-500/5" : "scale-100"
            }`}
            alt="Track Cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
              {track.title}
            </p>
            <p className="text-xs text-zinc-400 truncate hover:text-white cursor-pointer transition-colors">
              {track.artist}
            </p>
          </div>
        </div>

        {/* Playback Controls & Progress Bar */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[600px] px-4">
          {/* Controls Row */}
          <div className="flex items-center gap-5 text-zinc-400">
            <button
              onClick={() => player.toggleShuffle()}
              className={`hover:text-white transition-colors p-1 ${
                player.isShuffle ? "text-[#ff6c37]" : ""
              }`}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>
            <button onClick={() => player.prev()} className="hover:text-white transition-all active:scale-90" title="Previous">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={14} fill="black" strokeWidth={3} />
              ) : (
                <Play size={14} fill="black" className="ml-0.5" strokeWidth={3} />
              )}
            </button>
            <button onClick={() => player.next()} className="hover:text-white transition-all active:scale-90" title="Next">
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
              onClick={() => player.toggleRepeat()}
              className={`hover:text-white transition-colors p-1 ${
                player.isRepeat ? "text-[#ff6c37]" : ""
              }`}
              title="Repeat"
            >
              <Repeat size={16} />
            </button>
          </div>

          {/* Seekbar Row */}
          <div className="flex items-center gap-3 w-full text-[11px] text-zinc-500 font-semibold font-mono">
            <span className="w-8 text-right">{formatTime(position)}</span>
            <input
              type="range"
              min={0}
              max={track.duration || 100}
              value={position}
              onChange={(e) => player.seek(Number(e.target.value))}
              className="seek-bar flex-1 animate-fade-in"
              style={{
                background: `linear-gradient(to right, #ff6c37 0%, #ff6c37 ${
                  (position / (track.duration || 1)) * 100
                }%, rgba(255,255,255,0.08) ${(position / (track.duration || 1)) * 100}%, rgba(255,255,255,0.08) 100%)`,
              }}
            />
            <span className="w-8">{formatTime(track.duration || 0)}</span>
          </div>
        </div>

        {/* Volume & Aux Actions */}
        <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px] text-zinc-400">
          <button className="hover:text-white transition-colors">
            <ListMusic size={18} />
          </button>
          <div className="flex items-center gap-2 group w-32">
            <button onClick={() => player.toggleMute()} className="hover:text-white transition-colors shrink-0">
              <Volume2 size={18} className={player.isMuted ? "text-red-500" : ""} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="seek-bar flex-1"
              style={{
                background: `linear-gradient(to right, #ff6c37 0%, #ff6c37 ${volume}%, rgba(255,255,255,0.08) ${volume}%, rgba(255,255,255,0.08) 100%)`,
              }}
            />
          </div>
          <button className="hover:text-white transition-colors shrink-0">
            <Maximize2 size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
