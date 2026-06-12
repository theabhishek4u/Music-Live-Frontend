import { useEffect, useRef, useState, useCallback } from "react";
import { useRoomStore } from "@/stores/roomStore";
import { getSocket } from "@/lib/socket";

export function useWebRTC(roomId: string, userId: string) {
  const room = useRoomStore();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peersRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const remoteAudioRefs = useRef<{ [socketId: string]: HTMLAudioElement }>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize WebRTC
  const initWebRTC = useCallback(async () => {
    if (!room.voiceConnected) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      setLocalStream(stream);
      
      // Mute local track based on room store state
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !room.micMuted;
      });

      const socket = getSocket();
      socket.emit("room:request-voice-peers", { roomId });
    } catch (err) {
      console.error("Failed to get local media", err);
      room.setVoiceConnected(false);
    }
  }, [roomId, room.voiceConnected, room.micMuted]);

  // Clean up WebRTC
  const cleanupWebRTC = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
    
    Object.values(remoteAudioRefs.current).forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    remoteAudioRefs.current = {};

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit("webrtc:leave", { roomId });
    }
  }, [localStream, roomId]);

  // Handle mic toggle
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !room.micMuted;
      });
    }
  }, [room.micMuted, localStream]);

  // Handle deafen mode
  useEffect(() => {
    Object.values(remoteAudioRefs.current).forEach((audio) => {
      audio.muted = room.isDeafened;
    });
  }, [room.isDeafened]);

  // Toggle voice connection
  useEffect(() => {
    if (room.voiceConnected) {
      initWebRTC();
    } else {
      cleanupWebRTC();
    }
    return () => {
      if (!room.voiceConnected) {
        cleanupWebRTC();
      }
    };
  }, [room.voiceConnected]);

  // Socket signaling events
  useEffect(() => {
    if (!room.voiceConnected || !localStream) return;
    
    const socket = getSocket();
    
    const createPeer = (targetSocketId: string, initiator: boolean) => {
      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" }
        ],
      });

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            roomId,
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      peer.ontrack = (event) => {
        if (!remoteAudioRefs.current[targetSocketId]) {
          const audio = new Audio();
          audio.autoplay = true;
          audio.muted = room.isDeafened;
          audio.srcObject = event.streams[0];
          remoteAudioRefs.current[targetSocketId] = audio;
          
          // Speaking indicator using Web Audio API
          audio.addEventListener("playing", () => {
             if (!audioContextRef.current) {
               audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
             }
             
             try {
               const source = audioContextRef.current.createMediaStreamSource(event.streams[0]);
               const analyzer = audioContextRef.current.createAnalyser();
               analyzer.fftSize = 512;
               analyzer.smoothingTimeConstant = 0.1;
               source.connect(analyzer);
               
               const dataArray = new Uint8Array(analyzer.frequencyBinCount);
               
               const checkAudioLevel = () => {
                 if (!remoteAudioRefs.current[targetSocketId]) return;
                 analyzer.getByteFrequencyData(dataArray);
                 
                 let sum = 0;
                 for (let i = 0; i < dataArray.length; i++) {
                   sum += dataArray[i];
                 }
                 const average = sum / dataArray.length;
                 
                 const isSpeaking = average > 10; // Threshold for speaking
                 
                 // If speaking state changes, notify the room
                 // For now we will rely on socket speaking events for peer state
                 if (isSpeaking) {
                    // Send socket speaking event
                    socket.emit('speaking', { roomId, userId, isSpeaking: true });
                 }
                 
                 requestAnimationFrame(checkAudioLevel);
               };
               
               checkAudioLevel();
             } catch (e) {
               console.error("Audio Context error:", e);
             }
          });
        }
      };

      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
      });

      return peer;
    };

    const handleVoicePeers = async ({ peerSocketIds }: { peerSocketIds: string[] }) => {
      for (const targetSocketId of peerSocketIds) {
        if (targetSocketId === socket.id) continue;
        const peer = createPeer(targetSocketId, true);
        peersRef.current[targetSocketId] = peer;
        
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("webrtc:offer", { roomId, targetSocketId, offer });
      }
    };

    const handleOffer = async ({ fromSocketId, offer }: { fromSocketId: string, offer: RTCSessionDescriptionInit }) => {
      const peer = createPeer(fromSocketId, false);
      peersRef.current[fromSocketId] = peer;
      
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("webrtc:answer", { roomId, targetSocketId: fromSocketId, answer });
    };

    const handleAnswer = async ({ fromSocketId, answer }: { fromSocketId: string, answer: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current[fromSocketId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ fromSocketId, candidate }: { fromSocketId: string, candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current[fromSocketId];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handlePeerLeft = ({ socketId }: { socketId: string }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      if (remoteAudioRefs.current[socketId]) {
        remoteAudioRefs.current[socketId].pause();
        remoteAudioRefs.current[socketId].srcObject = null;
        delete remoteAudioRefs.current[socketId];
      }
    };

    socket.on("webrtc:voice-peers", handleVoicePeers);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);
    socket.on("webrtc:peer-left", handlePeerLeft);

    return () => {
      socket.off("webrtc:voice-peers", handleVoicePeers);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
      socket.off("webrtc:peer-left", handlePeerLeft);
    };
  }, [room.voiceConnected, localStream, roomId]);

  return { localStream };
}
