/**
 * Rowad Al-Mamal - Circuit Lab State Manager (ES Module Runtime)
 * Pure functional state transitions, cascading deletions, and bounded Undo/Redo history.
 */

export const MAX_HISTORY = 40;

export function createInitialLabState() {
  return {
    revision: 1,
    components: [],
    wires: [],
    selectedComponentId: null,
    selectedPortId: null,
    history: [],
    future: [],
  };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function pushHistory(state) {
  state.history.push({
    components: deepClone(state.components),
    wires: deepClone(state.wires),
  });
  if (state.history.length > MAX_HISTORY) {
    state.history.shift();
  }
  state.future = [];
}

/**
 * Adds a new component to the circuit and increments revision.
 */
export function addComponent(state, component) {
  pushHistory(state);
  state.components.push(deepClone(component));
  state.revision++;
  state.selectedComponentId = component.id;
}

/**
 * Moves a component with boundary clamping.
 */
export function moveComponent(
  state,
  componentId,
  newPos,
  bounds = { minX: 10, maxX: 670, minY: 10, maxY: 470 }
) {
  const comp = state.components.find((c) => c.id === componentId);
  if (!comp) return false;

  const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, Math.round(newPos.x)));
  const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, Math.round(newPos.y)));

  if (comp.position.x === clampedX && comp.position.y === clampedY) {
    return false;
  }

  comp.position.x = clampedX;
  comp.position.y = clampedY;
  return true;
}

/**
 * Commits a completed move action to the history stack.
 */
export function commitMove(state, previousPos, currentPos, componentId = state.selectedComponentId) {
  if (previousPos.x === currentPos.x && previousPos.y === currentPos.y) {
    return;
  }
  const targetId = componentId || state.selectedComponentId;
  if (!targetId) {
    return;
  }
  state.history.push({
    components: deepClone(
      state.components.map((c) =>
        c.id === targetId ? { ...c, position: { ...previousPos } } : c
      )
    ),
    wires: deepClone(state.wires),
  });
  if (state.history.length > MAX_HISTORY) {
    state.history.shift();
  }
  state.future = [];
  state.revision++;
}

/**
 * Removes a component and cascades to delete all attached wires.
 */
export function removeComponent(state, componentId) {
  const compIndex = state.components.findIndex((c) => c.id === componentId);
  if (compIndex === -1) return false;

  pushHistory(state);

  const comp = state.components[compIndex];
  const portIds = new Set(comp.ports.map((p) => p.id));

  // Cascading removal: delete all wires connecting to this component's ports
  state.wires = state.wires.filter((w) => !portIds.has(w.fromPortId) && !portIds.has(w.toPortId));

  // Remove component
  state.components.splice(compIndex, 1);

  if (state.selectedComponentId === componentId) {
    state.selectedComponentId = null;
  }
  if (state.selectedPortId && portIds.has(state.selectedPortId)) {
    state.selectedPortId = null;
  }

  state.revision++;
  return true;
}

/**
 * Adds a wire between two ports.
 */
export function addWire(state, fromPortId, toPortId) {
  if (fromPortId === toPortId) return false;

  // Prevent duplicate wire between same ports
  const exists = state.wires.some(
    (w) =>
      (w.fromPortId === fromPortId && w.toPortId === toPortId) ||
      (w.fromPortId === toPortId && w.toPortId === fromPortId)
  );
  if (exists) return false;

  pushHistory(state);

  state.wires.push({
    id: 'wire-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    fromPortId,
    toPortId,
  });

  state.selectedPortId = null;
  state.revision++;
  return true;
}

/**
 * Removes a single wire.
 */
export function removeWire(state, wireId) {
  const index = state.wires.findIndex((w) => w.id === wireId);
  if (index === -1) return false;

  pushHistory(state);
  state.wires.splice(index, 1);
  state.revision++;
  return true;
}

/**
 * Clears all wires from the lab.
 */
export function clearAllWires(state) {
  if (state.wires.length === 0) return;
  pushHistory(state);
  state.wires = [];
  state.selectedPortId = null;
  state.revision++;
}

/** Clears all components and wires in one undoable step. */
export function clearCircuit(state) {
  if (state.components.length === 0 && state.wires.length === 0) return false;
  pushHistory(state);
  state.components = [];
  state.wires = [];
  state.selectedComponentId = null;
  state.selectedPortId = null;
  state.revision++;
  return true;
}

/**
 * Toggles a switch state.
 */
export function toggleSwitch(state, switchId) {
  const sw = switchId
    ? state.components.find((c) => c.id === switchId && c.kind === 'switch')
    : state.components.find((c) => c.kind === 'switch');

  if (!sw || sw.kind !== 'switch') return false;

  pushHistory(state);
  sw.isOpen = !sw.isOpen;
  state.revision++;
  return true;
}

/**
 * Restores previous state from history stack.
 * Invariant: state.revision is strictly monotonically incremented to preserve tutor contract compatibility.
 */
export function undo(state) {
  if (state.history.length === 0) return false;

  const previousSnapshot = state.history.pop();

  state.future.push({
    components: deepClone(state.components),
    wires: deepClone(state.wires),
  });

  state.components = previousSnapshot.components;
  state.wires = previousSnapshot.wires;
  state.selectedPortId = null;

  state.revision++;
  return true;
}

/**
 * Restores next state from future stack.
 */
export function redo(state) {
  if (state.future.length === 0) return false;

  const nextSnapshot = state.future.pop();

  state.history.push({
    components: deepClone(state.components),
    wires: deepClone(state.wires),
  });

  state.components = nextSnapshot.components;
  state.wires = nextSnapshot.wires;
  state.selectedPortId = null;

  state.revision++;
  return true;
}

/**
 * Loads default model setup for Ohm's Law and LED Protection.
 */
export function loadDefaultModelCircuit(state) {
  pushHistory(state);

  state.components = [
    {
      id: 'bat-1',
      kind: 'dc_source',
      name: 'بطارية (5V)',
      position: { x: 40, y: 170 },
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
      name: 'مقاومة (330Ω)',
      position: { x: 220, y: 70 },
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
      name: 'صمام LED',
      position: { x: 470, y: 170 },
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
      name: 'مفتاح تشغيل',
      position: { x: 470, y: 360 },
      rotation: 0,
      isOpen: false,
      ports: [
        { id: 'p_sw_a', componentId: 'sw-1', role: 'terminal_a', label: '1' },
        { id: 'p_sw_b', componentId: 'sw-1', role: 'terminal_b', label: '2' },
      ],
    },
  ];

  state.wires = [
    { id: 'w1', fromPortId: 'p_bat_pos', toPortId: 'p_res_a' },
    { id: 'w2', fromPortId: 'p_res_b', toPortId: 'p_led_anode' },
    { id: 'w3', fromPortId: 'p_led_cathode', toPortId: 'p_sw_a' },
    { id: 'w4', fromPortId: 'p_sw_b', toPortId: 'p_bat_neg' },
  ];

  state.selectedComponentId = null;
  state.selectedPortId = null;
  state.revision++;
}

/**
 * Extracts a serializable, pure LabSnapshot for solver and tutor.
 */
export function toLabSnapshot(state) {
  return {
    schemaVersion: 1,
    experimentId: 'ohms-law-led',
    revision: state.revision,
    components: deepClone(state.components),
    wires: deepClone(state.wires),
  };
}
