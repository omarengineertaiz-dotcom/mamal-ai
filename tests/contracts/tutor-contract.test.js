import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalMockTutorAdapter, EDITS_PER_LEVEL } from '../../src/integrations/tutor/mock-adapter.js';

test('CONTRACT-001: Tutor candidate request v1.0.0 produces valid response matching contract', async () => {
  const adapter = new LocalMockTutorAdapter(1);

  const request = {
    contractVersion: '1.0.0',
    requestId: 'test-req-001',
    snapshotRevision: 1,
    experimentId: 'ohms-law-led',
    stepId: 'run',
    locale: 'ar',
    evidence: {
      modelVersion: '1.0.0',
      status: 'valid',
      diagnostics: [{ code: 'OK', affectedIds: [] }],
      measurements: {
        sourceVoltageV: 5.0,
        circuitCurrentA: 0.0090909,
        resistorVoltageV: 3.0,
        ledForwardVoltageV: 2.0,
      },
      knownComponentIds: ['bat-1', 'res-1', 'led-1', 'sw-1'],
    },
  };

  const response = await adapter.getHint(request);

  assert.equal(response.contractVersion, '1.0.0');
  assert.equal(response.requestId, 'test-req-001');
  assert.equal(response.snapshotRevision, 1);
  assert.ok(response.message.length > 0);
  assert.equal(typeof response.message, 'string');
});

test('CONTRACT-002: Stale snapshot revision is rejected with StaleRevisionError', async () => {
  const adapter = new LocalMockTutorAdapter(5); // Current revision is 5

  const staleRequest = {
    contractVersion: '1.0.0',
    requestId: 'stale-req-002',
    snapshotRevision: 3, // Stale revision 3 < 5
    experimentId: 'ohms-law-led',
    stepId: 'run',
    locale: 'ar',
    evidence: {
      modelVersion: '1.0.0',
      status: 'open',
      diagnostics: [{ code: 'OPEN_CIRCUIT', affectedIds: [] }],
      measurements: {
        sourceVoltageV: 5.0,
        circuitCurrentA: 0,
        resistorVoltageV: null,
        ledForwardVoltageV: null,
      },
      knownComponentIds: ['bat-1'],
    },
  };

  await assert.rejects(
    async () => {
      await adapter.getHint(staleRequest);
    },
    {
      name: 'Error',
      message: /StaleRevisionError/,
    }
  );
});

test('CONTRACT-004: Unknown component IDs in suggestedAction are sanitized and dropped', async () => {
  const adapter = new LocalMockTutorAdapter(1);

  const request = {
    contractVersion: '1.0.0',
    requestId: 'unknown-id-req',
    snapshotRevision: 1,
    experimentId: 'ohms-law-led',
    stepId: 'run',
    locale: 'ar',
    evidence: {
      modelVersion: '1.0.0',
      status: 'unsafe',
      diagnostics: [{ code: 'SOURCE_SHORT', affectedIds: ['bat-1'] }],
      measurements: {
        sourceVoltageV: 5.0,
        circuitCurrentA: null,
        resistorVoltageV: null,
        ledForwardVoltageV: null,
      },
      knownComponentIds: ['other-component-only'], // 'battery-1' not in known list!
    },
  };

  const response = await adapter.getHint(request);

  // Suggested action should be dropped because battery-1 is not in knownComponentIds
  assert.equal(response.suggestedAction, undefined);
});

// ---------------------------------------------------------------------------
// Socratic hint ladder
// ---------------------------------------------------------------------------
function req(code, revision, extra = {}) {
  return {
    contractVersion: '1.0.0',
    requestId: `req-${code}-${revision}`,
    snapshotRevision: revision,
    experimentId: 'ohms-law-led',
    stepId: 'run',
    locale: 'ar',
    evidence: {
      modelVersion: '1.0.0',
      status: code === 'OK' ? 'valid' : 'unsafe',
      diagnostics: [{ code, affectedIds: extra.affectedIds ?? ['led-1'] }],
      measurements: {
        sourceVoltageV: 5.0,
        circuitCurrentA: code === 'OK' ? 0.0090909 : null,
        resistorVoltageV: code === 'OK' ? 3.0 : null,
        ledForwardVoltageV: null,
        ...(extra.measurements ?? {}),
      },
      knownComponentIds: extra.known ?? ['bat-1', 'res-1', 'led-1', 'sw-1'],
    },
  };
}

test('CONTRACT-005: first hint for a mistake is a question that does not give the fix', async () => {
  const cases = {
    MISSING_RESISTOR: /330/,
    REVERSED_LED: /بدّل اتجاه|بدل اتجاه/,
    SWITCH_OPEN: /اضغط/,
    SOURCE_SHORT: /احذف/,
    BYPASSED_RESISTOR: /احذف/,
  };
  for (const [code, fixPattern] of Object.entries(cases)) {
    const adapter = new LocalMockTutorAdapter(1);
    const { message } = await adapter.getHint(req(code, 1));
    assert.ok(message.includes('؟'), `${code}: level-0 hint is a question`);
    assert.ok(!fixPattern.test(message), `${code}: level-0 hint does not state the fix`);
  }
});

