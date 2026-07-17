import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'VERIFIED' | 'PENDING' | 'FLAGGED';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold uppercase tracking-wider text-xs px-2.5 py-0.5 rounded-sm border",
        status === 'VERIFIED' && "bg-verified/10 text-verified border-verified/20",
        status === 'PENDING' && "bg-pending/10 text-pending border-pending/20",
        status === 'FLAGGED' && "bg-flagged/10 text-flagged border-flagged/20",
        className
      )}
    >
      {status}
    </Badge>
  );
}
