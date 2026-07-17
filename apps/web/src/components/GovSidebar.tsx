'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, LayoutDashboard, Building2, CheckSquare, FileBarChart, ShieldAlert, LogOut, Bell } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'wwb_admin'] },
  { href: '/department', label: 'My Verification Queue', icon: CheckSquare, roles: ['dept_officer'] },
  { href: '/workers', label: 'Workers Registry', icon: Users, roles: ['super_admin', 'wwb_admin'] },
  { href: '/employers', label: 'Employers', icon: Building2, roles: ['super_admin', 'wwb_admin'] },
  { href: '/verification', label: 'Verification Queue', icon: CheckSquare, roles: ['super_admin', 'wwb_admin'] },
  { href: '/reports', label: 'Reports', icon: FileBarChart, roles: ['super_admin', 'wwb_admin', 'dept_officer'] },
  { href: '/admin/demo-accounts', label: 'Demo Accounts', icon: ShieldAlert, roles: ['super_admin'] },
];

export function GovSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; department?: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const visibleItems = !isMounted 
    ? [] // Wait for client hydration
    : NAV_ITEMS.filter(item => item.roles.includes(user?.role || ''));

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Administrator',
    wwb_admin: 'WWB Administrator',
    dept_officer: user?.department ? `${user.department} Officer` : 'Department Officer',
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  return (
    <aside className={cn("w-64 h-screen sticky top-0 flex flex-col bg-[#060d14] border-r border-white/[0.06] shadow-2xl", className)}>
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
          <p className="text-[#D4AF37]/80 text-[10px] font-semibold tracking-[0.15em] uppercase mt-1">
            Government of Punjab
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-6 px-3">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[#0A5C36] text-white shadow-lg shadow-[#0A5C36]/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-white/40')} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-white/[0.06] bg-[#0a1a10]/50">
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
          <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#0A5C36] to-[#1D9E75] flex items-center justify-center text-xs font-bold text-white shadow-inner">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{user?.name || 'Admin'}</p>
            <p className="text-white/40 text-[10px] truncate leading-tight mt-0.5">{roleLabel[user?.role || ''] || 'Officer'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
