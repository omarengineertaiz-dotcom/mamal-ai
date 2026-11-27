/**
 * Mamal AI v3.1.4 - Circuit Import Validator & Sanitizer
 * Protects against XSS / SVG injection when loading external .mamal or .json files.
 */

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const SAFE_ID_RE = /^[a-zA-Z0-9_.-]{1,64}$/;

export const ALLOWED_COMPONENT_KINDS = new Set([
  'dc_source', 'ac_source', 'current_source', 'ground',
  'resistor', 'potentiometer', 'capacitor', 'inductor', 'switch',
  'led', 'diode', 'lamp',
  'logic_input', 'logic_probe',
  'gate_and', 'gate_or', 'gate_not', 'gate_nand', 'gate_nor', 'gate_xor', 'gate_xnor',
]);

export function sanitizeHexColor(value, fallback = '#FF4D4F') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed : fallback;
}

export function sanitizeWireColor(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed : '';
}

export function sanitizeLabel(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[<>"'&`]/g, '').trim().slice(0, 60);
  return cleaned || fallback;
}

function sanitizeFiniteNumber(value, fallback, min = -1e12, max = 1e12) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeId(value, fallback) {
  if (typeof value === 'string' && SAFE_ID_RE.test(value.trim())) return value.trim();
  return fallback;
}

export function validateAndSanitizeCircuitPayload(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('INVALID_PAYLOAD');
  }
  if (!Array.isArray(parsed.components) || !Array.isArray(parsed.wires)) {
    throw new Error('INVALID_STRUCTURE');
  }
  if (parsed.components.length > 150 || parsed.wires.length > 300) {
    throw new Error('CIRCUIT_TOO_LARGE');
  }

  const validPortIds = new Set();
  const seenCompIds = new Set();
  const components = [];

  for (let i = 0; i < parsed.components.length; i++) {
    const raw = parsed.components[i];
    if (!raw || typeof raw !== 'object') continue;
    if (!ALLOWED_COMPONENT_KINDS.has(raw.kind)) continue;

    const id = sanitizeId(raw.id, `comp_${i + 1}`);
    if (seenCompIds.has(id)) continue;
    seenCompIds.add(id);

    const rawPorts = Array.isArray(raw.ports) ? raw.ports.slice(0, 4) : [];
    const ports = [];
    for (let pIdx = 0; pIdx < rawPorts.length; pIdx++) {
      const rp = rawPorts[pIdx];
      if (!rp || typeof rp !== 'object') continue;
      const pid = sanitizeId(rp.id, `${id}_p${pIdx}`);
      validPortIds.add(pid);
      ports.push({
        id: pid,
        role: sanitizeLabel(rp.role, `p${pIdx}`),
        label: sanitizeLabel(rp.label, String(pIdx + 1)).slice(0, 8),
      });
    }

    const rotationRaw = Number(raw.rotation) || 0;
    const rotation = [0, 90, 180, 270].includes(((rotationRaw % 360) + 360) % 360)
      ? ((rotationRaw % 360) + 360) % 360
      : 0;

    const comp = {
      id,
      kind: raw.kind,
      name: sanitizeLabel(raw.name, raw.kind),
      position: {
        x: sanitizeFiniteNumber(raw.position?.x, 120 + i * 20, -5000, 5000),
        y: sanitizeFiniteNumber(raw.position?.y, 120, -5000, 5000),
      },
      rotation,
      ports,
    };

    if (raw.isVariable === true) comp.isVariable = true;
    if (raw.voltageV !== undefined) comp.voltageV = sanitizeFiniteNumber(raw.voltageV, 5, 0, 10000);
    if (raw.frequencyHz !== undefined) comp.frequencyHz = sanitizeFiniteNumber(raw.frequencyHz, 50, 0.1, 1e9);
    if (raw.resistanceOhms !== undefined) comp.resistanceOhms = sanitizeFiniteNumber(raw.resistanceOhms, 330, 0.01, 1e9);
    if (raw.capacitanceF !== undefined) comp.capacitanceF = sanitizeFiniteNumber(raw.capacitanceF, 1e-4, 1e-12, 100);
    if (raw.inductanceH !== undefined) comp.inductanceH = sanitizeFiniteNumber(raw.inductanceH, 1e-2, 1e-9, 1000);
    if (raw.currentA !== undefined) comp.currentA = sanitizeFiniteNumber(raw.currentA, 0.02, 0, 1000);
    if (raw.forwardVoltageV !== undefined) comp.forwardVoltageV = sanitizeFiniteNumber(raw.forwardVoltageV, 2.0, 0.1, 20);
    if (raw.maxCurrentA !== undefined) comp.maxCurrentA = sanitizeFiniteNumber(raw.maxCurrentA, 0.02, 0.001, 10);
    if (raw.isOpen !== undefined) comp.isOpen = Boolean(raw.isOpen);
    if (raw.logicValue !== undefined) comp.logicValue = raw.logicValue ? 1 : 0;
    if (raw.kind === 'led') comp.ledColor = sanitizeHexColor(raw.ledColor, '#FF4D4F');

    components.push(comp);
  }

  const seenWireIds = new Set();
  const wires = [];
  for (let i = 0; i < parsed.wires.length; i++) {
    const rw = parsed.wires[i];
    if (!rw || typeof rw !== 'object') continue;
    if (!validPortIds.has(rw.fromPortId) || !validPortIds.has(rw.toPortId)) continue;
    if (rw.fromPortId === rw.toPortId) continue;
    const wid = sanitizeId(rw.id, `wire_${i + 1}`);
    if (seenWireIds.has(wid)) continue;
    seenWireIds.add(wid);
    wires.push({ id: wid, fromPortId: rw.fromPortId, toPortId: rw.toPortId });
  }

  const wireOffsets = {};
  if (parsed.wireOffsets && typeof parsed.wireOffsets === 'object') {
    for (const [k, v] of Object.entries(parsed.wireOffsets)) {
      if (seenWireIds.has(k)) wireOffsets[k] = sanitizeFiniteNumber(v, 0, -2000, 2000);
    }
  }

  const wireColors = {};
  if (parsed.wireColors && typeof parsed.wireColors === 'object') {
    for (const [k, v] of Object.entries(parsed.wireColors)) {
      if (!seenWireIds.has(k)) continue;
      const safeCol = sanitizeWireColor(v);
      if (safeCol) wireColors[k] = safeCol;
    }
  }

  return {
    name: sanitizeLabel(parsed.name, 'تجربة مستوردة'),
    components,
    wires,
    wireOffsets,
    wireColors,
  };
}
