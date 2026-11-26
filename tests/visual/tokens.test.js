import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('VIS-001: tokens.css defines Future Lab — Mission Control color palette and touch target size', () => {
  const tokensPath = path.resolve('src/design-system/tokens.css');
  const content = fs.readFileSync(tokensPath, 'utf8');

  assert.ok(content.includes('--color-canvas-deep: #15171B'), 'Canvas deep color defined (#15171B)');
  assert.ok(content.includes('--color-surface-base: #292D33'), 'Surface base color defined (#292D33)');
  assert.ok(content.includes('--color-border-default: #565D66'), 'Border default color defined (#565D66)');
  assert.ok(content.includes('--accent-orange: #FF812C'), 'Technical engineering accent orange defined (#FF812C)');
  assert.ok(content.includes('--text-primary: #DCE1E7'), 'High-contrast text primary defined (#DCE1E7)');
  assert.ok(content.includes('--touch-min-size: 44px'), 'WCAG 2.2 touch target minimum 44px defined');
});

test('VIS-002: glass.css provides solid opaque background fallback before @supports backdrop-filter', () => {
  const glassPath = path.resolve('src/design-system/glass.css');
  const content = fs.readFileSync(glassPath, 'utf8');

  assert.ok(content.includes('background-color: var(--glass-fallback)'), 'Solid background fallback present');
  assert.ok(content.includes('@supports ((backdrop-filter: blur'), '@supports backdrop-filter query present');
});

test('VIS-003: animations.css includes strict prefers-reduced-motion reset', () => {
  const animPath = path.resolve('src/design-system/animations.css');
  const content = fs.readFileSync(animPath, 'utf8');

  assert.ok(content.includes('@media (prefers-reduced-motion: reduce)'), 'prefers-reduced-motion media query present');
  assert.ok(content.includes('animation-duration: 0.001ms !important'), 'Animations disabled for reduced motion');
});

test('VIS-004 & A11Y-001: index.html defines RTL layout, 5 persistent views, and accessible nav buttons', () => {
  const indexPath = path.resolve('index.html');
  const content = fs.readFileSync(indexPath, 'utf8');

  // Direction RTL
  assert.ok(content.includes('dir="rtl"'), 'HTML root has dir="rtl" for Arabic layout');

  // 5 Persistent Views
  assert.ok(content.includes('id="view-home"'), 'View 1: Home (#view-home) defined');
  assert.ok(content.includes('id="view-experiments"'), 'View 2: Experiments (#view-experiments) defined');
  assert.ok(content.includes('id="view-lab"'), 'View 3: Lab (#view-lab) defined');
  assert.ok(content.includes('id="view-guide"'), 'View 4: Guide (#view-guide) defined');
  assert.ok(content.includes('id="view-about"'), 'View 5: About (#view-about) defined');

  // 5 Navigation Buttons
  assert.ok(content.includes('id="navLinkHome"'), 'Nav link for Home defined');
  assert.ok(content.includes('id="navLinkExperiments"'), 'Nav link for Experiments defined');
  assert.ok(content.includes('id="navLinkLab"'), 'Nav link for Lab defined');
  assert.ok(content.includes('id="navLinkGuide"'), 'Nav link for Guide defined');
  assert.ok(content.includes('id="navLinkAbout"'), 'Nav link for About defined');

  // Keyboard accessibility
  assert.ok(content.includes('tabindex'), 'Interactive elements have tabindex set for keyboard focus');
  assert.ok(content.includes('aria-label='), 'Accessible aria labels present across interactive elements');
});