test('CONTRACT-006: hint becomes more direct only after repeated edits with the same problem', async () => {
  const adapter = new LocalMockTutorAdapter(1);
  const m0 = (await adapter.getHint(req('MISSING_RESISTOR', 1))).message;
  // Re-rendering the same revision (e.g. selecting a part) must not escalate.
  assert.equal((await adapter.getHint(req('MISSING_RESISTOR', 1))).message, m0);
  // Fewer edits than the threshold: still the same question.
  let rev = 1;
  for (let i = 1; i < EDITS_PER_LEVEL; i++) {
    assert.equal((await adapter.getHint(req('MISSING_RESISTOR', ++rev))).message, m0, `after ${i} edit(s)`);
  }
  const m1 = (await adapter.getHint(req('MISSING_RESISTOR', ++rev))).message; // threshold reached -> level 1
  assert.notEqual(m1, m0);
  assert.doesNotMatch(m1, /330Ω ثم/, 'level 1 still does not state the fix');
  let last = m1;
  for (let i = 0; i < EDITS_PER_LEVEL; i++) last = (await adapter.getHint(req('MISSING_RESISTOR', ++rev))).message;
  assert.match(last, /330/, 'level 2 states the fix');
  const beyond = (await adapter.getHint(req('MISSING_RESISTOR', ++rev))).message;
  assert.equal(beyond, last, 'ladder stops at level 2');
});

test('CONTRACT-007: ladder resets when the diagnosis changes or the circuit becomes valid', async () => {
  const adapter = new LocalMockTutorAdapter(1);
  let rev = 1;
  await adapter.getHint(req('REVERSED_LED', rev));
  for (let i = 0; i < EDITS_PER_LEVEL; i++) await adapter.getHint(req('REVERSED_LED', ++rev));
  const escalated = (await adapter.getHint(req('REVERSED_LED', rev))).message;
  const fresh = (await new LocalMockTutorAdapter(1).getHint(req('REVERSED_LED', 1))).message;
  assert.notEqual(escalated, fresh);
  const other = await adapter.getHint(req('SWITCH_OPEN', rev + 1));
  assert.equal(other.message, (await new LocalMockTutorAdapter(1).getHint(req('SWITCH_OPEN', 1))).message);
  await adapter.getHint(req('OK', rev + 2));
  assert.equal((await adapter.getHint(req('REVERSED_LED', rev + 3))).message, fresh, 'after OK the ladder starts over');
});

test('CONTRACT-008: highlight targets the affected component, only once the student is stuck, and only if known', async () => {
  const adapter = new LocalMockTutorAdapter(1);
  const first = await adapter.getHint(req('SWITCH_OPEN', 1, { affectedIds: ['sw-1'] }));
  assert.equal(first.suggestedAction, undefined, 'no pointing at the answer on the first hint');
  let stuck;
  for (let r = 2; r <= 1 + EDITS_PER_LEVEL; r++) stuck = await adapter.getHint(req('SWITCH_OPEN', r, { affectedIds: ['sw-1'] }));
  assert.deepEqual(stuck.suggestedAction, { kind: 'highlight', targetId: 'sw-1' });

  const unknown = new LocalMockTutorAdapter(1);
  let dropped;
  for (let r = 1; r <= 1 + EDITS_PER_LEVEL; r++) dropped = await unknown.getHint(req('SWITCH_OPEN', r, { affectedIds: ['sw-1'], known: ['bat-1'] }));
  assert.equal(dropped.suggestedAction, undefined);
});

test('CONTRACT-009: success message asks the student to verify with Ohm\'s law and every code has a hint', async () => {
  const ok = await new LocalMockTutorAdapter(1).getHint(req('OK', 1));
  assert.match(ok.message, /9\.1/);
  assert.ok(ok.message.includes('؟'));
  for (const code of ['BYPASSED_RESISTOR', 'OVERCURRENT', 'UNSUPPORTED_TOPOLOGY', 'INVALID_DATA', 'OPEN_CIRCUIT', 'UNKNOWN_CODE']) {
    const { message } = await new LocalMockTutorAdapter(1).getHint(req(code, 1));
    assert.ok(message && message.length > 10, `${code} has a hint`);
  }
  const noSource = await new LocalMockTutorAdapter(1).getHint(req('OPEN_CIRCUIT', 1, { measurements: { sourceVoltageV: null } }));
  assert.match(noSource.message, /يزوّد الدائرة بالطاقة/);
});

test('CONTRACT-010: an unfinished circuit (building) is not treated as "stuck" after a few edits', async () => {
  const adapter = new LocalMockTutorAdapter(1);
  const first = (await adapter.getHint(req('OPEN_CIRCUIT', 1))).message;
  // Adding 4 parts and 4 wires = 8 more revisions, all still an open circuit.
  let last = first;
  for (let rev = 2; rev <= 9; rev++) last = (await adapter.getHint(req('OPEN_CIRCUIT', rev))).message;
  assert.equal(last, first, 'still the gentle question after normal building');
  let stuck = last;
  for (let rev = 10; rev <= 25; rev++) stuck = (await adapter.getHint(req('OPEN_CIRCUIT', rev))).message;
  assert.notEqual(stuck, first, 'a long time without progress eventually gets more help');
});
