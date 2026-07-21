'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin')) return;

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (lastTrackedRef.current === path) return;
    lastTrackedRef.current = path;

    void fetch('/api/admin/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        path,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
      }),
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
