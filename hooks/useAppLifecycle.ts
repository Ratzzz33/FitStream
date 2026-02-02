/**
 * App Lifecycle Hook
 * Handles WebView resume issues on Android/iOS
 * Forces repaint when app returns from background to fix rendering glitches
 */
import { useEffect, useCallback, useRef } from 'react';

interface AppLifecycleOptions {
  onResume?: () => void;
  onPause?: () => void;
}

/**
 * Force viewport recalculation
 * Fixes Android WebView issue where viewport height gets stuck after minimize
 */
function forceViewportRecalc(): void {
  // Method 1: Dispatch resize event to recalculate CSS viewport units
  window.dispatchEvent(new Event('resize'));

  // Method 2: Force layout recalculation via CSS variable
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);

  // Method 3: Reset any stuck body height
  document.body.style.height = '';
  document.body.style.minHeight = '';
  requestAnimationFrame(() => {
    document.body.style.height = '100%';
    document.body.style.minHeight = '100dvh';
  });
}

/**
 * Force a full repaint of the WebView
 * This fixes rendering glitches when app resumes from background
 */
function forceRepaint(): void {
  // First, recalculate viewport
  forceViewportRecalc();

  // Method 1: Trigger reflow via display toggle
  const root = document.getElementById('root');
  if (root) {
    root.style.display = 'none';
    // Force synchronous reflow
    void root.offsetHeight;
    root.style.display = '';
  }

  // Method 2: Force redraw via opacity (fallback)
  document.body.style.opacity = '0.99';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });

  // Method 3: Scroll position reset (helps with stuck scroll)
  window.scrollTo(0, window.scrollY);

  // Method 4: Force another viewport recalc after paint
  requestAnimationFrame(() => {
    forceViewportRecalc();
  });
}

/**
 * Hook to handle app lifecycle events
 * Fixes WebView rendering issues on Android when resuming from background
 */
export function useAppLifecycle(options: AppLifecycleOptions = {}): void {
  const { onResume, onPause } = options;
  const wasInBackground = useRef(false);
  const lastActiveTime = useRef(Date.now());

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // App going to background
      wasInBackground.current = true;
      lastActiveTime.current = Date.now();
      onPause?.();
    } else {
      // App returning to foreground
      if (wasInBackground.current) {
        const timeInBackground = Date.now() - lastActiveTime.current;

        // If in background for more than 5 seconds, force repaint
        if (timeInBackground > 5000) {
          console.log('[AppLifecycle] Forcing repaint after background:', timeInBackground, 'ms');
          forceRepaint();
        }

        onResume?.();
        wasInBackground.current = false;
      }
    }
  }, [onResume, onPause]);

  useEffect(() => {
    // Initialize viewport height on mount
    forceViewportRecalc();

    // Update on resize
    const handleResize = () => {
      forceViewportRecalc();
    };
    window.addEventListener('resize', handleResize);

    // Web visibility API
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Capacitor-specific lifecycle (if available)
    let capacitorListener: { remove: () => void } | null = null;

    const setupCapacitorListener = async () => {
      try {
        const { App } = (window as any).Capacitor?.Plugins || {};
        if (App?.addListener) {
          capacitorListener = await App.addListener('appStateChange', (state: { isActive: boolean }) => {
            if (state.isActive) {
              if (wasInBackground.current) {
                const timeInBackground = Date.now() - lastActiveTime.current;

                // Force repaint on Capacitor resume
                if (timeInBackground > 3000) {
                  console.log('[AppLifecycle] Capacitor resume, forcing repaint');
                  // Delay slightly to let WebView finish restoring
                  setTimeout(forceRepaint, 100);
                }

                onResume?.();
                wasInBackground.current = false;
              }
            } else {
              wasInBackground.current = true;
              lastActiveTime.current = Date.now();
              onPause?.();
            }
          });
        }
      } catch (e) {
        console.warn('[AppLifecycle] Failed to setup Capacitor listener:', e);
      }
    };

    setupCapacitorListener();

    // Android-specific: handle page show event (bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('[AppLifecycle] Page restored from bfcache, forcing repaint');
        forceRepaint();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    // iOS-specific: handle resume from Safari tab switch
    const handleFocus = () => {
      if (wasInBackground.current) {
        setTimeout(forceRepaint, 50);
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
      capacitorListener?.remove();
    };
  }, [handleVisibilityChange, onResume, onPause]);
}

export default useAppLifecycle;
