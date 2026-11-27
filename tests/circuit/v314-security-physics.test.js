import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateExtended } from '../../src/domain/circuit/extended-solver.js';
import {
  sanitizeHexColor,
  sanitizeWireColor,
  validateAndSanitizeCircuitPayload,
} from '../../src/features/lab/import-sanitizer.js';
import { getSchematicSymbolMarkup } from '../../src/features/lab/presets.js';
import { handler as tutorHandler } from '../../netlify/functions/tutor.js';

function makeCircuitWithLed({ reversed = false, sourceV = 5, r1 = 330, r2 = 330 } = {}) {
  const components = [
    {
      id: 'src1', kind: 'dc_source', name: 'DC 5V', voltageV: sourceV,
      ports: [{ id: 'src1_pos', role: 'pos', label: '+' }, { id: 'src1_neg', role: 'neg', label: '-' }],
    },
    {
      id: 'r1', kind: 'resistor', name: 'R1', resistanceOhms: r1,
      ports: [{ id: 'r1_1', role: 'p1', label: '1' }, { id: 'r1_2', role: 'p2', label: '2' }],
    },
    {
      id: 'r2', kind: 'resistor', name: 'R2', resistanceOhms: r2,
      ports: [{ id: 'r2_1', role: 'p1', label: '1' }, { id: 'r2_2', role: 'p2', label: '2' }],
    },
    {
      id: 'led1', kind: 'led', name: 'LED', forwardVoltageV: 2.0, maxCurrentA: 0.02, ledColor: '#FF4D4F',
      ports: [{ id: 'led1_a', role: 'anode', label: 'A' }, { id: 'led1_k', role: 'cathode', label: 'K' }],
    },
  ];
  const ledIn = reversed ? 'led1_k' : 'led1_a';
  const ledOut = reversed ? 'led1_a' : 'led1_k';
  const wires = [
    { id: 'w1', fromPortId: 'src1_pos', toPortId: 'r1_1' },
    { id: 'w2', fromPortId: 'r1_2', toPortId: 'r2_1' },
    { id: 'w3', fromPortId: 'r2_2', toPortId: ledIn },
    { id: 'w4', fromPortId: ledOut, toPortId: 'src1_neg' },
  ];
  return { components, wires };
}

test('V314-PHYS-001: Extended solver blocks reversed LED in multi-resistor circuit', () => {
  const res = simulateExtended(makeCircuitWithLed({ reversed: true, sourceV: 5, r1: 330, r2: 330 }));
  assert.equal(res.status, 'open');
  assert.equal(res.ledOn, false);
  assert.equal(res.activeCompIds.includes('led1'), false);
  assert.equal(res.diagnostics.some((d) => d.code === 'REVERSED_LED'), true);
});

test('V314-PHYS-002: Extended solver lights forward-biased LED with realistic Vf drop', () => {
  const res = simulateExtended(makeCircuitWithLed({ reversed: false, sourceV: 5, r1: 330, r2: 330 }));
  assert.equal(res.status, 'valid');
  assert.equal(res.ledOn, true);
  assert.equal(res.activeCompIds.includes('led1'), true);
  assert.equal(res.values.ledForwardVoltageV, 2.0);
  // I ≈ (5 - 2) / (330 + 330 + 10) ≈ 4.48 mA
  assert.ok(res.values.circuitCurrentA > 0.004 && res.values.circuitCurrentA < 0.005);
});

test('V314-PHYS-003: Extended solver keeps LED OFF when Vs < Vf', () => {
  const res = simulateExtended(makeCircuitWithLed({ reversed: false, sourceV: 1.5, r1: 330, r2: 330 }));
  assert.equal(res.status, 'open');
  assert.equal(res.ledOn, false);
  assert.equal(res.activeCompIds.includes('led1'), false);
});

test('V314-PHYS-004: Extended solver reports scientific modelNotes for AC/C/L components', () => {
  const res = simulateExtended({
    components: [
      { id: 'ac1', kind: 'ac_source', name: 'AC 12V', voltageV: 12, ports: [{ id: 'a1', role: 'pos' }, { id: 'a2', role: 'neg' }] },
      { id: 'c1', kind: 'capacitor', name: 'C', capacitanceF: 1e-4, ports: [{ id: 'c1_1' }, { id: 'c1_2' }] },
    ],
    wires: [{ id: 'w1', fromPortId: 'a1', toPortId: 'c1_1' }, { id: 'w2', fromPortId: 'c1_2', toPortId: 'a2' }],
  });
  assert.equal(res.modelNotes.length, 2);
});

test('V314-SEC-001: Sanitizer blocks SVG/XSS injection in ledColor and wireColors', () => {
  const maliciousPayload = {
    name: '<script>alert(1)</script>My Circuit',
    components: [
      {
        id: 'led1', kind: 'led', name: '<b>LED</b>',
        ledColor: '#FF0000" onload="alert(1)',
        position: { x: 100, y: 100 },
        ports: [{ id: 'p1', role: 'anode', label: 'A' }, { id: 'p2', role: 'cathode', label: 'K' }],
      },
      {
        id: 'evil1', kind: 'injected_script', name: 'Evil',
        position: { x: 0, y: 0 }, ports: [],
      },
    ],
    wires: [{ id: 'w1', fromPortId: 'p1', toPortId: 'p2' }],
    wireColors: { w1: 'red" onmouseover="alert(1)' },
  };

  const clean = validateAndSanitizeCircuitPayload(maliciousPayload);
  assert.equal(clean.components.length, 1);
  assert.equal(clean.components[0].ledColor, '#FF4D4F');
  assert.equal(clean.wireColors.w1, undefined);
  assert.equal(clean.name.includes('<script>'), false);

  const svg = getSchematicSymbolMarkup({ kind: 'led', ledColor: '#000" onclick="alert(1)' }, true);
  assert.equal(svg.includes('onclick'), false);
  assert.equal(sanitizeHexColor('#22C55E'), '#22C55E');
  assert.equal(sanitizeWireColor('javascript:alert(1)'), '');
});

test('V314-TUTOR-001: Tutor function enforces CORS allowlist, method check, and payload size limit', async () => {
  const badMethod = await tutorHandler({ httpMethod: 'GET', headers: { origin: 'https://mamal-ai.netlify.app' } });
  assert.equal(badMethod.statusCode, 405);

  const badOrigin = await tutorHandler({
    httpMethod: 'POST',
    headers: { origin: 'https://evil-site.example' },
    body: '{}',
  });
  assert.equal(badOrigin.statusCode, 403);
  assert.equal(badOrigin.headers['Access-Control-Allow-Origin'], undefined);

  const hugeBody = await tutorHandler({
    httpMethod: 'POST',
    headers: { origin: 'https://mamal-ai.netlify.app' },
    body: JSON.stringify({ question: 'x'.repeat(30000) }),
  });
  assert.equal(hugeBody.statusCode, 413);
  assert.equal(hugeBody.headers['Access-Control-Allow-Origin'], 'https://mamal-ai.netlify.app');
});
