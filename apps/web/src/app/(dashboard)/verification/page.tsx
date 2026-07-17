'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Verification Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Review flagged profiles and pending cross-department verifications.</p>
      </div>
      <Card className="border-gray-200 shadow-sm rounded-md border-t-4 border-t-pending">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-navy">Priority Action Items</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-gray-500">
          The verification queue is being synchronized with NADRA and FBR adapters.
        </CardContent>
      </Card>
    </div>
  );
}
