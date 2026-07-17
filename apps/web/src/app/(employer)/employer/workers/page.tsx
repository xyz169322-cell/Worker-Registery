'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export default function EmployerWorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await api.get('/employers/workers');
        if (res.data?.success) {
          setWorkers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch workers', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkers();
  }, []);

  const filtered = workers.filter(w => 
    w.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    w.cnic?.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">My Workers</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage employees registered under your business.</p>
        </div>
        <Button 
          onClick={() => router.push('/employer/workers/new')}
          className="bg-navy hover:bg-gold text-white shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Worker
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-100 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search by name or CNIC..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Worker Details</th>
                  <th className="px-6 py-4 font-semibold">Job Title</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading your workers...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No workers found.</td></tr>
                ) : (
                  filtered.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-navy">{worker.full_name}</div>
                        <div className="text-gray-500 text-xs mt-1">{worker.cnic}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{worker.job_title || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          worker.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                          worker.verification_status === 'flagged' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {worker.verification_status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {worker.created_at ? format(new Date(worker.created_at), 'MMM dd, yyyy') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
