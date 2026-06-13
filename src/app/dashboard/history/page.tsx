import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { History, Play, Users, Clock } from "lucide-react";

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Clean up visits older than 24 hours in the background
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.roomVisit.deleteMany({
    where: {
      visitedAt: { lt: oneDayAgo }
    }
  }).catch(e => console.error("History page visit cleanup error:", e));

  // Fetch all recent room visits for this user
  const visits = await prisma.roomVisit.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          host: true,
          participants: {
            include: {
              user: true
            }
          }
        }
      }
    },
    orderBy: { visitedAt: "desc" }
  });

  if (visits.length === 0) {
    return (
      <div className="p-4 sm:p-8 h-full flex flex-col items-center justify-center select-none text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#121216] border border-white/5 flex items-center justify-center mb-6">
          <History size={32} className="text-zinc-500" />
        </div>
        <h1 className="text-2xl font-bold font-display text-white mb-2">No Room History</h1>
        <p className="text-zinc-400 mb-8 max-w-sm">Rooms you join or create will appear here for 24 hours.</p>
        <Link 
          href="/dashboard" 
          className="px-6 py-3 bg-[#ff6c37] hover:bg-[#ff571e] text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-orange-500/10 active:scale-95 cursor-pointer"
        >
          Explore Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12 px-4 md:px-8 select-none">
      {/* Top Bar */}
      <header className="h-16 flex items-center justify-between mb-8 sticky top-0 bg-[#070709]/80 backdrop-blur-md z-30 pt-4 pb-2 border-b border-white/3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#ff6c37]/10 flex items-center justify-center">
            <History size={16} className="text-[#ff6c37]" />
          </div>
          <h1 className="text-xl font-bold font-display text-white tracking-tight">Room History</h1>
        </div>
      </header>

      {/* Grid of room visits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {visits.map((visit) => {
          const isRoomActive = visit.room.isActive;
          const participants = visit.room.participants;
          
          return (
            <div 
              key={visit.id}
              className="bg-[#121216] border border-white/5 hover:border-[#ff6c37]/30 transition-all duration-300 p-5 rounded-3xl relative group flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[#ff6c37]/5"
            >
              <div>
                {/* Time ago and Active status */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-wider flex items-center gap-1.5">
                    <Clock size={10} />
                    {formatTimeAgo(visit.visitedAt)}
                  </span>
                  
                  {isRoomActive ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-extrabold tracking-wide uppercase flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-white/5 font-extrabold tracking-wide uppercase">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Room Info */}
                <h3 className="text-base font-bold text-white mb-1 truncate font-display tracking-tight group-hover:text-[#ff6c37] transition-colors">
                  {visit.room.roomName}
                </h3>
                <p className="text-[11px] text-zinc-500 font-semibold mb-6 flex items-center gap-1 truncate">
                  <span>Host: {visit.room.host.name || "Unknown"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 shrink-0" />
                  <span className="uppercase text-[9px] px-1 bg-white/5 border border-white/5 rounded text-zinc-400 font-bold tracking-wider shrink-0">{visit.room.roomType}</span>
                </p>
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between pt-4 border-t border-white/3 mt-2">
                {/* Active participants stack */}
                <div className="flex items-center gap-1">
                  {participants.length > 0 ? (
                    <div className="flex -space-x-2 overflow-hidden">
                      {participants.slice(0, 3).map((p) => (
                        <div key={p.id} className="relative inline-block" title={p.user.name || "Member"}>
                          {p.user.image ? (
                            <img 
                              src={p.user.image} 
                              alt={p.user.name || "Member"} 
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-[#121216] object-cover border border-white/10"
                            />
                          ) : (
                            <div className="flex h-6 w-6 rounded-full bg-zinc-850 ring-2 ring-[#121216] items-center justify-center text-white text-[9px] font-bold border border-white/10">
                              {(p.user.name || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                      {participants.length > 3 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-zinc-400 ring-2 ring-[#121216] border border-white/10 shrink-0">
                          +{participants.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-bold italic">Empty room</span>
                  )}
                  {participants.length > 0 && (
                    <span className="text-[10px] text-zinc-500 font-bold ml-1.5 flex items-center gap-1 shrink-0">
                      <Users size={10} />
                      {participants.length} joined
                    </span>
                  )}
                </div>

                {/* Rejoin link */}
                <Link
                  href={`/room/${visit.roomId}?name=${encodeURIComponent(visit.room.roomName)}&type=${visit.room.roomType}`}
                  className="py-1.5 px-3 rounded-lg text-[10px] font-extrabold flex items-center gap-1 bg-[#ff6c37]/10 hover:bg-[#ff6c37] text-[#ff6c37] hover:text-white transition-all cursor-pointer border border-[#ff6c37]/15 group-hover:scale-102 active:scale-98"
                >
                  <Play size={10} fill="currentColor" strokeWidth={0} />
                  Rejoin
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
