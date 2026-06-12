import { Music } from "lucide-react";

export default function PlaylistsPage() {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-6">
        <Music size={32} className="text-primary-400" />
      </div>
      <h1 className="text-3xl font-bold font-(family-name:--font-outfit) text-white mb-2">My Playlists</h1>
      <p className="text-zinc-400 mb-8 max-w-md text-center">Your personalized collection of vibes. Create and share playlists with your friends.</p>
      <button className="btn-primary">Create Playlist</button>
    </div>
  );
}
