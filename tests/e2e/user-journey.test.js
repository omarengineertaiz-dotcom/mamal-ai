import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../../src/domain/circuit/solver.js';
import { resolveRoute, navigate } from '../../src/ui/router.js';
import {
  createInitialLabState,
  addComponent,
  moveComponent,
  commitMove,
  removeComponent,
  addWire,
  removeWire,
  clearAllWires,
  toggleSwitch,
  undo,
  redo,
  loadDefaultModelCircuit,
  toLabSnapshot,
} from '../../src/features/lab/lab-state.js';

test('E2E-001: Step 1 - Open Home view', () => {
  assert.equal(resolveRoute(''), 'home');
  assert.equal(resolveRoute('#/'), 'home');
  assert.equal(resolveRoute(null), 'home');
});

test('E2E-002: Step 2 - Navigate to Experiments view', () => {
  let navigatedTo = null;
  const resolved = navigate('experiments', {
    onNavigate: (to) => {
      navigatedTo = to;
    },
  });
  assert.equal(resolved, 'experiments');
  assert.equal(navigatedTo, 'experiments');
});

test('E2E-003: Step 3 - Start Ohm\'s Law and LED experiment in Lab', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);
  assert.equal(labState.components.length, 4);
  assert.equal(labState.wires.length, 4);
  assert.equal(resolveRoute('#/lab'), 'lab');
});

test('E2E-004: Step 4 - Add DC source, resistor, LED, and switch components', () => {
  const labState = createInitialLabState();
  assert.equal(labState.components.length, 0);

  addComponent(labState, {
    id: 'bat-1',
    kind: 'dc_source',
    name: 'بطارية (5V)',
    position: { x: 90, y: 150 },
    rotation: 0,
    voltageV: 5.0,
    ports: [
      { id: 'p_bat_pos', componentId: 'bat-1', role: 'positive', label: '+' },
      { id: 'p_bat_neg', componentId: 'bat-1', role: 'negative', label: '-' },
    ],
  });

  addComponent(labState, {
    id: 'res-1',
    kind: 'resistor',
    name: 'مقاومة (330Ω)',
    position: { x: 310, y: 100 },
    rotation: 0,
    resistanceOhms: 330.0,
    ports: [
      { id: 'p_res_a', componentId: 'res-1', role: 'terminal_a', label: '1' },
      { id: 'p_res_b', componentId: 'res-1', role: 'terminal_b', label: '2' },
    ],
  });

  addComponent(labState, {
    id: 'led-1',
    kind: 'led',
    name: 'صمام LED',
    position: { x: 530, y: 180 },
    rotation: 0,
    forwardVoltageV: 2.0,
    maxCurrentA: 0.02,
    ports: [
      { id: 'p_led_anode', componentId: 'led-1', role: 'anode', label: 'A' },
      { id: 'p_led_cathode', componentId: 'led-1', role: 'cathode', label: 'K' },
    ],
  });

  addComponent(labState, {
    id: 'sw-1',
    kind: 'switch',
    name: 'مفتاح تشغيل',
    position: { x: 310, y: 350 },
    rotation: 0,
    isOpen: false,
    ports: [
      { id: 'p_sw_a', componentId: 'sw-1', role: 'terminal_a', label: '1' },
      { id: 'p_sw_b', componentId: 'sw-1', role: 'terminal_b', label: '2' },
    ],
  });

  assert.equal(labState.components.length, 4);
});

test('E2E-005: Step 5 - Connect components with wires', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);
  // Clear wires and re-connect explicitly
  labState.wires = [];

  const w1 = addWire(labState, 'p_bat_pos', 'p_res_a');
  const w2 = addWire(labState, 'p_res_b', 'p_led_anode');
  const w3 = addWire(labState, 'p_led_cathode', 'p_sw_a');
  const w4 = addWire(labState, 'p_sw_b', 'p_bat_neg');

  assert.ok(w1 && w2 && w3 && w4);
  assert.equal(labState.wires.length, 4);
});

test('E2E-006: Step 6 - Run simulation on closed circuit', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  const snapshot = toLabSnapshot(labState);
  const result = simulate(snapshot);

  assert.equal(result.status, 'valid');
  assert.equal(result.ledOn, true);
});

