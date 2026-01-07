import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

interface SwipeBackOptions {
  threshold?: number;
  edgeWidth?: number;
}

export function useSwipeBack(options: SwipeBackOptions = {}) {
  const { threshold = 100, edgeWidth = 50 } = options;
  const [location] = useLocation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartedFromEdge = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX <= edgeWidth) {
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        touchStartedFromEdge.current = true;
      } else {
        touchStartedFromEdge.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartedFromEdge.current || touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      if (deltaX > threshold && deltaY < 100) {
        if (window.history.length > 1 && location !== "/") {
          window.history.back();
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
      touchStartedFromEdge.current = false;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [threshold, edgeWidth, location]);
}
