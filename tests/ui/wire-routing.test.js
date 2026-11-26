import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialLabState, loadDefaultModelCircuit } from '../../src/features/lab/lab-state.js';
import {
  COMP_W, COMP_H, portSide, portPosition, routeAllWires, pointsToPath,
} from '../../src/ui/wire-routing.js';

function modelCircuit() {
  const state = createInitialLabState();
  loadDefaultModelCircuit(state);
  return state;
}

/** True if any segment of the polyline passes through the component body (strictly inside). */
function crossesBody(points, comp) {
  const x1 = comp.position.x, x2 = comp.position.x + COMP_W;
  const y1 = comp.position.y, y2 = comp.position.y + COMP_H;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const sx1 = Math.min(a.x, b.x), sx2 = Math.max(a.x, b.x);
    const sy1 = Math.min(a.y, b.y), sy2 = Math.max(a.y, b.y);
    if (sx1 < x2 && sx2 > x1 && sy1 < y2 && sy2 > y1) return true;
  }
  return false;
}

test('WIRE-001: battery (+) sits on the right edge, other parts start on the left', () => {
  const { components } = modelCircuit();
  const bat = components.find((c) => c.kind === 'dc_source');
  const led = components.find((c) => c.kind === 'led');
  const posIndex = bat.ports.findIndex((p) => p.role === 'positive');
  assert.equal(portSide(bat, posIndex), 'right');
  assert.equal(portSide(bat, 1 - posIndex), 'left');
  assert.equal(portSide(led, 0), 'left');
  assert.equal(portSide(led, 1), 'right');
});

test('WIRE-002: every wire leaves its port outward, perpendicular to the component edge', () => {
  const { components, wires } = modelCircuit();
  const routes = routeAllWires(components, wires);
  for (const wire of wires) {
    const { points } = routes.get(wire.id);
    for (const [portId, neighbour] of [[wire.fromPortId, points[1]], [wire.toPortId, points[points.length - 2]]]) {
      const comp = components.find((c) => c.ports.some((p) => p.id === portId));
      const idx = comp.ports.findIndex((p) => p.id === portId);
      const port = portPosition(comp, idx);
      assert.equal(neighbour.y, port.y, `${wire.id}: first segment is horizontal`);
      assert.equal(Math.sign(neighbour.x - port.x), port.dir, `${wire.id}: leaves outward from ${portId}`);
    }
  }
});

test('WIRE-003: no wire in the model circuit passes through any component body', () => {
  const { components, wires } = modelCircuit();
  const routes = routeAllWires(components, wires);
  assert.equal(routes.size, wires.length);
  for (const wire of wires) {
    const { points } = routes.get(wire.id);
    for (const comp of components) {
      assert.equal(crossesBody(points, comp), false, `${wire.id} crosses ${comp.id}`);
    }
  }
});

test('WIRE-004: routing is deterministic and every path is orthogonal', () => {
  const { components, wires } = modelCircuit();
  const first = routeAllWires(components, wires);
  const second = routeAllWires(components, wires);
  for (const wire of wires) {
    assert.equal(first.get(wire.id).d, second.get(wire.id).d);
    const { points } = first.get(wire.id);
    for (let i = 1; i < points.length; i++) {
      assert.ok(points[i].x === points[i - 1].x || points[i].y === points[i - 1].y, 'segment is axis-aligned');
    }
  }
});

test('WIRE-005: routing stays valid after moving components (including a component placed in the way)', () => {
  const { components, wires } = modelCircuit();
  const res = components.find((c) => c.kind === 'resistor');
  res.position = { x: 300, y: 200 }; // between the other parts
  const routes = routeAllWires(components, wires);
  for (const wire of wires) {
    const { points } = routes.get(wire.id);
    for (const comp of components) {
      assert.equal(crossesBody(points, comp), false, `${wire.id} crosses ${comp.id}`);
    }
  }
});

test('WIRE-006: wires with unknown ports are skipped instead of throwing', () => {
  const { components } = modelCircuit();
  const routes = routeAllWires(components, [{ id: 'ghost', fromPortId: 'nope', toPortId: 'p_res_a' }]);
  assert.equal(routes.size, 0);
});

test('WIRE-007: pointsToPath produces rounded corners and starts/ends exactly on the ports', () => {
  const d = pointsToPath([{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }, { x: 80, y: 40 }]);
  assert.ok(d.startsWith('M 0 0'));
  assert.ok(d.endsWith('L 80 40'));
  assert.equal((d.match(/Q /g) || []).length, 2);
});
