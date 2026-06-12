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
import { motion, AnimatePresence } from "framer-motion";

// Custom Youtube Icon component because of old lucide-react version in package.json
const Youtube = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => {
  const size = props.size || 24;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
};

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

  const [allowGuestControl, setAllowGuestControl] = useState(false);

  // Broadcast sync events when host (or guest, if allowed) performs actions
  const emitSync = useCallback(
    (event: string, data: any) => {
      if ((room.isHost || allowGuestControl) && room.isConnected) {
        const socket = getSocket();
        socket.emit(event, { roomId, ...data });
      }
    },
    [room.isHost, room.isConnected, roomId, allowGuestControl]
  );

  // Local state
  const [copied, setCopied] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [rightPanel, setRightPanel] = useState<"queue" | "members">("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [inviteCode] = useState(() => Math.random().toString(36).slice(2, 8));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // YouTube Watch Party Local State
  const [activeMode, setActiveMode] = useState<"music" | "youtube">("music");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoAuthor, setVideoAuthor] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [ytApiReady, setYtApiReady] = useState(false);
  
  const ytPlayerRef = useRef<any>(null);
  const activeVideoIdRef = useRef<string | null>(null);
  const pendingVideoState = useRef<{ currentTime: number; isPlaying: boolean } | null>(null);
  const lastUpdateRef = useRef<{ currentTime: number; isPlaying: boolean; timestamp: number } | null>(null);
  const isProgrammaticUpdateRef = useRef(false);

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

    const handleConnect = () => {
      room.setConnected(true);
      socket.emit("join-room", { roomId, userId, userName, userImage });
      // Request current sync states
      socket.emit("sync:request-state", { roomId });
      socket.emit("video-sync", { roomId });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

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
        // Auto-switch mode to music
        setActiveMode("music");

        // Pause YouTube video if playing on the guest side
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
          ytPlayerRef.current.pauseVideo();
        }

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

    // Sync YouTube events (for everyone in the room)
    socket.on("video-state-update", (state: any) => {
      // Sync guest control state
      if (state.allowGuestControl !== undefined) {
        setAllowGuestControl(state.allowGuestControl);
      }

      // Automatically switch to YouTube mode
      setActiveMode("youtube");

      // Pause music player if active
      if (player.isPlaying) {
        player.pause();
        if (audioRef.current) audioRef.current.pause();
      }

      if (state.videoId !== youtubeVideoId) {
        setYoutubeVideoId(state.videoId);
        setYoutubeUrl(`https://www.youtube.com/watch?v=${state.videoId}`);
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
          isProgrammaticUpdateRef.current = true;
          ytPlayerRef.current.loadVideoById(state.videoId);
        } else {
          pendingVideoState.current = { currentTime: state.currentTime, isPlaying: state.isPlaying };
        }
      }

      // Calculate latency offset
      const elapsed = (Date.now() - state.timestamp) / 1000;
      const targetTime = state.currentTime + (state.isPlaying ? elapsed : 0);

      lastUpdateRef.current = {
        currentTime: state.currentTime,
        isPlaying: state.isPlaying,
        timestamp: state.timestamp,
      };

      if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === "function") {
        const playerState = ytPlayerRef.current.getPlayerState();
        
        // Sync Play/Pause
        if (state.isPlaying && playerState !== 1) {
          isProgrammaticUpdateRef.current = true;
          ytPlayerRef.current.playVideo();
        } else if (!state.isPlaying && playerState === 1) {
          isProgrammaticUpdateRef.current = true;
          ytPlayerRef.current.pauseVideo();
        }

        // Sync timeline position (Drift limit: 250ms)
        const localTime = ytPlayerRef.current.getCurrentTime() || 0;
        if (Math.abs(localTime - targetTime) > 0.25) {
          isProgrammaticUpdateRef.current = true;
          ytPlayerRef.current.seekTo(targetTime, true);
        }
      } else {
        pendingVideoState.current = { currentTime: targetTime, isPlaying: state.isPlaying };
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
      socket.off("video-state-update");
      socket.off("chat:message");
      socket.off("chat:typing");
      socket.off("disconnect");
      disconnectSocket();
      room.leaveRoom();
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying YT player on unmount:", e);
        }
        ytPlayerRef.current = null;
      }
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

  // Load YouTube script
  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) {
      setYtApiReady(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      setYtApiReady(true);
    };
  }, []);

  const ytPlayerContainerId = "youtube-iframe-player";

  // Init YT Player
  const initYtPlayer = useCallback((videoId: string) => {
    const YT = (window as any).YT;
    if (!YT || !YT.Player) return;

    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying YT player:", e);
      }
      ytPlayerRef.current = null;
    }

    const container = document.getElementById(ytPlayerContainerId);
    if (!container) return;

    ytPlayerRef.current = new YT.Player(ytPlayerContainerId, {
      height: "100%",
      width: "100%",
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        origin: typeof window !== "undefined" ? window.location.origin : ""
      },
      events: {
        onReady: (event: any) => {
          setVideoDuration(event.target.getDuration() || 0);
          const data = event.target.getVideoData();
          if (data) {
            setVideoTitle(data.title || "YouTube Video");
            setVideoAuthor(data.author || "Unknown Channel");
          }
          if (pendingVideoState.current) {
            const { currentTime, isPlaying } = pendingVideoState.current;
            event.target.seekTo(currentTime, true);
            if (isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
            pendingVideoState.current = null;
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          setVideoIsPlaying(state === 1);
          setVideoDuration(event.target.getDuration() || 0);

          const data = event.target.getVideoData();
          if (data) {
            setVideoTitle(data.title || "YouTube Video");
            setVideoAuthor(data.author || "Unknown Channel");
          }

          // Prevent infinite update feedback loops from socket-initiated player events
          if (isProgrammaticUpdateRef.current) {
            if (state === 1 || state === 2) {
              isProgrammaticUpdateRef.current = false;
            }
            return;
          }

          const canControl = room.isHost || allowGuestControl;
          if (canControl) {
            const currentPos = event.target.getCurrentTime() || 0;
            if (state === 1) {
              emitSync("video-play", { videoId, currentTime: currentPos });
            } else if (state === 2) {
              emitSync("video-pause", { videoId, currentTime: currentPos });
            }
          }
        }
      }
    });
  }, [room.isHost, allowGuestControl, emitSync]);

  // YouTube player trigger effect
  useEffect(() => {
    if (activeMode === "youtube" && ytApiReady && youtubeVideoId) {
      if (!ytPlayerRef.current) {
        activeVideoIdRef.current = youtubeVideoId;
        const timer = setTimeout(() => {
          initYtPlayer(youtubeVideoId);
        }, 100);
        return () => clearTimeout(timer);
      } else if (activeVideoIdRef.current !== youtubeVideoId) {
        activeVideoIdRef.current = youtubeVideoId;
        if (typeof ytPlayerRef.current.loadVideoById === "function") {
          ytPlayerRef.current.loadVideoById(youtubeVideoId);
        }
      }
    }
  }, [activeMode, ytApiReady, youtubeVideoId, initYtPlayer]);

  // Poll video player position
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeMode === "youtube" && videoIsPlaying && ytPlayerRef.current) {
      interval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
          setVideoPosition(ytPlayerRef.current.getCurrentTime() || 0);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [activeMode, videoIsPlaying]);

  // YouTube Host heartbeat
  useEffect(() => {
    if (room.isHost && activeMode === "youtube" && videoIsPlaying && ytPlayerRef.current && youtubeVideoId) {
      const interval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
          const currentTime = ytPlayerRef.current.getCurrentTime() || 0;
          emitSync("video-seek", { videoId: youtubeVideoId, currentTime });
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [room.isHost, activeMode, videoIsPlaying, youtubeVideoId, emitSync]);

  // Guest auto-drift correction
  useEffect(() => {
    if (room.isHost || activeMode !== "youtube" || !ytPlayerRef.current) return;

    const interval = setInterval(() => {
      if (!lastUpdateRef.current || !lastUpdateRef.current.isPlaying) return;

      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        const elapsed = (Date.now() - lastUpdateRef.current.timestamp) / 1000;
        const expectedTime = lastUpdateRef.current.currentTime + elapsed;
        const localTime = ytPlayerRef.current.getCurrentTime() || 0;

        if (Math.abs(localTime - expectedTime) > 0.25) {
          console.log(`Drift detected: local ${localTime}s vs expected ${expectedTime}s. Re-syncing...`);
          ytPlayerRef.current.seekTo(expectedTime, true);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room.isHost, activeMode]);

  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleStartWatchParty = () => {
    if (!youtubeUrl) return;
    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      alert("Please enter a valid YouTube link.");
      return;
    }

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
      isProgrammaticUpdateRef.current = true;
      ytPlayerRef.current.loadVideoById(videoId);
    } else {
      setYoutubeVideoId(videoId);
    }

    emitSync("video-change", { videoId });

    // Pause music if active
    if (player.isPlaying) {
      player.pause();
      if (audioRef.current) audioRef.current.pause();
      emitSync("music-pause", { songId: player.currentTrack?.id || "", currentTime: player.position });
    }
  };

  const handleYtPlayPause = () => {
    if (!ytPlayerRef.current || typeof ytPlayerRef.current.getPlayerState !== "function" || !youtubeVideoId) return;
    
    const state = ytPlayerRef.current.getPlayerState();
    
    if (state === 1) { // Playing -> Pause
      ytPlayerRef.current.pauseVideo();
    } else { // Paused -> Play
      ytPlayerRef.current.playVideo();
    }
  };

  const handleSwitchMode = (mode: "music" | "youtube") => {
    if (mode === activeMode) return;
    handleStopTyping();
    setActiveMode(mode);

    if (mode === "music") {
      // Pause YouTube player if active
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
        ytPlayerRef.current.pauseVideo();
        const currentPos = ytPlayerRef.current.getCurrentTime() || 0;
        emitSync("video-pause", { videoId: youtubeVideoId || "", currentTime: currentPos });
      }
    } else {
      // Pause Music player if active
      if (player.isPlaying) {
        player.pause();
        if (audioRef.current) audioRef.current.pause();
        emitSync("music-pause", { songId: player.currentTrack?.id || "", currentTime: player.position });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    if (player.isPlaying) {
      player.setPosition(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    if (room.isHost || allowGuestControl) {
      handleNext();
    } else {
      // Guests just pause local playback and wait for host's change-song event
      player.pause();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

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
      <header className="glass border-b border-white/5 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors" title="Exit Room">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-6 sm:h-6"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <div>
            <h1 className="font-semibold text-sm sm:text-lg text-white font-display flex items-center gap-1.5 sm:gap-2 tracking-tight">
              <span className="max-w-[100px] sm:max-w-xs truncate block">{roomName}</span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md bg-[#ff6c37]/15 text-[#ff6c37] border border-[#ff6c37]/15 font-bold uppercase shrink-0">{roomType}</span>
              {room.isHost && <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/10 font-bold shrink-0">HOST</span>}
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
              {/* Chat Toggle Button for Mobile */}
              <button
                onClick={() => setShowMobileChat(!showMobileChat)}
                className="md:hidden p-2 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-[#ff6c37]/30 text-zinc-300 hover:text-white cursor-pointer transition-colors shadow-lg"
                title="Toggle Chat"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </button>
              <button 
                id="copy-invite-btn" 
                onClick={copyInviteCode} 
                className="hidden sm:flex relative overflow-hidden group py-2 px-3.5 rounded-xl text-xs font-bold bg-zinc-900/60 border border-white/5 hover:border-[#ff6c37]/30 text-zinc-300 hover:text-white transition-all duration-300 items-center gap-1.5 cursor-pointer shadow-lg shadow-black/20"
              >
                <div className="absolute inset-0 w-full h-full bg-linear-to-r from-orange-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-12 transition-transform duration-300"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                {copied ? <span className="text-emerald-400 font-bold">Copied!</span> : <span>Copy Link</span>}
              </button>
              <button 
                className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl text-[10px] sm:text-xs font-extrabold flex items-center gap-1.5 sm:gap-2 bg-linear-to-r from-[#ff6c37] to-[#ff571e] text-white hover:brightness-110 active:scale-95 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 cursor-pointer border border-[#ff6c37]/25"
                onClick={copyInviteCode}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                Invite
              </button>
            </div>
          )}
        </div>
      </header>

  <div className="flex-1 flex overflow-hidden relative">
    {/* Hidden Audio Element */}
    {currentTrack?.audioUrl && (
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />
    )}

    {/* Left Switcher Sidebar */}
    <div className="w-12 md:w-20 border-r border-white/5 bg-zinc-950/40 backdrop-blur-md flex flex-col items-center py-4 md:py-6 gap-4 md:gap-6 shrink-0 z-20 select-none">
      <button
        onClick={() => handleSwitchMode("music")}
        className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 relative group cursor-pointer ${
          activeMode === "music"
            ? "bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20"
            : "text-zinc-500 hover:text-white hover:bg-white/5"
        }`}
        title="Music Player"
      >
        <Headphones className="w-4 h-4 md:w-5 md:h-5" />
        {activeMode === "music" && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 w-1 h-6 bg-[#ff6c37] rounded-r-md"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </button>

      <button
        onClick={() => handleSwitchMode("youtube")}
        className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 relative group cursor-pointer ${
          activeMode === "youtube"
            ? "bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20"
            : "text-zinc-500 hover:text-white hover:bg-white/5"
        }`}
        title="YouTube Watch Party"
      >
        <Youtube className="w-4 h-4 md:w-5 md:h-5" />
        {activeMode === "youtube" && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 w-1 h-6 bg-[#ff6c37] rounded-r-md"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </button>
    </div>

    {/* Dynamic Center Panel */}
    {activeMode === "music" ? (
      /* Center: Music Player */
      <div className="flex-1 flex flex-col relative z-10 select-none">
        <div className="absolute inset-0 opacity-15 blur-[150px] pointer-events-none hidden md:block" style={{ background: "radial-gradient(circle at center, rgba(255,108,55,0.4), transparent 75%)" }} />
        
        <div className="flex-1 flex flex-col items-center justify-center py-4 px-6 relative z-20 pb-24">
          {/* Rotating Vinyl Record Cover */}
          <div className={`relative mb-4 transition-all duration-700 ${player.isPlaying ? "scale-105" : "scale-100"}`}>
            {/* Glow backdrop */}
            <div className={`absolute -inset-8 bg-orange-500/5 rounded-full blur-3xl opacity-0 transition-opacity duration-1000 hidden md:block ${player.isPlaying ? "opacity-100 animate-pulse-glow" : ""}`} />
            
            {/* Rotating Vinyl Outer Disk */}
            <div className={`w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full bg-zinc-950 border-[6px] border-zinc-900 shadow-2xl relative flex items-center justify-center transition-transform ${player.isPlaying ? "animate-spin-slow shadow-orange-500/5" : ""}`}>
              {/* Vinyl Grooves (subtle concentric circles) */}
              <div className="absolute inset-2 rounded-full border border-white/5 opacity-40 pointer-events-none" />
              <div className="absolute inset-6 rounded-full border border-white/5 opacity-30 pointer-events-none" />
              <div className="absolute inset-10 rounded-full border border-white/5 opacity-25 pointer-events-none" />
              <div className="absolute inset-16 rounded-full border border-white/5 opacity-15 pointer-events-none" />
              <div className="absolute inset-24 rounded-full border border-white/5 opacity-10 pointer-events-none" />
              
              {/* Center Album Art */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden border-4 border-zinc-950 relative z-10 shrink-0 select-none">
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
          <div className="flex items-center justify-center gap-4 sm:gap-8">
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
      </div>
    ) : (
      /* Center YouTube Watch Party Player */
      <div className="flex-1 flex flex-col relative z-10 select-none pb-24 overflow-y-auto scrollbar-hide">
        <div className="absolute inset-0 opacity-10 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle at center, rgba(255,108,55,0.35), transparent 70%)" }} />
        
        {/* Top YouTube URL Input bar */}
        <div className="w-full max-w-4xl mx-auto mt-4 sm:mt-6 mb-4 px-4 relative z-20">
          <div className="glass p-2 sm:p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 border border-white/5 shadow-2xl">
            <input
              type="text"
              placeholder={
                (room.isHost || allowGuestControl)
                  ? "Paste YouTube link (e.g., watch?v=...)" 
                  : "Waiting for host to play a video..."
              }
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={!(room.isHost || allowGuestControl)}
              className="flex-1 bg-zinc-900 border border-white/5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/20 transition-all font-medium disabled:opacity-60"
            />
            {(room.isHost || allowGuestControl) && (
              <button
                onClick={handleStartWatchParty}
                className="py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl text-xs font-bold bg-linear-to-r from-[#ff6c37] to-[#ff571e] text-white hover:brightness-110 active:scale-95 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer border border-[#ff6c37]/25 shrink-0 text-center"
              >
                Start Watch Party
              </button>
            )}
          </div>
        </div>

        {/* Immersive Video Player Area */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 px-6 relative z-20">
          <div className="w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-black/60 group">
            {/* Visual Glow behind Player */}
            <div className={`absolute -inset-4 bg-orange-500/5 rounded-3xl blur-2xl opacity-0 transition-opacity duration-1000 ${videoIsPlaying ? "opacity-100 animate-pulse-glow" : ""}`} />

            {youtubeVideoId ? (
              <>
                <div id="youtube-iframe-player" className="w-full h-full relative z-10" />
                {/* Transparent click overlay to block direct player clicks for guests */}
                {!(room.isHost || allowGuestControl) && (
                  <div className="absolute inset-0 bg-transparent z-20 cursor-default" />
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-zinc-900/50 backdrop-blur-md select-none z-10">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-500 mb-4 shadow-lg shadow-black/40">
                  <Youtube size={32} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">YouTube Watch Party</h3>
                <p className="text-xs text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
                  {room.isHost 
                    ? "Paste a YouTube link in the input field above and click 'Start Watch Party' to begin synchronization."
                    : "Waiting for the host to select and start a watch party video."}
                </p>
              </div>
            )}
          </div>

          {/* Player Metadata & Custom Controls Bar */}
          {youtubeVideoId && (
            <div className="w-full max-w-4xl mt-6">
              {/* Track Info (Title & Channel) */}
              <div className="text-left mb-4 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-extrabold text-white font-display mb-0.5 sm:mb-1 tracking-tight truncate max-w-xs sm:max-w-lg md:max-w-2xl">{videoTitle || "Loading YouTube Video..."}</h2>
                  <p className="text-[11px] sm:text-xs text-[#ff6c37] font-bold tracking-wide truncate">{videoAuthor || "Syncora Watch Party"}</p>
                </div>

                {/* Control Access Toggle for Host / Indicator for Guest */}
                {room.isHost ? (
                  <div className="flex items-center gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-zinc-950/60 border border-white/5 shadow-lg shrink-0 select-none self-start sm:self-auto">
                    <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Guest Control</span>
                    <button
                      onClick={() => {
                        const nextVal = !allowGuestControl;
                        setAllowGuestControl(nextVal);
                        const socket = getSocket();
                        if (socket) {
                          socket.emit("video-toggle-control", { roomId, allowGuestControl: nextVal });
                        }
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer focus:outline-none ${
                        allowGuestControl ? "bg-[#ff6c37]" : "bg-zinc-800"
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-4 h-4 rounded-full bg-white shadow-md"
                        animate={{ x: allowGuestControl ? 16 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                ) : (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider shrink-0 select-none self-start sm:self-auto ${
                    allowGuestControl 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" 
                      : "bg-zinc-900/60 text-zinc-500 border-white/5"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${allowGuestControl ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                    {allowGuestControl ? "Control Enabled" : "Read Only"}
                  </div>
                )}
              </div>

              {/* Custom Controls Panel */}
              <div className="glass border border-white/5 p-3 sm:p-4 rounded-2xl flex flex-col gap-2.5 sm:gap-3 shadow-xl">
                {/* Timeline Seekbar and Time Indicators */}
                <div className="flex flex-col gap-1.5">
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 100}
                    value={videoPosition}
                    onChange={(e) => {
                      if (room.isHost || allowGuestControl) {
                        const newPos = Number(e.target.value);
                        setVideoPosition(newPos);
                        if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
                          ytPlayerRef.current.seekTo(newPos, true);
                        }
                        emitSync("video-seek", { videoId: youtubeVideoId, currentTime: newPos });
                      }
                    }}
                    className="seek-bar w-full"
                    disabled={!(room.isHost || allowGuestControl)}
                    style={{
                      background: `linear-gradient(to right, #ff6c37 0%, #ff6c37 ${(videoPosition / (videoDuration || 1)) * 100}%, rgba(255,255,255,0.08) ${(videoPosition / (videoDuration || 1)) * 100}%, rgba(255,255,255,0.08) 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-bold font-mono tracking-wider select-none">
                    <span>{formatTime(videoPosition)}</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                </div>

                {/* Controls (Play/Pause, Deafen, etc.) */}
                <div className="flex items-center justify-center pt-1">
                  <button
                    onClick={handleYtPlayPause}
                    disabled={!(room.isHost || allowGuestControl)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 focus:outline-none ${
                      (room.isHost || allowGuestControl)
                        ? "bg-white text-black hover:scale-105 active:scale-95 cursor-pointer" 
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                    title={videoIsPlaying ? "Pause Video" : "Play Video"}
                  >
                    {videoIsPlaying ? (
                      <Pause size={18} fill="currentColor" strokeWidth={0} />
                    ) : (
                      <Play size={18} fill="currentColor" className="ml-0.5" strokeWidth={0} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Floating Voice Controls overlays both players */}
    {roomType !== "SOLO" && (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-[90vw]">
        <div className="flex items-center gap-1.5 sm:gap-2.5 bg-zinc-950/85 backdrop-blur-md border border-white/5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-2xl">
          <button
            id="mic-toggle-btn"
            onClick={() => {
              if (!room.voiceConnected) room.setVoiceConnected(true);
              room.toggleMic();
            }}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer ${
              room.micMuted 
                ? "bg-red-500/10 text-red-400 border border-red-500/15" 
                : "bg-[#ff6c37]/10 text-[#ff6c37] border border-[#ff6c37]/15 hover:bg-[#ff6c37]/20"
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-3 sm:h-3">
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
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer ${
              room.isDeafened 
                ? "bg-red-500/10 text-red-400 border border-red-500/15 animate-pulse" 
                : "bg-zinc-800 text-zinc-300 border border-white/5 hover:bg-zinc-700"
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-3 sm:h-3">
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
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer ${
              room.voiceConnected 
                ? "bg-[#ff6c37]/10 text-[#ff6c37] border border-[#ff6c37]/15 hover:bg-[#ff6c37]/20" 
                : "bg-zinc-800 text-zinc-400 border border-white/5 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-3 sm:h-3">
              <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            {room.voiceConnected ? "Connected" : "Join"}
          </button>
        </div>
      </div>
    )}

    {/* Backdrop overlay for mobile drawer */}
    {showMobileChat && roomType !== "SOLO" && (
      <div 
        className="fixed inset-0 bg-black/55 z-30 md:hidden"
        onClick={() => setShowMobileChat(false)}
      />
    )}

    {/* Right Side: Dynamic Real-time Chat */}
    {roomType !== "SOLO" && (
      <aside className={`fixed md:relative inset-y-0 right-0 z-40 md:z-20 w-80 border-l border-white/5 bg-[#0b0c10]/95 md:bg-zinc-950/60 backdrop-blur-md flex flex-col shrink-0 h-full transition-transform duration-300 ${
        showMobileChat ? "translate-x-0" : "translate-x-full md:translate-x-0"
      }`}>
        {/* Chat Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 select-none">
          <div>
            <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider">Room Chat</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Messages are synchronized</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#ff6c37]/10 px-2 py-0.5 rounded-md border border-[#ff6c37]/10 text-[9px] font-bold text-[#ff6c37] uppercase">
              <span className="w-1.5 h-1.5 bg-[#ff6c37] rounded-full animate-pulse" />
              Live
            </div>
            {/* Close Chat button on mobile */}
            <button 
              onClick={() => setShowMobileChat(false)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Close Chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
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
    )}  </div>

      {/* Bottom Vignette Effect */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-[#ff6c37]/15 via-purple-600/5 to-transparent z-0" />
    </div>
  );
}
