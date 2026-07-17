'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Filter } from 'lucide-react';

export default function WorkersListPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await api.get('/workers');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Workers Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and verify industrial workers across Punjab.</p>
        </div>
        <Link href="/workers/new">
          <Button className="bg-navy hover:bg-gold text-white font-bold h-10 px-4 rounded-md">
            <Plus className="w-4 h-4 mr-2" />
            Register New Worker
          </Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search by CNIC or Name..." 
            className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-navy"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="border-gray-200 text-navy font-semibold w-full md:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-navy py-3">CNIC</TableHead>
              <TableHead className="font-bold text-navy py-3">Worker Name</TableHead>
              <TableHead className="font-bold text-navy py-3">Employer</TableHead>
              <TableHead className="font-bold text-navy py-3">Status</TableHead>
              <TableHead className="font-bold text-navy py-3">Date Registered</TableHead>
              <TableHead className="text-right font-bold text-navy py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500 font-medium">
                  Loading registry data...
                </TableCell>
              </TableRow>
            ) : workers.map((worker) => (
              <TableRow key={worker.id} className="hover:bg-navy/5 border-b border-gray-100 transition-colors cursor-pointer group" onClick={() => window.location.href = `/workers/${worker.id}`}>
                <TableCell className="font-mono font-medium text-navy">{worker.cnic}</TableCell>
                <TableCell className="font-semibold">{worker.full_name}</TableCell>
                <TableCell className="text-gray-600">{worker.employer_name || 'N/A'}</TableCell>
                <TableCell>
                  <StatusBadge status={worker.verification_status} />
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {worker.created_at ? new Date(worker.created_at).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/workers/${worker.id}`}>
                    <Button variant="outline" size="sm" className="border-gray-200 text-navy hover:text-gold hover:border-gold transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                      View Profile
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 1-10 of 5,432 entries</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="border-gray-200">Previous</Button>
            <Button variant="outline" size="sm" className="border-gray-200">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
