import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_ROUTES, resolveRoute, navigate, setupRouter } from '../../src/ui/router.js';

test('ROUTER-001: ALLOWED_ROUTES defines all 5 approved system views', () => {
  const expectedRoutes = ['home', 'experiments', 'lab', 'guide', 'about'];
  assert.equal(ALLOWED_ROUTES.length, 5, 'Exactly 5 routes must be configured');
  assert.deepEqual([...ALLOWED_ROUTES], expectedRoutes, 'Routes must match approved views specification');
});

test('ROUTER-002: resolveRoute resolves exact route names', () => {
  for (const route of ALLOWED_ROUTES) {
    assert.equal(resolveRoute(route), route, `resolveRoute('${route}') should return '${route}'`);
  }
});

test('ROUTER-003: resolveRoute handles hash and leading slash formats', () => {
  assert.equal(resolveRoute('#/home'), 'home');
  assert.equal(resolveRoute('#/experiments'), 'experiments');
  assert.equal(resolveRoute('#/lab'), 'lab');
  assert.equal(resolveRoute('#/guide'), 'guide');
  assert.equal(resolveRoute('#/about'), 'about');

  assert.equal(resolveRoute('#home'), 'home');
  assert.equal(resolveRoute('/lab'), 'lab');
  assert.equal(resolveRoute('##/guide'), 'guide');
  assert.equal(resolveRoute('///experiments'), 'experiments');
});

test('ROUTER-004: resolveRoute strips query strings and ignores casing or surrounding whitespace', () => {
  assert.equal(resolveRoute('#/lab?mode=interactive&step=1'), 'lab');
  assert.equal(resolveRoute('#/experiments?id=ohms-law'), 'experiments');
  assert.equal(resolveRoute('   #/guide   '), 'guide');
  assert.equal(resolveRoute('LAB'), 'lab');
  assert.equal(resolveRoute('#/ABOUT'), 'about');
  assert.equal(resolveRoute('  HOME  '), 'home');
});

test('ROUTER-005: resolveRoute falls back safely to "home" for empty, malformed, or nullish input', () => {
  assert.equal(resolveRoute(''), 'home', 'Empty string must fallback to home');
  assert.equal(resolveRoute('   '), 'home', 'Whitespace string must fallback to home');
  assert.equal(resolveRoute('#'), 'home', 'Bare hash must fallback to home');
  assert.equal(resolveRoute('#/'), 'home', 'Bare hash slash must fallback to home');
  assert.equal(resolveRoute(null), 'home', 'Null must fallback to home');
  assert.equal(resolveRoute(undefined), 'home', 'Undefined must fallback to home');
  assert.equal(resolveRoute(), 'home', 'No arguments must fallback to home');
  assert.equal(resolveRoute(123), 'home', 'Non-string number must fallback to home');
  assert.equal(resolveRoute({}), 'home', 'Non-string object must fallback to home');
});

test('ROUTER-006: resolveRoute falls back safely to "home" for unknown routes', () => {
  assert.equal(resolveRoute('unknown'), 'home');
  assert.equal(resolveRoute('#/404'), 'home');
  assert.equal(resolveRoute('#/dashboard'), 'home');
  assert.equal(resolveRoute('#/admin/settings'), 'home');
  assert.equal(resolveRoute('../etc/passwd'), 'home');
});

test('ROUTER-007: navigate executes onNavigate hook and returns resolved route', () => {
  let navigatedTo = null;
  let navigatedFrom = null;

  const result = navigate('lab', {
    onNavigate: (to, from) => {
      navigatedTo = to;
      navigatedFrom = from;
    }
  });

  assert.equal(result, 'lab');
  assert.equal(navigatedTo, 'lab');
  assert.equal(navigatedFrom, 'home');
});

test('ROUTER-008: navigate respects beforeNavigate hook and aborts when false', () => {
  let onNavigateCalled = false;

  const result = navigate('about', {
    beforeNavigate: (from, to) => {
      assert.equal(to, 'about');
      return false; // Abort
    },
    onNavigate: () => {
      onNavigateCalled = true;
    }
  });

  assert.equal(result, 'home', 'Should return current route when aborted');
  assert.equal(onNavigateCalled, false, 'onNavigate should not be called when aborted');
});

test('ROUTER-009: setupRouter returns cleanup unbind function safely in non-browser runtime', () => {
  const cleanup = setupRouter();
  assert.equal(typeof cleanup, 'function');
  assert.doesNotThrow(() => cleanup());
});
