"use client";

import { useState } from "react";
import { Settings, Volume2, Mic, Globe, Bell, Shield, Key } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("audio");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-(family-name:--font-outfit) text-white mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your account, preferences, and connected devices.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            <button onClick={() => setActiveTab("audio")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "audio" ? "bg-primary-500/10 text-primary-300 border border-primary-500/20" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
              <Volume2 size={18} /> Audio & Voice
            </button>
            <button onClick={() => setActiveTab("account")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "account" ? "bg-primary-500/10 text-primary-300 border border-primary-500/20" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
              <Settings size={18} /> Account
            </button>
            <button onClick={() => setActiveTab("privacy")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "privacy" ? "bg-primary-500/10 text-primary-300 border border-primary-500/20" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
              <Shield size={18} /> Privacy
            </button>
            <button onClick={() => setActiveTab("notifications")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "notifications" ? "bg-primary-500/10 text-primary-300 border border-primary-500/20" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
              <Bell size={18} /> Notifications
            </button>
          </nav>
        </aside>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {activeTab === "audio" && (
            <>
              <section className="glass-card p-6">
                <h2 className="text-lg font-semibold font-(family-name:--font-outfit) text-white mb-6">Playback Quality</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Streaming Quality</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-white focus:outline-none focus:border-primary-500/30 transition-all">
                      <option value="auto">Auto (Recommended)</option>
                      <option value="high">High (320kbps)</option>
                      <option value="normal">Normal (160kbps)</option>
                      <option value="low">Data Saver (96kbps)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-white">Normalize Volume</p>
                      <p className="text-xs text-zinc-500 mt-1">Set the same volume level for all tracks</p>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-primary-500 relative transition-colors">
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              </section>

              <section className="glass-card p-6">
                <h2 className="text-lg font-semibold font-(family-name:--font-outfit) text-white mb-6">Input Devices</h2>
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2"><Mic size={16} /> Microphone</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-white focus:outline-none focus:border-primary-500/30 transition-all">
                      <option value="default">Default - MacBook Pro Microphone</option>
                      <option value="ext">External USB Microphone</option>
                    </select>
                  </div>
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Input Volume</label>
                    <input type="range" min="0" max="100" defaultValue="75" className="seek-bar w-full" />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-white">Noise Suppression</p>
                      <p className="text-xs text-zinc-500 mt-1">Filter out background noise during voice chat</p>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-primary-500 relative transition-colors">
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "account" && (
            <section className="glass-card p-6">
              <h2 className="text-lg font-semibold font-(family-name:--font-outfit) text-white mb-6">Account Details</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Display Name</label>
                  <input type="text" defaultValue="User" className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-white focus:outline-none focus:border-primary-500/30 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
                  <input type="email" defaultValue="user@example.com" disabled className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/5 text-zinc-500 opacity-70 cursor-not-allowed" />
                  <p className="text-xs text-zinc-500 mt-2">Email is linked to your Google account.</p>
                </div>
                <div className="pt-4 flex justify-end">
                  <button className="btn-primary">Save Changes</button>
                </div>
              </div>
            </section>
          )}

          {(activeTab === "privacy" || activeTab === "notifications") && (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <Globe size={32} className="text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
              <p className="text-zinc-400">These settings are not available in the current MVP.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
