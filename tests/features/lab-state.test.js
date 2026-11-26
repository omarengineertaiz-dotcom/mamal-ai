import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialLabState,
  addComponent,
  moveComponent,
  commitMove,
  removeComponent,
  addWire,
  removeWire,
  clearAllWires,
  clearCircuit,
  toggleSwitch,
  undo,
  redo,
  loadDefaultModelCircuit,
  toLabSnapshot,
  MAX_HISTORY,
} from '../../src/features/lab/lab-state.js';
import { simulate } from '../../src/domain/circuit/solver.js';

test('LAB-001: createInitialLabState initializes empty state with revision 1', () => {
  const state = createInitialLabState();
  assert.equal(state.revision, 1);
  assert.equal(state.components.length, 0);
  assert.equal(state.wires.length, 0);
  assert.equal(state.selectedComponentId, null);
  assert.equal(state.history.length, 0);
  assert.equal(state.future.length, 0);
});

test('LAB-002: addComponent adds component, selects it, and increments revision', () => {
  const state = createInitialLabState();
  const battery = {
    id: 'bat-1',
    kind: 'dc_source',
    name: 'بطارية',
    position: { x: 50, y: 50 },
    rotation: 0,
    voltageV: 5.0,
    ports: [
      { id: 'p1', componentId: 'bat-1', role: 'positive', label: '+' },
      { id: 'p2', componentId: 'bat-1', role: 'negative', label: '-' },
    ],
  };

  addComponent(state, battery);
  assert.equal(state.components.length, 1);
  assert.equal(state.components[0].id, 'bat-1');
  assert.equal(state.selectedComponentId, 'bat-1');
  assert.equal(state.revision, 2);
  assert.equal(state.history.length, 1);
});

test('LAB-003: moveComponent clamps coordinates to boundary limits', () => {
  const state = createInitialLabState();
  addComponent(state, {
    id: 'res-1',
    kind: 'resistor',
    name: 'مقاومة',
    position: { x: 100, y: 100 },
    rotation: 0,
    resistanceOhms: 330,
    ports: [],
  });

  // Test inside bounds
  const moved = moveComponent(state, 'res-1', { x: 250, y: 300 });
  assert.equal(moved, true);
  assert.equal(state.components[0].position.x, 250);
  assert.equal(state.components[0].position.y, 300);

  // Test clamp beyond max
  moveComponent(state, 'res-1', { x: 9999, y: 9999 });
  assert.equal(state.components[0].position.x, 670);
  assert.equal(state.components[0].position.y, 470);

  // Test clamp below min
  moveComponent(state, 'res-1', { x: -500, y: -500 });
  assert.equal(state.components[0].position.x, 10);
  assert.equal(state.components[0].position.y, 10);
});

test('LAB-004: commitMove commits drag end to history stack only on actual movement', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);
  const initialHistoryLen = state.history.length;
  const initialRev = state.revision;

  // Move component
  state.selectedComponentId = 'bat-1';
  commitMove(state, { x: 90, y: 150 }, { x: 120, y: 180 });

  assert.equal(state.history.length, initialHistoryLen + 1);
  assert.equal(state.revision, initialRev + 1);

  // Attempt commit with identical position (no movement) -> should not push history
  const lenBefore = state.history.length;
  commitMove(state, { x: 120, y: 180 }, { x: 120, y: 180 });
  assert.equal(state.history.length, lenBefore);
});

test('LAB-005: removeComponent cascades and removes all attached wires without orphans', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);

  // In default circuit: 4 components, 4 wires
  assert.equal(state.components.length, 4);
  assert.equal(state.wires.length, 4);

  // Resistor has 2 wires attached (w1 to p_res_a, w2 from p_res_b)
  const removed = removeComponent(state, 'res-1');
  assert.equal(removed, true);
  assert.equal(state.components.length, 3);
  assert.ok(!state.components.some((c) => c.id === 'res-1'));

  // The 2 wires connected to the resistor must be automatically eliminated
  assert.equal(state.wires.length, 2);
  assert.ok(!state.wires.some((w) => w.fromPortId === 'p_res_a' || w.toPortId === 'p_res_a'));
  assert.ok(!state.wires.some((w) => w.fromPortId === 'p_res_b' || w.toPortId === 'p_res_b'));
});

test('LAB-006: Undo restores previous circuit snapshot and strictly increments revision monotonically', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);

  const revBefore = state.revision;
  const wiresCountBefore = state.wires.length;

  // Delete a wire
  removeWire(state, state.wires[0].id);
  assert.equal(state.wires.length, wiresCountBefore - 1);
  assert.equal(state.revision, revBefore + 1);

  // Undo
  const undoSuccess = undo(state);
  assert.equal(undoSuccess, true);
  assert.equal(state.wires.length, wiresCountBefore); // Restored!

  // Crucial Tutor Contract invariant: revision MUST be strictly greater than revBefore + 1
  assert.ok(
    state.revision > revBefore + 1,
    `Revision must strictly increase monotonically (was ${revBefore + 1}, now ${state.revision})`
  );
});

