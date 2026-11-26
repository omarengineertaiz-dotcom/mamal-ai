/**
 * Rowad Al-Mamal - Wire routing (pure geometry, no DOM).
 *
 * Wires leave every port perpendicular to the component edge (a short stub),
 * then follow an orthogonal path with rounded corners that avoids component
 * bodies and, where possible, does not overlap other wires. This keeps
 * polarity unambiguous: a wire can never appear to attach to the wrong
 * terminal by passing behind a component.
 */

export const COMP_W = 120;
export const COMP_H = 80;
export const PORT_Y = 40;
const STUB = 24;
const CORNER = 10;
const MARGIN = 8;
const LANE = 22; // wires closer than this (while running side by side) look merged
const CANVAS = { minX: 12, maxX: 788, minY: 12, maxY: 548 };

/**
 * Which edge a port sits on. Sources put (+) on the right so that current
 * visually flows left-to-right out of the battery; everything else puts
 * port #1 on the left and port #2 on the right.
 */
export function portSide(component, portIndex) {
  const first = component.kind === 'dc_source' ? 'right' : 'left';
  const second = first === 'left' ? 'right' : 'left';
  return portIndex === 0 ? first : second;
}

/** Local (component-relative) x of a port. */
export function portLocalX(component, portIndex) {
  return portSide(component, portIndex) === 'left' ? 0 : COMP_W;
}

/** Absolute canvas position and outward direction (-1 left, +1 right) of a port. */
export function portPosition(component, portIndex) {
  const side = portSide(component, portIndex);
  return {
    x: component.position.x + (side === 'left' ? 0 : COMP_W),
    y: component.position.y + PORT_Y,
    dir: side === 'left' ? -1 : 1,
  };
}

function findPort(components, portId) {
  for (const component of components) {
    const index = component.ports.findIndex((p) => p.id === portId);
    if (index !== -1) return { component, ...portPosition(component, index) };
  }
  return null;
}

function bodyRect(component) {
  return {
    x1: component.position.x - MARGIN,
    y1: component.position.y - MARGIN,
    x2: component.position.x + COMP_W + MARGIN,
    y2: component.position.y + COMP_H + MARGIN,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dedupe(points) {
  const out = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && last.x === p.x && last.y === p.y) continue;
    out.push(p);
  }
  // Drop collinear middle points so corners are real corners.
  const simplified = [];
  for (const p of out) {
    while (simplified.length >= 2) {
      const a = simplified[simplified.length - 2];
      const b = simplified[simplified.length - 1];
      const collinear = (a.x === b.x && b.x === p.x) || (a.y === b.y && b.y === p.y);
      if (!collinear) break;
      simplified.pop();
    }
    simplified.push(p);
  }
  return simplified;
}

function segmentHitsRect(a, b, r) {
  const x1 = Math.min(a.x, b.x);
  const x2 = Math.max(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const y2 = Math.max(a.y, b.y);
  return x1 < r.x2 && x2 > r.x1 && y1 < r.y2 && y2 > r.y1;
}

/**
 * How much two segments run on top of, or visually merge with, each other:
 * same orientation, closer than LANE, with their extents (padded by LANE so
 * that end-to-end neighbours also count) overlapping.
 */
function overlapLength(a, b, c, d) {
  if (a.y === b.y && c.y === d.y && Math.abs(a.y - c.y) < LANE) {
    const lo = Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x) - LANE);
    const hi = Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x) + LANE);
    return Math.max(0, hi - lo);
  }
  if (a.x === b.x && c.x === d.x && Math.abs(a.x - c.x) < LANE) {
    const lo = Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y) - LANE);
    const hi = Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y) + LANE);
    return Math.max(0, hi - lo);
  }
  return 0;
}

function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
  }
  return total;
}

/**
 * Chooses the cheapest orthogonal route between two ports that crosses no
 * component body. Cost = length + bends, with a heavy penalty for running on
 * top of an already-routed wire.
 */
