/**
 * Mamal AI v3.1.4 - Extended Educational Circuit Solver (Analog MNA + Nonlinear Diode/LED + Digital Logic Engine)
 * Computes node voltages, total current, Req, exact activeCompIds, activeWireIds,
 * enforces Diode/LED forward polarity & Vf threshold, and evaluates Digital Logic networks.
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

const DIGITAL_KINDS = new Set([
  'logic_input', 'logic_probe',
  'gate_and', 'gate_or', 'gate_not', 'gate_nand', 'gate_nor', 'gate_xor', 'gate_xnor',
]);

/**
 * Evaluates all digital logic components on the canvas by propagating logic levels (0/1).
 * Returns { logicStates: { [compId]: 0|1 }, highWireIds: string[], hasDigital: boolean }.
 */
export function evaluateDigitalNetwork(components, wires) {
  const digitalComps = components.filter((c) => DIGITAL_KINDS.has(c.kind));
  if (digitalComps.length === 0) return { logicStates: {}, highWireIds: [], hasDigital: false };

  const portIds = new Set();
  for (const c of components) for (const p of c.ports || []) portIds.add(p.id);
  const parent = new Map([...portIds].map((id) => [id, id]));
  const find = (id) => {
    let cur = id;
    while (parent.get(cur) !== cur) cur = parent.get(cur);
    return cur;
  };
  for (const w of wires) {
    if (parent.has(w.fromPortId) && parent.has(w.toPortId)) {
      parent.set(find(w.fromPortId), find(w.toPortId));
    }
  }

  const netValue = new Map();
  const logicStates = {};

  for (const c of digitalComps) {
    if (c.kind === 'logic_input') {
      const val = c.logicValue ? 1 : 0;
      logicStates[c.id] = val;
      if (c.ports[0]) netValue.set(find(c.ports[0].id), val);
    }
  }

  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (const c of digitalComps) {
      if (c.kind === 'logic_input' || c.kind === 'logic_probe') continue;
      const inA = c.ports[0] ? (netValue.get(find(c.ports[0].id)) ?? 0) : 0;
      const inB = c.kind === 'gate_not' ? 0 : (c.ports[1] ? (netValue.get(find(c.ports[1].id)) ?? 0) : 0);
      const outPort = c.kind === 'gate_not' ? c.ports[1] : c.ports[2];
      let y = 0;
      if (c.kind === 'gate_not') y = inA ? 0 : 1;
      else if (c.kind === 'gate_and') y = (inA && inB) ? 1 : 0;
      else if (c.kind === 'gate_or') y = (inA || inB) ? 1 : 0;
      else if (c.kind === 'gate_nand') y = (inA && inB) ? 0 : 1;
      else if (c.kind === 'gate_nor') y = (inA || inB) ? 0 : 1;
      else if (c.kind === 'gate_xor') y = (inA !== inB) ? 1 : 0;
      else if (c.kind === 'gate_xnor') y = (inA === inB) ? 1 : 0;

      if (logicStates[c.id] !== y) {
        logicStates[c.id] = y;
        changed = true;
      }
      if (outPort) {
        const net = find(outPort.id);
        if (netValue.get(net) !== y) {
          netValue.set(net, y);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  for (const c of digitalComps) {
    if (c.kind === 'logic_probe' && c.ports[0]) {
      logicStates[c.id] = netValue.get(find(c.ports[0].id)) ?? 0;
    }
  }

  const highWireIds = [];
  for (const w of wires) {
    if (parent.has(w.fromPortId) && netValue.get(find(w.fromPortId)) === 1) {
      highWireIds.push(w.id);
    }
  }

  return { logicStates, highWireIds, hasDigital: true };
}

function findEnergizedWireIds(components, wires, find, activeCompIds) {
  const portToComp = new Map();
  for (const c of components) for (const p of c.ports || []) portToComp.set(p.id, c);
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

function getDiodePorts(comp) {
  const anode = comp.ports.find((p) => p.role === 'anode') || comp.ports[0];
  const cathode = comp.ports.find((p) => p.role === 'cathode') || comp.ports[1];
  return { anodeId: anode?.id, cathodeId: cathode?.id };
}

function collectModelNotes(analogComps) {
  const notes = [];
  if (analogComps.some((c) => c.kind === 'ac_source')) {
    notes.push({
      ar: 'مصدر AC يُحسب حالياً بالقيمة الفعّالة (Vrms) في التحليل المستقر.',
      en: 'AC source is currently evaluated using its RMS equivalent (Vrms) in steady-state analysis.',
    });
  }
  if (analogComps.some((c) => c.kind === 'capacitor' || c.kind === 'inductor')) {
    notes.push({
      ar: 'المكثف والملف يُحاكَيان بحالة التيار المستمر المستقرة (DC Steady-State: المكثف مفتوح، والملف موصل).',
      en: 'Capacitors & inductors are modeled in DC Steady-State (C = open circuit, L = short circuit).',
    });
  }
  return notes;
}

export function simulateExtended(snapshot) {
  const components = snapshot?.components || [];
  const wires = snapshot?.wires || [];
  const digital = evaluateDigitalNetwork(components, wires);

  const result = {
    modelVersion: '3.1.4',
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
    activeCompIds: [],
    activeWireIds: [...digital.highWireIds],
    logicStates: digital.logicStates,
    diagnostics: [],
    modelNotes: [],
    isExtended: true,
  };

  const sources = components.filter(
    (c) => c.kind === 'dc_source' || c.kind === 'ac_source' || c.kind === 'current_source'
  );

  if (sources.length === 0) {
    if (digital.hasDigital) {
      result.status = 'valid';
      result.diagnostics.push({
        code: 'DIGITAL_OK',
        severity: 'info',
        affectedIds: [],
        messageAr: 'الدائرة الرقمية نشطة. انقر على المداخل المنطقية (0/1) لتجربة جدول الحقيقة.',
        messageEn: 'Digital logic circuit active. Click logic inputs (0/1) to test outputs.',
      });
      return result;
    }
    result.diagnostics.push({
      code: 'OPEN_CIRCUIT',
      severity: 'info',
      affectedIds: [],
      messageAr: 'لا يوجد مصدر طاقة في الدائرة. أضف مصدر جهد أو تيار لبدء القياس.',
      messageEn: 'No power source in the circuit. Add a voltage or current source to begin.',
    });
    return result;
  }

  const analogComps = components.filter((c) => !DIGITAL_KINDS.has(c.kind));
  result.modelNotes = collectModelNotes(analogComps);

  const ports = new Map();
  for (const c of analogComps) for (const p of c.ports || []) ports.set(p.id, { ...p, component: c });

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
  const union = (a, b) => { if (parent.has(a) && parent.has(b)) parent.set(find(a), find(b)); };

  for (const w of wires) {
    if (ports.has(w.fromPortId) && ports.has(w.toPortId)) union(w.fromPortId, w.toPortId);
  }
  for (const c of analogComps) {
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
  const vSources = analogComps.filter((c) => c.kind === 'dc_source' || c.kind === 'ac_source');
  const m = vSources.length;
  const size = nNodes + m;
  if (size <= 0) return result;

  const diodes = analogComps.filter((c) => (c.kind === 'led' || c.kind === 'diode') && c.ports.length >= 2);
  const diodeConducting = new Map(diodes.map((d) => [d.id, false]));
  const DIODE_R_ON = 10;
  const DIODE_R_OFF = 1e9;

  const solvePass = () => {
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
      if (iA >= 0 && iB >= 0) { A[iA][iB] -= g; A[iB][iA] -= g; }
    };

    for (const c of analogComps) {
      if (c.ports.length < 2) continue;
      const p0 = c.ports[0].id, p1 = c.ports[1].id;
      if (c.kind === 'resistor' || c.kind === 'potentiometer' || c.kind === 'lamp') {
        stampResistor(p0, p1, c.resistanceOhms ?? 100);
      } else if (c.kind === 'led' || c.kind === 'diode') {
        const { anodeId, cathodeId } = getDiodePorts(c);
        const vf = Number(c.forwardVoltageV) || (c.kind === 'led' ? 2.0 : 0.7);
        if (diodeConducting.get(c.id)) {
          stampResistor(anodeId, cathodeId, DIODE_R_ON);
          const gOn = 1 / DIODE_R_ON;
          const iA = netIdx.get(find(anodeId)) - 1;
          const iK = netIdx.get(find(cathodeId)) - 1;
          if (iA >= 0) z[iA] += gOn * vf;
          if (iK >= 0) z[iK] -= gOn * vf;
        } else {
          stampResistor(anodeId, cathodeId, DIODE_R_OFF);
        }
      } else if (c.kind === 'capacitor') {
        stampResistor(p0, p1, 1e9);
      } else if (c.kind === 'current_source') {
        const iVal = Number(c.currentA) || 0.02;
        const iPos = netIdx.get(find(p0)) - 1, iNeg = netIdx.get(find(p1)) - 1;
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

    return solveLinearSystem(A, z);
  };

  let x = null;
  const maxIterations = diodes.length > 0 ? 8 : 1;
  for (let iter = 0; iter < maxIterations; iter++) {
    x = solvePass();
    if (!x) return result;
    if (diodes.length === 0) break;

    let changed = false;
    for (const d of diodes) {
      const { anodeId, cathodeId } = getDiodePorts(d);
      const vf = Number(d.forwardVoltageV) || (d.kind === 'led' ? 2.0 : 0.7);
      const idxA = netIdx.get(find(anodeId));
      const idxK = netIdx.get(find(cathodeId));
      const vA = idxA === 0 ? 0 : x[idxA - 1];
      const vK = idxK === 0 ? 0 : x[idxK - 1];
      const vAk = vA - vK;
      const isOn = diodeConducting.get(d.id);

      if (!isOn && vAk > vf - 1e-3) {
        diodeConducting.set(d.id, true);
        changed = true;
      } else if (isOn) {
        const iD = (vAk - vf) / DIODE_R_ON;
        if (iD < -1e-7) {
          diodeConducting.set(d.id, false);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  if (!x) return result;

  const nodeV = (portId) => {
    const idx = netIdx.get(find(portId));
    return idx === 0 ? 0 : x[idx - 1];
  };

  const Vs = Number(primarySource.voltageV) || Math.abs(nodeV(posPort) - nodeV(negPort)) || 5;
  let totalI = 0;
  if (vSources.length > 0) totalI = Math.abs(x[nNodes]);
  else if (primarySource.kind === 'current_source') totalI = Number(primarySource.currentA) || 0.02;

  // Detect reversed or under-voltage diodes/LEDs
  const reversedLeds = [];
  const reversedDiodes = [];
  const overcurrentLeds = [];
  const activeCompIds = new Set();
  const details = [];
  let firstVoltage = null;
  let activeLedVf = null;

  for (const d of diodes) {
    const { anodeId, cathodeId } = getDiodePorts(d);
    const vf = Number(d.forwardVoltageV) || (d.kind === 'led' ? 2.0 : 0.7);
    const vAk = nodeV(anodeId) - nodeV(cathodeId);
    if (diodeConducting.get(d.id)) {
      const iD = Math.max(0, (vAk - vf) / DIODE_R_ON);
      if (iD > 1e-7) {
        activeCompIds.add(d.id);
        if (d.kind === 'led') {
          if (activeLedVf === null) activeLedVf = vf;
          const maxI = Number(d.maxCurrentA) || 0.02;
          if (iD > maxI * 1.25) {
            overcurrentLeds.push({ comp: d, currentA: iD, maxI });
          }
        }
        details.push({ id: d.id, name: d.name, voltageV: Math.abs(vAk), currentA: iD, resistanceOhms: DIODE_R_ON });
      }
    } else if (vAk < -0.2) {
      if (d.kind === 'led') reversedLeds.push(d);
      else reversedDiodes.push(d);
    }
  }

  if (overcurrentLeds.length > 0) {
    const first = overcurrentLeds[0];
    const iFmt = formatCurrent(first.currentA);
    result.status = 'unsafe';
    result.values.sourceVoltageV = Vs;
    result.values.circuitCurrentA = totalI;
    result.diagnostics.push({
      code: 'OVERCURRENT',
      severity: 'error',
      affectedIds: overcurrentLeds.map((o) => o.comp.id),
      messageAr: `خطر تيار زائد على الصمام LED (${iFmt.value} ${iFmt.unit} يتجاوز الحد الآمن ${(first.maxI * 1000).toFixed(0)} mA)! أضف أو زد قيمة المقاومة.`,
      messageEn: `Overcurrent danger on LED (${iFmt.value} ${iFmt.unit} exceeds safe limit ${(first.maxI * 1000).toFixed(0)} mA)! Add or increase series resistance.`,
    });
    return result;
  }

  if (totalI < 1e-7) {
    const hasOpenSwitch = analogComps.some((c) => c.kind === 'switch' && c.isOpen);
    result.status = 'open';
    result.values.sourceVoltageV = Vs;
    result.values.circuitCurrentA = 0;
    result.values.resistorVoltageV = 0;

    if (reversedLeds.length > 0) {
      result.diagnostics.push({
        code: 'REVERSED_LED',
        severity: 'warning',
        affectedIds: reversedLeds.map((d) => d.id),
        messageAr: 'الصمام الضوئي LED موصول بعكس القطبية! يجب توصيل الأنود (A) نحو الطرف الموجب والكاثود (K) نحو السالب.',
        messageEn: 'LED is reverse-biased! Connect Anode (A) toward positive and Cathode (K) toward negative.',
      });
    } else if (reversedDiodes.length > 0) {
      result.diagnostics.push({
        code: 'REVERSED_DIODE',
        severity: 'warning',
        affectedIds: reversedDiodes.map((d) => d.id),
        messageAr: 'الدايود في حالة انحياز عكسي يمنع مرور التيار. اعكس اتجاهه إذا كنت تريد التوصيل الأمامي.',
        messageEn: 'Diode is reverse-biased and blocking current. Flip its orientation for forward conduction.',
      });
    } else {
      result.diagnostics.push({
        code: hasOpenSwitch ? 'SWITCH_OPEN' : 'OPEN_CIRCUIT',
        severity: 'info',
        affectedIds: [],
        messageAr: hasOpenSwitch ? 'المفتاح مفتوح؛ انقر عليه مباشرة لإغلاق الدائرة.' : 'الدائرة مفتوحة؛ أكمل التوصيل بين طرفي المصدر.',
        messageEn: hasOpenSwitch ? 'Switch is open; click it directly to close the circuit.' : 'Open circuit; complete the loop between source terminals.',
      });
    }
    return result;
  }

  activeCompIds.add(primarySource.id);

  for (const c of analogComps) {
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
    } else if ((c.kind === 'switch' && !c.isOpen) || c.kind === 'inductor') {
      const n0 = find(c.ports[0].id);
      if (n0 === netPos || n0 === netNeg || Math.abs(nodeV(c.ports[0].id)) > 1e-6) activeCompIds.add(c.id);
    }
  }

  const energizedWires = findEnergizedWireIds(analogComps, wires, find, activeCompIds);
  digital.highWireIds.forEach((id) => energizedWires.add(id));

  const req = totalI > 1e-9 ? Vs / totalI : null;
  result.status = 'valid';
  result.activeCompIds = [...activeCompIds];
  result.ledOn = analogComps.some((c) => (c.kind === 'led' || c.kind === 'lamp') && activeCompIds.has(c.id));
  result.activeWireIds = [...energizedWires];
  result.values = {
    sourceVoltageV: Vs,
    circuitCurrentA: totalI,
    resistorVoltageV: firstVoltage ?? Vs,
    ledForwardVoltageV: activeLedVf,
    equivalentResistanceOhms: req,
    nodeDetails: details,
  };

  if (reversedLeds.length > 0) {
    result.diagnostics.push({
      code: 'REVERSED_LED',
      severity: 'warning',
      affectedIds: reversedLeds.map((d) => d.id),
      messageAr: 'ملاحظة: يوجد صمام LED موصول بعكس القطبية في أحد الفروع ولن يضيء حتى يتم تدويره أو عكس توصيله.',
      messageEn: 'Note: One branch has a reverse-biased LED that will stay OFF until flipped.',
    });
  }

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
