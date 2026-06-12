"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAdminData();
    }
  }, [session]);

  const fetchAdminData = async () => {
    try {
      // In MVP, we just pass userId in header. Real app uses JWT.
      const headers = { "x-user-id": session?.user?.id || "" };

      const [statsRes, usersRes, reportsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports`, { headers })
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        // Not admin
        router.push("/dashboard");
        return;
      }

      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setReports(await reportsRes.json());
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || ""
        },
        body: JSON.stringify({ role: newRole })
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/${reportId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || ""
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  if (status === "loading" || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-bold font-(family-name:--font-outfit) text-white mb-2">Admin Dashboard</h1>
        <p className="text-zinc-400">Manage platform analytics, users, and moderation queues.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/5 pb-px">
        {["overview", "users", "reports"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold text-sm transition-all relative ${
              activeTab === tab ? "text-primary-400" : "text-zinc-500 hover:text-white"
            }`}
          >
            <span className="capitalize">{tab}</span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full shadow-[0_0_10px_rgba(124,77,255,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Daily Active Users</h3>
            <p className="text-3xl font-bold text-accent-400">{stats.dau}</p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Active Rooms</h3>
            <p className="text-3xl font-bold text-green-400">{stats.activeRooms} <span className="text-sm text-zinc-500">/ {stats.totalRooms}</span></p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <h3 className="text-sm font-medium text-red-400 mb-2">Pending Reports</h3>
            <p className="text-3xl font-bold text-white relative z-10">{stats.totalReports}</p>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-800/50 border-b border-white/5 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold">Hosted</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                          {user.image && <img src={user.image} alt={user.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'ADMIN' ? 'bg-primary-500/20 text-primary-400' : user.role === 'MODERATOR' ? 'bg-amber-500/20 text-amber-400' : 'bg-surface-700 text-zinc-300'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.plan === 'PREMIUM' ? 'bg-accent-500/20 text-accent-400' : 'bg-surface-700 text-zinc-300'}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{user._count.hostedRooms}</td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'USER' ? (
                        <button onClick={() => updateRole(user.id, 'MODERATOR')} className="text-xs text-primary-400 hover:text-white transition-colors">Make Mod</button>
                      ) : user.role === 'MODERATOR' ? (
                        <button onClick={() => updateRole(user.id, 'USER')} className="text-xs text-zinc-400 hover:text-white transition-colors">Revoke Mod</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          {reports.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No reports found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-800/50 border-b border-white/5 text-zinc-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Reported User</th>
                    <th className="px-6 py-4 font-semibold">Reported By</th>
                    <th className="px-6 py-4 font-semibold">Reason</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{report.reported.name}</td>
                      <td className="px-6 py-4 text-zinc-500">{report.reporter.name}</td>
                      <td className="px-6 py-4">{report.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${report.status === 'PENDING' ? 'bg-red-500/20 text-red-400' : report.status === 'REVIEWED' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        {report.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => updateReportStatus(report.id, 'RESOLVED')} className="text-xs text-green-400 hover:text-white transition-colors">Resolve</button>
                            <button onClick={() => updateReportStatus(report.id, 'REVIEWED')} className="text-xs text-amber-400 hover:text-white transition-colors">Mark Reviewed</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
