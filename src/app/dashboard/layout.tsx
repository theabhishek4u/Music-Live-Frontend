"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Music, History, User, Settings, LogOut, Play, FastForward, Rewind, CreditCard, Shield } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || null;

  const navItems = [
    { label: "Home", href: "/dashboard", icon: <Home size={20} /> },
    { label: "Rooms", href: "/dashboard/rooms", icon: <Users size={20} /> },
    { label: "Playlists", href: "/dashboard/playlists", icon: <Music size={20} /> },
    { label: "History", href: "/dashboard/history", icon: <History size={20} /> },
    { label: "Billing", href: "/dashboard/billing", icon: <CreditCard size={20} /> },
    { label: "Admin", href: "/dashboard/admin", icon: <Shield size={20} /> },
    { label: "Profile", href: "/dashboard/profile", icon: <User size={20} /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen flex bg-surface-950">
      {/* Left Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 glass border-r border-white/5 flex flex-col z-40">
        <div className="p-6 pb-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            </div>
            <span className="text-xl font-bold font-(family-name:--font-outfit) text-white">Syncora</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-primary-500/10 text-primary-300 border border-primary-500/10" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            {userImage ? (
              <img src={userImage} alt={userName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-zinc-500 hover:text-red-400 transition-colors" title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 mr-80 overflow-y-auto h-screen scrollbar-hide">
        {children}
      </main>

      {/* Right Sidebar (Activity & Mini Player) */}
      <aside className="w-80 h-screen fixed right-0 top-0 glass border-l border-white/5 flex flex-col z-30">
        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-sm font-semibold font-(family-name:--font-outfit) text-white mb-4 uppercase tracking-wider">Active Friends</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center">
                    <User size={16} className="text-zinc-500" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-950" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Friend Name</p>
                  <p className="text-xs text-primary-400 truncate">Listening to The Weeknd</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-white/5 bg-surface-900/50">
          <div className="flex items-center gap-3 mb-4">
            <img src="https://picsum.photos/seed/track1/60/60" className="w-12 h-12 rounded-lg object-cover shadow-lg" alt="Cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">SoundHelix Song 1</p>
              <p className="text-xs text-zinc-400 truncate">T. Schürger</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-zinc-400">
            <button className="hover:text-white transition-colors"><Rewind size={18} /></button>
            <button className="w-10 h-10 rounded-full bg-white text-surface-950 flex items-center justify-center hover:scale-105 transition-transform">
              <Play size={18} className="ml-1" />
            </button>
            <button className="hover:text-white transition-colors"><FastForward size={18} /></button>
          </div>
        </div>
      </aside>
    </div>
  );
}
