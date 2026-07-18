'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, Building2, FileText, LogOut, Bell, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/employer', label: 'Company Profile', icon: Building2 },
  { href: '/employer/workers', label: 'Manage Workers', icon: Users },
  { href: '/employer/reports', label: 'Reports', icon: FileText },
];

function SidebarContent({ user, pathname, handleLogout, onNavClick }: {
  user: { name: string; email: string } | null;
  pathname: string;
  handleLogout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Brand Header */}
      <div className="p-6 border-b border-white/[0.06] flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#a07d1c] p-[2px] shadow-[0_0_30px_rgba(212,175,55,0.25)]">
            <div className="w-full h-full rounded-full bg-[#0A5C36] flex items-center justify-center">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'serif' }}>و</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight tracking-wide">Workers Welfare Board</p>
          <p className="text-[#D4AF37] text-[10px] font-bold tracking-[0.15em] uppercase mt-1">
            Employer Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-6 px-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/employer' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[#0A5C36] text-white shadow-lg shadow-[#0A5C36]/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-white/40')} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-white/[0.06] bg-black/20">
        <div className="flex items-center justify-between mb-4 px-1">
          <button className="relative flex items-center justify-center hover:bg-white/10 transition-colors w-8 h-8 rounded-full">
            <Bell className="w-4 h-4 text-white/50" />
            <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-8 h-8 rounded-full"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{user?.name || 'Employer'}</p>
            <p className="text-white/40 text-[10px] truncate leading-tight mt-0.5">{user?.email || 'employer@example.com'}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function EmployerSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-[#0d1f17] border-b border-[#D4AF37]/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#a07d1c] p-[1.5px]">
            <div className="w-full h-full rounded-full bg-[#0A5C36] flex items-center justify-center">
              <span className="text-sm font-bold text-white" style={{ fontFamily: 'serif' }}>و</span>
            </div>
          </div>
          <div>
            <span className="text-white font-bold text-sm">Workers Welfare Board</span>
            <span className="ml-2 text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase">Employer</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#0d1f17] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl border-r border-[#D4AF37]/20',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent user={user} pathname={pathname} handleLogout={handleLogout} onNavClick={() => setMobileOpen(false)} />
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn('hidden lg:flex w-64 h-screen sticky top-0 flex-col bg-[#0d1f17] border-r border-[#D4AF37]/20 shadow-2xl', className)}>
        <SidebarContent user={user} pathname={pathname} handleLogout={handleLogout} />
      </aside>
    </>
  );
}
