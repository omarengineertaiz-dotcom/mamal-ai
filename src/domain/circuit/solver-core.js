/**
 * Rowad Al-Mamal: deterministic, educational single-loop DC topology solver.
 * One electrical source, resistor, LED, and switch are supported. Wire-only
 * nets are traced first; a valid reading requires ONE continuous series path
 * from source + through each of the three devices to source -.
 * No SPICE/parallel-network behavior is implied by this model.
 */
export function simulate(snapshot) {
  const result = {
    modelVersion: '1.0.0',
    status: 'open',
    values: { sourceVoltageV: null, circuitCurrentA: null, resistorVoltageV: null, ledForwardVoltageV: null },
    ledOn: false,
    diagnostics: [],
  };

  function finish(status, code, severity, messageAr, affectedIds = [], readings = {}) {
    result.status = status;
    // No unsafe/unsupported state may inherit measured readings from a previous calculation.
    if (status === 'unsafe' || status === 'unsupported') {
      result.values = { sourceVoltageV: null, circuitCurrentA: null, resistorVoltageV: null, ledForwardVoltageV: null };
    } else {
      result.values = { ...result.values, ...readings };
    }
    result.ledOn = status === 'valid';
    result.diagnostics = [{ code, severity, affectedIds, messageAr }];
    return result;
  }

  const invalid = (text = 'بيانات الدائرة غير مكتملة أو غير صالحة.') =>
    finish('unsupported', 'INVALID_DATA', 'error', text);
  const open = (text = 'الدائرة غير مكتملة؛ لا يوجد مسار سلسلة متصل من قطب المصدر الموجب إلى السالب.') =>
    finish('open', 'OPEN_CIRCUIT', 'warning', text, [], { circuitCurrentA: 0 });
  const unsupported = (text = 'هذه التوصيلات تحتوي تفرعات أو حلقات غير مدعومة. استخدم حلقة سلسلة واحدة.') =>
    finish('unsupported', 'UNSUPPORTED_TOPOLOGY', 'warning', text);

  if (!snapshot || !Array.isArray(snapshot.components) || !Array.isArray(snapshot.wires)) return invalid();
  const { components, wires } = snapshot;
  const validKinds = new Set(['dc_source', 'resistor', 'led', 'switch', 'meter']);
  const expectedRoles = {
    dc_source: ['positive', 'negative'], resistor: ['terminal_a', 'terminal_b'],
    led: ['anode', 'cathode'], switch: ['terminal_a', 'terminal_b'],
  };
  const ports = new Map();
  const componentIds = new Set();
  const groups = { dc_source: [], resistor: [], led: [], switch: [], meter: [] };
  for (const c of components) {
    if (!c || typeof c.id !== 'string' || !c.id || componentIds.has(c.id) || !validKinds.has(c.kind)) return invalid();
    componentIds.add(c.id);
    if (!Array.isArray(c.ports)) return invalid();
    const roles = expectedRoles[c.kind];
    if (roles && (c.ports.length !== 2 || !roles.every(role => c.ports.some(p => p.role === role)))) return invalid();
    groups[c.kind].push(c);
    for (const p of c.ports) {
      if (!p || typeof p.id !== 'string' || !p.id || ports.has(p.id) || p.componentId !== c.id) return invalid();
      ports.set(p.id, p);
    }
  }
  if (groups.dc_source.length === 0) {
    return finish('open', 'OPEN_CIRCUIT', 'info', 'لا يوجد مصدر جهد. أضف بطارية لتزويد الدائرة بالطاقة.', [], { circuitCurrentA: 0 });
  }
  if (groups.dc_source.length !== 1 || groups.resistor.length > 1 || groups.led.length > 1 ||
      groups.switch.length > 1 || groups.meter.length !== 0) return unsupported();

  const source = groups.dc_source[0];
  const voltage = source.voltageV;
  if (typeof voltage !== 'number' || !Number.isFinite(voltage) || voltage <= 0) return invalid('قيمة جهد المصدر غير صالحة.');
  result.values.sourceVoltageV = voltage;
  const resistor = groups.resistor[0];
  const led = groups.led[0];
  const sw = groups.switch[0];
  if (resistor && (typeof resistor.resistanceOhms !== 'number' || !Number.isFinite(resistor.resistanceOhms) || resistor.resistanceOhms <= 0))
    return invalid('قيمة المقاومة غير صالحة.');
  if (led && ((typeof led.forwardVoltageV !== 'number' || !Number.isFinite(led.forwardVoltageV) || led.forwardVoltageV <= 0) ||
              (typeof led.maxCurrentA !== 'number' || !Number.isFinite(led.maxCurrentA) || led.maxCurrentA <= 0)))
    return invalid('بيانات الصمام LED غير صالحة.');
  if (sw && typeof sw.isOpen !== 'boolean') return invalid('حالة المفتاح غير صالحة.');

  // Union-find: wires are ideal conductors, so all wire-connected ports share a net.
  const parent = new Map([...ports.keys()].map(id => [id, id]));
  const find = (id) => {
    let node = id;
    while (parent.get(node) !== node) node = parent.get(node);
    let cur = id;
    while (parent.get(cur) !== node) { const next = parent.get(cur); parent.set(cur, node); cur = next; }
    return node;
  };
  const union = (a, b) => { parent.set(find(a), find(b)); };
  const wireKeys = new Set();
  for (const wire of wires) {
    if (!wire || !ports.has(wire.fromPortId) || !ports.has(wire.toPortId) || wire.fromPortId === wire.toPortId)
      return invalid('يوجد سلك يشير إلى منفذ غير معروف أو إلى المنفذ نفسه.');
    const key = [wire.fromPortId, wire.toPortId].sort().join('|');
    if (wireKeys.has(key)) return unsupported('يوجد سلك مكرر بين نفس المنفذين.');
    wireKeys.add(key);
    union(wire.fromPortId, wire.toPortId);
  }
  const portOf = (component, role) => component?.ports.find(p => p.role === role)?.id;
  const plus = portOf(source, 'positive');
  const minus = portOf(source, 'negative');
  if (find(plus) === find(minus)) {
    return finish('unsafe', 'SOURCE_SHORT', 'error', 'خطر: قصر مباشر أو غير مباشر بين قطبي المصدر عبر الأسلاك.', [source.id]);
  }
  if (resistor && find(portOf(resistor, 'terminal_a')) === find(portOf(resistor, 'terminal_b'))) {
    return finish('unsafe', 'BYPASSED_RESISTOR', 'error', 'خطر: المقاومة متجاوزة بواسطة أسلاك موصلة بين طرفيها.', [resistor.id]);
  }
  if (led && find(portOf(led, 'anode')) === find(portOf(led, 'cathode'))) return unsupported('أطراف الصمام متصلة على نفس العقدة الكهربائية.');
  if (sw && find(portOf(sw, 'terminal_a')) === find(portOf(sw, 'terminal_b'))) return unsupported('المفتاح متجاوز بسلك، وهذه الدائرة غير مدعومة.');

  // Missing required devices cannot be treated as a normal functioning LED loop.
  if (!led || !sw) return open('أضف الصمام والمفتاح وأكمل التوصيل لتجربة قانون أوم وحماية LED.');

  const active = [source, ...(resistor ? [resistor] : []), led, sw];
  const netTerminals = new Map();
  for (const c of active) for (const p of c.ports) {
    const net = find(p.id);
    if (!netTerminals.has(net)) netTerminals.set(net, []);
    netTerminals.get(net).push({ component: c, port: p });
  }
  // Missing physical wire = an isolated port, rather than an inferred connection.
  const connected = new Set(wires.flatMap(w => [w.fromPortId, w.toPortId]));
  if (active.some(c => c.ports.some(p => !connected.has(p.id)))) return open();
  // No branching or parallel loads in the approved single-loop model.
  if ([...netTerminals.values()].some(terminals => terminals.length > 2)) return unsupported();
  if ([...netTerminals.values()].some(terminals => terminals.length !== 2)) return open();

  // Walk the actual series circuit from source + to source -, following one wire
  // net and then one internal component at each step. Track LED polarity as seen
  // from the positive source terminal, regardless of resistor placement/order.
  let outgoingPortId = plus;
  const traversed = new Set();
  let reversedLed = false;
  let endedAtNegative = false;
  for (let step = 0; step <= active.length; step++) {
    const terminals = netTerminals.get(find(outgoingPortId)) || [];
    const next = terminals.find(item => item.port.id !== outgoingPortId);
    if (!next) break;
    const comp = next.component;
    if (comp.id === source.id) {
      endedAtNegative = next.port.id === minus;
      break;
    }
    if (traversed.has(comp.id)) return unsupported();
    traversed.add(comp.id);
    if (comp.kind === 'led' && next.port.role === 'cathode') reversedLed = true;
    const exitPort = comp.ports.find(p => p.id !== next.port.id);
    outgoingPortId = exitPort.id;
  }
  if (!endedAtNegative || traversed.size !== active.length - 1) return open();
  // Every terminal in the circuit now belongs to this one source-to-return path;
  // there are no independent disconnected cycles or bypassed devices.
  if (sw.isOpen) {
    return finish('open', 'SWITCH_OPEN', 'info', 'المفتاح مفتوح. أغلقه للسماح بمرور التيار.', [sw.id], { circuitCurrentA: 0 });
  }
  if (!resistor) {
    return finish('unsafe', 'MISSING_RESISTOR', 'error', 'خطر: الصمام موصل بمصدر الجهد دون مقاومة حماية.', [led.id]);
  }
  if (reversedLed) {
    return finish('open', 'REVERSED_LED', 'warning', 'الصمام موصل بقطبية معكوسة؛ اعكس المصعد والمهبط.', [led.id],
      { circuitCurrentA: 0, resistorVoltageV: 0 });
  }
  const vf = led.forwardVoltageV;
  if (voltage <= vf) {
    return finish('open', 'OPEN_CIRCUIT', 'info', 'جهد المصدر لا يتجاوز جهد تشغيل الصمام في هذا النموذج.', [led.id],
      { circuitCurrentA: 0, resistorVoltageV: 0 });
  }
  const current = (voltage - vf) / resistor.resistanceOhms;
  if (current > led.maxCurrentA) {
    return finish('unsafe', 'OVERCURRENT', 'error',
      `خطر: التيار النظري ${(current * 1000).toFixed(2)}mA يتجاوز حد الصمام ${(led.maxCurrentA * 1000).toFixed(2)}mA، وقد حُجبت القراءات.`,
      [led.id, resistor.id]);
  }
  return finish('valid', 'OK', 'info', 'الدائرة سليمة وفق نموذج الصمام التعليمي ذي الجهد الأمامي الثابت.', [], {
    circuitCurrentA: current, resistorVoltageV: current * resistor.resistanceOhms, ledForwardVoltageV: vf,
  });
}
