"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePlayerStore, type Track } from "@/stores/playerStore";
import { useRoomStore } from "@/stores/roomStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Play, Pause, FastForward, Rewind, Copy, Check } from "lucide-react";

const demoTracks: Track[] = [
  { id: "track_1", title: "SoundHelix Song 1", artist: "T. Schürger", duration: 372, thumbnail: "https://picsum.photos/seed/track1/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "track_2", title: "SoundHelix Song 2", artist: "T. Schürger", duration: 425, thumbnail: "https://picsum.photos/seed/track2/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "track_3", title: "SoundHelix Song 3", artist: "T. Schürger", duration: 344, thumbnail: "https://picsum.photos/seed/track3/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "track_4", title: "SoundHelix Song 4", artist: "T. Schürger", duration: 302, thumbnail: "https://picsum.photos/seed/track4/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "track_5", title: "SoundHelix Song 8", artist: "T. Schürger", duration: 327, thumbnail: "https://picsum.photos/seed/track5/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

const searchResultTracks: Track[] = [
  { id: "s1", title: "Montero", artist: "Lil Nas X", duration: 137, thumbnail: "https://picsum.photos/seed/track6/300/300" },
  { id: "s2", title: "Kiss Me More", artist: "Doja Cat ft. SZA", duration: 208, thumbnail: "https://picsum.photos/seed/track7/300/300" },
  { id: "s3", title: "Good 4 U", artist: "Olivia Rodrigo", duration: 178, thumbnail: "https://picsum.photos/seed/track8/300/300" },
  { id: "s4", title: "Industry Baby", artist: "Lil Nas X & Jack Harlow", duration: 212, thumbnail: "https://picsum.photos/seed/track9/300/300" },
  { id: "s5", title: "Heat Waves", artist: "Glass Animals", duration: 234, thumbnail: "https://picsum.photos/seed/track10/300/300" },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ===== ROOM PAGE ===== */
export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [roomId, setRoomId] = useState<string>("");
  const roomName = searchParams.get("name") || "Chill Vibes 🎧";
  const roomType = searchParams.get("type") || "PRIVATE";
  const isHostParam = searchParams.get("host") === "true";

  // Zustand stores
  const player = usePlayerStore();
  const room = useRoomStore();

  // Local state
  const [copied, setCopied] = useState(false);
  const [rightPanel, setRightPanel] = useState<"queue" | "members">("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [inviteCode] = useState(() => Math.random().toString(36).slice(2, 8));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize WebRTC
  useWebRTC(roomId, session?.user?.id || "");

  // Resolve params
  useEffect(() => {
    params.then((p) => setRoomId(p.id));
  }, [params]);

  // Initialize queue with demo tracks
  useEffect(() => {
    if (player.queue.length === 0) {
      player.setQueue(demoTracks, 0);
    }
  }, []);

  // Set up room state
  useEffect(() => {
    if (!session?.user || !roomId) return;

    const userId = session.user.id || session.user.email || "user";
    const userName = session.user.name || "User";
    const userImage = session.user.image || null;

    room.setRoom({
      id: roomId,
      name: roomName,
      inviteCode,
      type: roomType as "PRIVATE" | "FRIENDS" | "SOLO",
      hostId: isHostParam ? userId : "",
      hostName: isHostParam ? userName : "Host",
    });
    room.setIsHost(isHostParam);

    // Connect to socket
    const socket = connectSocket();

    socket.on("connect", () => {
      room.setConnected(true);
      socket.emit("join-room", { roomId, userId, userName, userImage });
      // Request current sync state
      socket.emit("sync:request-state", { roomId });
    });

    socket.on("room:members", (members) => {
      room.setMembers(
        members.map((m: any) => ({
          ...m,
          isHost: m.userId === (isHostParam ? userId : ""),
          isSpeaking: false,
        }))
      );
    });

    socket.on("user-joined", (data) => {
      console.log(`${data.userName || data.userId} joined the room`);
      room.addMember({
        userId: data.userId,
        userName: data.userName,
        userImage: data.userImage,
        isMuted: false,
        isHost: false,
        isSpeaking: false,
      });
    });

    socket.on("user-left", (data) => {
      console.log(`${data.userName || data.userId} left the room`);
      room.removeMember(data.userId);
    });

    socket.on("speaking", (data) => {
      room.setSpeaking(data.userId, data.isSpeaking);
    });

    // Sync events (for guests)
    socket.on("music-state-update", (state) => {
      if (!isHostParam) {
        const track = demoTracks.find((t) => t.id === state.songId) || player.currentTrack;
        if (track && track.id !== player.currentTrack?.id) {
          player.setTrack(track);
        }
        if (state.isPlaying) {
          const elapsed = (Date.now() - state.timestamp) / 1000;
          const newPos = state.currentTime + elapsed;
          
          // Drift correction: if drift > 250ms, force sync
          const localTime = audioRef.current?.currentTime || 0;
          if (Math.abs(localTime - newPos) > 0.25) {
             player.seek(newPos);
             if (audioRef.current) audioRef.current.currentTime = newPos;
          }
          
          player.play();
        } else {
          player.seek(state.currentTime);
          if (audioRef.current) {
            audioRef.current.currentTime = state.currentTime;
          }
          player.pause();
        }
      }
    });

    socket.on("disconnect", () => {
      room.setConnected(false);
    });

    return () => {
      socket.emit("room:leave", { roomId, userId });
      socket.off("connect");
      socket.off("room:members");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("speaking");
      socket.off("music-state-update");
      socket.off("disconnect");
      disconnectSocket();
      room.leaveRoom();
    };
  }, [session, roomId]);

  // Handle audio play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (player.isPlaying) {
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [player.isPlaying, player.currentTrack?.id]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (player.isMuted ? 0 : player.volume) / 100;
    }
  }, [player.volume, player.isMuted]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    // To prevent infinite update loops, only update store position if playing
    if (player.isPlaying) {
      player.setPosition(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    handleNext();
  };

  // Broadcast sync events when host performs actions
  const emitSync = useCallback(
    (event: string, data: any) => {
      if (room.isHost && room.isConnected) {
        const socket = getSocket();
        socket.emit(event, { roomId, ...data });
      }
    },
    [room.isHost, room.isConnected, roomId]
  );

  // Host heartbeat to keep guests in sync and update server state
  useEffect(() => {
    if (room.isHost && player.isPlaying && audioRef.current && player.currentTrack) {
      const interval = setInterval(() => {
        emitSync("seek-update", { songId: player.currentTrack!.id, currentTime: audioRef.current?.currentTime || player.position });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [room.isHost, player.isPlaying, emitSync, player.position, player.currentTrack]);

  const handlePlayPause = () => {
    if (!player.currentTrack) return;
    if (player.isPlaying) {
      player.pause();
      emitSync("music-pause", { songId: player.currentTrack.id, currentTime: player.position });
    } else {
      player.play();
      emitSync("music-play", { songId: player.currentTrack.id, currentTime: player.position });
    }
  };

  const handleNext = () => {
    player.next();
    const nextTrack = player.currentTrack;
    if (nextTrack) {
      emitSync("change-song", { songId: nextTrack.id });
    }
  };

  const handlePrev = () => {
    player.prev();
  };

  const handleSeek = (pos: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = pos;
    }
    player.seek(pos);
    if (player.currentTrack) {
      emitSync("seek-update", { songId: player.currentTrack.id, currentTime: pos });
    }
  };

  const handleAddToQueue = (track: Track) => {
    player.addToQueue(track);
    setSearchQuery("");
    setShowSearch(false);
  };

  const copyInviteCode = () => {
    const inviteLink = `${window.location.origin}/room/${roomId}?name=${encodeURIComponent(roomName)}&type=${roomType}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reportUser = async (reportedId: string, reportedName: string) => {
    if (confirm(`Are you sure you want to report ${reportedName} for abuse?`)) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reporterId: session?.user?.id || "anonymous",
            reportedId,
            roomId,
            reason: "Toxic behavior / Voice abuse in room",
          })
        });
        alert(`Report submitted for ${reportedName}. Our moderators will review it shortly.`);
      } catch (e) {
        console.error(e);
        alert("Failed to submit report. Please try again.");
      }
    }
  };

  const currentTrack = player.currentTrack || demoTracks[0];
  const effectiveVolume = player.isMuted ? 0 : player.volume;

  // Mock members if socket not connected
  const members = room.members.length > 0 ? room.members : [
    { userId: "self", userName: session?.user?.name || "You", userImage: session?.user?.image || null, isMuted: false, isHost: true, isSpeaking: false },
  ];

  const filteredSearch = searchQuery
    ? searchResultTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchResultTracks;

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden">
      {/* Top Bar */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors" title="Exit Room">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <div>
            <h1 className="font-semibold text-lg text-white font-(family-name:--font-outfit) flex items-center gap-2">
              {roomName}
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/10 font-bold uppercase">{roomType}</span>
              {room.isHost && <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/10 font-bold">HOST</span>}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {roomType !== "SOLO" && (
            <>
              <button id="copy-invite-btn" onClick={copyInviteCode} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                {copied ? <span className="text-green-400 font-medium">Copied!</span> : <span>Copy Link</span>}
              </button>
              <button className="btn-primary py-2 px-4 text-sm flex items-center gap-2" onClick={copyInviteCode}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                Invite
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hidden Audio Element */}
        {currentTrack?.audioUrl && (
          <audio
            ref={audioRef}
            src={currentTrack.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleAudioEnded}
          />
        )}

        {/* Left Side: Participants (Hide in SOLO mode) */}
        {roomType !== "SOLO" && (
          <aside className="w-72 border-r border-white/5 glass flex flex-col shrink-0 z-20">
            <div className="p-5 border-b border-white/5">
              <h2 className="text-sm font-bold font-(family-name:--font-outfit) text-white uppercase tracking-wider flex items-center justify-between">
                Participants
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 normal-case">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {members.length}
                </div>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/30 border border-white/5 hover:bg-surface-800/80 transition-colors">
                  <div className="relative">
                    {member.userImage ? (
                      <img src={member.userImage} alt={member.userName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${member.isHost ? "bg-linear-to-br from-primary-600 to-primary-400" : "bg-linear-to-br from-surface-600 to-surface-500"}`}>
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {member.isSpeaking && !member.isMuted && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-surface-900 animate-[pulse-glow_2s_ease-in-out_infinite]" />
                    )}
                    {member.isMuted && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface-900 flex items-center justify-center border-2 border-surface-900">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-red-400"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><path d="M17 16.95A7 7 0 0 1 5 12v-2" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                      {member.userName}
                      {member.isHost && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">HOST</span>}
                    </p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      {room.isConnected ? <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
                      {member.isMuted ? "Muted" : "Listening"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Center: Music Player */}
        <div className="flex-1 flex flex-col relative z-10">
          <div className="absolute inset-0 opacity-20 blur-[150px]" style={{ background: "radial-gradient(circle at center, rgba(139,92,246,0.5), transparent 70%)" }} />
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-20">
            {/* Album Art */}
            <div className={`relative mb-8 transition-transform duration-500 ${player.isPlaying ? "scale-105" : "scale-100"}`}>
              <div className={`absolute -inset-4 bg-primary-500/20 rounded-full blur-3xl opacity-0 transition-opacity duration-1000 ${player.isPlaying ? "opacity-100 animate-pulse-glow" : ""}`} />
              <div className={`w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${player.isPlaying ? "shadow-primary-500/40 glow-primary" : "shadow-black/50"}`}>
                <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Track Info */}
            <div className="text-center mb-8 max-w-md w-full">
              <h2 className="text-3xl font-bold text-white font-(family-name:--font-outfit) mb-2 truncate">{currentTrack.title}</h2>
              <p className="text-lg text-primary-400 truncate">{currentTrack.artist}</p>
            </div>

            {/* Seek Bar */}
            <div className="w-full max-w-2xl mb-8 group">
              <input
                id="seek-bar"
                type="range"
                min={0}
                max={currentTrack.duration}
                value={player.position}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="seek-bar"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #06b6d4 ${(player.position / currentTrack.duration) * 100}%, rgba(255,255,255,0.1) ${(player.position / currentTrack.duration) * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs font-medium text-zinc-400 tracking-wider">{formatTime(player.position)}</span>
                <span className="text-xs font-medium text-zinc-400 tracking-wider">{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-center gap-8">
              <button id="shuffle-btn" onClick={() => player.toggleShuffle()} className={`transition-all hover:scale-110 ${player.isShuffle ? "text-accent-500 glow-accent" : "text-zinc-500 hover:text-white"}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
              </button>
              <button id="prev-btn" onClick={handlePrev} className="text-white hover:text-primary-300 hover:scale-110 transition-all">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M19 20L9 12l10-8v16zM5 19V5h2v14H5z" /></svg>
              </button>
              <button id="play-pause-btn" onClick={handlePlayPause} className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 glow-primary">
                {player.isPlaying ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#09090b"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#09090b" className="ml-1"><path d="M5 3l14 9-14 9V3z" /></svg>
                )}
              </button>
              <button id="next-btn" onClick={handleNext} className="text-white hover:text-primary-300 hover:scale-110 transition-all">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8V4zM17 5h2v14h-2V5z" /></svg>
              </button>
              <button id="repeat-btn" onClick={() => player.toggleRepeat()} className={`transition-all hover:scale-110 ${player.isRepeat ? "text-accent-500 glow-accent" : "text-zinc-500 hover:text-white"}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Chat & Activity (Hide in SOLO mode) */}
        {roomType !== "SOLO" && (
          <aside className="w-80 border-l border-white/5 glass flex flex-col shrink-0 z-20">
            <div className="p-5 border-b border-white/5">
              <h2 className="text-sm font-bold font-(family-name:--font-outfit) text-white uppercase tracking-wider">Room Activity</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-center p-6 bg-primary-500/10 rounded-2xl border border-primary-500/20">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h3 className="text-white font-semibold mb-1">Voice Participants</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">Users in this room will appear below.</p>
                
                <div className="flex flex-col gap-3">
                  {members.map(member => (
                    <div key={member.userId} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${member.isSpeaking ? 'bg-primary-500/20 shadow-[0_0_15px_rgba(124,77,255,0.3)]' : 'bg-surface-800/50'}`}>
                      <div className={`w-8 h-8 rounded-full bg-zinc-700 shrink-0 flex items-center justify-center overflow-hidden ${member.isSpeaking ? 'ring-2 ring-primary-500 glow-primary' : ''}`}>
                        {member.userImage ? (
                          <img src={member.userImage} alt={member.userName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-white">{member.userName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-white line-clamp-1">{member.userName} {member.isHost && <span className="text-[10px] text-amber-400 ml-1">HOST</span>}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {member.userId !== session?.user?.id && member.userId !== session?.user?.email && member.userId !== "self" && (
                          <button onClick={() => reportUser(member.userId, member.userName)} className="text-zinc-500 hover:text-red-400 transition-colors" title="Report User">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          </button>
                        )}
                        {member.isMuted ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18" /></svg>
                        ) : member.isSpeaking ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="2" className="animate-pulse"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative pl-4 border-l-2 border-white/10 pb-4 pt-2">
                <div className="absolute left-[-5px] top-3 w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-white"><span className="font-semibold text-primary-400">You</span> joined the room.</p>
                <p className="text-xs text-zinc-500 mt-0.5">Just now</p>
              </div>
              {members.length > 1 && (
                <div className="relative pl-4 border-l-2 border-white/10 pb-4 pt-2">
                  <div className="absolute left-[-5px] top-3 w-2 h-2 rounded-full bg-accent-500" />
                  <p className="text-sm text-white"><span className="font-semibold text-accent-400">Friend</span> joined the room.</p>
                  <p className="text-xs text-zinc-500 mt-0.5">1 min ago</p>
                </div>
              )}
              {player.isPlaying && (
                <div className="relative pl-4 border-l-2 border-white/10 pb-4 pt-2">
                  <div className="absolute left-[-5px] top-3 w-2 h-2 rounded-full bg-primary-500" />
                  <p className="text-sm text-white"><span className="font-semibold text-primary-400">Host</span> played a track.</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Now</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Bar: Voice Controls & Player */}
      <footer className="glass border-t border-white/5 px-6 py-4 flex items-center justify-between z-30 shrink-0">
        {/* Left: Volume */}
        <div className="flex items-center gap-3 w-1/3 max-w-xs">
          <button onClick={() => player.toggleMute()} className="text-zinc-400 hover:text-white transition-colors">
            {player.isMuted || player.volume === 0 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
            )}
          </button>
          <input
            id="volume-bar"
            type="range"
            min={0}
            max={100}
            value={effectiveVolume}
            onChange={(e) => player.setVolume(Number(e.target.value))}
            className="seek-bar flex-1"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${effectiveVolume}%, rgba(255,255,255,0.1) ${effectiveVolume}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
        </div>

        {/* Center: Music Controller */}
        <div className="flex flex-col items-center justify-center w-1/3 min-w-[300px]">
          <div className="flex items-center gap-6 mb-2 text-zinc-400">
            {room.isHost && (
              <button onClick={handlePrev} className="hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>
              </button>
            )}
            <button onClick={room.isHost ? handlePlayPause : undefined} className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${room.isHost ? 'bg-white text-surface-950 hover:scale-105' : 'bg-white/10 text-white opacity-50 cursor-not-allowed'}`}>
              {player.isPlaying ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3" /></svg>}
            </button>
            {room.isHost && (
              <button onClick={handleNext} className="hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full text-xs text-zinc-500 font-medium">
            <span className="w-10 text-right">{formatTime(player.position)}</span>
            <input
              type="range"
              min={0}
              max={currentTrack.duration || 100}
              value={player.position}
              onChange={(e) => room.isHost ? handleSeek(Number(e.target.value)) : undefined}
              className={`seek-bar flex-1 ${!room.isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!room.isHost}
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(player.position / (currentTrack.duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(player.position / (currentTrack.duration || 1)) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <span className="w-10">{formatTime(currentTrack.duration || 0)}</span>
          </div>
        </div>

        {/* Right: Voice Controls (Hide in SOLO mode) */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          {roomType !== "SOLO" && (
            <div className="flex items-center gap-2 bg-surface-800/50 p-1.5 rounded-2xl border border-white/5">
              <button
                id="mic-toggle-btn"
                onClick={() => {
                  if (!room.voiceConnected) room.setVoiceConnected(true);
                  room.toggleMic();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${room.micMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 glow-red" : "bg-surface-700 text-white hover:bg-surface-600"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {room.micMuted ? (
                    <><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18" /></>
                  ) : (
                    <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
                  )}
                </svg>
                {room.micMuted ? "Muted" : "Mic On"}
              </button>

              <button
                id="deafen-toggle-btn"
                onClick={() => room.toggleDeafen()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${room.isDeafened ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 glow-red" : "bg-surface-700 text-white hover:bg-surface-600"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {room.isDeafened ? (
                     <><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18" /></>
                  ) : (
                     <><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></>
                  )}
                </svg>
                {room.isDeafened ? "Deafened" : "Deafen"}
              </button>

              <button
                id="voice-toggle-btn"
                onClick={() => room.setVoiceConnected(!room.voiceConnected)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${room.voiceConnected ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-surface-700 text-zinc-400 hover:bg-surface-600 hover:text-white"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                {room.voiceConnected ? "Voice Connected" : "Join Voice"}
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
