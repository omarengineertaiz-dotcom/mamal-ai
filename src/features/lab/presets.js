/**
 * Mamal AI v3.1.3 - Multisim Component Library (Fixed & Variable + Digital Logic + ANSI/IEC Symbols)
 */

export const COMPONENT_GROUPS = [
  { id: 'all', icon: 'All', labelAr: 'كل المجموعات', labelEn: '<All groups>' },
  { id: 'sources', icon: '⚡', labelAr: 'المصادر (Sources)', labelEn: 'Sources' },
  { id: 'basic', icon: '♒', labelAr: 'الأساسيات (Basic)', labelEn: 'Basic' },
  { id: 'diodes', icon: '▷|', labelAr: 'الثنائيات والضوئيات (Diodes)', labelEn: 'Diodes & LEDs' },
  { id: 'indicators', icon: '🔆', labelAr: 'المؤشرات والأحمال (Indicators)', labelEn: 'Indicators' },
  { id: 'digital', icon: '01', labelAr: 'الرقميات والبوابات (Digital)', labelEn: 'Digital & Logic' },
];

export const COMPONENT_CATALOG = [
  // SOURCES
  {
    group: 'sources', familyAr: 'مصادر ثابتة', familyEn: 'POWER_SOURCES',
    code: 'DC_POWER', kind: 'dc_source', icon: '🔋', btnId: 'btnAddBattery',
    labelAr: 'مصدر جهد مستمر ثابت (DC_POWER)', labelEn: 'Fixed DC Voltage (DC_POWER)',
    descAr: 'مصدر جهد مستمر ثابت؛ يُضبط من نافذة الخصائص مع اختيار الوحدة (mV / V).',
    descEn: 'Fixed DC voltage source; edit value & unit (mV/V) in properties.',
    defaults: { voltageV: 5.0, isVariable: false },
    ports: [{ suffix: 'pos', role: 'positive', label: '+' }, { suffix: 'neg', role: 'negative', label: '-' }],
  },
  {
    group: 'sources', familyAr: 'مصادر متغيرة', familyEn: 'INTERACTIVE_SOURCES',
    code: 'DC_INTERACTIVE', kind: 'dc_source', icon: '🎚️',
    labelAr: 'مصدر جهد مستمر متغير (DC_VAR ↗)', labelEn: 'Variable DC Voltage (DC_VAR ↗)',
    descAr: 'مصدر جهد DC متغير بسهم قياسي وشريط سحب حيّ أثناء تشغيل التجربة.',
    descEn: 'Variable DC voltage source with diagonal arrow & live slider.',
    defaults: { voltageV: 9.0, isVariable: true },
    ports: [{ suffix: 'pos', role: 'positive', label: '+' }, { suffix: 'neg', role: 'negative', label: '-' }],
  },
  {
    group: 'sources', familyAr: 'مصادر مترددة', familyEn: 'SIGNAL_VOLTAGE_SOURCES',
    code: 'AC_VOLTAGE', kind: 'ac_source', icon: '〰️',
    labelAr: 'مصدر جهد متردد ثابت (AC_VOLTAGE)', labelEn: 'Fixed AC Voltage (AC_VOLTAGE)',
    descAr: 'مصدر جهد متردد جيبي ثابت يُضبط من نافذة الخصائص.',
    descEn: 'Fixed sinusoidal AC voltage source.',
    defaults: { voltageV: 12.0, frequencyHz: 50, isVariable: false },
    ports: [{ suffix: 'pos', role: 'positive', label: '~+' }, { suffix: 'neg', role: 'negative', label: '~-' }],
  },
  {
    group: 'sources', familyAr: 'مصادر مترددة متغيرة', familyEn: 'INTERACTIVE_SOURCES',
    code: 'AC_INTERACTIVE', kind: 'ac_source', icon: '〰️',
    labelAr: 'مصدر جهد متردد متغير (AC_VAR ↗)', labelEn: 'Variable AC Voltage (AC_VAR ↗)',
    descAr: 'مصدر جهد AC متغير بسهم مائل وشريط سحب حيّ.',
    descEn: 'Variable AC voltage source with diagonal arrow & live slider.',
    defaults: { voltageV: 12.0, frequencyHz: 50, isVariable: true },
    ports: [{ suffix: 'pos', role: 'positive', label: '~+' }, { suffix: 'neg', role: 'negative', label: '~-' }],
  },
  {
    group: 'sources', familyAr: 'مصادر التيار', familyEn: 'SIGNAL_CURRENT_SOURCES',
    code: 'DC_CURRENT', kind: 'current_source', icon: '⬆️',
    labelAr: 'مصدر تيار (DC_CURRENT)', labelEn: 'DC Current Source (DC_CURRENT)',
    descAr: 'مصدر تيار كهربائي قابل للضبط بالأمبير والملي أمبير.',
    descEn: 'Configurable DC current source (A / mA).',
    defaults: { currentA: 0.02, isVariable: false },
    ports: [{ suffix: 'pos', role: 'positive', label: 'I+' }, { suffix: 'neg', role: 'negative', label: 'I-' }],
  },

  // BASIC
  {
    group: 'basic', familyAr: 'المقاومات', familyEn: 'RESISTOR',
    code: 'RESISTOR', kind: 'resistor', icon: '♒', btnId: 'btnAddResistor',
    labelAr: 'مقاومة ثابتة (RESISTOR)', labelEn: 'Fixed Resistor (RESISTOR)',
    descAr: 'مقاومة ثابتة؛ انقر نقرتين لضبط قيمتها ووحدتها (Ω / kΩ / MΩ).',
    descEn: 'Fixed resistor; double-click to set value & unit (Ω/kΩ/MΩ).',
    defaults: { resistanceOhms: 330.0, isVariable: false },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
  {
    group: 'basic', familyAr: 'المقاومات المتغيرة', familyEn: 'POTENTIOMETER',
    code: 'POTENTIOMETER', kind: 'potentiometer', icon: '🎛️',
    labelAr: 'مقاومة متغيرة (POTENTIOMETER ↗)', labelEn: 'Variable Resistor (POT ↗)',
    descAr: 'مقاومة متغيرة بشريط سحب حيّ للتحكم الفوري بالتيار أثناء التشغيل.',
    descEn: 'Variable resistor with live slider for real-time tuning.',
    defaults: { resistanceOhms: 500.0, maxResistanceOhms: 5000.0, isVariable: true },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
  {
    group: 'basic', familyAr: 'المكثفات', familyEn: 'CAPACITOR',
    code: 'CAPACITOR', kind: 'capacitor', icon: '┤├',
    labelAr: 'مكثف ثابت (CAPACITOR)', labelEn: 'Fixed Capacitor (CAPACITOR)',
    descAr: 'مكثف كهربائي ثابت السعة (pF / nF / µF / mF).',
    descEn: 'Fixed electrical capacitor (pF / nF / µF / mF).',
    defaults: { capacitanceUf: 100.0, isVariable: false },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '+' }, { suffix: 'b', role: 'terminal_b', label: '-' }],
  },
  {
    group: 'basic', familyAr: 'المكثفات المتغيرة', familyEn: 'CAPACITOR_VARIABLE',
    code: 'CAPACITOR_VAR', kind: 'capacitor', icon: '┤├',
    labelAr: 'مكثف متغير السعة (CAP_VAR ↗)', labelEn: 'Variable Capacitor (CAP_VAR ↗)',
    descAr: 'مكثف متغير السعة بسهم قياسي وشريط سحب حيّ لدوائر التوليف.',
    descEn: 'Variable tuning capacitor with diagonal arrow & live slider.',
    defaults: { capacitanceUf: 50.0, isVariable: true },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '+' }, { suffix: 'b', role: 'terminal_b', label: '-' }],
  },
  {
    group: 'basic', familyAr: 'الملفات والمحثات', familyEn: 'INDUCTOR',
    code: 'INDUCTOR', kind: 'inductor', icon: '🌀',
    labelAr: 'ملف / محث ثابت (INDUCTOR)', labelEn: 'Fixed Inductor (INDUCTOR)',
    descAr: 'محث ثابت الحث الذاتي (µH / mH / H).',
    descEn: 'Fixed electromagnetic inductor (µH / mH / H).',
    defaults: { inductanceMh: 10.0, isVariable: false },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
  {
    group: 'basic', familyAr: 'الملفات المتغيرة', familyEn: 'INDUCTOR_VARIABLE',
    code: 'INDUCTOR_VAR', kind: 'inductor', icon: '🌀',
    labelAr: 'ملف / محث متغير الحث (IND_VAR ↗)', labelEn: 'Variable Inductor (IND_VAR ↗)',
    descAr: 'محث متغير الحث بسهم قياسي وشريط سحب حيّ.',
    descEn: 'Variable permeability-tuned inductor with arrow & live slider.',
    defaults: { inductanceMh: 25.0, isVariable: true },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
  {
    group: 'basic', familyAr: 'المفاتيح', familyEn: 'SWITCH',
    code: 'SPST_SWITCH', kind: 'switch', icon: '🔘', btnId: 'btnAddSwitch',
    labelAr: 'مفتاح كهربائي (SPST_SWITCH)', labelEn: 'SPST Toggle Switch (SPST)',
    descAr: 'مفتاح فتح وإغلاق مستقل؛ انقر مباشرة على جسمه لتبديل حالته.',
    descEn: 'Independent toggle switch; click directly on its body to toggle.',
    defaults: { isOpen: false },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },

  // DIODES & LEDS
  {
    group: 'diodes', familyAr: 'الصمامات الضوئية', familyEn: 'LED',
    code: 'LED_RED', kind: 'led', icon: '💡', btnId: 'btnAddLed',
    labelAr: 'صمام ضوئي (LED — متعدد الألوان)', labelEn: 'Light Emitting Diode (LED)',
    descAr: 'صمام باعث للضوء قابل لاختيار اللون والجهد الأمامي.',
    descEn: 'LED with selectable color and forward voltage.',
    defaults: { forwardVoltageV: 2.0, maxCurrentA: 0.02, ledColor: '#FF4D4F' },
    ports: [{ suffix: 'anode', role: 'anode', label: 'A' }, { suffix: 'cathode', role: 'cathode', label: 'K' }],
  },
  {
    group: 'diodes', familyAr: 'الثنائيات', familyEn: 'DIODE',
    code: 'DIODE_1N4007', kind: 'diode', icon: '▷|',
    labelAr: 'دايود مقوّم (1N4007)', labelEn: 'Rectifier Diode (1N4007)',
    descAr: 'ثنائي سيليكوني يسمح بمرور التيار في اتجاه واحد (Vf ≈ 0.7V).',
    descEn: 'Silicon rectifier diode (Vf ≈ 0.7V).',
    defaults: { forwardVoltageV: 0.7 },
    ports: [{ suffix: 'anode', role: 'anode', label: 'A' }, { suffix: 'cathode', role: 'cathode', label: 'K' }],
  },

  // INDICATORS
  {
    group: 'indicators', familyAr: 'المصابيح والأحمال', familyEn: 'LAMP',
    code: 'LAMP_100', kind: 'lamp', icon: '🔆',
    labelAr: 'مصباح حمل (LAMP)', labelEn: 'Incandescent Lamp (LAMP)',
    descAr: 'مصباح حمل يضيء فقط عند مرور تيار فعلي فيه.',
    descEn: 'Resistive lamp that lights only when actual current flows through it.',
    defaults: { resistanceOhms: 100.0 },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },

  // DIGITAL LOGIC
  {
    group: 'digital', familyAr: 'مداخل رقمية', familyEn: 'DIGITAL_SOURCES',
    code: 'LOGIC_INPUT', kind: 'logic_input', icon: '0/1',
    labelAr: 'مصدر منطقي تفاعلي (0 / 1)', labelEn: 'Interactive Digital Input (0 / 1)',
    descAr: 'مدخل رقمي؛ انقر عليه مباشرة للتبديل بين 0 (LOW) و 1 (HIGH).',
    descEn: 'Interactive digital constant; click directly to toggle 0 / 1.',
    defaults: { logicValue: 0 },
    ports: [{ suffix: 'q', role: 'output', label: 'Q' }],
  },
  {
    group: 'digital', familyAr: 'مؤشرات رقمية', familyEn: 'DIGITAL_PROBES',
    code: 'LOGIC_PROBE', kind: 'logic_probe', icon: '🟢',
    labelAr: 'لمبة / مؤشر منطقي بمدخل واحد (PROBE)', labelEn: 'Single-Input Logic Probe Lamp',
    descAr: 'مؤشر منطقي يضيء عند استقبال 1 وينطفئ عند 0.',
    descEn: 'Single-input logic indicator lamp (lights on HIGH=1, off on LOW=0).',
    defaults: {},
    ports: [{ suffix: 'in', role: 'input', label: 'IN' }],
  },
  {
    group: 'digital', familyAr: 'البوابات المنطقية', familyEn: 'LOGIC_GATES',
    code: 'GATE_AND', kind: 'gate_and', icon: '&',
    labelAr: 'بوابة AND (و)', labelEn: '2-Input AND Gate',
    descAr: 'تُخرج 1 فقط عندما يكون كلا المدخلين A و B يساويان 1.',
    descEn: 'Outputs 1 only when both A and B are 1.',
    defaults: {},
    ports: [{ suffix: 'a', role: 'in_a', label: 'A' }, { suffix: 'b', role: 'in_b', label: 'B' }, { suffix: 'y', role: 'out_y', label: 'Y' }],
  },
  {
    group: 'digital', familyAr: 'البوابات المنطقية', familyEn: 'LOGIC_GATES',
    code: 'GATE_OR', kind: 'gate_or', icon: '≥1',
    labelAr: 'بوابة OR (أو)', labelEn: '2-Input OR Gate',
    descAr: 'تُخرج 1 إذا كان أحد المدخلين A أو B يساوي 1.',
    descEn: 'Outputs 1 when either A or B is 1.',
    defaults: {},
    ports: [{ suffix: 'a', role: 'in_a', label: 'A' }, { suffix: 'b', role: 'in_b', label: 'B' }, { suffix: 'y', role: 'out_y', label: 'Y' }],
  },
  {
    group: 'digital', familyAr: 'البوابات المنطقية', familyEn: 'LOGIC_GATES',
    code: 'GATE_NOT', kind: 'gate_not', icon: '¬',
    labelAr: 'بوابة NOT (العاكس)', labelEn: 'NOT Gate (Inverter)',
    descAr: 'تعكس إشارة المدخل: 0 تصبح 1، و1 تصبح 0.',
    descEn: 'Inverts input signal: 0 → 1, 1 → 0.',
    defaults: {},
    ports: [{ suffix: 'a', role: 'in_a', label: 'A' }, { suffix: 'y', role: 'out_y', label: 'Y' }],
  },
  {
    group: 'digital', familyAr: 'البوابات المنطقية', familyEn: 'LOGIC_GATES',
    code: 'GATE_NAND', kind: 'gate_nand', icon: '⊼',
    labelAr: 'بوابة NAND (نفي و)', labelEn: '2-Input NAND Gate',
    descAr: 'تُخرج 0 فقط عندما يكون كلا المدخلين 1.',
    descEn: 'Outputs 0 only when both inputs are 1.',
    defaults: {},
    ports: [{ suffix: 'a', role: 'in_a', label: 'A' }, { suffix: 'b', role: 'in_b', label: 'B' }, { suffix: 'y', role: 'out_y', label: 'Y' }],
  },
  {
    group: 'digital', familyAr: 'البوابات المنطقية', familyEn: 'LOGIC_GATES',
    code: 'GATE_NOR', kind: 'gate_nor', icon: '⊽',
    labelAr: 'بوابة NOR (نفي أو)', labelEn: '2-Input NOR Gate',
    descAr: 'تُخرج 1 فقط عندما يكون كلا المدخلين 0.',
    descEn: 'Outputs 1 only when both inputs are 0.',
    defaults: {},
    ports: [{ suffix: 'a', role: 'in_a', label: 'A' }, { suffix: 'b', role: 'in_b', label: 'B' }, { suffix: 'y', role: 'out_y', label: 'Y' }],
  },
  {
    group: 'digital', familyAr: 'البوابات المنطقية', familyEn: 'LOGIC_GATES',
    code: 'GATE_XOR', kind: 'gate_xor', icon: '⊕',
    labelAr: 'بوابة XOR (أو الحصرية)', labelEn: '2-Input XOR Gate',
    descAr: 'تُخرج 1 عندما يختلف المدخلان A و B.',
    descEn: 'Outputs 1 when inputs A and B differ.',
    defaults: {},
    ports: [{ suffix: 'a', role: 'in_a', label: 'A' }, { suffix: 'b', role: 'in_b', label: 'B' }, { suffix: 'y', role: 'out_y', label: 'Y' }],
  },
  {
    group: 'digital', familyAr: 'البوابات المنطقية', familyEn: 'LOGIC_GATES',
    code: 'GATE_XNOR', kind: 'gate_xnor', icon: '⊙',
    labelAr: 'بوابة XNOR (نفي أو الحصرية)', labelEn: '2-Input XNOR Gate',
    descAr: 'تُخرج 1 عندما يتساوى المدخلان A و B.',
    descEn: 'Outputs 1 when inputs A and B are equal.',
    defaults: {},
    ports: [{ suffix: 'a', role: 'in_a', label: 'A' }, { suffix: 'b', role: 'in_b', label: 'B' }, { suffix: 'y', role: 'out_y', label: 'Y' }],
  },
];

const VAR_ARROW = `<line x1="38" y1="58" x2="80" y2="20" stroke="#FF812C" stroke-width="2"/><polygon points="83,17 75,19 80,25" fill="#FF812C"/>`;

export function getSchematicSymbolMarkup(comp, isLit = false, logicVal = 0) {
  const stroke = 'currentColor';
  const arrow = comp.isVariable ? VAR_ARROW : '';
  switch (comp.kind) {
    case 'dc_source':
      return `
        <line x1="12" y1="40" x2="48" y2="40" stroke="${stroke}" stroke-width="2"/>
        <line x1="48" y1="26" x2="48" y2="54" stroke="${stroke}" stroke-width="2"/>
        <line x1="58" y1="33" x2="58" y2="47" stroke="${stroke}" stroke-width="3.5"/>
        <line x1="68" y1="26" x2="68" y2="54" stroke="${stroke}" stroke-width="2"/>
        <line x1="78" y1="33" x2="78" y2="47" stroke="${stroke}" stroke-width="3.5"/>
        <line x1="78" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        ${arrow}
      `;
    case 'ac_source':
      return `
        <line x1="12" y1="40" x2="42" y2="40" stroke="${stroke}" stroke-width="2"/>
        <circle cx="60" cy="40" r="18" fill="none" stroke="${stroke}" stroke-width="2"/>
        <path d="M 49 40 Q 54.5 29 60 40 T 71 40" fill="none" stroke="${stroke}" stroke-width="2"/>
        <line x1="78" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        ${arrow}
      `;
    case 'current_source':
      return `
        <line x1="12" y1="40" x2="42" y2="40" stroke="${stroke}" stroke-width="2"/>
        <circle cx="60" cy="40" r="18" fill="none" stroke="${stroke}" stroke-width="2"/>
        <line x1="48" y1="40" x2="70" y2="40" stroke="${stroke}" stroke-width="2"/>
        <polygon points="73,40 65,35 65,45" fill="${stroke}"/>
        <line x1="78" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        ${arrow}
      `;
    case 'resistor':
      return `
        <line x1="12" y1="40" x2="32" y2="40" stroke="${stroke}" stroke-width="2"/>
        <polyline points="32,40 37,30 45,50 53,30 61,50 69,30 77,50 83,40" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>
        <line x1="83" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
      `;
    case 'potentiometer':
      return `
        <line x1="12" y1="40" x2="32" y2="40" stroke="${stroke}" stroke-width="2"/>
        <polyline points="32,40 37,30 45,50 53,30 61,50 69,30 77,50 83,40" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>
        <line x1="83" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        ${VAR_ARROW}
      `;
    case 'capacitor':
      return `
        <line x1="12" y1="40" x2="53" y2="40" stroke="${stroke}" stroke-width="2"/>
        <line x1="53" y1="24" x2="53" y2="56" stroke="${stroke}" stroke-width="3"/>
        <line x1="67" y1="24" x2="67" y2="56" stroke="${stroke}" stroke-width="3"/>
        <line x1="67" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        ${arrow}
      `;
    case 'inductor':
      return `
        <line x1="12" y1="40" x2="30" y2="40" stroke="${stroke}" stroke-width="2"/>
        <path d="M 30 40 A 7.5 10 0 0 1 45 40 A 7.5 10 0 0 1 60 40 A 7.5 10 0 0 1 75 40 A 7.5 10 0 0 1 90 40" fill="none" stroke="${stroke}" stroke-width="2.2"/>
        <line x1="90" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        ${arrow}
      `;
    case 'switch':
      return comp.isOpen
        ? `<line x1="12" y1="40" x2="40" y2="40" stroke="${stroke}" stroke-width="2"/><circle cx="42" cy="40" r="3.5" fill="#F59E0B"/><line x1="44" y1="38" x2="75" y2="23" stroke="#F59E0B" stroke-width="2.8" stroke-linecap="round"/><circle cx="78" cy="40" r="3.5" fill="${stroke}"/><line x1="80" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>`
        : `<line x1="12" y1="40" x2="40" y2="40" stroke="${stroke}" stroke-width="2"/><circle cx="42" cy="40" r="3.5" fill="#10B981"/><line x1="42" y1="40" x2="78" y2="40" stroke="#10B981" stroke-width="3" stroke-linecap="round"/><circle cx="78" cy="40" r="3.5" fill="#10B981"/><line x1="80" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>`;
    case 'led': {
      const col = (typeof comp.ledColor === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(comp.ledColor.trim())) ? comp.ledColor.trim() : '#FF4D4F';
      return `<line x1="12" y1="40" x2="46" y2="40" stroke="${stroke}" stroke-width="2"/><polygon points="46,28 46,52 70,40" fill="${isLit ? col : 'none'}" stroke="${col}" stroke-width="2.2"/><line x1="70" y1="28" x2="70" y2="52" stroke="${col}" stroke-width="2.5"/><line x1="70" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/><line x1="60" y1="24" x2="68" y2="16" stroke="${col}" stroke-width="1.6"/><line x1="68" y1="26" x2="76" y2="18" stroke="${col}" stroke-width="1.6"/>`;
    }
    case 'diode':
      return `<line x1="12" y1="40" x2="46" y2="40" stroke="${stroke}" stroke-width="2"/><polygon points="46,28 46,52 70,40" fill="none" stroke="${stroke}" stroke-width="2.2"/><line x1="70" y1="28" x2="70" y2="52" stroke="${stroke}" stroke-width="2.5"/><line x1="70" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>`;
    case 'lamp':
      return `<line x1="12" y1="40" x2="44" y2="40" stroke="${stroke}" stroke-width="2"/><circle cx="60" cy="40" r="16" fill="${isLit ? 'rgba(255, 196, 0, 0.45)' : 'none'}" stroke="${isLit ? '#F59E0B' : stroke}" stroke-width="2.2"/><line x1="49" y1="29" x2="71" y2="51" stroke="${isLit ? '#F59E0B' : stroke}" stroke-width="2"/><line x1="71" y1="29" x2="49" y2="51" stroke="${isLit ? '#F59E0B' : stroke}" stroke-width="2"/><line x1="76" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>`;

    // DIGITAL SYMBOLS
    case 'logic_input': {
      const on = comp.logicValue ? 1 : 0;
      return `
        <rect x="30" y="22" width="46" height="36" rx="8" fill="${on ? 'rgba(34,197,94,0.25)' : 'rgba(148,163,184,0.12)'}" stroke="${on ? '#22C55E' : stroke}" stroke-width="2.2"/>
        <text x="53" y="47" text-anchor="middle" fill="${on ? '#22C55E' : stroke}" font-size="22" font-weight="900" font-family="monospace">${on}</text>
        <line x1="76" y1="40" x2="112" y2="40" stroke="${on ? '#22C55E' : stroke}" stroke-width="2.2"/>
      `;
    }
    case 'logic_probe': {
      const on = logicVal ? 1 : 0;
      return `
        <line x1="8" y1="40" x2="42" y2="40" stroke="${on ? '#22C55E' : stroke}" stroke-width="2.2"/>
        <circle cx="62" cy="40" r="18" fill="${on ? '#22C55E' : 'rgba(148,163,184,0.12)'}" stroke="${on ? '#86EFAC' : stroke}" stroke-width="2.4"/>
        <text x="62" y="46" text-anchor="middle" fill="${on ? '#0F172A' : stroke}" font-size="18" font-weight="900" font-family="monospace">${on}</text>
      `;
    }
    case 'gate_not':
      return `
        <line x1="8" y1="40" x2="36" y2="40" stroke="${stroke}" stroke-width="2"/>
        <polygon points="36,24 36,56 76,40" fill="none" stroke="${stroke}" stroke-width="2.2"/>
        <circle cx="81" cy="40" r="4.5" fill="none" stroke="${stroke}" stroke-width="2.2"/>
        <line x1="86" y1="40" x2="112" y2="40" stroke="${stroke}" stroke-width="2"/>
      `;
    case 'gate_and':
    case 'gate_nand': {
      const inv = comp.kind === 'gate_nand';
      return `
        <line x1="8" y1="26" x2="34" y2="26" stroke="${stroke}" stroke-width="2"/>
        <line x1="8" y1="54" x2="34" y2="54" stroke="${stroke}" stroke-width="2"/>
        <path d="M 34 20 L 58 20 A 20 20 0 0 1 58 60 L 34 60 Z" fill="none" stroke="${stroke}" stroke-width="2.2"/>
        ${inv ? `<circle cx="83" cy="40" r="4.5" fill="none" stroke="${stroke}" stroke-width="2.2"/><line x1="88" y1="40" x2="112" y2="40" stroke="${stroke}" stroke-width="2"/>` : `<line x1="78" y1="40" x2="112" y2="40" stroke="${stroke}" stroke-width="2"/>`}
      `;
    }
    case 'gate_or':
    case 'gate_nor':
    case 'gate_xor':
    case 'gate_xnor': {
      const inv = comp.kind === 'gate_nor' || comp.kind === 'gate_xnor';
      const ex = comp.kind === 'gate_xor' || comp.kind === 'gate_xnor';
      return `
        <line x1="8" y1="26" x2="36" y2="26" stroke="${stroke}" stroke-width="2"/>
        <line x1="8" y1="54" x2="36" y2="54" stroke="${stroke}" stroke-width="2"/>
        ${ex ? `<path d="M 27 20 Q 37 40 27 60" fill="none" stroke="${stroke}" stroke-width="2"/>` : ''}
        <path d="M 33 20 Q 43 40 33 60 L 52 60 Q 72 60 80 40 Q 72 20 52 20 Z" fill="none" stroke="${stroke}" stroke-width="2.2"/>
        ${inv ? `<circle cx="85" cy="40" r="4.5" fill="none" stroke="${stroke}" stroke-width="2.2"/><line x1="90" y1="40" x2="112" y2="40" stroke="${stroke}" stroke-width="2"/>` : `<line x1="80" y1="40" x2="112" y2="40" stroke="${stroke}" stroke-width="2"/>`}
      `;
    }
    default:
      return '';
  }
}
