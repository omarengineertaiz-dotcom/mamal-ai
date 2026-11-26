/**
 * Mamal AI v3.0 - Extended Educational Circuit Solver
 * Supports multi-resistor series, parallel/Kirchhoff (KVL/KCL), potentiometer,
 * and basic RC DC steady-state circuits while preserving solver-core.js for
 * single-loop LED protection experiments.
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
 * Nodal analysis for general DC resistive + voltage/current source circuits
 * (used when the circuit goes beyond the strict single-loop LED model).
 */
export function simulateExtended(snapshot) {
  const components = snapshot?.components || [];
  const wires = snapshot?.wires || [];

  const result = {
    modelVersion: '3.0.0',
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
      messageAr: 'لا يوجد مصدر طاقة. أضف مصدر جهد أو تيار لبدء القياس.',
      messageEn: 'No power source found. Add a voltage or current source to begin.',
    });
    return result;
  }

  // Union-find across all ports + closed switches
  const ports = new Map();
  for (const c of components) {
    for (const p of c.ports || []) {
      ports.set(p.id, { ...p, component: c });
    }
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
    if (ports.has(w.fromPortId) && ports.has(w.toPortId)) {
      union(w.fromPortId, w.toPortId);
    }
  }

  // Closed switches & inductors (DC steady state) act as near-zero resistance shorts
  for (const c of components) {
    if (c.kind === 'switch' && !c.isOpen && c.ports.length === 2) {
      union(c.ports[0].id, c.ports[1].id);
    }
    if (c.kind === 'inductor' && c.ports.length === 2) {
      union(c.ports[0].id, c.ports[1].id);
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

  // Assign contiguous indices to unique electrical nets; ground = netNeg (index 0)
  const netSet = new Set([...ports.keys()].map((id) => find(id)));
  const netList = [netNeg, ...[...netSet].filter((n) => n !== netNeg)];
  const netIdx = new Map(netList.map((n, i) => [n, i]));

  // Build Modified Nodal Analysis (MNA) for resistors, potentiometers, lamps, diodes/LEDs (approx), voltage/current sources
  const nNodes = netList.length - 1; // excluding ground (idx 0)
  const vSources = components.filter((c) => c.kind === 'dc_source' || c.kind === 'ac_source');
  const m = vSources.length;
  const size = nNodes + m;
  if (size <= 0) return result;

  const A = Array.from({ length: size }, () => Array(size).fill(0));
  const z = Array(size).fill(0);

  // Add tiny leak conductance to ground for floating nodes so matrix stays nonsingular
  for (let i = 0; i < nNodes; i++) {
    A[i][i] += 1e-12;
  }

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
    if (c.kind === 'resistor' || c.kind === 'potentiometer') {
      stampResistor(p0, p1, c.resistanceOhms ?? 330);
    } else if (c.kind === 'lamp') {
      stampResistor(p0, p1, c.resistanceOhms ?? 100);
    } else if (c.kind === 'led' || c.kind === 'diode') {
      // Linearized educational model for multi-element networks
      stampResistor(p0, p1, 220);
    } else if (c.kind === 'capacitor') {
      // DC steady-state open with tiny conductance
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
    if (iPos >= 0) {
      A[iPos][row] += 1;
      A[row][iPos] += 1;
    }
    if (iNeg >= 0) {
      A[iNeg][row] -= 1;
      A[row][iNeg] -= 1;
    }
    z[row] = Number(src.voltageV) || 5;
  });

  // Gaussian elimination with partial pivoting
  const x = solveLinearSystem(A, z);
  if (!x) return result;

  const nodeV = (portId) => {
    const idx = netIdx.get(find(portId));
    return idx === 0 ? 0 : x[idx - 1];
  };

  const Vs = Number(primarySource.voltageV) || (primarySource.kind === 'current_source' ? Math.abs(nodeV(posPort) - nodeV(negPort)) : 5);
  let totalI = 0;
  if (vSources.length > 0) {
    totalI = Math.abs(x[nNodes]);
  } else if (primarySource.kind === 'current_source') {
    totalI = Number(primarySource.currentA) || 0.02;
  }

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
        ? 'المفتاح مفتوح؛ أغلقه بالنقر عليه للسماح بمرور التيار.'
        : hasCap
          ? `المكثف مشحون بالكامل عند جهد ${Vs.toFixed(1)}V (في الحالة المستقرة DC يتوقف التيار).`
          : 'الدائرة مفتوحة؛ أكمل توصيل المسار بين طرفي المصدر.',
      messageEn: hasOpenSwitch
        ? 'Switch is open; click it directly to close the circuit.'
        : hasCap
          ? `Capacitor fully charged to ${Vs.toFixed(1)}V (steady-state DC current is 0).`
          : 'Open circuit; complete the path between source terminals.',
    });
    return result;
  }

  // Compute component voltages & currents
  const details = [];
  let firstResistorV = null;
  for (const c of components) {
    if (c.kind === 'resistor' || c.kind === 'potentiometer' || c.kind === 'lamp') {
      const vDrop = Math.abs(nodeV(c.ports[0].id) - nodeV(c.ports[1].id));
      const rVal = Math.max(0.01, Number(c.resistanceOhms) || 100);
      const iBranch = vDrop / rVal;
      if (firstResistorV === null) firstResistorV = vDrop;
      details.push({ id: c.id, name: c.name, voltageV: vDrop, currentA: iBranch, resistanceOhms: rVal });
    }
  }

  const req = totalI > 1e-9 ? Vs / totalI : null;
  result.status = 'valid';
  result.ledOn = components.some((c) => c.kind === 'led' || c.kind === 'lamp');
  result.values = {
    sourceVoltageV: Vs,
    circuitCurrentA: totalI,
    resistorVoltageV: firstResistorV ?? Vs,
    ledForwardVoltageV: components.some((c) => c.kind === 'led') ? 2.0 : null,
    equivalentResistanceOhms: req,
    nodeDetails: details,
  };
  const iFmt = formatCurrent(totalI);
  const detailSummaryAr = details
    .map((d) => `${d.name}: V=${d.voltageV.toFixed(2)}V, I=${formatCurrent(d.currentA).value}${formatCurrent(d.currentA).unit}`)
    .join(' | ');
  result.diagnostics.push({
    code: 'OK',
    severity: 'info',
    affectedIds: [],
    messageAr: `دائرة نشطة! التيار الكلي = ${iFmt.value} ${iFmt.unit}، المقاومة المكافئة ≈ ${formatResistance(req)}. ${detailSummaryAr}`,
    messageEn: `Active circuit! Total current = ${iFmt.value} ${iFmt.unit}, Req ≈ ${formatResistance(req)}.`,
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
