/**
 * Mamal AI v3.1 - Multisim-Inspired Component Library (Groups, Families, ANSI/IEC Symbols)
 */

export const COMPONENT_GROUPS = [
  { id: 'all', icon: 'All', labelAr: 'كل المجموعات', labelEn: '<All groups>' },
  { id: 'sources', icon: '⚡', labelAr: 'المصادر (Sources)', labelEn: 'Sources' },
  { id: 'basic', icon: '♒', labelAr: 'الأساسيات (Basic)', labelEn: 'Basic' },
  { id: 'diodes', icon: '▷|', labelAr: 'الثنائيات والضوئيات (Diodes)', labelEn: 'Diodes & LEDs' },
  { id: 'indicators', icon: '🔆', labelAr: 'المؤشرات والأحمال (Indicators)', labelEn: 'Indicators' },
];

export const COMPONENT_CATALOG = [
  // SOURCES
  {
    group: 'sources', familyAr: 'مصادر القدرة', familyEn: 'POWER_SOURCES',
    code: 'DC_POWER', kind: 'dc_source', icon: '🔋', btnId: 'btnAddBattery',
    labelAr: 'مصدر جهد مستمر ثابت (DC_POWER)', labelEn: 'DC Voltage Source (DC_POWER)',
    descAr: 'مصدر فرق جهد مستمر قابل لضبط القيمة من 0V حتى أي جهد مطلوب.',
    descEn: 'Fixed/editable DC voltage source configurable to any voltage.',
    defaults: { voltageV: 5.0 },
    ports: [{ suffix: 'pos', role: 'positive', label: '+' }, { suffix: 'neg', role: 'negative', label: '-' }],
  },
  {
    group: 'sources', familyAr: 'مصادر متغيرة', familyEn: 'INTERACTIVE_SOURCES',
    code: 'DC_INTERACTIVE_VOLTAGE', kind: 'dc_source', icon: '🎚️',
    labelAr: 'مصدر جهد مستمر متغير (DC_INTERACTIVE)', labelEn: 'Variable DC Source (DC_INTERACTIVE)',
    descAr: 'مصدر جهد DC تفاعلي متغير القيمة للتجارب المعملية.',
    descEn: 'Interactive variable DC voltage supply for lab sweeps.',
    defaults: { voltageV: 9.0, isVariable: true },
    ports: [{ suffix: 'pos', role: 'positive', label: '+' }, { suffix: 'neg', role: 'negative', label: '-' }],
  },
  {
    group: 'sources', familyAr: 'مصادر مترددة', familyEn: 'SIGNAL_VOLTAGE_SOURCES',
    code: 'AC_VOLTAGE', kind: 'ac_source', icon: '〰️',
    labelAr: 'مصدر جهد متردد (AC_VOLTAGE)', labelEn: 'AC Voltage Source (AC_VOLTAGE)',
    descAr: 'مصدر تيار متردد (جيبي) قابل لتعديل الجهد والتردد.',
    descEn: 'Sinusoidal AC voltage source with configurable RMS voltage.',
    defaults: { voltageV: 12.0, frequencyHz: 50 },
    ports: [{ suffix: 'pos', role: 'positive', label: '~+' }, { suffix: 'neg', role: 'negative', label: '~-' }],
  },
  {
    group: 'sources', familyAr: 'مصادر التيار', familyEn: 'SIGNAL_CURRENT_SOURCES',
    code: 'DC_CURRENT', kind: 'current_source', icon: '⬆️',
    labelAr: 'مصدر تيار ثابت / متغير (DC_CURRENT)', labelEn: 'DC Current Source (DC_CURRENT)',
    descAr: 'مصدر تيار كهربائي ثابت أو متغير الشدة بالأمبير والملي أمبير.',
    descEn: 'Configurable constant/variable DC current source.',
    defaults: { currentA: 0.02 },
    ports: [{ suffix: 'pos', role: 'positive', label: 'I+' }, { suffix: 'neg', role: 'negative', label: 'I-' }],
  },
  // BASIC
  {
    group: 'basic', familyAr: 'المقاومات', familyEn: 'RESISTOR',
    code: 'RESISTOR', kind: 'resistor', icon: '♒', btnId: 'btnAddResistor',
    labelAr: 'مقاومة ثابتة (RESISTOR)', labelEn: 'Fixed Resistor (RESISTOR)',
    descAr: 'مقاومة كهربائية خطية تحد من التيار؛ انقر نقرتين لضبط أي قيمة بالأوم.',
    descEn: 'Linear fixed resistor; double-click to set any value in Ohms.',
    defaults: { resistanceOhms: 330.0 },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
  {
    group: 'basic', familyAr: 'المقاومات المتغيرة', familyEn: 'POTENTIOMETER',
    code: 'POTENTIOMETER', kind: 'potentiometer', icon: '🎛️',
    labelAr: 'مقاومة متغيرة (POTENTIOMETER)', labelEn: 'Variable Resistor (POTENTIOMETER)',
    descAr: 'مقاومة متغيرة للتحكم السلس في التيار وهبوط الجهد.',
    descEn: 'Variable resistor / potentiometer for continuous current control.',
    defaults: { resistanceOhms: 500.0, maxResistanceOhms: 5000.0 },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
  {
    group: 'basic', familyAr: 'المكثفات', familyEn: 'CAPACITOR',
    code: 'CAPACITOR', kind: 'capacitor', icon: '┤├',
    labelAr: 'مكثف (CAPACITOR)', labelEn: 'Capacitor (CAPACITOR)',
    descAr: 'مكثف كهربائي لتخزين الشحنة الكهربائية (بالميكروفاراد µF).',
    descEn: 'Electrical capacitor storing charge (configurable in µF).',
    defaults: { capacitanceUf: 100.0 },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '+' }, { suffix: 'b', role: 'terminal_b', label: '-' }],
  },
  {
    group: 'basic', familyAr: 'الملفات والمحثات', familyEn: 'INDUCTOR',
    code: 'INDUCTOR', kind: 'inductor', icon: '🌀',
    labelAr: 'ملف / محث (INDUCTOR)', labelEn: 'Inductor / Coil (INDUCTOR)',
    descAr: 'ملف حث كهرومغناطيسي (بالملي هنري mH).',
    descEn: 'Electromagnetic inductor coil (configurable in mH).',
    defaults: { inductanceMh: 10.0 },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
  {
    group: 'basic', familyAr: 'المفاتيح', familyEn: 'SWITCH',
    code: 'SPST_SWITCH', kind: 'switch', icon: '🔘', btnId: 'btnAddSwitch',
    labelAr: 'مفتاح كهربائي (SPST_SWITCH)', labelEn: 'SPST Toggle Switch (SPST)',
    descAr: 'مفتاح فتح وإغلاق مستقل؛ انقر مباشرة على جسمه لتبديل حالته.',
    descEn: 'Independent toggle switch; click directly on its body to open/close.',
    defaults: { isOpen: false },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
  // DIODES & LEDS
  {
    group: 'diodes', familyAr: 'الصمامات الضوئية', familyEn: 'LED',
    code: 'LED_RED', kind: 'led', icon: '💡', btnId: 'btnAddLed',
    labelAr: 'صمام ضوئي (LED — متعدد الألوان)', labelEn: 'Light Emitting Diode (LED)',
    descAr: 'صمام باعث للضوء قابل لاختيار اللون (أحمر/أخضر/أزرق/أصفر) والجهد الأمامي.',
    descEn: 'LED with selectable color (Red/Green/Blue/Yellow) and forward voltage.',
    defaults: { forwardVoltageV: 2.0, maxCurrentA: 0.02, ledColor: '#FF4D4F' },
    ports: [{ suffix: 'anode', role: 'anode', label: 'A' }, { suffix: 'cathode', role: 'cathode', label: 'K' }],
  },
  {
    group: 'diodes', familyAr: 'الثنائيات', familyEn: 'DIODE',
    code: 'DIODE_1N4007', kind: 'diode', icon: '▷|',
    labelAr: 'دايود مقوّم (1N4007)', labelEn: 'Rectifier Diode (1N4007)',
    descAr: 'ثنائي سيليكوني يسمح بمرور التيار في اتجاه واحد (Vf ≈ 0.7V).',
    descEn: 'Silicon rectifier diode conducting in one direction (Vf ≈ 0.7V).',
    defaults: { forwardVoltageV: 0.7 },
    ports: [{ suffix: 'anode', role: 'anode', label: 'A' }, { suffix: 'cathode', role: 'cathode', label: 'K' }],
  },
  // INDICATORS
  {
    group: 'indicators', familyAr: 'المصابيح والأحمال', familyEn: 'LAMP',
    code: 'LAMP_100', kind: 'lamp', icon: '🔆',
    labelAr: 'مصباح حمل (LAMP)', labelEn: 'Incandescent Lamp (LAMP)',
    descAr: 'مصباح حمل كهربائي يضيء عند مرور التيار (مقاومة قابلة للتعديل).',
    descEn: 'Resistive incandescent lamp indicator with editable resistance.',
    defaults: { resistanceOhms: 100.0 },
    ports: [{ suffix: 'a', role: 'terminal_a', label: '1' }, { suffix: 'b', role: 'terminal_b', label: '2' }],
  },
];

/**
 * Generates crisp ANSI/IEC SVG schematic graphics for a component (centered in 120x80 box).
 */
export function getSchematicSymbolMarkup(comp, isLit = false) {
  const stroke = 'currentColor';
  switch (comp.kind) {
    case 'dc_source':
      return `
        <line x1="12" y1="40" x2="48" y2="40" stroke="${stroke}" stroke-width="2"/>
        <line x1="48" y1="26" x2="48" y2="54" stroke="${stroke}" stroke-width="2"/>
        <line x1="58" y1="33" x2="58" y2="47" stroke="${stroke}" stroke-width="3.5"/>
        <line x1="68" y1="26" x2="68" y2="54" stroke="${stroke}" stroke-width="2"/>
        <line x1="78" y1="33" x2="78" y2="47" stroke="${stroke}" stroke-width="3.5"/>
        <line x1="78" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
      `;
    case 'ac_source':
      return `
        <line x1="12" y1="40" x2="42" y2="40" stroke="${stroke}" stroke-width="2"/>
        <circle cx="60" cy="40" r="18" fill="none" stroke="${stroke}" stroke-width="2"/>
        <path d="M 49 40 Q 54.5 29 60 40 T 71 40" fill="none" stroke="${stroke}" stroke-width="2"/>
        <line x1="78" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
      `;
    case 'current_source':
      return `
        <line x1="12" y1="40" x2="42" y2="40" stroke="${stroke}" stroke-width="2"/>
        <circle cx="60" cy="40" r="18" fill="none" stroke="${stroke}" stroke-width="2"/>
        <line x1="48" y1="40" x2="70" y2="40" stroke="${stroke}" stroke-width="2"/>
        <polygon points="73,40 65,35 65,45" fill="${stroke}"/>
        <line x1="78" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
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
        <line x1="42" y1="54" x2="74" y2="24" stroke="#FF812C" stroke-width="2"/>
        <polygon points="77,21 69,23 74,29" fill="#FF812C"/>
      `;
    case 'capacitor':
      return `
        <line x1="12" y1="40" x2="53" y2="40" stroke="${stroke}" stroke-width="2"/>
        <line x1="53" y1="24" x2="53" y2="56" stroke="${stroke}" stroke-width="3"/>
        <line x1="67" y1="24" x2="67" y2="56" stroke="${stroke}" stroke-width="3"/>
        <line x1="67" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
      `;
    case 'inductor':
      return `
        <line x1="12" y1="40" x2="30" y2="40" stroke="${stroke}" stroke-width="2"/>
        <path d="M 30 40 A 7.5 10 0 0 1 45 40 A 7.5 10 0 0 1 60 40 A 7.5 10 0 0 1 75 40 A 7.5 10 0 0 1 90 40" fill="none" stroke="${stroke}" stroke-width="2.2"/>
        <line x1="90" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
      `;
    case 'switch':
      return comp.isOpen
        ? `
          <line x1="12" y1="40" x2="40" y2="40" stroke="${stroke}" stroke-width="2"/>
          <circle cx="42" cy="40" r="3.5" fill="#F59E0B"/>
          <line x1="44" y1="38" x2="75" y2="23" stroke="#F59E0B" stroke-width="2.8" stroke-linecap="round"/>
          <circle cx="78" cy="40" r="3.5" fill="${stroke}"/>
          <line x1="80" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        `
        : `
          <line x1="12" y1="40" x2="40" y2="40" stroke="${stroke}" stroke-width="2"/>
          <circle cx="42" cy="40" r="3.5" fill="#10B981"/>
          <line x1="42" y1="40" x2="78" y2="40" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>
          <circle cx="78" cy="40" r="3.5" fill="#10B981"/>
          <line x1="80" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        `;
    case 'led': {
      const col = comp.ledColor || '#FF4D4F';
      return `
        <line x1="12" y1="40" x2="46" y2="40" stroke="${stroke}" stroke-width="2"/>
        <polygon points="46,28 46,52 70,40" fill="${isLit ? col : 'none'}" stroke="${col}" stroke-width="2.2"/>
        <line x1="70" y1="28" x2="70" y2="52" stroke="${col}" stroke-width="2.5"/>
        <line x1="70" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
        <line x1="60" y1="24" x2="68" y2="16" stroke="${col}" stroke-width="1.6"/>
        <line x1="68" y1="26" x2="76" y2="18" stroke="${col}" stroke-width="1.6"/>
      `;
    }
    case 'diode':
      return `
        <line x1="12" y1="40" x2="46" y2="40" stroke="${stroke}" stroke-width="2"/>
        <polygon points="46,28 46,52 70,40" fill="none" stroke="${stroke}" stroke-width="2.2"/>
        <line x1="70" y1="28" x2="70" y2="52" stroke="${stroke}" stroke-width="2.5"/>
        <line x1="70" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
      `;
    case 'lamp':
      return `
        <line x1="12" y1="40" x2="44" y2="40" stroke="${stroke}" stroke-width="2"/>
        <circle cx="60" cy="40" r="16" fill="${isLit ? 'rgba(255, 196, 0, 0.35)' : 'none'}" stroke="${isLit ? '#F59E0B' : stroke}" stroke-width="2.2"/>
        <line x1="49" y1="29" x2="71" y2="51" stroke="${isLit ? '#F59E0B' : stroke}" stroke-width="2"/>
        <line x1="71" y1="29" x2="49" y2="51" stroke="${isLit ? '#F59E0B' : stroke}" stroke-width="2"/>
        <line x1="76" y1="40" x2="108" y2="40" stroke="${stroke}" stroke-width="2"/>
      `;
    default:
      return '';
  }
}
