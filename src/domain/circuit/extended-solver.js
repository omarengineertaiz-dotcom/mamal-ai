/**
 * Mamal AI v3.1 - Extended Educational Circuit Solver (MNA + Per-Wire Active Flow)
 * Computes node voltages, total current, equivalent resistance, and exact active
 * wire IDs so current animation ONLY appears on wires carrying real current.
 */

export function formatCurrent(amps) {
  if (amps === null || amps === undefined || !Number.isFinite(amps)) {
    return { value: '—', unit: 'mA' };
  }
  const abs = Math.abs(amps);
  if (abs === 0) return { value: '0.00', unit: 'mA' };
  if (abs >= 1) return { value: amps.toFixed(3), unit: 'A' };
  if (abs >= 1e-3) return { value: (amps * 1e3).toFixed(2), unit: 'mA' };
  return { value: (amps * 1e6).toFixed(1), unit: 'µA' };
}

export function formatResistance(ohms) {
  if (!Number.isFinite(ohms)) return '—';
  if (ohms >= 1e6) return `${(ohms / 1e6).toFixed(2)}MΩ`;
  if (ohms >= 1e3) return `${(ohms / 1e3).toFixed(ohms % 1000 === 0 ? 0 : 2)}kΩ`;
  return `${Math.round(ohms * 10) / 10}Ω`;
}

/**
 * Returns the Set of wire IDs that belong to electrically energized nets
 * connected to an active source loop with non-zero current.
 */
function findEnergizedWireIds(components, wires, find, activeCompIds) {
  // Build component-level adjacency only through components that carry current (or closed switches/sources)
  const portToComp = new Map();
  for (const c of components) {
    for (const p of c.ports || []) portToComp.set(p.id, c);
  }
  const activeNets = new Set();
  for (const c of components) {
    if (!activeCompIds.has(c.id)) continue;
    for (const p of c.ports || []) activeNets.add(find(p.id));
  }
  const energized = new Set();
  for (const w of wires) {
    const cA = portToComp.get(w.fromPortId);
    const cB = portToComp.get(w.toPortId);
    if (!cA || !cB) continue;
    if (activeCompIds.has(cA.id) && activeCompIds.has(cB.id) && activeNets.has(find(w.fromPortId))) {
      energized.add(w.id);
    }
  }
  return energized;
}