test('LAB-007: Redo re-applies undone change and increments revision', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);

  const wiresCountBefore = state.wires.length;
  removeWire(state, state.wires[0].id);
  assert.equal(state.wires.length, wiresCountBefore - 1);

  undo(state);
  assert.equal(state.wires.length, wiresCountBefore);

  const redoSuccess = redo(state);
  assert.equal(redoSuccess, true);
  assert.equal(state.wires.length, wiresCountBefore - 1);
});

test('LAB-008: toggleSwitch updates switch state and integrates with undo', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);

  const sw = state.components.find((c) => c.kind === 'switch');
  assert.equal(sw.isOpen, false);

  toggleSwitch(state, sw.id);
  assert.equal(sw.isOpen, true);

  // Simulate on open switch -> circuit is open, current is 0
  const simOpen = simulate(toLabSnapshot(state));
  assert.equal(simOpen.status, 'open');
  assert.equal(simOpen.values.circuitCurrentA, 0);
  assert.equal(simOpen.ledOn, false);

  // Undo toggle
  undo(state);
  const swRestored = state.components.find((c) => c.kind === 'switch');
  assert.equal(swRestored.isOpen, false);

  // Simulate on closed switch -> valid 9.09mA, LED ON
  const simClosed = simulate(toLabSnapshot(state));
  assert.equal(simClosed.status, 'valid');
  assert.equal(simClosed.ledOn, true);
});

test('LAB-009: History stack is bounded by MAX_HISTORY to prevent memory leak', () => {
  const state = createInitialLabState();

  // Push 60 actions (exceeding MAX_HISTORY = 40)
  for (let i = 0; i < 60; i++) {
    addComponent(state, {
      id: `test-comp-${i}`,
      kind: 'resistor',
      name: `R${i}`,
      position: { x: i, y: i },
      rotation: 0,
      resistanceOhms: 100,
      ports: [],
    });
  }

  assert.ok(
    state.history.length <= MAX_HISTORY,
    `History length ${state.history.length} must not exceed MAX_HISTORY ${MAX_HISTORY}`
  );
  assert.equal(state.history.length, MAX_HISTORY);
});

test('LAB-010: toLabSnapshot produces clean snapshot consumable by solver', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);

  const snapshot = toLabSnapshot(state);
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.experimentId, 'ohms-law-led');
  assert.equal(snapshot.revision, state.revision);
  assert.equal(snapshot.components.length, 4);
  assert.equal(snapshot.wires.length, 4);

  const result = simulate(snapshot);
  assert.equal(result.status, 'valid');
  assert.equal(result.ledOn, true);
  assert.ok(Math.abs(result.values.circuitCurrentA - 0.00909) < 0.0001);
});

test('LAB-011: clearAllWires clears all wires and supports undo restoration', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);
  assert.equal(state.wires.length, 4);

  clearAllWires(state);
  assert.equal(state.wires.length, 0);

  const restored = undo(state);
  assert.equal(restored, true);
  assert.equal(state.wires.length, 4);
});

test('LAB-012: addWire rejects duplicate connections and self-loops', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);

  // Attempt self-loop (same port)
  const selfLoop = addWire(state, 'p_bat_pos', 'p_bat_pos');
  assert.equal(selfLoop, false);

  // Attempt duplicate wire (already exists: p_bat_pos to p_res_a)
  const duplicateDirect = addWire(state, 'p_bat_pos', 'p_res_a');
  assert.equal(duplicateDirect, false);

  // Attempt duplicate in reverse order
  const duplicateReverse = addWire(state, 'p_res_a', 'p_bat_pos');
  assert.equal(duplicateReverse, false);
});

test('LAB-013: undo and redo return false safely on empty history stacks', () => {
  const state = createInitialLabState();
  assert.equal(undo(state), false);
  assert.equal(redo(state), false);
});


test('LAB-START-001: opening the lab starts without components or wires', () => {
  const state = createInitialLabState();
  assert.deepEqual(state.components, []);
  assert.deepEqual(state.wires, []);
  assert.equal(state.history.length, 0);
  assert.equal(state.revision, 1);
});

test('LAB-START-002: clearCircuit empties a sample circuit and undo/redo preserves the work', () => {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state); // The student explicitly requests the example.
  assert.equal(state.components.length, 4);
  assert.equal(state.wires.length, 4);
  const rev = state.revision;
  assert.equal(clearCircuit(state), true);
  assert.equal(state.components.length, 0);
  assert.equal(state.wires.length, 0);
  assert.equal(state.selectedPortId, null);
  assert.equal(state.selectedComponentId, null);
  assert.equal(state.revision, rev + 1);
  assert.equal(undo(state), true);
  assert.equal(state.components.length, 4);
  assert.equal(state.wires.length, 4);
  assert.equal(redo(state), true);
  assert.equal(state.components.length, 0);
  assert.equal(state.wires.length, 0);
});

test('LAB-START-003: clearing an already empty lab does not create phantom undo history', () => {
  const state = createInitialLabState();
  assert.equal(clearCircuit(state), false);
  assert.equal(state.revision, 1);
  assert.equal(state.history.length, 0);
  assert.equal(state.future.length, 0);
});
