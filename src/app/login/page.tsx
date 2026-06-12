"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check for errors in the URL redirect from NextAuth
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "OAuthAccountNotLinked") {
          setError("To confirm your identity, sign in with the same provider you used originally (e.g. Google).");
        } else if (err === "Configuration") {
          setError("Server authentication configuration error.");
        } else if (err === "AccessDenied") {
          setError("Access was denied by the security policies.");
        } else {
          setError("Authentication failed. Please check your credentials and try again.");
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);

    if (isSignUp) {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Signup failed.");
          setLoading(false);
          return;
        }

        setSuccess("Account created successfully! Logging you in...");

        // Automatically log in after successful signup
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setSuccess("Account created successfully! Please sign in below.");
          setIsSignUp(false);
          setPassword("");
        } else {
          window.location.href = "/dashboard";
        }
      } catch (err) {
        setError("Network error. Failed to create account.");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          if (signInResult.error.includes("UserNotFound") || signInResult.error.includes("CredentialsSignin")) {
            setError("No user found with this email, or incorrect password.");
          } else if (signInResult.error.includes("OAuthAccount")) {
            setError("This account uses Google Login. Please click 'Continue with Google'.");
          } else if (signInResult.error.includes("InvalidPassword")) {
            setError("Incorrect password. Please try again.");
          } else {
            setError("Failed to sign in. Please verify your credentials.");
          }
        } else {
          window.location.href = "/dashboard";
        }
      } catch (err) {
        setError("An error occurred during sign in.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full animate-float"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full animate-float"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
            filter: "blur(80px)",
            animationDelay: "2s",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-6">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <svg
                width="22"
                height="22"
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
            <span className="text-xl font-bold font-(family-name:--font-outfit) text-white">Syncora</span>
          </Link>
          <h1 className="text-4xl font-bold font-(family-name:--font-outfit) text-white mb-4">Listen Together,<br/><span className="gradient-text">Feel Together</span></h1>
          <p className="text-zinc-400 mt-2">
            Sign in to start listening with friends
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card p-8">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white text-gray-900 font-medium hover:bg-zinc-100 transition-colors mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5">
              <svg className="shrink-0 mt-0.5" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5">
              <svg className="shrink-0 mt-0.5" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Login / Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="transition-all duration-300">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Name
                </label>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 transition-all"
              />
            </div>
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || !email || !password || (isSignUp && !name)}
              className="btn-primary w-full py-3.5 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    {isSignUp ? "Create Account" : "Sign In"}
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Toggle signup/login state */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            {isSignUp ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-primary-400 hover:text-primary-300 font-medium cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to Syncora?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-primary-400 hover:text-primary-300 font-medium cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-zinc-600 mt-6">
          By signing in, you agree to our{" "}
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
