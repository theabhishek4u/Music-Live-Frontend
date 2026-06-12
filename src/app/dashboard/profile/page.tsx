"use client";

import { useSession } from "next-auth/react";
import { User, Edit3, Heart, Music, Clock } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "user@example.com";
  const userImage = session?.user?.image || null;

  return (
    <div className="p-8">
      {/* Header Profile Section */}
      <div className="relative mb-12">
        <div className="h-48 w-full rounded-3xl bg-linear-to-r from-primary-600/40 via-accent-600/20 to-surface-800 border border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-surface-950/20 backdrop-blur-xs" />
        </div>
        
        <div className="absolute -bottom-10 left-10 flex items-end gap-6">
          <div className="relative">
            {userImage ? (
              <img src={userImage} alt={userName} className="w-32 h-32 rounded-full object-cover border-4 border-surface-950 shadow-2xl" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-linear-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-surface-950 shadow-2xl">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-surface-800 border-2 border-surface-950 flex items-center justify-center text-white hover:bg-primary-500 transition-colors shadow-lg">
              <Edit3 size={18} />
            </button>
          </div>
          <div className="mb-2">
            <h1 className="text-4xl font-bold font-(family-name:--font-outfit) text-white">{userName}</h1>
            <p className="text-zinc-400">{userEmail} • Joined March 2024</p>
          </div>
        </div>
      </div>

      {/* Stats & Info */}
      <div className="grid lg:grid-cols-3 gap-6 mt-20">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold font-(family-name:--font-outfit) text-white mb-6">Listening Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-800/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <Clock className="text-primary-400 mb-2" size={24} />
                <span className="text-2xl font-bold text-white">128h</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Time Listened</span>
              </div>
              <div className="bg-surface-800/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <Music className="text-accent-400 mb-2" size={24} />
                <span className="text-2xl font-bold text-white">1,432</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Tracks Played</span>
              </div>
              <div className="bg-surface-800/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <Heart className="text-rose-400 mb-2" size={24} />
                <span className="text-2xl font-bold text-white">45</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Rooms Joined</span>
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold font-(family-name:--font-outfit) text-white">Top Tracks this Month</h2>
              <button className="text-sm text-primary-400 hover:text-primary-300">View All</button>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <span className="text-zinc-600 font-medium w-4">{i}</span>
                  <div className="w-12 h-12 rounded-lg bg-surface-700 overflow-hidden">
                    <img src={`https://picsum.photos/seed/profile${i}/60/60`} alt="Cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Blinding Lights {i}</p>
                    <p className="text-sm text-zinc-500">The Weeknd</p>
                  </div>
                  <span className="text-xs text-zinc-600">42 plays</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold font-(family-name:--font-outfit) text-white mb-6">Connected Accounts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-white">
                    <Music size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium">Spotify</p>
                    <p className="text-xs text-[#1DB954]">Connected</p>
                  </div>
                </div>
                <button className="text-sm text-zinc-400 hover:text-white">Disconnect</button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.33-.35-.76-.53-1.09a.09.09 0 0 0-.07-.03c-1.5.26-2.94.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95.01.02.02.04.04.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06-.01.07-.03.4-.55.77-1.13 1.1-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.03.02.03.08-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.33.61.7 1.19 1.1 1.74.02.02.05.04.07.03 1.71-.53 3.44-1.33 5.24-2.65.02-.01.03-.03.04-.05.42-4.46-.71-8.38-3.13-11.97-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12z"/></svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Discord</p>
                    <p className="text-xs text-zinc-500">Not connected</p>
                  </div>
                </div>
                <button className="text-sm text-primary-400 hover:text-primary-300">Connect</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