export function simulateExtended(snapshot) {
  const components = snapshot?.components || [];
  const wires = snapshot?.wires || [];

  const result = {
    modelVersion: '3.1.0',
    status: 'open',
    values: {
      sourceVoltageV: null,
      circuitCurrentA: 0,
      resistorVoltageV: null,
      ledForwardVoltageV: null,
      equivalentResistanceOhms: null,
      nodeDetails: [],
    },
    ledOn: false,
    activeWireIds: [],
    diagnostics: [],
    isExtended: true,
  };

  const sources = components.filter(
    (c) => c.kind === 'dc_source' || c.kind === 'ac_source' || c.kind === 'current_source'
  );
  if (sources.length === 0) {
    result.diagnostics.push({
      code: 'OPEN_CIRCUIT',
      severity: 'info',
      affectedIds: [],
      messageAr: 'لا يوجد مصدر طاقة في الدائرة. أضف مصدر جهد أو تيار لبدء القياس.',
      messageEn: 'No power source in the circuit. Add a voltage or current source to begin.',
    });
    return result;
  }

  const ports = new Map();
  for (const c of components) {
    for (const p of c.ports || []) ports.set(p.id, { ...p, component: c });
  }
  const parent = new Map([...ports.keys()].map((id) => [id, id]));
  const find = (id) => {
    let cur = id;
    while (parent.get(cur) !== cur) cur = parent.get(cur);
    let walk = id;
    while (parent.get(walk) !== cur) {
      const next = parent.get(walk);
      parent.set(walk, cur);
      walk = next;
    }
    return cur;
  };
  const union = (a, b) => {
    if (parent.has(a) && parent.has(b)) parent.set(find(a), find(b));
  };

  for (const w of wires) {
    if (ports.has(w.fromPortId) && ports.has(w.toPortId)) union(w.fromPortId, w.toPortId);
  }

  // Closed switches & inductors (DC steady state) conduct directly
  for (const c of components) {
    if ((c.kind === 'switch' && !c.isOpen) || c.kind === 'inductor') {
      if (c.ports.length === 2) union(c.ports[0].id, c.ports[1].id);
    }
  }

  const primarySource = sources[0];
  const posPort = primarySource.ports[0]?.id;
  const negPort = primarySource.ports[1]?.id;
  if (!posPort || !negPort) return result;

  const netPos = find(posPort);
  const netNeg = find(negPort);

  if (netPos === netNeg) {
    result.status = 'unsafe';
    result.values.circuitCurrentA = null;
    result.diagnostics.push({
      code: 'SOURCE_SHORT',
      severity: 'error',
      affectedIds: [primarySource.id],
      messageAr: 'خطر: قصر كهربائي مباشر بين طرفي المصدر!',
      messageEn: 'Danger: Direct short circuit across the power source!',
    });
    return result;
  }

  const netSet = new Set([...ports.keys()].map((id) => find(id)));
  const netList = [netNeg, ...[...netSet].filter((n) => n !== netNeg)];
  const netIdx = new Map(netList.map((n, i) => [n, i]));

  const nNodes = netList.length - 1;
  const vSources = components.filter((c) => c.kind === 'dc_source' || c.kind === 'ac_source');
  const m = vSources.length;
  const size = nNodes + m;
  if (size <= 0) return result;

  const A = Array.from({ length: size }, () => Array(size).fill(0));
  const z = Array(size).fill(0);
  for (let i = 0; i < nNodes; i++) A[i][i] += 1e-12;

  const stampResistor = (pA, pB, R) => {
    const rVal = Math.max(0.01, Number(R) || 100);
    const g = 1 / rVal;
    const iA = netIdx.get(find(pA)) - 1;
    const iB = netIdx.get(find(pB)) - 1;
    if (iA >= 0) A[iA][iA] += g;
    if (iB >= 0) A[iB][iB] += g;
    if (iA >= 0 && iB >= 0) {
      A[iA][iB] -= g;
      A[iB][iA] -= g;
    }
  };

  for (const c of components) {
    if (c.ports.length < 2) continue;
    const p0 = c.ports[0].id;
    const p1 = c.ports[1].id;
    if (c.kind === 'resistor' || c.kind === 'potentiometer' || c.kind === 'lamp') {
      stampResistor(p0, p1, c.resistanceOhms ?? 100);
    } else if (c.kind === 'led' || c.kind === 'diode') {
      stampResistor(p0, p1, 220);
    } else if (c.kind === 'capacitor') {
      stampResistor(p0, p1, 1e9);
    } else if (c.kind === 'current_source') {
      const iVal = Number(c.currentA) || 0.02;
      const iPos = netIdx.get(find(p0)) - 1;
      const iNeg = netIdx.get(find(p1)) - 1;
      if (iPos >= 0) z[iPos] += iVal;
      if (iNeg >= 0) z[iNeg] -= iVal;
    }
  }

  vSources.forEach((src, k) => {
    const row = nNodes + k;
    const iPos = netIdx.get(find(src.ports[0].id)) - 1;
    const iNeg = netIdx.get(find(src.ports[1].id)) - 1;
    if (iPos >= 0) { A[iPos][row] += 1; A[row][iPos] += 1; }
    if (iNeg >= 0) { A[iNeg][row] -= 1; A[row][iNeg] -= 1; }
    z[row] = Number(src.voltageV) || 5;
  });

  const x = solveLinearSystem(A, z);
  if (!x) return result;

  const nodeV = (portId) => {
    const idx = netIdx.get(find(portId));
    return idx === 0 ? 0 : x[idx - 1];
  };

  const Vs = Number(primarySource.voltageV) || Math.abs(nodeV(posPort) - nodeV(negPort)) || 5;
  let totalI = 0;
  if (vSources.length > 0) totalI = Math.abs(x[nNodes]);
  else if (primarySource.kind === 'current_source') totalI = Number(primarySource.currentA) || 0.02;

  if (totalI < 1e-7) {
    const hasOpenSwitch = components.some((c) => c.kind === 'switch' && c.isOpen);
    const hasCap = components.some((c) => c.kind === 'capacitor');
    result.status = 'open';
    result.values.sourceVoltageV = Vs;
    result.values.circuitCurrentA = 0;
    result.values.resistorVoltageV = 0;
    result.diagnostics.push({
      code: hasOpenSwitch ? 'SWITCH_OPEN' : hasCap ? 'CAPACITOR_CHARGED' : 'OPEN_CIRCUIT',
      severity: 'info',
      affectedIds: [],
      messageAr: hasOpenSwitch
        ? 'المفتاح مفتوح؛ انقر عليه مباشرة لإغلاق الدائرة.'
        : hasCap
          ? `المكثف مشحون بالكامل عند ${Vs.toFixed(1)}V (التيار المستقر = 0).`
          : 'الدائرة مفتوحة؛ أكمل التوصيل بين طرفي المصدر.',
      messageEn: hasOpenSwitch
        ? 'Switch is open; click it directly to close the circuit.'
        : hasCap
          ? `Capacitor fully charged to ${Vs.toFixed(1)}V (steady-state DC current = 0).`
          : 'Open circuit; complete the loop between source terminals.',
    });
    return result;
  }

  // Track ONLY components actually carrying non-zero current
  const activeCompIds = new Set([primarySource.id]);
  const details = [];
  let firstVoltage = null;

  for (const c of components) {
    if (c.ports.length < 2) continue;
    const vDrop = Math.abs(nodeV(c.ports[0].id) - nodeV(c.ports[1].id));
    if (c.kind === 'resistor' || c.kind === 'potentiometer' || c.kind === 'lamp') {
      const rVal = Math.max(0.01, Number(c.resistanceOhms) || 100);
      const iBranch = vDrop / rVal;
      if (iBranch > 1e-7) {
        activeCompIds.add(c.id);
        if (firstVoltage === null) firstVoltage = vDrop;
        details.push({ id: c.id, name: c.name, voltageV: vDrop, currentA: iBranch, resistanceOhms: rVal });
      }
    } else if (c.kind === 'led' || c.kind === 'diode') {
      if (vDrop / 220 > 1e-7) activeCompIds.add(c.id);
    } else if ((c.kind === 'switch' && !c.isOpen) || c.kind === 'inductor') {
      // Conductive only if its net is energized and part of a closed path (voltage > 0 or connected to active net)
      const n0 = find(c.ports[0].id);
      if (n0 === netPos || n0 === netNeg || Math.abs(nodeV(c.ports[0].id)) > 1e-6) {
        activeCompIds.add(c.id);
      }
    }
  }

  const energizedWires = findEnergizedWireIds(components, wires, find, activeCompIds);
  const req = totalI > 1e-9 ? Vs / totalI : null;
  result.status = 'valid';
  result.ledOn = components.some((c) => (c.kind === 'led' || c.kind === 'lamp') && activeCompIds.has(c.id));
  result.activeWireIds = [...energizedWires];
  result.values = {
    sourceVoltageV: Vs,
    circuitCurrentA: totalI,
    resistorVoltageV: firstVoltage ?? Vs,
    ledForwardVoltageV: components.some((c) => c.kind === 'led' && activeCompIds.has(c.id)) ? 2.0 : null,
    equivalentResistanceOhms: req,
    nodeDetails: details,
  };

  const iFmt = formatCurrent(totalI);
  result.diagnostics.push({
    code: 'OK',
    severity: 'info',
    affectedIds: [],
    messageAr: `دائرة نشطة! التيار = ${iFmt.value} ${iFmt.unit}، الجهد = ${(firstVoltage ?? Vs).toFixed(2)}V، المقاومة المكافئة ≈ ${formatResistance(req)}.`,
    messageEn: `Active circuit! Current = ${iFmt.value} ${iFmt.unit}, Voltage = ${(firstVoltage ?? Vs).toFixed(2)}V, Req ≈ ${formatResistance(req)}.`,
  });
  return result;
}

function solveLinearSystem(matrix, rhs) {
  const n = rhs.length;
  const M = matrix.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-14) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const div = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let j = col; j <= n; j++) M[r][j] -= factor * M[col][j];
    }
  }
  return M.map((row) => row[n]);
}
