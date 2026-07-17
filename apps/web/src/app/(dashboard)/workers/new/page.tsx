'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CnicInput } from '@/components/CnicInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Save, X, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterWorkerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    cnic: '',
    name: '',
    fatherName: '',
    dob: '',
    gender: '',
    phone: '',
    address: '',
    employerId: '',
    designation: '',
    salary: '',
    joiningDate: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/workers/admin-register', formData);
      if (res.data?.success) {
        setSubmitted(true);
        setTimeout(() => {
          router.push('/workers');
        }, 2000);
      } else {
        setError(res.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register worker');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 bg-verified/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-verified" />
        </div>
        <h2 className="text-3xl font-bold text-navy">Registration Submitted</h2>
        <p className="text-gray-600 max-w-md">
          The worker profile has been sent for automatic verification across NADRA, FBR, and EOBI.
        </p>
        <p className="text-sm text-gray-400 mt-4">Redirecting to registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Register New Worker</h1>
          <p className="text-sm text-gray-500 mt-1">Enter official details to initiate verification process.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} className="border-gray-200" disabled={loading}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-navy hover:bg-gold text-white font-bold" disabled={loading}>
            <Save className="w-4 h-4 mr-2" /> {loading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-center border border-red-200">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-gray-200 shadow-sm rounded-md">
          <CardHeader className="bg-gray-50 border-b border-gray-100 py-3">
            <CardTitle className="text-base text-navy">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">CNIC Number</label>
              <CnicInput 
                value={formData.cnic} 
                onChange={v => setFormData({ ...formData, cnic: v })} 
                required 
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name (as per NADRA)</label>
              <Input 
                required 
                className="border-gray-300 focus-visible:ring-navy" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Father/Husband Name</label>
              <Input 
                required 
                className="border-gray-300 focus-visible:ring-navy"
                value={formData.fatherName}
                onChange={e => setFormData({...formData, fatherName: e.target.value})}
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <Input 
                required 
                placeholder="03001234567"
                className="border-gray-300 focus-visible:ring-navy"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
              <Input 
                type="date" 
                required 
                className="border-gray-300 focus-visible:ring-navy"
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: e.target.value})}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
              <Select onValueChange={v => setFormData({...formData, gender: v})}>
                <SelectTrigger className="border-gray-300 focus:ring-navy">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Address</label>
              <Input 
                required 
                className="border-gray-300 focus-visible:ring-navy"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm rounded-md">
          <CardHeader className="bg-gray-50 border-b border-gray-100 py-3">
            <CardTitle className="text-base text-navy">Employment Specifics</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Employer Establishment</label>
              <Select onValueChange={v => setFormData({...formData, employerId: v})}>
                <SelectTrigger className="border-gray-300 focus:ring-navy">
                  <SelectValue placeholder="Select Registered Establishment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Crescent Mills Ltd.</SelectItem>
                  <SelectItem value="2">Nishat Apparel</SelectItem>
                  <SelectItem value="3">Knitwear Corp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
              <Input 
                required 
                className="border-gray-300 focus-visible:ring-navy"
                value={formData.designation}
                onChange={e => setFormData({...formData, designation: e.target.value})}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Gross Salary (PKR)</label>
              <Input 
                type="number" 
                required 
                className="border-gray-300 focus-visible:ring-navy"
                value={formData.salary}
                onChange={e => setFormData({...formData, salary: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
