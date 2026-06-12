"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Music,
  History,
  Settings,
  LogOut,
  CreditCard,
  Shield
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || null;

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
        { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
      ],
    },
  ];

  return (
    <div className="h-screen max-h-screen flex flex-col bg-[#070709] text-zinc-100 font-sans antialiased overflow-hidden">
      {/* Main Container */}
      <div className="flex flex-1 flex-row h-[calc(100vh-56px)] md:h-screen overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden md:flex w-64 bg-black flex-col shrink-0 border-r border-white/5 select-none">
          {/* Logo */}
          <div className="p-6 pb-2">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex-none flex items-center justify-center shadow-lg shadow-orange-500/10">
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

          {/* Sign Out Button */}
          <div className="p-4 border-t border-white/5 bg-black">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-zinc-900/10 overflow-y-auto h-full scrollbar-hide">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="flex md:hidden h-14 bg-zinc-950 border-t border-white/5 items-center justify-around z-50 select-none shrink-0">
        {navSections[0].items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
                isActive ? "text-[#ff6c37]" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {item.icon}
              <span className="scale-90">{item.label}</span>
            </Link>
          );
        })}
        {/* Mobile Settings Option */}
        <Link
          href="/dashboard/settings"
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
            pathname === "/dashboard/settings" ? "text-[#ff6c37]" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Settings size={18} />
          <span className="scale-90">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
