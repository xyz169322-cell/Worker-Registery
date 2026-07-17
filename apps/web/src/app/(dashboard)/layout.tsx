import React from 'react';
import { GovSidebar } from '@/components/GovSidebar';
import { SessionTimeoutModal } from '@/components/SessionTimeoutModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <GovSidebar className="print:hidden shrink-0 flex" />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <SessionTimeoutModal />
        <footer className="bg-white border-t border-gray-200 py-6 print:hidden">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Workers Welfare Board, Government of Punjab.</p>
            <p className="mt-1">For technical support, contact IT Department at support@wwb.punjab.gov.pk</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
