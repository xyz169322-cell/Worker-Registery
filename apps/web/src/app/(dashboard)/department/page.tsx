'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Search, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export default function DepartmentDashboard() {
  const router = useRouter();
  const [department, setDepartment] = useState<string>('Department');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [queue, setQueue] = useState<any[]>([]);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/verifications/pending');
      const payload = res.data;
      if (payload.success) {
        setMetrics({
          pending: payload.data.pendingCount,
          approved: payload.data.approvedToday,
          rejected: payload.data.rejectedToday
        });
        setQueue(payload.data.queue);
      }
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.role !== 'dept_officer') {
          router.push('/dashboard');
          return;
        }
        setDepartment(user.department || 'Department');
        fetchQueue().finally(() => setLoading(false));
      } catch (err) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleAction = async (workerId: string, status: 'approved' | 'rejected') => {
    setSubmitting(workerId);
    try {
      await api.post(`/verifications/worker/${workerId}`, {
        status,
        remarks: status === 'approved' ? 'Cleared by department' : 'Flagged for review'
      });
      // Refresh the queue
      await fetchQueue();
    } catch (error) {
      console.error(`Failed to ${status} worker:`, error);
      alert(`An error occurred while trying to ${status} the record.`);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-navy text-white p-8 rounded-lg shadow-md relative overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[40%] h-[150%] bg-gold/10 rotate-12 blur-2xl" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border-2 border-gold shadow-lg backdrop-blur-sm">
            <span className="text-2xl font-bold text-gold font-urdu">پ</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{department} Portal</h1>
            <p className="text-blue-100 mt-2 text-lg">
              Welcome to your dedicated verification dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-amber-500" />
              <span className="text-4xl font-bold text-navy">{metrics.pending}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Awaiting your department's review</p>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-green-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Verified Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <span className="text-4xl font-bold text-navy">{metrics.approved}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Successfully cleared</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="text-4xl font-bold text-navy">{metrics.rejected}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Requires follow-up</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
          <CardTitle className="text-navy flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gold" />
            My Verification Queue
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchQueue} className="text-navy border-navy">
            Refresh Queue
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {queue.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy">All Caught Up!</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                There are no workers currently awaiting clearance from the {department}. New applications will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Worker Details</th>
                    <th className="px-6 py-4 font-semibold">Job Title</th>
                    <th className="px-6 py-4 font-semibold">Applied On</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {queue.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-navy">{worker.full_name}</div>
                        <div className="text-gray-500 text-xs mt-1">CNIC: {worker.cnic}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{worker.job_title || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {worker.created_at ? format(new Date(worker.created_at), 'MMM dd, yyyy') : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-green-600 text-green-700 hover:bg-green-50"
                            disabled={submitting === worker.id}
                            onClick={() => handleAction(worker.id, 'approved')}
                          >
                            {submitting === worker.id ? '...' : 'Approve'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-600 text-red-700 hover:bg-red-50"
                            disabled={submitting === worker.id}
                            onClick={() => handleAction(worker.id, 'rejected')}
                          >
                            {submitting === worker.id ? '...' : 'Reject'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
