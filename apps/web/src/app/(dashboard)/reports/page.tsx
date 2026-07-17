'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#003366', '#C8A951', '#1D9E75', '#E6A817', '#C8202F', '#004080', '#6B7A8D', '#2C3E50'];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/analytics/summary');
        if (res?.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to load analytics', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3001/api/workers/export/csv', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workers_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">System Reports & Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-[400px] animate-pulse bg-gray-100" />
          <Card className="h-[400px] animate-pulse bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>Failed to load data.</div>;
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center print:hidden gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">System Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Live data visualizations of registry metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="border-navy text-navy">
            <Printer className="mr-2 h-4 w-4" /> Print PDF
          </Button>
          <Button onClick={handleExportCSV} className="bg-navy hover:bg-royal">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="hidden print:block mb-8 border-b-2 border-navy pb-4">
        <h1 className="text-2xl font-bold text-navy text-center uppercase tracking-wider">Government of Punjab — Confidential</h1>
        <h2 className="text-lg text-center mt-2">Workers Welfare Board — Industrial Worker Registry Analytics</h2>
        <p className="text-sm text-center text-gray-500 mt-2">Printed on: {new Date().toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-6">
        
        {/* Chart 1: Registration Trend */}
        <Card className="border-gray-200 shadow-sm print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-navy">Registration Trend (12 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="New Registrations" stroke="#003366" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Workers by District */}
        <Card className="border-gray-200 shadow-sm print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-navy">Top Districts by Worker Count</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDistrict} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="district" type="category" fontSize={12} width={80} />
                <Tooltip />
                <Bar dataKey="count" name="Workers" fill="#004080" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Verification Status by Dept */}
        <Card className="border-gray-200 shadow-sm lg:col-span-2 print:break-inside-avoid print:mt-10">
          <CardHeader>
            <CardTitle className="text-navy">Departmental Verification Pipeline</CardTitle>
            <CardDescription>Status of approvals per integrated government department</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDepartment} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="verified" name="Verified" stackId="a" fill="#1D9E75" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#E6A817" />
                <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#C8202F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Industry Breakdown */}
        <Card className="border-gray-200 shadow-sm print:break-inside-avoid print:w-[50%] print:mx-auto">
          <CardHeader>
            <CardTitle className="text-navy">Industry Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byIndustry}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="industry"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.byIndustry.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
