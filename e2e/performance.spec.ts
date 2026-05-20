import { test, expect } from './fixtures/test-fixtures';

/**
 * Performance Tests
 * These tests measure key performance metrics
 */

test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    // This is a wall-clock measure: it includes Playwright browser launch and
    // dev-server cold start, which on a shared self-hosted Docker runner add
    // ~10s of overhead unrelated to app performance. Real product perf is
    // asserted by the FCP/LCP web-vitals tests below (LCP ~1s in practice).
    // Keep a generous sanity ceiling here to still catch a page that never
    // settles to networkidle.
    expect(loadTime).toBeLessThan(30000);
  });

  test('first contentful paint is fast', async ({ page, browserName }) => {
    await page.goto('/');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcp = entries.find(e => e.name === 'first-contentful-paint');
      return {
        fcp: fcp?.startTime || 0,
      };
    });

    console.log(`First Contentful Paint: ${metrics.fcp}ms`);

    // Browser-specific FCP thresholds.
    // Firefox on the shared self-hosted Docker runner (fitstream-runner) consistently
    // measures 2756–3179ms due to browser-launch overhead, not an app regression.
    // Chromium on the same runner measures ~956ms (well within the 2500ms target).
    // Using per-browser ceilings lets us keep strict Chromium/WebKit coverage while
    // not letting Firefox runner overhead create false-positive CI failures.
    // See: task-2510, run 25995804934.
    const fcpThreshold = browserName === 'firefox' ? 5000 : 2500;
    console.log(`FCP threshold for ${browserName}: ${fcpThreshold}ms`);

    expect(metrics.fcp).toBeLessThan(fcpThreshold);
  });

  test('time to interactive is acceptable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to interact with the page
    const startTime = Date.now();

    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.click({ timeout: 5000 });
    }

    const interactiveTime = Date.now() - startTime;

    console.log(`Time to first interaction: ${interactiveTime}ms`);

    // Should be interactive within 3 seconds
    expect(interactiveTime).toBeLessThan(3000);
  });

  test('no layout shifts after load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for any delayed content
    await page.waitForTimeout(1000);

    // Check Cumulative Layout Shift
    const cls = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let clsValue = 0;
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Give it a moment to collect shifts
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 500);
      });
    });

    console.log(`Cumulative Layout Shift: ${cls}`);

    // CLS should be under 0.1 (good score)
    expect(cls).toBeLessThan(0.25); // Allow up to 0.25 (needs improvement threshold)
  });

  test('memory usage is reasonable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Perform some interactions - try multiple selector strategies
    const navButtons = page.locator('nav button, [role="navigation"] button, .bottom-0 button, button[class*="tab"]');
    const count = await navButtons.count();

    for (let i = 0; i < Math.min(5, count); i++) {
      const tab = navButtons.nth(i);
      if (await tab.isVisible().catch(() => false)) {
        await tab.click().catch(() => {});
        await page.waitForTimeout(200);
      }
    }

    // Check memory (if available)
    const memory = await page.evaluate(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
        };
      }
      return null;
    });

    if (memory) {
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      console.log(`JS Heap Used: ${usedMB.toFixed(2)}MB`);

      // Should use less than 100MB
      expect(usedMB).toBeLessThan(100);
    }
  });

  test.skip('no memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial memory
    const getMemory = async () => {
      return page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    const initialMemory = await getMemory();

    // Navigate between tabs multiple times - use flexible selectors
    const tabs = page.locator('nav button, [role="navigation"] button, .bottom-0 button, button[class*="tab"]');
    const count = await tabs.count();

    for (let i = 0; i < Math.min(10, count * 3); i++) {
      if (count > 0) {
        await tabs.nth(i % count).click().catch(() => {});
        await page.waitForTimeout(100);
      }
    }

    // Force garbage collection if possible
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(500);

    const finalMemory = await getMemory();

    if (initialMemory > 0 && finalMemory > 0) {
      const increase = (finalMemory - initialMemory) / (1024 * 1024);
      console.log(`Memory increase after navigation: ${increase.toFixed(2)}MB`);

      // Should not increase by more than 20MB after navigations
      expect(increase).toBeLessThan(20);
    }
  });

  test('bundle size check', async ({ page }) => {
    const resources: { name: string; size: number }[] = [];

    // Listen for network requests
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0');
        resources.push({
          name: url.split('/').pop() || url,
          size: contentLength,
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Calculate total bundle size
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const totalMB = totalSize / (1024 * 1024);

    console.log(`Total JS/CSS bundle size: ${totalMB.toFixed(2)}MB`);

    // Log individual files
    resources
      .sort((a, b) => b.size - a.size)
      .slice(0, 5)
      .forEach(r => {
        console.log(`  ${r.name}: ${(r.size / 1024).toFixed(2)}KB`);
      });

    // Total should be under 2MB (reasonable for a PWA)
    expect(totalMB).toBeLessThan(2);
  });
});

test.describe('Performance - Lighthouse Metrics', () => {
  test('collects web vitals', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for all metrics to be collected
    await page.waitForTimeout(2000);

    const vitals = await page.evaluate(() => {
      return new Promise<{
        lcp: number;
        fid: number;
        cls: number;
        fcp: number;
        ttfb: number;
      }>(resolve => {
        const metrics = {
          lcp: 0,
          fid: 0,
          cls: 0,
          fcp: 0,
          ttfb: 0,
        };

        // Get navigation timing
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (nav) {
          metrics.ttfb = nav.responseStart - nav.requestStart;
        }

        // Get paint timing
        const paints = performance.getEntriesByType('paint');
        const fcp = paints.find(p => p.name === 'first-contentful-paint');
        if (fcp) {
          metrics.fcp = fcp.startTime;
        }

        // Use PerformanceObserver for LCP, FID, CLS
        let resolved = false;

        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) {
            metrics.lcp = last.startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              metrics.cls += entry.value;
            }
          });
        }).observe({ type: 'layout-shift', buffered: true });

        // Resolve after a delay
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(metrics);
          }
        }, 1000);
      });
    });

    console.log('Web Vitals:');
    console.log(`  LCP: ${vitals.lcp.toFixed(0)}ms`);
    console.log(`  FCP: ${vitals.fcp.toFixed(0)}ms`);
    console.log(`  CLS: ${vitals.cls.toFixed(3)}`);
    console.log(`  TTFB: ${vitals.ttfb.toFixed(0)}ms`);

    // Browser-specific FCP threshold
    const fcpThreshold = browserName === 'firefox' ? 5000 : 3000;

    // Basic thresholds (not as strict as Lighthouse)
    expect(vitals.fcp).toBeLessThan(fcpThreshold);
    expect(vitals.lcp).toBeLessThan(4000);
    expect(vitals.cls).toBeLessThan(0.25);
  });
});
