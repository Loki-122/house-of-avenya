'use client';

import { ViewTransition } from 'react';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Cross-fades between routes.
 *
 * Rendered by the root layout around `{children}` only, so every route passes
 * through one implementation: header links, product cards, quick view, the
 * collection cards, new arrivals, search results, wishlist and cart lines, the
 * logo, and browser back/forward.
 *
 * The boundary is keyed on the pathname rather than living in a `template.tsx`.
 * That is deliberate. A template remounts by deleting its whole subtree, which
 * leaves React with an unpaired enter and nothing to fade out from. Here the
 * layout persists and only this keyed boundary is replaced, so React matches
 * the outgoing boundary to the incoming one and cross-fades real DOM snapshots:
 * the old page fades and shifts out while the new one fades and shifts in.
 * Nothing is held on screen and the navigation is never delayed — the new page
 * is live and interactive immediately, the animation plays over it.
 *
 * `share`, not `enter`/`exit`. A cross-fade needs *both* snapshots, and React
 * only produces the outgoing one for a named pair where one side sits in the
 * deleted subtree and the other in the inserted subtree. `enter`/`exit` animate
 * a single snapshot each, so the outgoing page would simply vanish. `share` also
 * takes precedence over both. See globals.css for the timings.
 *
 * The CSS entrance is a fallback, not a parallel layer. It is applied in a
 * layout effect and only when no view transition was requested for that
 * navigation, so the two can never animate at the same time. That covers two
 * cases: browsers without the API, and history navigations — Next wraps link
 * and router navigations in a transition but delivers back/forward as a bare
 * `popstate`.
 */
const VIEW_TRANSITION_NAME = 'avenya-page';

/** React adds this class to the snapshots; the CSS is written against it. */
const VIEW_TRANSITION_CLASS = 'avenya-page-share';

type Motion = {
  duration: string;
  rise: string;
};

/** Product pages carry the most detail, so they get the longest, softest settle. */
const PRODUCT: Motion = { duration: '560ms', rise: '10px' };

/** Browsing pages are used in long scrolling sessions, so they settle a touch quicker. */
const BROWSING: Motion = { duration: '480ms', rise: '8px' };

const DEFAULT: Motion = { duration: '520ms', rise: '8px' };

function motionFor(pathname: string): Motion {
  if (pathname.startsWith('/products/')) return PRODUCT;
  if (pathname === '/collections' || pathname === '/women' || pathname === '/new-arrivals') {
    return BROWSING;
  }
  return DEFAULT;
}

/**
 * Set the moment React asks the browser for a view transition, which it does
 * *before* it mutates the DOM and before layout effects run.
 *
 * That timing is the whole point. Checking `view-transition-name` from a layout
 * effect is too late — React applies the name after layout effects, so it always
 * reads `none` there and the CSS entrance would run alongside every cross-fade,
 * compounding into a washed-out frame.
 *
 * If a future React version stops calling through `document`, the flag simply
 * never gets set and every navigation uses the CSS entrance. That is a graceful
 * downgrade: consistent motion, just without the cross-fade.
 */
let viewTransitionRequested = false;

if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
  const nativeStartViewTransition = document.startViewTransition.bind(document);
  document.startViewTransition = ((callback: Parameters<typeof nativeStartViewTransition>[0]) => {
    viewTransitionRequested = true;
    const transition = nativeStartViewTransition(callback);
    // Never let a skipped transition surface as an unhandled rejection.
    transition.finished.catch(() => {}).finally(() => {
      viewTransitionRequested = false;
    });
    return transition;
  }) as typeof document.startViewTransition;
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [useCssEntrance, setUseCssEntrance] = useState(false);

  // Null until the first layout pass, then the path we were last settled on.
  // Comparing against the previous path is how a navigation is told apart from
  // the initial page load, and it keeps working under StrictMode, which invokes
  // effects twice and would otherwise treat the first load as a navigation.
  const settledPath = useRef<string | null>(null);

  useLayoutEffect(() => {
    const previous = settledPath.current;
    settledPath.current = pathname;

    if (previous === null) return; // first page of the session: not a navigation
    if (previous === pathname) return; // same path, nothing to transition

    // Consume the flag: one decision per navigation.
    const crossFading = viewTransitionRequested;
    viewTransitionRequested = false;
    setUseCssEntrance(!crossFading);
  }, [pathname]);

  const motion = motionFor(pathname ?? '/');

  return (
    <ViewTransition key={pathname} name={VIEW_TRANSITION_NAME} share={VIEW_TRANSITION_CLASS} default="none">
      <div
        className={`page-transition${useCssEntrance ? ' is-css-fallback' : ''}`}
        style={
          {
            '--avenya-page-duration': motion.duration,
            '--avenya-page-rise': motion.rise,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </ViewTransition>
  );
}