test('E2E-007: Step 7 - Verify calculated current and voltage values', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  const result = simulate(toLabSnapshot(labState));
  // I = (5.0 - 2.0) / 330.0 = 0.0090909... A (~9.09 mA)
  assert.ok(Math.abs(result.values.circuitCurrentA - 0.00909) < 0.0001);
  // VR = 0.0090909 * 330 = 3.00 V
  assert.ok(Math.abs(result.values.resistorVoltageV - 3.0) < 0.001);
});

test('E2E-008: Step 8 - Toggle switch open and close', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  // Toggle open
  toggleSwitch(labState);
  let result = simulate(toLabSnapshot(labState));
  assert.equal(result.status, 'open');
  assert.equal(result.ledOn, false);
  assert.equal(result.values.circuitCurrentA, 0);

  // Toggle close
  toggleSwitch(labState);
  result = simulate(toLabSnapshot(labState));
  assert.equal(result.status, 'valid');
  assert.equal(result.ledOn, true);
});

test('E2E-009: Step 9 - Reverse LED polarity and verify REVERSED_LED fault', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  // Wire cathode to battery positive terminal
  labState.wires = [
    { id: 'w1', fromPortId: 'p_bat_pos', toPortId: 'p_led_cathode' },
    { id: 'w2', fromPortId: 'p_led_anode', toPortId: 'p_res_a' },
    { id: 'w3', fromPortId: 'p_res_b', toPortId: 'p_sw_a' },
    { id: 'w4', fromPortId: 'p_sw_b', toPortId: 'p_bat_neg' },
  ];

  const result = simulate(toLabSnapshot(labState));
  assert.equal(result.status, 'open');
  assert.equal(result.ledOn, false);
  assert.equal(result.values.circuitCurrentA, 0);
  assert.ok(result.diagnostics.some((d) => d.code === 'REVERSED_LED'));
});

test('E2E-010: Step 10 - Remove protection resistor and discover MISSING_RESISTOR', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  // Remove resistor component entirely
  removeComponent(labState, 'res-1');

  // Direct connection from battery to LED anode
  addWire(labState, 'p_bat_pos', 'p_led_anode');

  const result = simulate(toLabSnapshot(labState));
  assert.equal(result.status, 'unsafe');
  assert.equal(result.ledOn, false);
  assert.equal(result.values.circuitCurrentA, null);
  assert.ok(result.diagnostics.some((d) => d.code === 'MISSING_RESISTOR'));
});

test('E2E-011: Step 11 - Bypass resistor with wire and discover BYPASSED_RESISTOR', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  // Short resistor terminals 1 & 2
  labState.wires.push({ id: 'w_bypass', fromPortId: 'p_res_a', toPortId: 'p_res_b' });

  const result = simulate(toLabSnapshot(labState));
  assert.equal(result.status, 'unsafe');
  assert.equal(result.ledOn, false);
  assert.equal(result.values.circuitCurrentA, null);
  assert.ok(result.diagnostics.some((d) => d.code === 'BYPASSED_RESISTOR'));
});

test('E2E-012: Step 12 - Cause open circuit by removing wire', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  // Remove w1
  removeWire(labState, 'w1');

  const result = simulate(toLabSnapshot(labState));
  assert.equal(result.status, 'open');
  assert.equal(result.ledOn, false);
  assert.equal(result.values.circuitCurrentA, 0);
  assert.ok(result.diagnostics.some((d) => d.code === 'OPEN_CIRCUIT'));
});

test('E2E-013: Step 13 - Direct source short circuit and discover SOURCE_SHORT', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  // Direct short wire across battery terminals
  labState.wires.push({ id: 'w_short', fromPortId: 'p_bat_pos', toPortId: 'p_bat_neg' });

  const result = simulate(toLabSnapshot(labState));
  assert.equal(result.status, 'unsafe');
  assert.equal(result.ledOn, false);
  assert.equal(result.values.circuitCurrentA, null);
  assert.ok(result.diagnostics.some((d) => d.code === 'SOURCE_SHORT'));
});

