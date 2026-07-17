'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, User, Building2, CreditCard, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const res = await api.get(`/workers/${id}`);
        if (res.data?.success) {
          setWorker(res.data.data);
        } else {
          router.push('/workers');
        }
      } catch (err) {
        console.error('Failed to fetch worker details', err);
        router.push('/workers');
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 font-medium">Loading worker profile...</div>
      </div>
    );
  }

  if (!worker) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/workers')} className="h-10 w-10 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-navy">{worker.full_name}</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{worker.cnic}</p>
          </div>
        </div>
        <StatusBadge status={worker.verification_status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <Card className="shadow-sm border-t-4 border-t-navy">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <User className="w-5 h-5 text-navy" />
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Full Name" value={worker.full_name} />
              <InfoField label="CNIC Number" value={worker.cnic} isMono />
              <InfoField label="Phone Number" value={worker.phone} isMono />
              <InfoField label="District" value={worker.district || '-'} />
              <div className="md:col-span-2">
                <InfoField label="Home Address" value={worker.address || '-'} />
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card className="shadow-sm border-t-4 border-t-gold">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Building2 className="w-5 h-5 text-gold" />
              <CardTitle className="text-lg">Employment Data</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Employer Name" value={worker.employer_name || 'Not linked to business'} />
              <InfoField label="Employer NTN" value={worker.employer_ntn || '-'} isMono />
              <InfoField label="Job Title" value={worker.job_title || '-'} />
              <InfoField label="Designation" value={worker.designation || '-'} />
              <InfoField label="Pay Scale" value={worker.pay_scale ? `Rs. ${worker.pay_scale}` : '-'} />
              <InfoField label="Date of Joining" value={worker.date_of_joining ? format(new Date(worker.date_of_joining), 'PP') : '-'} />
            </CardContent>
          </Card>

          {/* Financials */}
          <Card className="shadow-sm border-t-4 border-t-green-600">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Payment Mode" value={worker.payment_mode?.toUpperCase()} />
              <InfoField label="Bank Name" value={worker.bank_name || '-'} />
              <InfoField label="Account Number / IBAN" value={worker.bank_account || '-'} isMono />
              <InfoField label="EOBI Number" value={worker.eobi_number || '-'} isMono />
              <InfoField label="Social Security Number" value={worker.social_security_no || '-'} isMono />
            </CardContent>
          </Card>

        </div>

        {/* Right Column (Verification Timeline) */}
        <div className="space-y-6">
          <Card className="shadow-sm border-gray-200 sticky top-24">
            <CardHeader className="flex flex-row items-center gap-2 pb-2 bg-gray-50 border-b border-gray-100 rounded-t-lg">
              <Activity className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg">Verification History</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {worker.verifications && worker.verifications.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {worker.verifications.map((v: any, i: number) => (
                    <div key={v.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      
                      {/* Timeline Dot */}
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                        v.status === 'verified' ? 'border-green-500' :
                        v.status === 'flagged' ? 'border-red-500' : 'border-amber-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          v.status === 'verified' ? 'bg-green-500' :
                          v.status === 'flagged' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                      </div>
                      
                      {/* Timeline Card */}
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-navy text-sm uppercase tracking-wide">{v.department}</div>
                          <time className="text-xs font-medium text-gray-500">
                            {format(new Date(v.verified_at), 'MMM dd')}
                          </time>
                        </div>
                        <div className={`text-xs font-semibold mb-2 ${
                          v.status === 'verified' ? 'text-green-600' :
                          v.status === 'flagged' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {v.status.toUpperCase()}
                        </div>
                        {v.remarks && <div className="text-gray-600 text-xs italic">"{v.remarks}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-8">
                  No verifications performed yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}

function InfoField({ label, value, isMono = false }: { label: string, value: string | React.ReactNode, isMono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-navy ${isMono ? 'font-mono font-medium' : ''}`}>{value}</span>
    </div>
  );
}
