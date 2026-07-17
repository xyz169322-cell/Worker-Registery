'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function EmployerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ total: 0, verified: 0, pending: 0 });
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/employers/dashboard');
        if (res.data?.success) {
          setMetrics(res.data.data.metrics);
          setBusinessName(res.data.data.businessName);
        }
      } catch (err) {
        console.error('Failed to fetch employer dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Security check
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'employer') {
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    fetchDashboard();
  }, [router]);

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-navy">Welcome, {businessName || 'Employer'}</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your workforce registration and compliance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-t-4 border-t-navy">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Registered Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-navy" />
                <span className="text-4xl font-bold text-navy">{metrics.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-green-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Verified & Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <span className="text-4xl font-bold text-navy">{metrics.verified}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-amber-500" />
              <span className="text-4xl font-bold text-navy">{metrics.pending}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mt-8">
        <Button 
          onClick={() => router.push('/employer/workers/new')}
          className="bg-navy hover:bg-gold text-white shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Register New Worker
        </Button>
        <Button 
          variant="outline" 
          onClick={() => router.push('/employer/workers')}
          className="border-navy text-navy"
        >
          View All Workers
        </Button>
      </div>
    </div>
  );
}
