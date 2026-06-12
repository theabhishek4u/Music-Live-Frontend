import { Users } from "lucide-react";

export default function RoomsPage() {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-6">
        <Users size={32} className="text-primary-400" />
      </div>
      <h1 className="text-3xl font-bold font-(family-name:--font-outfit) text-white mb-2">My Rooms</h1>
      <p className="text-zinc-400 mb-8 max-w-md text-center">Manage all the active and past listening rooms you've created or joined.</p>
    </div>
  );
}