export function routeBetween(a, b, components, routedWires = []) {
  const obstacles = components.map(bodyRect);
  const tops = components.map((c) => c.position.y);
  const bottoms = components.map((c) => c.position.y + COMP_H);
  const lefts = components.map((c) => c.position.x);
  const rights = components.map((c) => c.position.x + COMP_W);
  const owners = components.filter((c) => c === a.component || c === b.component);

  const candidates = [];
  // Longer stubs let two wires leaving neighbouring ports use different lanes.
  for (const e1 of [0, 16, 32]) {
    for (const e2 of [0, 16, 32]) {
      const s1 = { x: a.x + a.dir * (STUB + e1), y: a.y };
      const s2 = { x: b.x + b.dir * (STUB + e2), y: b.y };
      const mx = (s1.x + s2.x) / 2;
      const my = (s1.y + s2.y) / 2;
      const ownerTop = Math.min(...owners.map((c) => c.position.y), s1.y, s2.y);
      const ownerBottom = Math.max(...owners.map((c) => c.position.y + COMP_H), s1.y, s2.y);

      const xs = new Set([mx, mx - LANE, mx + LANE, Math.min(s1.x, s2.x) - STUB, Math.max(s1.x, s2.x) + STUB]);
      const ys = new Set([my, my - LANE, my + LANE, ownerTop - 24, ownerBottom + 24]);
      if (lefts.length) {
        xs.add(Math.min(...lefts) - 30).add(Math.max(...rights) + 30);
        ys.add(Math.min(...tops) - 24).add(Math.max(...bottoms) + 24);
      }

      if (s1.y === s2.y) candidates.push([s1, s2]);
      for (const x of xs) {
        const xm = clamp(Math.round(x), CANVAS.minX, CANVAS.maxX);
        candidates.push([s1, { x: xm, y: s1.y }, { x: xm, y: s2.y }, s2]);
      }
      for (const y of ys) {
        const ym = clamp(Math.round(y), CANVAS.minY, CANVAS.maxY);
        candidates.push([s1, { x: s1.x, y: ym }, { x: s2.x, y: ym }, s2]);
      }
    }
  }

  let best = null;
  for (const raw of candidates) {
    // Everything from stub end to stub end must stay clear of every component body.
    const between = dedupe(raw);
    let blocked = 0;
    for (let i = 1; i < between.length; i++) {
      if (obstacles.some((r) => segmentHitsRect(between[i - 1], between[i], r))) blocked++;
    }
    const mid = dedupe([{ x: a.x, y: a.y }, ...between, { x: b.x, y: b.y }]);
    let overlap = 0;
    for (const other of routedWires) {
      for (let i = 1; i < mid.length; i++) {
        for (let j = 1; j < other.length; j++) overlap += overlapLength(mid[i - 1], mid[i], other[j - 1], other[j]);
      }
    }
    const cost = pathLength(mid) + (mid.length - 2) * 30 + blocked * 5000 + overlap * 12;
    if (!best || cost < best.cost) best = { cost, mid };
  }
  return best.mid;
}

/** Turns an orthogonal polyline into an SVG path with rounded corners. */
export function pointsToPath(points, radius = CORNER) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const lenIn = Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y);
    const lenOut = Math.abs(next.x - cur.x) + Math.abs(next.y - cur.y);
    const r = Math.min(radius, lenIn / 2, lenOut / 2);
    const inDir = { x: Math.sign(cur.x - prev.x), y: Math.sign(cur.y - prev.y) };
    const outDir = { x: Math.sign(next.x - cur.x), y: Math.sign(next.y - cur.y) };
    d += ` L ${cur.x - inDir.x * r} ${cur.y - inDir.y * r}`;
    d += ` Q ${cur.x} ${cur.y} ${cur.x + outDir.x * r} ${cur.y + outDir.y * r}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}

/**
 * Routes every wire in order. Returns Map<wireId, { points, d }>.
 * Wires pointing at unknown ports are skipped.
 */
export function routeAllWires(components, wires) {
  const result = new Map();
  const routed = [];
  for (const wire of wires) {
    const a = findPort(components, wire.fromPortId);
    const b = findPort(components, wire.toPortId);
    if (!a || !b) continue;
    const points = routeBetween(a, b, components, routed);
    routed.push(points);
    result.set(wire.id, { points, d: pointsToPath(points) });
  }
  return result;
}
