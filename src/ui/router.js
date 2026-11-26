/**
 * Rowad Al-Mamal - Lightweight Client-Side Router (JavaScript Runtime)
 * Pure functional routing module for Persistent DOM Views
 */

export const ALLOWED_ROUTES = ['home', 'experiments', 'lab', 'guide', 'about'];

/**
 * Resolves any hash or path string to a valid AppRoute.
 * Falls back safely to 'home' if route is unknown, empty, or malformed.
 */
export function resolveRoute(hash) {
  if (!hash || typeof hash !== 'string') {
    return 'home';
  }

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
export function navigate(route, hooks) {
  const currentRoute = typeof window !== 'undefined' 
    ? resolveRoute(window.location.hash) 
    : 'home';
    
  const targetRoute = resolveRoute(route);

  if (hooks?.beforeNavigate) {
    const canProceed = hooks.beforeNavigate(currentRoute, targetRoute);
    if (canProceed === false) {
      return currentRoute;
    }
  }

  if (typeof window !== 'undefined') {
    const targetHash = `#/${targetRoute}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }

  hooks?.onNavigate?.(targetRoute, currentRoute);

  return targetRoute;
}

/**
 * Attaches a hashchange listener to handle browser back/forward and external link clicks.
 * Returns an unbind cleanup function.
 */
export function setupRouter(hooks) {
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

  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
}
