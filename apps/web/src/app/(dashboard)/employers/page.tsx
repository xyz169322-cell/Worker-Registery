'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Employers Directory</h1>
        <p className="text-sm text-gray-500 mt-1">Manage registered industrial establishments.</p>
      </div>
      <Card className="border-gray-200 shadow-sm rounded-md">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-navy">Registered Establishments</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-gray-500">
          Directory module is currently under active development.
        </CardContent>
      </Card>
    </div>
  );
}
