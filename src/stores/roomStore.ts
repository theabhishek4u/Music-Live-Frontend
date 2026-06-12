import { create } from "zustand";

export interface RoomMember {
  userId: string;
  userName: string;
  userImage: string | null;
  isMuted: boolean;
  isHost: boolean;
  isSpeaking: boolean;
  socketId?: string;
}

export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  type: "PRIVATE" | "FRIENDS" | "SOLO";
  hostId: string;
  hostName: string;
}

interface RoomState {
  // Current room
  currentRoom: Room | null;
  members: RoomMember[];
  isHost: boolean;
  isConnected: boolean;

  // Voice state
  voiceConnected: boolean;
  micMuted: boolean;
  isDeafened: boolean;

  // Actions
  setRoom: (room: Room) => void;
  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  setIsHost: (isHost: boolean) => void;
  setConnected: (connected: boolean) => void;
  setVoiceConnected: (connected: boolean) => void;
  toggleMic: () => void;
  toggleDeafen: () => void;
  setSpeaking: (userId: string, isSpeaking: boolean) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  members: [],
  isHost: false,
  isConnected: false,
  voiceConnected: false,
  micMuted: false,
  isDeafened: false,

  setRoom: (room) => set({ currentRoom: room }),
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((state) => ({
      members: [...state.members.filter((m) => m.userId !== member.userId), member],
    })),
  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),
  setIsHost: (isHost) => set({ isHost }),
  setConnected: (connected) => set({ isConnected: connected }),
  setVoiceConnected: (connected: boolean) => set({ voiceConnected: connected }),
  toggleMic: () => set((state) => ({ micMuted: !state.micMuted })),
  toggleDeafen: () => set((state) => ({ isDeafened: !state.isDeafened })),
  setSpeaking: (userId, isSpeaking) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, isSpeaking } : m
      ),
    })),
  leaveRoom: () =>
    set({
      currentRoom: null,
      members: [],
      isHost: false,
      isConnected: false,
      voiceConnected: false,
      micMuted: false,
      isDeafened: false,
    }),
}));
