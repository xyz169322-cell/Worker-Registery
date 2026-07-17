'use client';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatCnic, isValidCnic } from '@wwb/shared';

interface CnicInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CnicInput({ value, onChange, error, className, ...props }: CnicInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9-]/g, '');
    const formatted = formatCnic(raw);
    onChange(formatted);
  };

  const isValid = value.length === 15 && isValidCnic(value);

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        placeholder="00000-0000000-0"
        maxLength={15}
        className={cn(
          "font-mono text-lg tracking-wider",
          value.length === 15 && isValid && "border-verified focus-visible:ring-verified",
          value.length === 15 && !isValid && "border-flagged focus-visible:ring-flagged",
          error && "border-flagged focus-visible:ring-flagged",
          className
        )}
      />
      {value.length === 15 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValid ? (
            <svg className="w-5 h-5 text-verified" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-flagged" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
      )}
      {error && <p className="text-sm text-flagged mt-1">{error}</p>}
    </div>
  );
}
