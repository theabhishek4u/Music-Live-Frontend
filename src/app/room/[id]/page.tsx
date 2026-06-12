"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePlayerStore, type Track } from "@/stores/playerStore";
import { useRoomStore } from "@/stores/roomStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { 
  Play, 
  Pause, 
  FastForward, 
  Rewind, 
  Copy, 
  Check, 
  Paperclip, 
  Send, 
  Smile, 
  Info, 
  MoreVertical, 
  Mic, 
  MicOff, 
  Headphones 
} from "lucide-react";

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

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  text?: string;
  imageUrl?: string;
  emoji?: string;
  timestamp: number;
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

  // Chat/Messaging State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState("");
  const [isTypingState, setIsTypingState] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showEmojiRow, setShowEmojiRow] = useState(false);

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

  // Set up room state & socket listeners
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

    // Real-time Chat Sockets
    socket.on("chat:message", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
      setTimeout(() => {
        if (chatViewportRef.current) {
          chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
        }
      }, 50);
    });

    socket.on("chat:typing", (data: { userId: string; userName: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (data.isTyping && data.userId !== userId) {
          next[data.userId] = data.userName;
        } else {
          delete next[data.userId];
        }
        return next;
      });
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
      socket.off("chat:message");
      socket.off("chat:typing");
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

  // Real-time Chat functions
  const handleSendMessage = (text?: string, imageUrl?: string, emoji?: string) => {
    if (!session?.user || !roomId) return;
    if (!text && !imageUrl && !emoji) return;

    const message: ChatMessage = {
      id: Math.random().toString(36).slice(2, 9),
      senderId: session.user.id || session.user.email || "user",
      senderName: session.user.name || "User",
      senderImage: session.user.image || null,
      text,
      imageUrl,
      emoji,
      timestamp: Date.now()
    };

    const socket = getSocket();
    if (socket) {
      socket.emit("chat:message", { roomId, message });
    }

    handleStopTyping();
    setChatInput("");
    setShowEmojiRow(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (!session?.user || !roomId) return;
    
    const socket = getSocket();
    if (!socket) return;

    const userId = session.user.id || session.user.email || "user";
    const userName = session.user.name || "User";

    if (!isTypingState) {
      setIsTypingState(true);
      socket.emit("chat:typing", { roomId, userId, userName, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingState && session?.user && roomId) {
      setIsTypingState(false);
      const socket = getSocket();
      if (socket) {
        const userId = session.user.id || session.user.email || "user";
        const userName = session.user.name || "User";
        socket.emit("chat:typing", { roomId, userId, userName, isTyping: false });
      }
    }
  };

  const handleAttachPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      handleSendMessage(undefined, base64Data);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
    <div className="h-screen flex flex-col bg-[#070709] text-zinc-100 font-sans overflow-hidden relative">
      {/* Top Bar */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors" title="Exit Room">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <div>
            <h1 className="font-semibold text-lg text-white font-display flex items-center gap-2 tracking-tight">
              {roomName}
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#ff6c37]/15 text-[#ff6c37] border border-[#ff6c37]/15 font-bold uppercase">{roomType}</span>
              {room.isHost && <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/10 font-bold">HOST</span>}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6 select-none">
          {/* Active Participants Avatars in Top Bar */}
          {roomType !== "SOLO" && (
            <div className="flex items-center gap-2">
              {[0, 1].map((index) => {
                const member = members[index];
                if (member) {
                  return (
                    <div 
                      key={member.userId} 
                      className="relative group cursor-pointer"
                      title={member.userName}
                    >
                      {member.userImage ? (
                        <img 
                          src={member.userImage} 
                          alt={member.userName} 
                          className="w-8 h-8 rounded-full object-cover border border-white/10 hover:border-[#ff6c37] transition-all" 
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold border border-white/10 hover:border-[#ff6c37] transition-all ${member.isHost ? "bg-linear-to-br from-orange-500 to-red-600" : "bg-zinc-800"}`}>
                          {member.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Speaks/Mute indicators */}
                      {member.isSpeaking && !member.isMuted && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
                      )}
                      {member.isMuted && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-black flex items-center justify-center border border-white/10">
                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-red-400"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.49-.34 2.18" /></svg>
                        </div>
                      )}
                      
                      {/* Elegant hover tooltip */}
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                        {member.userName} {member.isHost ? "(Host)" : ""}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <button 
                      key={`empty-${index}`}
                      onClick={copyInviteCode}
                      className="w-8 h-8 rounded-full border border-dashed border-white/20 hover:border-[#ff6c37]/50 hover:bg-[#ff6c37]/5 flex items-center justify-center text-zinc-500 hover:text-[#ff6c37] transition-all cursor-pointer"
                      title="Invite Friend"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  );
                }
              })}
            </div>
          )}

          {roomType !== "SOLO" && (
            <div className="flex items-center gap-2.5">
              <button 
                id="copy-invite-btn" 
                onClick={copyInviteCode} 
                className="relative overflow-hidden group py-2 px-3.5 rounded-xl text-xs font-bold bg-zinc-900/60 border border-white/5 hover:border-[#ff6c37]/30 text-zinc-300 hover:text-white transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-black/20"
              >
                <div className="absolute inset-0 w-full h-full bg-linear-to-r from-orange-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-12 transition-transform duration-300"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                {copied ? <span className="text-emerald-400 font-bold">Copied!</span> : <span>Copy Link</span>}
              </button>
              <button 
                className="py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 bg-linear-to-r from-[#ff6c37] to-[#ff571e] text-white hover:brightness-110 active:scale-95 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 cursor-pointer border border-[#ff6c37]/25"
                onClick={copyInviteCode}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                Invite
              </button>
            </div>
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



        {/* Center: Music Player */}
        <div className="flex-1 flex flex-col relative z-10 select-none">
          <div className="absolute inset-0 opacity-15 blur-[150px] pointer-events-none" style={{ background: "radial-gradient(circle at center, rgba(255,108,55,0.4), transparent 75%)" }} />
          
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-6 relative z-20 pb-24">
            {/* Rotating Vinyl Record Cover */}
            <div className={`relative mb-4 transition-all duration-700 ${player.isPlaying ? "scale-105" : "scale-100"}`}>
              {/* Glow backdrop */}
              <div className={`absolute -inset-8 bg-orange-500/5 rounded-full blur-3xl opacity-0 transition-opacity duration-1000 ${player.isPlaying ? "opacity-100 animate-pulse-glow" : ""}`} />
              
              {/* Rotating Vinyl Outer Disk */}
              <div className={`w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full bg-zinc-950 border-[6px] border-zinc-900 shadow-2xl relative flex items-center justify-center transition-transform ${player.isPlaying ? "animate-spin-slow shadow-orange-500/5" : ""}`}>
                {/* Vinyl Grooves (subtle concentric circles) */}
                <div className="absolute inset-2 rounded-full border border-white/5 opacity-40 pointer-events-none" />
                <div className="absolute inset-6 rounded-full border border-white/5 opacity-30 pointer-events-none" />
                <div className="absolute inset-10 rounded-full border border-white/5 opacity-25 pointer-events-none" />
                <div className="absolute inset-16 rounded-full border border-white/5 opacity-15 pointer-events-none" />
                <div className="absolute inset-24 rounded-full border border-white/5 opacity-10 pointer-events-none" />
                
                {/* Center Album Art */}
                <div className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden border-4 border-zinc-950 relative z-10 shrink-0 select-none">
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover pointer-events-none" />
                </div>
                
                {/* Vinyl Spindle Center Hole */}
                <div className="w-4 h-4 rounded-full bg-zinc-950 border border-white/20 absolute z-20 shadow-inner" />
              </div>
            </div>

            {/* Track Info */}
            <div className="text-center mb-4 max-w-md w-full">
              <h2 className="text-2xl font-extrabold text-white font-display mb-1 tracking-tight truncate">{currentTrack.title}</h2>
              <p className="text-sm text-[#ff6c37] font-semibold tracking-wide truncate">{currentTrack.artist}</p>

              {/* Animated Equalizer Visualizer */}
              {player.isPlaying && (
                <div className="flex items-center justify-center gap-[3px] h-6 mt-4 opacity-80 select-none">
                  <div className="eq-bar" />
                  <div className="eq-bar" style={{ animationDelay: "0.15s" }} />
                  <div className="eq-bar" style={{ animationDelay: "0.3s" }} />
                  <div className="eq-bar" style={{ animationDelay: "0.45s" }} />
                  <div className="eq-bar" style={{ animationDelay: "0.6s" }} />
                </div>
              )}
            </div>

            {/* Seek Bar */}
            <div className="w-full max-w-lg mb-4 group px-4">
              <input
                id="seek-bar"
                type="range"
                min={0}
                max={currentTrack.duration || 100}
                value={player.position}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="seek-bar animate-fade-in"
                style={{
                  background: `linear-gradient(to right, #ff6c37 0%, #ff6c37 ${(player.position / (currentTrack.duration || 1)) * 100}%, rgba(255,255,255,0.08) ${(player.position / (currentTrack.duration || 1)) * 100}%, rgba(255,255,255,0.08) 100%)`,
                }}
              />
              <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-bold font-mono tracking-wider">
                <span>{formatTime(player.position)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Player controls */}
            <div className="flex items-center justify-center gap-8">
              <button id="shuffle-btn" onClick={() => player.toggleShuffle()} className={`transition-all hover:scale-110 p-1.5 cursor-pointer ${player.isShuffle ? "text-[#ff6c37]" : "text-zinc-500 hover:text-white"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
              </button>
              <button id="prev-btn" onClick={handlePrev} className="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-1.5 cursor-pointer">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M19 20L9 12l10-8v16zM5 19V5h2v14H5z" /></svg>
              </button>
              
              <button 
                id="play-pause-btn" 
                onClick={handlePlayPause} 
                className="w-16 h-16 rounded-full bg-[#ff6c37] hover:bg-[#ff571e] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/20 cursor-pointer shrink-0"
              >
                {player.isPlaying ? (
                  <Pause size={24} fill="white" strokeWidth={0} />
                ) : (
                  <Play size={24} fill="white" className="ml-0.5" strokeWidth={0} />
                )}
              </button>

              <button id="next-btn" onClick={handleNext} className="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-1.5 cursor-pointer">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8V4zM17 5h2v14h-2V5z" /></svg>
              </button>
              <button id="repeat-btn" onClick={() => player.toggleRepeat()} className={`transition-all hover:scale-110 p-1.5 cursor-pointer ${player.isRepeat ? "text-[#ff6c37]" : "text-zinc-500 hover:text-white"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
              </button>
            </div>
          </div>

          {/* Bottom Floating Voice Controls */}
          {roomType !== "SOLO" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
              <div className="flex items-center gap-2.5 bg-zinc-950/85 backdrop-blur-md border border-white/5 p-1.5 rounded-2xl shadow-2xl">
                <button
                  id="mic-toggle-btn"
                  onClick={() => {
                    if (!room.voiceConnected) room.setVoiceConnected(true);
                    room.toggleMic();
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    room.micMuted 
                      ? "bg-red-500/10 text-red-400 border border-red-500/15" 
                      : "bg-[#ff6c37]/10 text-[#ff6c37] border border-[#ff6c37]/15 hover:bg-[#ff6c37]/20"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    room.isDeafened 
                      ? "bg-red-500/10 text-red-400 border border-red-500/15 animate-pulse" 
                      : "bg-zinc-800 text-zinc-300 border border-white/5 hover:bg-zinc-700"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    room.voiceConnected 
                      ? "bg-[#ff6c37]/10 text-[#ff6c37] border border-[#ff6c37]/15 hover:bg-[#ff6c37]/20" 
                      : "bg-zinc-800 text-zinc-400 border border-white/5 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  {room.voiceConnected ? "Connected" : "Join Voice"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Dynamic Real-time Chat */}
        {roomType !== "SOLO" && (
          <aside className="w-80 border-l border-white/5 bg-zinc-950/60 backdrop-blur-md flex flex-col shrink-0 z-20 h-full">
            {/* Chat Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 select-none">
              <div>
                <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider">Room Chat</h2>
                <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Messages are synchronized</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#ff6c37]/10 px-2 py-0.5 rounded-md border border-[#ff6c37]/10 text-[9px] font-bold text-[#ff6c37] uppercase">
                <span className="w-1.5 h-1.5 bg-[#ff6c37] rounded-full animate-pulse" />
                Live
              </div>
            </div>

            {/* Message Viewport */}
            <div 
              ref={chatViewportRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide flex flex-col"
            >
              {chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-60 select-none">
                  <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-500 mb-3 border border-white/5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-white">No messages yet</p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">Send text, emojis, or upload a photo to start chatting!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === (session?.user?.id || session?.user?.email || "user");
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        isMe ? "self-end items-end" : "self-start items-start"
                      }`}
                    >
                      {/* Sender Info */}
                      <div className="flex items-center gap-1.5 mb-1.5 select-none">
                        {!isMe && (
                          <>
                            {msg.senderImage ? (
                              <img src={msg.senderImage} className="w-4 h-4 rounded-full object-cover" alt="" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-[#ff6c37] flex items-center justify-center text-white text-[9px] font-bold">
                                {msg.senderName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-zinc-400">{msg.senderName}</span>
                          </>
                        )}
                        <span className="text-[9px] text-zinc-600 font-bold font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-lg ${
                          isMe
                            ? "bg-[#ff6c37]/15 border border-[#ff6c37]/25 text-white rounded-tr-none"
                            : "bg-[#121216]/80 border border-white/5 text-zinc-200 rounded-tl-none"
                        }`}
                      >
                        {msg.text && <p className="wrap-break-word">{msg.text}</p>}
                        
                        {msg.imageUrl && (
                          <div className="relative rounded-xl overflow-hidden mt-1.5 max-w-[200px] border border-white/5 select-none">
                            <img
                              src={msg.imageUrl}
                              className="w-full h-full object-cover max-h-[140px] rounded"
                              alt="attached media"
                            />
                          </div>
                        )}

                        {msg.emoji && (
                          <span className="text-3xl block filter drop-shadow select-none">{msg.emoji}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {/* Messages container bottom */}
            </div>

            {/* Typing Indicator Status */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="px-5 py-1.5 bg-[#070709] border-t border-white/3 text-[10px] text-zinc-500 font-bold italic flex items-center gap-1.5 shrink-0 select-none animate-pulse">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-[#ff6c37] rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-[#ff6c37] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 bg-[#ff6c37] rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>
                  {Object.values(typingUsers).join(", ")} {Object.keys(typingUsers).length === 1 ? "is" : "are"}{" "}
                  typing...
                </span>
              </div>
            )}

            {/* Input Form Footer */}
            <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md shrink-0 relative">
              {/* Emojis row */}
              {showEmojiRow && (
                <div className="absolute bottom-16 left-3 right-3 bg-[#121216] border border-white/10 p-2.5 rounded-2xl flex items-center justify-between shadow-2xl z-40 animate-slide-up select-none">
                  {["👍", "🔥", "❤️", "😂", "🎉", "🎵", "✨", "🙌"].map((em) => (
                    <button
                      key={em}
                      onClick={() => handleSendMessage(undefined, undefined, em)}
                      className="text-xl hover:scale-125 transition-transform p-1 cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Text Form */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAttachPhoto}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Attach Photo"
                >
                  <Paperclip size={16} />
                </button>

                <button
                  onClick={() => setShowEmojiRow(!showEmojiRow)}
                  className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                    showEmojiRow ? "text-[#ff6c37] bg-[#ff6c37]/10" : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                  title="Insert Emoji"
                >
                  <Smile size={16} />
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage(chatInput)}
                  className="flex-1 bg-zinc-900 border border-white/5 px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff6c37]/40 focus:ring-1 focus:ring-[#ff6c37]/10 transition-all font-medium"
                />

                <button
                  onClick={() => handleSendMessage(chatInput)}
                  className="p-2 bg-[#ff6c37] hover:bg-[#ff571e] text-white rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10"
                  title="Send Message"
                >
                  <Send size={12} fill="white" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Vignette Effect */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-[#ff6c37]/15 via-purple-600/5 to-transparent z-0" />
    </div>
  );
}
