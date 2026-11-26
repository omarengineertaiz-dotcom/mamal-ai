/**
 * Mamal AI v3.0 - Ready-made Engineering Experiment Presets & Component Catalog
 * Organized into Electricity (الكهرباء) and Electronics (الإلكترونيات).
 */

export const COMPONENT_CATALOG = [
  // Sources
  {
    category: 'sources',
    kind: 'dc_source',
    icon: '🔋',
    labelAr: 'مصدر جهد DC',
    labelEn: 'DC Voltage Source',
    defaultLabelAr: 'بطارية (5V)',
    defaultLabelEn: 'DC Source (5V)',
    btnId: 'btnAddBattery',
    defaults: { voltageV: 5.0 },
    ports: [
      { suffix: 'pos', role: 'positive', label: '+' },
      { suffix: 'neg', role: 'negative', label: '-' },
    ],
  },
  {
    category: 'sources',
    kind: 'ac_source',
    icon: '〰️',
    labelAr: 'مصدر جهد AC',
    labelEn: 'AC Voltage Source',
    defaultLabelAr: 'مصدر AC (12V)',
    defaultLabelEn: 'AC Source (12V)',
    btnId: 'btnAddAcSource',
    defaults: { voltageV: 12.0, frequencyHz: 50 },
    ports: [
      { suffix: 'pos', role: 'positive', label: '~+' },
      { suffix: 'neg', role: 'negative', label: '~-' },
    ],
  },
  {
    category: 'sources',
    kind: 'current_source',
    icon: '⚡',
    labelAr: 'مصدر تيار',
    labelEn: 'Current Source',
    defaultLabelAr: 'مصدر تيار (20mA)',
    defaultLabelEn: 'Current Src (20mA)',
    btnId: 'btnAddCurrentSource',
    defaults: { currentA: 0.02 },
    ports: [
      { suffix: 'pos', role: 'positive', label: 'I+' },
      { suffix: 'neg', role: 'negative', label: 'I-' },
    ],
  },
  // Basic
  {
    category: 'basic',
    kind: 'resistor',
    icon: '♒',
    labelAr: 'مقاومة ثابتة',
    labelEn: 'Fixed Resistor',
    defaultLabelAr: 'مقاومة (330Ω)',
    defaultLabelEn: 'Resistor (330Ω)',
    btnId: 'btnAddResistor',
    defaults: { resistanceOhms: 330.0 },
    ports: [
      { suffix: 'a', role: 'terminal_a', label: '1' },
      { suffix: 'b', role: 'terminal_b', label: '2' },
    ],
  },
  {
    category: 'basic',
    kind: 'potentiometer',
    icon: '🎛️',
    labelAr: 'مقاومة متغيرة',
    labelEn: 'Variable Resistor',
    defaultLabelAr: 'متغيرة (500Ω)',
    defaultLabelEn: 'Potentiometer (500Ω)',
    btnId: 'btnAddPotentiometer',
    defaults: { resistanceOhms: 500.0, maxResistanceOhms: 2000.0 },
    ports: [
      { suffix: 'a', role: 'terminal_a', label: '1' },
      { suffix: 'b', role: 'terminal_b', label: '2' },
    ],
  },
  {
    category: 'basic',
    kind: 'capacitor',
    icon: '🔋',
    labelAr: 'مكثف (Capacitor)',
    labelEn: 'Capacitor',
    defaultLabelAr: 'مكثف (100µF)',
    defaultLabelEn: 'Capacitor (100µF)',
    btnId: 'btnAddCapacitor',
    defaults: { capacitanceUf: 100.0 },
    ports: [
      { suffix: 'a', role: 'terminal_a', label: '+' },
      { suffix: 'b', role: 'terminal_b', label: '-' },
    ],
  },
  {
    category: 'basic',
    kind: 'inductor',
    icon: '🌀',
    labelAr: 'ملف / محث',
    labelEn: 'Inductor (Coil)',
    defaultLabelAr: 'ملف (10mH)',
    defaultLabelEn: 'Inductor (10mH)',
    btnId: 'btnAddInductor',
    defaults: { inductanceMh: 10.0 },
    ports: [
      { suffix: 'a', role: 'terminal_a', label: '1' },
      { suffix: 'b', role: 'terminal_b', label: '2' },
    ],
  },
  // Optics & Control
  {
    category: 'control',
    kind: 'led',
    icon: '💡',
    labelAr: 'صمام ضوئي LED',
    labelEn: 'LED Diode',
    defaultLabelAr: 'صمام LED',
    defaultLabelEn: 'Red LED',
    btnId: 'btnAddLed',
    defaults: { forwardVoltageV: 2.0, maxCurrentA: 0.02 },
    ports: [
      { suffix: 'anode', role: 'anode', label: 'A' },
      { suffix: 'cathode', role: 'cathode', label: 'K' },
    ],
  },
  {
    category: 'control',
    kind: 'switch',
    icon: '🔘',
    labelAr: 'مفتاح كهربائي',
    labelEn: 'SPST Switch',
    defaultLabelAr: 'مفتاح تشغيل',
    defaultLabelEn: 'Switch (SPST)',
    btnId: 'btnAddSwitch',
    defaults: { isOpen: false },
    ports: [
      { suffix: 'a', role: 'terminal_a', label: '1' },
      { suffix: 'b', role: 'terminal_b', label: '2' },
    ],
  },
  {
    category: 'control',
    kind: 'lamp',
    icon: '🔆',
    labelAr: 'مصباح حمل',
    labelEn: 'Incandescent Lamp',
    defaultLabelAr: 'مصباح (100Ω)',
    defaultLabelEn: 'Lamp (100Ω)',
    btnId: 'btnAddLamp',
    defaults: { resistanceOhms: 100.0 },
    ports: [
      { suffix: 'a', role: 'terminal_a', label: '1' },
      { suffix: 'b', role: 'terminal_b', label: '2' },
    ],
  },
  {
    category: 'control',
    kind: 'diode',
    icon: '▶️',
    labelAr: 'دايود (Diode)',
    labelEn: 'Rectifier Diode',
    defaultLabelAr: 'دايود 1N4007',
    defaultLabelEn: 'Diode 1N4007',
    btnId: 'btnAddDiode',
    defaults: { forwardVoltageV: 0.7 },
    ports: [
      { suffix: 'anode', role: 'anode', label: 'A' },
      { suffix: 'cathode', role: 'cathode', label: 'K' },
    ],
  },
];

