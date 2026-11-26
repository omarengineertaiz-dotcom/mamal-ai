import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../../src/domain/circuit/solver.js';

function createValidSeriesSnapshot() {
  return {
    schemaVersion: 1,
    experimentId: 'ohms-law-led',
    revision: 1,
    components: [
      {
        id: 'bat-1',
        kind: 'dc_source',
        name: 'بطارية',
        position: { x: 0, y: 0 },
        rotation: 0,
        voltageV: 5.0,
        ports: [
          { id: 'p_bat_pos', componentId: 'bat-1', role: 'positive', label: '+' },
          { id: 'p_bat_neg', componentId: 'bat-1', role: 'negative', label: '-' },
        ],
      },
      {
        id: 'res-1',
        kind: 'resistor',
        name: 'مقاومة',
        position: { x: 100, y: 0 },
        rotation: 0,
        resistanceOhms: 330.0,
        ports: [
          { id: 'p_res_a', componentId: 'res-1', role: 'terminal_a', label: '1' },
          { id: 'p_res_b', componentId: 'res-1', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'led-1',
        kind: 'led',
        name: 'صمام',
        position: { x: 200, y: 0 },
        rotation: 0,
        forwardVoltageV: 2.0,
        maxCurrentA: 0.02,
        ports: [
          { id: 'p_led_anode', componentId: 'led-1', role: 'anode', label: 'A' },
          { id: 'p_led_cathode', componentId: 'led-1', role: 'cathode', label: 'K' },
        ],
      },
      {
        id: 'sw-1',
        kind: 'switch',
        name: 'مفتاح',
        position: { x: 300, y: 0 },
        rotation: 0,
        isOpen: false,
        ports: [
          { id: 'p_sw_a', componentId: 'sw-1', role: 'terminal_a', label: '1' },
          { id: 'p_sw_b', componentId: 'sw-1', role: 'terminal_b', label: '2' },
        ],
      },
    ],
    wires: [
      { id: 'w1', fromPortId: 'p_bat_pos', toPortId: 'p_res_a' },
      { id: 'w2', fromPortId: 'p_res_b', toPortId: 'p_led_anode' },
      { id: 'w3', fromPortId: 'p_led_cathode', toPortId: 'p_sw_a' },
      { id: 'w4', fromPortId: 'p_sw_b', toPortId: 'p_bat_neg' },
    ],
  };
}

test('CIR-001: 5V source + 330Ω + 2V LED + closed switch produces ~9.09mA and LED ON', () => {
  const snapshot = createValidSeriesSnapshot();
  const res = simulate(snapshot);

  assert.equal(res.status, 'valid');
  assert.equal(res.ledOn, true);
  assert.ok(res.values.circuitCurrentA !== null);
  // (5 - 2) / 330 = 0.0090909...
  const currentDiff = Math.abs(res.values.circuitCurrentA - 0.0090909);
  assert.ok(currentDiff < 0.0001, `Expected current ~0.00909A, got ${res.values.circuitCurrentA}`);
  assert.equal(res.values.resistorVoltageV, 3);
  assert.equal(res.values.ledForwardVoltageV, 2);
  assert.equal(res.diagnostics[0]?.code, 'OK');
});

test('CIR-002: Same circuit with open switch yields 0A current and LED OFF', () => {
  const snapshot = createValidSeriesSnapshot();
  const sw = snapshot.components.find(c => c.kind === 'switch');
  sw.isOpen = true;

  const res = simulate(snapshot);
  assert.equal(res.status, 'open');
  assert.equal(res.ledOn, false);
  assert.equal(res.values.circuitCurrentA, 0);
  assert.equal(res.diagnostics[0]?.code, 'SWITCH_OPEN');
});

test('CIR-003: LED reversed cathode-to-positive yields LED OFF and REVERSED_LED', () => {
  const snapshot = createValidSeriesSnapshot();
  // Reverse LED wiring
  snapshot.wires = [
    { id: 'w1', fromPortId: 'p_bat_pos', toPortId: 'p_led_cathode' },
    { id: 'w2', fromPortId: 'p_led_anode', toPortId: 'p_res_a' },
    { id: 'w3', fromPortId: 'p_res_b', toPortId: 'p_sw_a' },
    { id: 'w4', fromPortId: 'p_sw_b', toPortId: 'p_bat_neg' },
  ];

  const res = simulate(snapshot);
  assert.equal(res.status, 'open');
  assert.equal(res.ledOn, false);
  assert.equal(res.values.circuitCurrentA, 0);
  assert.equal(res.diagnostics[0]?.code, 'REVERSED_LED');
});

test('CIR-004: Missing protection resistor triggers MISSING_RESISTOR, unsafe, null current', () => {
  const snapshot = createValidSeriesSnapshot();
  snapshot.components = snapshot.components.filter(c => c.kind !== 'resistor');
  snapshot.wires = [
    { id: 'w1', fromPortId: 'p_bat_pos', toPortId: 'p_led_anode' },
    { id: 'w2', fromPortId: 'p_led_cathode', toPortId: 'p_sw_a' },
    { id: 'w3', fromPortId: 'p_sw_b', toPortId: 'p_bat_neg' },
  ];

  const res = simulate(snapshot);
  assert.equal(res.status, 'unsafe');
  assert.equal(res.values.circuitCurrentA, null);
  assert.equal(res.ledOn, false);
  assert.equal(res.diagnostics[0]?.code, 'MISSING_RESISTOR');
});

test('CIR-005: Resistor bypassed electrically triggers BYPASSED_RESISTOR, unsafe, null current', () => {
  const snapshot = createValidSeriesSnapshot();
  // Add direct bypass wire between resistor terminals
  snapshot.wires.push({ id: 'w_bypass', fromPortId: 'p_res_a', toPortId: 'p_res_b' });

  const res = simulate(snapshot);
  assert.equal(res.status, 'unsafe');
  assert.equal(res.values.circuitCurrentA, null);
  assert.equal(res.ledOn, false);
  assert.equal(res.diagnostics[0]?.code, 'BYPASSED_RESISTOR');
});

test('CIR-006: Wire disconnected yields OPEN_CIRCUIT and LED OFF', () => {
  const snapshot = createValidSeriesSnapshot();
  snapshot.wires.pop(); // Remove one wire

  const res = simulate(snapshot);
  assert.equal(res.status, 'open');
  assert.equal(res.ledOn, false);
  assert.equal(res.values.circuitCurrentA, 0);
  assert.equal(res.diagnostics[0]?.code, 'OPEN_CIRCUIT');
});

test('CIR-007: Direct terminal short circuit triggers SOURCE_SHORT, unsafe, null current', () => {
  const snapshot = createValidSeriesSnapshot();
  // Add wire shorting positive to negative directly
  snapshot.wires.push({ id: 'w_short', fromPortId: 'p_bat_pos', toPortId: 'p_bat_neg' });

  const res = simulate(snapshot);
  assert.equal(res.status, 'unsafe');
  assert.equal(res.values.circuitCurrentA, null);
  assert.equal(res.ledOn, false);
  assert.equal(res.diagnostics[0]?.code, 'SOURCE_SHORT');
});

test('CIR-009: 100Ω low resistor triggers OVERCURRENT warning and unsafe status', () => {
  const snapshot = createValidSeriesSnapshot();
  const resComp = snapshot.components.find(c => c.kind === 'resistor');
  resComp.resistanceOhms = 100.0;

  const res = simulate(snapshot);
  assert.equal(res.status, 'unsafe');
  assert.equal(res.ledOn, false); // Must NOT be displayed as safe ON
  // (5 - 2) / 100 = 0.030A = 30mA > 20mA limit
  assert.equal(res.values.circuitCurrentA, null); // Suppressed as unsafe; warning carries the theoretical estimate.
  assert.equal(res.values.resistorVoltageV, null);
  assert.equal(res.values.ledForwardVoltageV, null);
  assert.equal(res.diagnostics[0]?.code, 'OVERCURRENT');
});

test('CIR-012: Invalid or negative resistor value triggers INVALID_DATA', () => {
  const snapshot = createValidSeriesSnapshot();
  const resComp = snapshot.components.find(c => c.kind === 'resistor');
  resComp.resistanceOhms = -50;

  const res = simulate(snapshot);
  assert.equal(res.status, 'unsupported');
  assert.equal(res.values.circuitCurrentA, null);
  assert.equal(res.diagnostics[0]?.code, 'INVALID_DATA');
});

test('CIR-015: Determinism check: 100 runs on identical snapshot return exact same values', () => {
  const snapshot = createValidSeriesSnapshot();
  const baseline = simulate(snapshot);

  for (let i = 0; i < 100; i++) {
    const iter = simulate(snapshot);
    assert.deepEqual(iter, baseline);
  }
});

test('CIR-017: Safety invariant: LED is NEVER on when status is unsafe or switch is open', () => {
  // Test case 1: switch open
  const openSnap = createValidSeriesSnapshot();
  openSnap.components.find(c => c.kind === 'switch').isOpen = true;
  assert.equal(simulate(openSnap).ledOn, false);

  // Test case 2: short circuit
  const shortSnap = createValidSeriesSnapshot();
  shortSnap.wires.push({ id: 'ws', fromPortId: 'p_bat_pos', toPortId: 'p_bat_neg' });
  assert.equal(simulate(shortSnap).ledOn, false);

  // Test case 3: missing resistor
  const noResSnap = createValidSeriesSnapshot();
  noResSnap.components = noResSnap.components.filter(c => c.kind !== 'resistor');
  assert.equal(simulate(noResSnap).ledOn, false);
});

test('REG-001: two independent loops cannot be classified as a powered LED circuit', () => {
  const s = createValidSeriesSnapshot();
  s.wires = [
    ['p_bat_pos', 'p_res_a'], ['p_res_b', 'p_bat_neg'],
    ['p_led_anode', 'p_sw_a'], ['p_led_cathode', 'p_sw_b'],
  ].map(([fromPortId, toPortId], i) => ({ id: 'split-' + i, fromPortId, toPortId }));
  const result = simulate(s);
  assert.notEqual(result.status, 'valid');
  assert.equal(result.ledOn, false);
  assert.notEqual(result.diagnostics[0].code, 'OK');
});

test('REG-002: cathode fed via resistor is REVERSED_LED, even without direct battery wire', () => {
  const s = createValidSeriesSnapshot();
  s.wires = [
    ['p_bat_pos', 'p_res_a'], ['p_res_b', 'p_led_cathode'],
    ['p_led_anode', 'p_sw_a'], ['p_sw_b', 'p_bat_neg'],
  ].map(([fromPortId, toPortId], i) => ({ id: 'rev-' + i, fromPortId, toPortId }));
  const result = simulate(s);
  assert.equal(result.status, 'open');
  assert.equal(result.values.circuitCurrentA, 0);
  assert.equal(result.ledOn, false);
  assert.equal(result.diagnostics[0].code, 'REVERSED_LED');
});

test('REG-003: alternative correct component order and undirected wire orientations stay valid', () => {
  const s = createValidSeriesSnapshot();
  s.wires = [
    ['p_sw_a', 'p_bat_pos'], ['p_res_a', 'p_sw_b'],
    ['p_led_anode', 'p_res_b'], ['p_bat_neg', 'p_led_cathode'],
  ].map(([fromPortId, toPortId], i) => ({ id: 'order-' + i, fromPortId, toPortId }));
  const r = simulate(s);
  assert.equal(r.status, 'valid');
  assert.equal(r.ledOn, true);
});

test('REG-004: branch connecting three device terminals is UNSUPPORTED_TOPOLOGY', () => {
  const s = createValidSeriesSnapshot();
  s.wires.push({ id: 'branch', fromPortId: 'p_bat_pos', toPortId: 'p_sw_a' });
  const r = simulate(s);
  assert.equal(r.status, 'unsupported');
  assert.equal(r.values.circuitCurrentA, null);
  assert.equal(r.diagnostics[0].code, 'UNSUPPORTED_TOPOLOGY');
});

test('REG-005: indirect source short across two wires is unsafe and suppressed', () => {
  const s = createValidSeriesSnapshot();
  s.wires.push({ id: 'indirect-short', fromPortId: 'p_res_a', toPortId: 'p_bat_neg' });
  const r = simulate(s);
  assert.equal(r.status, 'unsafe');
  assert.equal(r.diagnostics[0].code, 'SOURCE_SHORT');
  assert.equal(r.values.circuitCurrentA, null);
});

test('REG-006: indirect wire-net bypass of resistor is unsafe', () => {
  const s = createValidSeriesSnapshot();
  s.wires.push({ id: 'bypass-via-shared-node', fromPortId: 'p_res_a', toPortId: 'p_led_anode' });
  const r = simulate(s);
  assert.equal(r.status, 'unsafe');
  assert.equal(r.diagnostics[0].code, 'BYPASSED_RESISTOR');
});

test('REG-007: missing physical return wire stays open, not valid', () => {
  const s = createValidSeriesSnapshot();
  s.wires = s.wires.filter(w => w.id !== 'w4');
  const r = simulate(s);
  assert.equal(r.status, 'open');
  assert.equal(r.values.circuitCurrentA, 0);
});

test('REG-008: all unsafe and unsupported calculations suppress measured numeric values', () => {
  const s = createValidSeriesSnapshot();
  s.components.find(c => c.kind === 'resistor').resistanceOhms = 100;
  const unsafe = simulate(s);
  assert.equal(unsafe.diagnostics[0].code, 'OVERCURRENT');
  assert.ok(Object.values(unsafe.values).every(v => v === null));
  s.components.find(c => c.kind === 'resistor').resistanceOhms = -1;
  const unsupported = simulate(s);
  assert.equal(unsupported.status, 'unsupported');
  assert.ok(Object.values(unsupported.values).every(v => v === null));
});

test('REG-009: malformed wire referencing unknown port is rejected, not silently used', () => {
  const s = createValidSeriesSnapshot();
  s.wires.push({ id: 'bad-wire', fromPortId: 'ghost', toPortId: 'p_bat_pos' });
  const r = simulate(s);
  assert.equal(r.status, 'unsupported');
  assert.equal(r.diagnostics[0].code, 'INVALID_DATA');
});

test('REG-010: duplicate source or extra component is not silently ignored', () => {
  const s = createValidSeriesSnapshot();
  const extra = structuredClone(s.components[0]);
  extra.id = 'bat-2';
  extra.ports = extra.ports.map(p => ({ ...p, id: 'extra-' + p.id, componentId: 'bat-2' }));
  s.components.push(extra);
  const r = simulate(s);
  assert.equal(r.status, 'unsupported');
  assert.equal(r.ledOn, false);
});

test('REG-011: orientation remains correct under all wire endpoint reversals', () => {
  const s = createValidSeriesSnapshot();
  s.wires = s.wires.map(w => ({ ...w, fromPortId: w.toPortId, toPortId: w.fromPortId }));
  assert.equal(simulate(s).status, 'valid');
});
