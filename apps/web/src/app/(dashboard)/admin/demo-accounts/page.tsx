'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

const accounts = [
  { role: 'super_admin',   label: 'Super Admin',              email: 'admin@wwb.punjab.gov.pk',                password: 'Admin@123456', note: 'Full system access' },
  { role: 'wwb_admin',     label: 'WWB Admin',                email: 'wwb.admin@wwb.punjab.gov.pk',             password: 'Admin@123456', note: 'Registry management' },
  { role: 'dept_officer',  label: 'Labour Dept Officer',      email: 'labourdept@wwb.punjab.gov.pk',            password: 'Dept@123',    note: 'Department: Labour Dept' },
  { role: 'dept_officer',  label: 'Police Officer',           email: 'police@wwb.punjab.gov.pk',                password: 'Dept@123',    note: 'Department: Police' },
  { role: 'dept_officer',  label: 'EOBI Officer',             email: 'eobi@wwb.punjab.gov.pk',                  password: 'Dept@123',    note: 'Department: EOBI' },
  { role: 'dept_officer',  label: 'Social Security Officer',  email: 'socialsecurity@wwb.punjab.gov.pk',        password: 'Dept@123',    note: 'Department: Social Security' },
  { role: 'dept_officer',  label: 'FBR Officer',              email: 'fbr@wwb.punjab.gov.pk',                   password: 'Dept@123',    note: 'Department: FBR' },
  { role: 'dept_officer',  label: 'Excise & Taxation Officer',email: 'excisestaxation@wwb.punjab.gov.pk',       password: 'Dept@123',    note: 'Department: Excise & Taxation' },
  { role: 'dept_officer',  label: 'Civil Defense Officer',    email: 'civildefense@wwb.punjab.gov.pk',          password: 'Dept@123',    note: 'Department: Civil Defense' },
  { role: 'dept_officer',  label: 'District Admin Officer',   email: 'districtadministration@wwb.punjab.gov.pk',password: 'Dept@123',    note: 'Department: District Administration' },
  { role: 'employer',      label: 'Employer 1',               email: 'employer1@test.com',                      password: 'Dept@123',    note: 'Test employer account' },
  { role: 'employer',      label: 'Employer 2',               email: 'employer2@test.com',                      password: 'Dept@123',    note: 'Test employer account' },
  { role: 'employer',      label: 'Employer 3',               email: 'employer3@test.com',                      password: 'Dept@123',    note: 'Test employer account' },
];

const roleBadgeVariant: Record<string, string> = {
  super_admin: 'destructive',
  wwb_admin: 'default',
  dept_officer: 'secondary',
  employer: 'outline',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-navy transition-colors ml-1"
      title="Copy"
    >
      {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function DemoAccountsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    const loadingToast = toast.loading('Resetting demo data...');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3001/api/admin/reset-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setResetDone(true);
      toast.success('Demo data reset successfully!', { id: loadingToast });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e: any) {
      toast.error(e.message || 'An error occurred', { id: loadingToast });
    } finally {
      setResetting(false);
      setShowDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Demo Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Default credentials seeded for prototype demonstration. All passwords are hashed in the database.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDialog(true)}
          disabled={resetting || resetDone}
          className="gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          {resetting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : resetDone ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {resetting ? 'Resetting...' : resetDone ? 'Reset Complete!' : 'Reset Demo Data'}
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-navy text-base">Default Credentials</CardTitle>
          <CardDescription>Click the copy icon to copy email or password to clipboard.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500 tracking-wide">
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Password</th>
                  <th className="text-left py-3 px-4 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Badge variant={roleBadgeVariant[acc.role] as any} className="text-xs">
                        {acc.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{acc.label}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      <span>{acc.email}</span>
                      <CopyButton text={acc.email} />
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      <span>{acc.password}</span>
                      <CopyButton text={acc.password} />
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{acc.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex gap-3 items-start">
              <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Reset All Demo Data?</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  This will <strong>permanently delete ALL records</strong> including workers, 
                  businesses, verifications, and audit logs, then re-seed 500 dummy workers. 
                  This action <strong>cannot be undone</strong>. Continue?
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReset}
                disabled={resetting}
                className="gap-2"
              >
                {resetting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                Yes, Reset Everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
