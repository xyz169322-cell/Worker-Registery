'use client';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function SessionTimeoutModal() {
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 mins warning

  useEffect(() => {
    // In a real app, this would be tied to a session context / idle timer
    // Just a placeholder implementation
    const timer = setTimeout(() => {
      setOpen(true);
    }, 25 * 60 * 1000); // 25 mins

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open && countdown > 0) {
      const interval = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(interval);
    } else if (open && countdown === 0) {
      // Auto logout
      window.location.href = '/login?timeout=true';
    }
  }, [open, countdown]);

  const handleExtend = () => {
    setOpen(false);
    setCountdown(300);
    // Ping API to refresh token
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-t-4 border-t-flagged">
        <DialogHeader>
          <DialogTitle className="text-xl">Session Expiring Soon</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            For security purposes, your session will expire in{' '}
            <strong className="text-flagged">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </strong>
            . Do you need more time?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            Log Out
          </Button>
          <Button onClick={handleExtend} className="bg-navy hover:bg-gold text-white">
            Continue Working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
