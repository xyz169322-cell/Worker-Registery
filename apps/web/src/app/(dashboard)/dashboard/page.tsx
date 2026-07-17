'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Building2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentWorkers, setRecentWorkers] = useState<any[]>([]);
  const [pendingWorkers, setPendingWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, workersRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/workers')
        ]);

        if (statsRes.data?.success) {
          const s = statsRes.data.data;
          setStats({
            totalWorkers: s.totalWorkers,
            totalBusinesses: s.totalEmployers,
            pendingVerifications: s.verificationStats.pending,
            flaggedProfiles: s.verificationStats.flagged,
          });
        }

        if (workersRes.data?.success) {
          const all = workersRes.data.data;
          setRecentWorkers(all.slice(0, 5));
          setPendingWorkers(all.filter((w: any) => w.verification_status === 'pending').slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !stats) return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 rounded-md"></div>
        <div className="h-4 w-96 bg-slate-100 rounded-md"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl border border-slate-200"></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">High-level registry metrics and pending actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Workers</CardTitle>
            <div className="p-2 bg-navy/10 rounded-full">
              <Users className="w-5 h-5 text-navy" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{stats.totalWorkers.toLocaleString()}</div>
            <p className="text-xs text-verified font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-verified"></span> +142 this week
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Employers</CardTitle>
            <div className="p-2 bg-navy/10 rounded-full">
              <Building2 className="w-5 h-5 text-navy" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{stats.totalBusinesses.toLocaleString()}</div>
            <p className="text-xs text-gray-500 font-medium mt-1">Active establishments</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-t-4 border-t-pending bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending</CardTitle>
            <div className="p-2 bg-pending/10 rounded-full">
              <Clock className="w-5 h-5 text-pending" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{stats.pendingVerifications.toLocaleString()}</div>
            <p className="text-xs text-pending font-medium mt-1">Requires officer action</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-t-4 border-t-flagged bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Flagged</CardTitle>
            <div className="p-2 bg-flagged/10 rounded-full">
              <AlertTriangle className="w-5 h-5 text-flagged" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{stats.flaggedProfiles.toLocaleString()}</div>
            <p className="text-xs text-flagged font-medium mt-1">NADRA/FBR mismatch</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-gray-200 shadow-sm rounded-md col-span-1">
          <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg text-navy">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentWorkers.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentWorkers.map((w: any) => (
                  <div key={w.id} className="p-4 flex items-center justify-between hover:bg-navy/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/workers/${w.id}`}>
                    <div>
                      <p className="text-sm font-semibold text-navy">{w.full_name} <span className="font-mono text-gray-500 font-normal">({w.cnic})</span></p>
                      <p className="text-xs text-gray-500">Submitted by {w.employer_name || 'Individual'}</p>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {w.created_at ? new Date(w.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No recent activity.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm rounded-md col-span-1">
          <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg text-navy">Priority Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pendingWorkers.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {pendingWorkers.map((w: any) => (
                  <div key={w.id} className="p-4 flex items-center justify-between hover:bg-navy/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/workers/${w.id}`}>
                    <div>
                      <p className="text-sm font-semibold text-navy">{w.full_name}</p>
                      <p className="text-xs text-amber-600 font-semibold mt-0.5">Pending Verification</p>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {w.created_at ? new Date(w.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-600">You're all caught up!</p>
                <p className="text-sm mt-1">No urgent verification tasks assigned to you right now.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
