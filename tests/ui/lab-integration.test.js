import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.resolve('index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

test('LAB-INT-001: Mission control toolbar contains Undo, Redo, Delete, Switch, and Reset controls', () => {
  assert.ok(indexHtml.includes('id="btnUndo"'), 'Undo button present in HTML');
  assert.ok(indexHtml.includes('id="btnRedo"'), 'Redo button present in HTML');
  assert.ok(indexHtml.includes('id="btnDeleteComponent"'), 'Delete component button present in HTML');
  assert.ok(indexHtml.includes('id="btnToggleSwitch"'), 'Switch toggle button present in HTML');
  assert.ok(indexHtml.includes('id="btnReset"'), 'Wire reset button present in HTML');
  assert.ok(indexHtml.includes('id="btnReloadDefault"'), 'Default circuit reload button present in HTML');
});

test('LAB-INT-002: ES module script imports lab-state manager and binds toLabSnapshot to solver', () => {
  assert.ok(
    indexHtml.includes("from './src/features/lab/lab-state.js'"),
    'Imports functional state manager from lab-state.js'
  );
  assert.ok(
    indexHtml.includes('toLabSnapshot(labState)'),
    'Passes immutable snapshot to solver'
  );
  assert.ok(
    indexHtml.includes('simulate(snapshot)'),
    'Simulates circuit with current snapshot'
  );
});

test('LAB-INT-003: Pointer drag-and-drop uses CTM inverse coordinates and pointer capture', () => {
  assert.ok(
    indexHtml.includes('matrixTransform(svg.getScreenCTM().inverse())'),
    'Transforms pointer coordinates using inverse screen CTM'
  );
  assert.ok(
    indexHtml.includes('setPointerCapture'),
    'Captures pointer for smooth multi-touch and mouse dragging'
  );
  assert.ok(
    indexHtml.includes('commitMove(labState, dragContext.startPos, comp.position)'),
    'Commits move to history only on drag end (pointerup)'
  );
});

test('LAB-INT-004: Global keyboard shortcuts are wired and guarded against input elements', () => {
  assert.ok(
    indexHtml.includes("tag === 'input' || tag === 'textarea'"),
    'Keyboard listener guards against active input elements'
  );
  assert.ok(
    indexHtml.includes("e.key.toLowerCase() === 'z'"),
    'Ctrl+Z undo shortcut registered'
  );
  assert.ok(
    indexHtml.includes("e.key.toLowerCase() === 'y'"),
    'Ctrl+Y redo shortcut registered'
  );
  assert.ok(
    indexHtml.includes("e.key === 'Delete' || e.key === 'Backspace'"),
    'Delete/Backspace shortcut registered for removing selected component'
  );
  assert.ok(
    indexHtml.includes("['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']"),
    'Arrow keys registered for moving selected component'
  );
});

test('LAB-INT-005: Measurements strictly use textContent preventing XSS and layout thrashing', () => {
  assert.ok(
    indexHtml.includes('currentEl.textContent ='),
    'Current measurement assigns via textContent'
  );
  assert.ok(
    indexHtml.includes('vrEl.textContent ='),
    'Voltage measurement assigns via textContent'
  );
  assert.ok(
    indexHtml.includes('circuitBadge.textContent ='),
    'Circuit badge assigns via textContent'
  );
});

test('REG-UI-001: unsupported simulation visibly clears readings and LED instead of retaining previous state', () => {
  assert.ok(indexHtml.includes("sim.status === 'unsupported'"), 'unsupported status is handled explicitly');
  assert.ok(indexHtml.includes("circuitBadge.textContent = 'توصيل غير مدعوم'"), 'unsupported badge is visible');
  assert.ok(indexHtml.includes("currentEl.textContent = 'غير محسوب'"), 'unsupported current is suppressed');
  assert.ok(indexHtml.includes("vrEl.textContent = 'غير محسوب'"), 'unsupported voltage is suppressed');
});


test('REG-START-001: startup and lesson entry do not pre-load the answer', () => {
  const startupCode = indexHtml.split('// Initialize application with a completely empty lab; the example is opt-in.')[1];
  assert.ok(startupCode, 'Explicit empty initialization is documented');
  assert.ok(!startupCode.includes('loadDefaultModelCircuit(labState)'), 'Startup does not load example');
  const start = indexHtml.indexOf("document.getElementById('btnStartOhmsExperiment')");
  assert.ok(start !== -1, 'Start experiment handler exists');
  const experimentHandler = indexHtml.slice(start, indexHtml.indexOf('document.querySelectorAll', start));
  assert.ok(!experimentHandler.includes('loadDefaultModelCircuit'), 'Opening experiment never pre-builds circuit');
  assert.equal(indexHtml.match(/loadDefaultModelCircuit\(labState\)/g)?.length, 1, 'Sample loads only in its explicit button');
});

test('REG-START-002: empty lab shows a builder hint and no invented measurements', () => {
  assert.ok(indexHtml.includes('id="emptyCanvasGuide"'));
  assert.ok(indexHtml.includes("labState.components.length === 0"));
  assert.ok(indexHtml.includes("circuitBadge.textContent = 'المختبر فارغ'"));
  assert.ok(indexHtml.includes("currentEl.textContent = '—'"));
  assert.ok(indexHtml.includes("vrEl.textContent = '—'"));
  assert.ok(!indexHtml.includes('قمنا بإعداد دائرة توالي قياسية لك'));
});

test('REG-START-003: sample is opt-in, overwrites require confirmation and reset is undoable', () => {
  assert.ok(indexHtml.includes('id="btnReloadDefault"'));
  assert.ok(indexHtml.includes('id="btnClearCircuit"'));
  assert.ok(indexHtml.includes("document.getElementById('btnReloadDefault')?.addEventListener('click'"));
  assert.ok(indexHtml.includes("window.confirm('سيتم استبدال دائرتك"));
  assert.ok(indexHtml.includes('clearCircuit(labState)'));
  assert.ok(indexHtml.includes('يمكنك التراجع عن هذه الخطوة'));
});
