/**
 * Rowad Al-Mamal - Lightweight Client-Side Router
 * Pure functional routing module for Persistent DOM Views
 */

export const ALLOWED_ROUTES = ['home', 'experiments', 'lab', 'guide', 'about'] as const;

export type AppRoute = typeof ALLOWED_ROUTES[number];

export interface RouteNavigationHooks {
  beforeNavigate?: (from: AppRoute, to: AppRoute) => boolean | void;
  onNavigate?: (to: AppRoute, from: AppRoute) => void;
}

/**
 * Resolves any hash or path string to a valid AppRoute.
 * Falls back safely to 'home' if route is unknown, empty, or malformed.
 */
export function resolveRoute(hash?: string | null): AppRoute {
  if (!hash || typeof hash !== 'string') {
    return 'home';
  }

  // Strip query strings, leading '#' and '/'
  const cleanHash = hash
    .split('?')[0]
    .trim()
    .replace(/^#+/, '')
    .replace(/^\/+/, '')
    .trim()
    .toLowerCase();

  const matchedRoute = ALLOWED_ROUTES.find((r) => r === cleanHash);
  return matchedRoute || 'home';
}

/**
 * Navigates to the given route, executing beforeNavigate and onNavigate hooks.
 * Returns the final resolved route.
 */
export function navigate(route: string, hooks?: RouteNavigationHooks): AppRoute {
  const currentRoute: AppRoute = typeof window !== 'undefined' 
    ? resolveRoute(window.location.hash) 
    : 'home';
    
  const targetRoute = resolveRoute(route);

  // Before navigation hook (can abort if explicitly returns false)
  if (hooks?.beforeNavigate) {
    const canProceed = hooks.beforeNavigate(currentRoute, targetRoute);
    if (canProceed === false) {
      return currentRoute;
    }
  }

  // Update hash if in browser environment
  if (typeof window !== 'undefined') {
    const targetHash = `#/${targetRoute}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }

  // Run onNavigate callback
  hooks?.onNavigate?.(targetRoute, currentRoute);

  return targetRoute;
}

/**
 * Attaches a hashchange listener to handle browser back/forward and external link clicks.
 * Returns an unbind cleanup function.
 */
export function setupRouter(hooks?: RouteNavigationHooks): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let lastRoute = resolveRoute(window.location.hash);

  const handleHashChange = () => {
    const targetRoute = resolveRoute(window.location.hash);
    if (hooks?.beforeNavigate) {
      const allowed = hooks.beforeNavigate(lastRoute, targetRoute);
      if (allowed === false) {
        window.location.hash = `#/${lastRoute}`;
        return;
      }
    }
    const from = lastRoute;
    lastRoute = targetRoute;
    hooks?.onNavigate?.(targetRoute, from);
  };

  window.addEventListener('hashchange', handleHashChange);

  // Return unbind handler
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
}
