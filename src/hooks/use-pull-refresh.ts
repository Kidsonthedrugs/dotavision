'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for pull-to-refresh functionality on mobile devices.
 * 
 * @param onRefresh - Callback function that returns a Promise to execute when refresh is triggered
 * @returns Object containing isRefreshing state
 * 
 * @example
 * ```typescript
 * const { isRefreshing } = usePullToRefresh(async () => {
 *   await refetch() // your query refetch function
 * })
 * ```
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only track pull if user is at the top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || startY.current === null) return;

    const currentY = e.touches[0].clientY;
    const pullDistance = startY.current - currentY;

    // If user is pulling down (positive distance) and at top of page
    if (pullDistance > 0 && window.scrollY === 0) {
      // Allow the pull gesture but prevent default to avoid native refresh
      // Only prevent default if pull distance is significant
      if (pullDistance > 10) {
        e.preventDefault();
      }
    }
  }, []);

  const handleTouchEnd = useCallback(async (e: TouchEvent) => {
    if (startY.current === null || !isPulling.current) return;

    // Get the final touch position from changedTouches
    const endY = e.changedTouches[0]?.clientY ?? startY.current;
    const pullDistance = startY.current - endY;

    // Trigger refresh if pull distance > 100px and at top of page
    if (pullDistance > 100 && window.scrollY === 0 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    // Reset
    startY.current = null;
    isPulling.current = false;
  }, [onRefresh, isRefreshing]);

  useEffect(() => {
    // Add event listeners for touch events
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isRefreshing };
}
