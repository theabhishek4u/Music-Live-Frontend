"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ===== ANIMATED BACKGROUND ORB COMPONENT ===== */
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large purple orb */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full animate-float"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Cyan orb */}
      <div
        className="absolute top-1/3 -right-48 w-[500px] h-[500px] rounded-full animate-float"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
          animationDelay: "1.5s",
        }}
      />
      {/* Bottom orb */}
      <div
        className="absolute -bottom-48 left-1/3 w-[700px] h-[700px] rounded-full animate-float"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
          filter: "blur(100px)",
          animationDelay: "3s",
        }}
      />
    </div>
  );
}

/* ===== EQUALIZER ANIMATION ===== */
function Equalizer() {
  return (
    <div className="flex items-end gap-[3px] h-5">
      <div className="eq-bar" />
      <div className="eq-bar" />
      <div className="eq-bar" />
      <div className="eq-bar" />
      <div className="eq-bar" />
    </div>
  );
}

/* ===== FEATURE CARD ===== */
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="glass-card p-6 opacity-0 animate-slide-up"
      style={{ animationDelay: delay, animationFillMode: "forwards" }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 text-primary-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 font-(family-name:--font-outfit)">
        {title}
      </h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

/* ===== NAV BAR ===== */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="text-xl font-bold font-(family-name:--font-outfit) text-white">
            Syncora
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="#experience"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Experience
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="btn-secondary text-sm py-2.5 px-5 hidden sm:block"
          >
            Log In
          </Link>
          <Link
            href="/login"
            className="btn-primary text-sm py-2.5 px-5 relative z-10"
          >
            <span className="relative z-10">Get Started</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ===== LANDING PAGE ===== */
export default function LandingPage() {
  return (
    <main className="relative">
      <BackgroundOrbs />
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/5 mb-8 animate-fade-in">
            <Equalizer />
            <span className="text-sm text-primary-300 font-medium">
              Real-Time Social Music
            </span>
          </div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold font-(family-name:--font-outfit) leading-[1.05] tracking-tight mb-6"
          >
            <span className="text-white">Listen Together,</span>
            <br />
            <span className="gradient-text">Feel Together</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Create a room, invite your friends, and experience music in perfect
            sync — with built-in voice chat so you never miss a beat or a
            conversation.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login" passHref legacyBehavior>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-base py-3.5 px-8 glow-primary relative z-10 flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Start Listening Free
                </span>
              </motion.a>
            </Link>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary text-base py-3.5 px-8 flex items-center gap-2"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              See How It Works
            </motion.a>
          </motion.div>

          {/* Hero visual - floating music player mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="glass-card p-1 rounded-2xl glow-primary">
              <div className="bg-surface-900/80 rounded-xl p-6">
                {/* Mock player bar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-linear-to-br from-primary-600 to-accent-500 shrink-0 flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white text-base">
                      Blinding Lights
                    </p>
                    <p className="text-sm text-zinc-400">The Weeknd</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400 font-medium">
                        2 listening
                      </span>
                    </div>
                  </div>
                  <Equalizer />
                </div>

                {/* Mock seek bar */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-8 text-right">
                    1:42
                  </span>
                  <div className="flex-1 h-1 bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary-500 to-accent-500 rounded-full"
                      style={{ width: "45%" }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-8">3:20</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm text-primary-400 font-medium tracking-wider uppercase">
              Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-(family-name:--font-outfit) text-white mt-3">
              Everything You Need to
              <br />
              <span className="gradient-text">Vibe Together</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              }
              title="Perfect Sync"
              description="Music stays synchronized within 300ms. When the host plays, pauses, or seeks — everyone follows instantly."
              delay="0ms"
            />
            <FeatureCard
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              }
              title="Voice Chat"
              description="Built-in HD voice chat powered by WebRTC. Talk, laugh, and react while listening — no separate apps needed."
              delay="100ms"
            />
            <FeatureCard
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              title="Private Rooms"
              description="Create invite-only rooms with unique codes. Share a link and your friends join in seconds."
              delay="200ms"
            />
            <FeatureCard
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="5.5" cy="17.5" r="2.5" />
                  <circle cx="17.5" cy="15.5" r="2.5" />
                  <path d="M8 17V5l12-2v12" />
                </svg>
              }
              title="Premium Player"
              description="A Spotify-grade music player with play, pause, seek, volume, repeat, shuffle, and queue management."
              delay="300ms"
            />
            <FeatureCard
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
              title="Instant Search"
              description="Search millions of songs, artists, and albums. Find what you want and start playing in seconds."
              delay="400ms"
            />
            <FeatureCard
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              }
              title="All Devices"
              description="Works beautifully on desktop, tablet, and mobile. Your room, your rules, anywhere you go."
              delay="500ms"
            />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section id="how-it-works" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm text-accent-400 font-medium tracking-wider uppercase">
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-(family-name:--font-outfit) text-white mt-3">
              Three Steps to
              <br />
              <span className="gradient-text">Start Vibing</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create a Room",
                description:
                  "Sign in with Google and create a private listening room in one click. Get a unique invite link.",
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Invite Friends",
                description:
                  "Share your room link or code. Friends join instantly — no sign-up friction, just click and enter.",
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Listen & Talk",
                description:
                  "Play any song — it syncs for everyone. Voice chat is built-in, so just vibe together.",
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                ),
              },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group">
                {/* Step number */}
                <div className="text-6xl font-bold font-(family-name:--font-outfit) text-surface-700 absolute -top-4 left-1/2 -translate-x-1/2 select-none group-hover:text-primary-900/30 transition-colors">
                  {item.step}
                </div>
                <div className="relative pt-12">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-600/20 to-accent-500/20 border border-primary-500/10 flex items-center justify-center mx-auto mb-5 text-primary-400 group-hover:scale-110 group-hover:border-primary-500/30 transition-all">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 font-(family-name:--font-outfit)">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EXPERIENCE SECTION ===== */}
      <section id="experience" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 md:p-14 text-center relative overflow-hidden">
            {/* Background gradient inside card */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse at top, rgba(139,92,246,0.2), transparent 60%)",
              }}
            />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold font-(family-name:--font-outfit) text-white mb-5">
                Ready to <span className="gradient-text">Sync Up?</span>
              </h2>
              <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
                Join thousands of music lovers who are already listening
                together. Create your first room in under 30 seconds.
              </p>
              <Link
                href="/login"
                className="btn-primary text-base py-3.5 px-10 glow-primary relative z-10 inline-flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Get Started — It&apos;s Free
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="font-semibold font-(family-name:--font-outfit) text-white">
              Syncora
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Syncora. Listen Together, Feel
            Together.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