test('E2E-014: Step 14 - Move components with clamping and update coordinates', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  const prevPos = { x: 310, y: 100 };
  const moved = moveComponent(labState, 'res-1', { x: 400, y: 150 });
  assert.equal(moved, true);

  commitMove(labState, prevPos, { x: 400, y: 150 }, 'res-1');
  const comp = labState.components.find((c) => c.id === 'res-1');
  assert.equal(comp.position.x, 400);
  assert.equal(comp.position.y, 150);

  // Verify boundary clamping
  moveComponent(labState, 'res-1', { x: 9999, y: 9999 });
  assert.equal(comp.position.x, 670); // Clamped
  assert.equal(comp.position.y, 470); // Clamped
});

test('E2E-015: Step 15 - Delete component with cascading wire deletion', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);
  assert.equal(labState.wires.length, 4);

  // Deleting resistor cascades to delete w1 and w2
  const removed = removeComponent(labState, 'res-1');
  assert.equal(removed, true);
  assert.equal(labState.components.length, 3);
  assert.equal(labState.wires.length, 2);
  assert.ok(!labState.wires.some((w) => w.fromPortId === 'p_res_a' || w.toPortId === 'p_res_a'));
  assert.ok(!labState.wires.some((w) => w.fromPortId === 'p_res_b' || w.toPortId === 'p_res_b'));
});

test('E2E-016: Step 16 - Undo and Redo operations with monotonic revision increment', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  const rev1 = labState.revision;
  removeComponent(labState, 'res-1');
  assert.equal(labState.components.length, 3);
  assert.equal(labState.revision, rev1 + 1);

  // Undo
  undo(labState);
  assert.equal(labState.components.length, 4);
  assert.ok(labState.revision > rev1 + 1, 'Undo increments revision monotonically');

  // Redo
  const rev2 = labState.revision;
  redo(labState);
  assert.equal(labState.components.length, 3);
  assert.ok(labState.revision > rev2, 'Redo increments revision monotonically');
});

test('E2E-017: Step 17 - Navigate between pages and return to Lab without losing circuit', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  // Transient port selection before navigation
  labState.selectedPortId = 'p_bat_pos';

  let activeRoute = 'lab';
  const routerHooks = {
    beforeNavigate: (from, to) => {
      if ((from === 'lab' || activeRoute === 'lab') && to !== 'lab') {
        // Reset transient selection safely
        labState.selectedPortId = null;
      }
      return true;
    },
    onNavigate: (to) => {
      activeRoute = to;
    },
  };

  // Navigate to Guide
  navigate('guide', routerHooks);
  assert.equal(activeRoute, 'guide');
  assert.equal(labState.selectedPortId, null); // Transient cleared
  assert.equal(labState.components.length, 4); // Circuit preserved!
  assert.equal(labState.wires.length, 4); // Wires preserved!

  // Return to Lab
  navigate('lab', routerHooks);
  assert.equal(activeRoute, 'lab');
  assert.equal(labState.components.length, 4);
  assert.equal(labState.wires.length, 4);
});

test('E2E-018: Step 18 - Verify state persistence and simulation consistency across re-entry', () => {
  const labState = createInitialLabState();
  loadDefaultModelCircuit(labState);

  // Move a component and toggle switch
  moveComponent(labState, 'bat-1', { x: 120, y: 160 });
  toggleSwitch(labState);

  // Check state
  const bat = labState.components.find((c) => c.id === 'bat-1');
  const sw = labState.components.find((c) => c.id === 'sw-1');
  assert.equal(bat.position.x, 120);
  assert.equal(bat.position.y, 160);
  assert.equal(sw.isOpen, true);

  // Simulated state is open circuit
  let sim = simulate(toLabSnapshot(labState));
  assert.equal(sim.status, 'open');

  // Switch back
  toggleSwitch(labState);
  sim = simulate(toLabSnapshot(labState));
  assert.equal(sim.status, 'valid');
  assert.equal(sim.ledOn, true);
  assert.ok(Math.abs(sim.values.circuitCurrentA - 0.00909) < 0.0001);
});
