"use client";

import { useSession } from "next-auth/react";

export default function BillingDashboard() {
  const { data: session } = useSession();

  // In a full implementation, we would query the backend for user.plan
  // We'll mock it here.
  const currentPlan = "FREE";

  const handleUpgrade = () => {
    alert("Razorpay/Stripe Checkout Integration Coming Soon!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-(family-name:--font-outfit) text-white mb-4">Choose Your Vibe</h1>
        <p className="text-zinc-400 text-lg">Upgrade to Syncora Premium to unlock HD Voice, custom badges, and unlimited shared rooms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Tier */}
        <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col">
          {currentPlan === "FREE" && (
            <div className="absolute top-0 right-0 bg-white/10 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
              CURRENT PLAN
            </div>
          )}
          <h2 className="text-2xl font-bold text-white mb-2">Free Vibe</h2>
          <p className="text-zinc-400 mb-6">For casual listeners.</p>
          <div className="text-4xl font-bold text-white mb-8">₹0 <span className="text-lg text-zinc-500 font-normal">/ month</span></div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-zinc-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Solo listening
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Private room (2 users)
            </li>
            <li className="flex items-center gap-3 text-zinc-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Standard Voice Chat
            </li>
            <li className="flex items-center gap-3 text-zinc-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              Contains Ads
            </li>
          </ul>

          <button disabled className="w-full py-4 rounded-xl font-bold bg-surface-700 text-zinc-400 cursor-not-allowed">
            Active Plan
          </button>
        </div>

        {/* Premium Tier */}
        <div className="p-8 rounded-3xl border border-primary-500/50 relative overflow-hidden flex flex-col bg-linear-to-b from-primary-900/40 to-surface-900 glow-primary">
          <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl shadow-lg">
            POPULAR
          </div>
          <h2 className="text-2xl font-bold text-primary-400 mb-2">Premium Vibe</h2>
          <p className="text-primary-200/60 mb-6">For the ultimate party host.</p>
          <div className="text-4xl font-bold text-white mb-8">₹199 <span className="text-lg text-primary-200/40 font-normal">/ month</span></div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c4dff" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Unlimited Room Size
            </li>
            <li className="flex items-center gap-3 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c4dff" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              HD Voice Quality
            </li>
            <li className="flex items-center gap-3 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c4dff" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Advanced Playlists & Queue
            </li>
            <li className="flex items-center gap-3 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c4dff" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Zero Ads. Pure Music.
            </li>
          </ul>

          <button onClick={handleUpgrade} className="w-full py-4 rounded-xl font-bold bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 hover:scale-[1.02]">
            Upgrade to Premium
          </button>
        </div>
      </div>

      <div className="mt-12 glass p-6 rounded-2xl border border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Unlock Premium for Free</h3>
          <p className="text-sm text-zinc-400">Invite 3 friends to Syncora and get 7 days of Premium absolutely free!</p>
        </div>
        <button className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
          Get Invite Link
        </button>
      </div>
    </div>
  );
}
