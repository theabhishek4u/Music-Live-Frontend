import { create } from "zustand";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail: string;
  audioUrl?: string;
}

interface PlayerState {
  // Current track
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;

  // Playback state
  isPlaying: boolean;
  position: number;
  volume: number;
  isMuted: boolean;
  isRepeat: boolean;
  isShuffle: boolean;

  // Actions
  setTrack: (track: Track) => void;
  setQueue: (queue: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (position: number) => void;
  setPosition: (position: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  position: 0,
  volume: 75,
  isMuted: false,
  isRepeat: false,
  isShuffle: false,

  setTrack: (track) =>
    set({ currentTrack: track, position: 0, isPlaying: true }),

  setQueue: (queue, startIndex = 0) =>
    set({
      queue,
      queueIndex: startIndex,
      currentTrack: queue[startIndex] || null,
      position: 0,
      isPlaying: true,
    }),

  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),

  removeFromQueue: (index) =>
    set((state) => {
      const newQueue = [...state.queue];
      newQueue.splice(index, 1);
      return { queue: newQueue };
    }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  next: () => {
    const { queue, queueIndex, isShuffle, isRepeat } = get();
    if (queue.length === 0) return;

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (queueIndex < queue.length - 1) {
      nextIndex = queueIndex + 1;
    } else if (isRepeat) {
      nextIndex = 0;
    } else {
      return; // End of queue
    }

    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      position: 0,
      isPlaying: true,
    });
  },

  prev: () => {
    const { queue, queueIndex, position } = get();
    if (position > 3) {
      set({ position: 0 });
      return;
    }
    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      set({
        queueIndex: prevIndex,
        currentTrack: queue[prevIndex],
        position: 0,
        isPlaying: true,
      });
    }
  },

  seek: (position) => set({ position }),
  setPosition: (position) => set({ position }),
  setVolume: (volume) => set({ volume, isMuted: false }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
}));
