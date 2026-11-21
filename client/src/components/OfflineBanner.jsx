import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-in slide-in-from-top">
      <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
      <span>
        You are offline. New sales & inventory changes are disabled until internet connection is restored.
      </span>
    </div>
  );
}