export const EXPERIMENT_PRESETS = {
  'ohms-law-led': {
    id: 'ohms-law-led',
    category: 'electronics',
    titleAr: 'قانون أوم وحماية صمام LED',
    titleEn: "Ohm's Law & LED Protection",
    components: [
      {
        id: 'bat-1', kind: 'dc_source', name: 'بطارية (5V)', position: { x: 60, y: 200 }, rotation: 0, voltageV: 5.0,
        ports: [
          { id: 'p_bat_pos', componentId: 'bat-1', role: 'positive', label: '+' },
          { id: 'p_bat_neg', componentId: 'bat-1', role: 'negative', label: '-' },
        ],
      },
      {
        id: 'res-1', kind: 'resistor', name: 'مقاومة (330Ω)', position: { x: 260, y: 90 }, rotation: 0, resistanceOhms: 330.0,
        ports: [
          { id: 'p_res_a', componentId: 'res-1', role: 'terminal_a', label: '1' },
          { id: 'p_res_b', componentId: 'res-1', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'led-1', kind: 'led', name: 'صمام LED', position: { x: 520, y: 200 }, rotation: 0, forwardVoltageV: 2.0, maxCurrentA: 0.02,
        ports: [
          { id: 'p_led_anode', componentId: 'led-1', role: 'anode', label: 'A' },
          { id: 'p_led_cathode', componentId: 'led-1', role: 'cathode', label: 'K' },
        ],
      },
      {
        id: 'sw-1', kind: 'switch', name: 'مفتاح تشغيل', position: { x: 260, y: 340 }, rotation: 0, isOpen: false,
        ports: [
          { id: 'p_sw_a', componentId: 'sw-1', role: 'terminal_a', label: '1' },
          { id: 'p_sw_b', componentId: 'sw-1', role: 'terminal_b', label: '2' },
        ],
      },
    ],
    wires: [
      { id: 'w1', fromPortId: 'p_bat_pos', toPortId: 'p_res_a' },
      { id: 'w2', fromPortId: 'p_res_b', toPortId: 'p_led_anode' },
      { id: 'w3', fromPortId: 'p_led_cathode', toPortId: 'p_sw_b' },
      { id: 'w4', fromPortId: 'p_sw_a', toPortId: 'p_bat_neg' },
    ],
  },

  'series-resistors': {
    id: 'series-resistors',
    category: 'electricity',
    titleAr: 'توصيل المقاومات على التوالي (مجزئ الجهد)',
    titleEn: 'Series Resistors (Voltage Divider)',
    components: [
      {
        id: 'bat-s1', kind: 'dc_source', name: 'مصدر (12V)', position: { x: 60, y: 200 }, rotation: 0, voltageV: 12.0,
        ports: [
          { id: 'p_bs_pos', componentId: 'bat-s1', role: 'positive', label: '+' },
          { id: 'p_bs_neg', componentId: 'bat-s1', role: 'negative', label: '-' },
        ],
      },
      {
        id: 'res-s1', kind: 'resistor', name: 'R1 (200Ω)', position: { x: 260, y: 90 }, rotation: 0, resistanceOhms: 200.0,
        ports: [
          { id: 'p_rs1_a', componentId: 'res-s1', role: 'terminal_a', label: '1' },
          { id: 'p_rs1_b', componentId: 'res-s1', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'res-s2', kind: 'resistor', name: 'R2 (400Ω)', position: { x: 520, y: 200 }, rotation: 0, resistanceOhms: 400.0,
        ports: [
          { id: 'p_rs2_a', componentId: 'res-s2', role: 'terminal_a', label: '1' },
          { id: 'p_rs2_b', componentId: 'res-s2', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'sw-s1', kind: 'switch', name: 'مفتاح رئيسي', position: { x: 260, y: 340 }, rotation: 0, isOpen: false,
        ports: [
          { id: 'p_sws_a', componentId: 'sw-s1', role: 'terminal_a', label: '1' },
          { id: 'p_sws_b', componentId: 'sw-s1', role: 'terminal_b', label: '2' },
        ],
      },
    ],
    wires: [
      { id: 'ws1', fromPortId: 'p_bs_pos', toPortId: 'p_rs1_a' },
      { id: 'ws2', fromPortId: 'p_rs1_b', toPortId: 'p_rs2_a' },
      { id: 'ws3', fromPortId: 'p_rs2_b', toPortId: 'p_sws_b' },
      { id: 'ws4', fromPortId: 'p_sws_a', toPortId: 'p_bs_neg' },
    ],
  },

  'kirchhoff-kvl-kcl': {
    id: 'kirchhoff-kvl-kcl',
    category: 'electricity',
    titleAr: 'قوانين كيرشوف للجهد والتيار (KVL / KCL)',
    titleEn: "Kirchhoff's Laws (KVL / KCL)",
    components: [
      {
        id: 'bat-k1', kind: 'dc_source', name: 'مصدر (10V)', position: { x: 60, y: 200 }, rotation: 0, voltageV: 10.0,
        ports: [
          { id: 'p_bk_pos', componentId: 'bat-k1', role: 'positive', label: '+' },
          { id: 'p_bk_neg', componentId: 'bat-k1', role: 'negative', label: '-' },
        ],
      },
      {
        id: 'res-k1', kind: 'resistor', name: 'R1 (100Ω)', position: { x: 260, y: 80 }, rotation: 0, resistanceOhms: 100.0,
        ports: [
          { id: 'p_rk1_a', componentId: 'res-k1', role: 'terminal_a', label: '1' },
          { id: 'p_rk1_b', componentId: 'res-k1', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'res-k2', kind: 'resistor', name: 'R2 (200Ω)', position: { x: 520, y: 120 }, rotation: 0, resistanceOhms: 200.0,
        ports: [
          { id: 'p_rk2_a', componentId: 'res-k2', role: 'terminal_a', label: '1' },
          { id: 'p_rk2_b', componentId: 'res-k2', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'res-k3', kind: 'resistor', name: 'R3 (200Ω)', position: { x: 520, y: 310 }, rotation: 0, resistanceOhms: 200.0,
        ports: [
          { id: 'p_rk3_a', componentId: 'res-k3', role: 'terminal_a', label: '1' },
          { id: 'p_rk3_b', componentId: 'res-k3', role: 'terminal_b', label: '2' },
        ],
      },
    ],
    wires: [
      { id: 'wk1', fromPortId: 'p_bk_pos', toPortId: 'p_rk1_a' },
      { id: 'wk2', fromPortId: 'p_rk1_b', toPortId: 'p_rk2_a' },
      { id: 'wk3', fromPortId: 'p_rk1_b', toPortId: 'p_rk3_a' },
      { id: 'wk4', fromPortId: 'p_rk2_b', toPortId: 'p_bk_neg' },
      { id: 'wk5', fromPortId: 'p_rk3_b', toPortId: 'p_bk_neg' },
    ],
  },

  'ohms-basic': {
    id: 'ohms-basic',
    category: 'electricity',
    titleAr: 'دائرة قانون أوم الأساسية ومصباح الحمل',
    titleEn: "Basic Ohm's Law & Load Lamp",
    components: [
      {
        id: 'bat-b1', kind: 'dc_source', name: 'مصدر (9V)', position: { x: 70, y: 200 }, rotation: 0, voltageV: 9.0,
        ports: [
          { id: 'p_bb_pos', componentId: 'bat-b1', role: 'positive', label: '+' },
          { id: 'p_bb_neg', componentId: 'bat-b1', role: 'negative', label: '-' },
        ],
      },
      {
        id: 'lamp-b1', kind: 'lamp', name: 'مصباح (100Ω)', position: { x: 350, y: 110 }, rotation: 0, resistanceOhms: 100.0,
        ports: [
          { id: 'p_lb_a', componentId: 'lamp-b1', role: 'terminal_a', label: '1' },
          { id: 'p_lb_b', componentId: 'lamp-b1', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'sw-b1', kind: 'switch', name: 'مفتاح الدائرة', position: { x: 350, y: 310 }, rotation: 0, isOpen: false,
        ports: [
          { id: 'p_swb_a', componentId: 'sw-b1', role: 'terminal_a', label: '1' },
          { id: 'p_swb_b', componentId: 'sw-b1', role: 'terminal_b', label: '2' },
        ],
      },
    ],
    wires: [
      { id: 'wb1', fromPortId: 'p_bb_pos', toPortId: 'p_lb_a' },
      { id: 'wb2', fromPortId: 'p_lb_b', toPortId: 'p_swb_b' },
      { id: 'wb3', fromPortId: 'p_swb_a', toPortId: 'p_bb_neg' },
    ],
  },

  'potentiometer-led': {
    id: 'potentiometer-led',
    category: 'electronics',
    titleAr: 'التحكم بشدة التيار بمقاومة متغيرة',
    titleEn: 'Variable Resistor Current Control',
    components: [
      {
        id: 'bat-p1', kind: 'dc_source', name: 'مصدر (9V)', position: { x: 60, y: 200 }, rotation: 0, voltageV: 9.0,
        ports: [
          { id: 'p_bp_pos', componentId: 'bat-p1', role: 'positive', label: '+' },
          { id: 'p_bp_neg', componentId: 'bat-p1', role: 'negative', label: '-' },
        ],
      },
      {
        id: 'pot-p1', kind: 'potentiometer', name: 'متغيرة (500Ω)', position: { x: 270, y: 95 }, rotation: 0, resistanceOhms: 500.0, maxResistanceOhms: 2000.0,
        ports: [
          { id: 'p_pot_a', componentId: 'pot-p1', role: 'terminal_a', label: '1' },
          { id: 'p_pot_b', componentId: 'pot-p1', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'led-p1', kind: 'led', name: 'صمام LED', position: { x: 520, y: 200 }, rotation: 0, forwardVoltageV: 2.0, maxCurrentA: 0.02,
        ports: [
          { id: 'p_lp_a', componentId: 'led-p1', role: 'anode', label: 'A' },
          { id: 'p_lp_k', componentId: 'led-p1', role: 'cathode', label: 'K' },
        ],
      },
      {
        id: 'sw-p1', kind: 'switch', name: 'مفتاح تشغيل', position: { x: 270, y: 340 }, rotation: 0, isOpen: false,
        ports: [
          { id: 'p_swp_a', componentId: 'sw-p1', role: 'terminal_a', label: '1' },
          { id: 'p_swp_b', componentId: 'sw-p1', role: 'terminal_b', label: '2' },
        ],
      },
    ],
    wires: [
      { id: 'wp1', fromPortId: 'p_bp_pos', toPortId: 'p_pot_a' },
      { id: 'wp2', fromPortId: 'p_pot_b', toPortId: 'p_lp_a' },
      { id: 'wp3', fromPortId: 'p_lp_k', toPortId: 'p_swp_b' },
      { id: 'wp4', fromPortId: 'p_swp_a', toPortId: 'p_bp_neg' },
    ],
  },

  'rc-circuit': {
    id: 'rc-circuit',
    category: 'electronics',
    titleAr: 'دائرة المقاومة والمكثف (RC Circuit)',
    titleEn: 'Resistor-Capacitor (RC) Circuit',
    components: [
      {
        id: 'bat-rc', kind: 'dc_source', name: 'مصدر (5V)', position: { x: 60, y: 200 }, rotation: 0, voltageV: 5.0,
        ports: [
          { id: 'p_brc_pos', componentId: 'bat-rc', role: 'positive', label: '+' },
          { id: 'p_brc_neg', componentId: 'bat-rc', role: 'negative', label: '-' },
        ],
      },
      {
        id: 'res-rc', kind: 'resistor', name: 'مقاومة (1kΩ)', position: { x: 280, y: 100 }, rotation: 0, resistanceOhms: 1000.0,
        ports: [
          { id: 'p_rrc_a', componentId: 'res-rc', role: 'terminal_a', label: '1' },
          { id: 'p_rrc_b', componentId: 'res-rc', role: 'terminal_b', label: '2' },
        ],
      },
      {
        id: 'cap-rc', kind: 'capacitor', name: 'مكثف (100µF)', position: { x: 520, y: 200 }, rotation: 0, capacitanceUf: 100.0,
        ports: [
          { id: 'p_crc_a', componentId: 'cap-rc', role: 'terminal_a', label: '+' },
          { id: 'p_crc_b', componentId: 'cap-rc', role: 'terminal_b', label: '-' },
        ],
      },
    ],
    wires: [
      { id: 'wrc1', fromPortId: 'p_brc_pos', toPortId: 'p_rrc_a' },
      { id: 'wrc2', fromPortId: 'p_rrc_b', toPortId: 'p_crc_a' },
      { id: 'wrc3', fromPortId: 'p_crc_b', toPortId: 'p_brc_neg' },
    ],
  },
};
