/**
 * Electrical Circuit Domain Types - Rowad Al-Mamal
 * Pure, deterministic, strict typing without React or DOM dependencies.
 */

export type ComponentKind = 'dc_source' | 'resistor' | 'led' | 'switch' | 'meter';

export type PortRole = 'positive' | 'negative' | 'anode' | 'cathode' | 'terminal_a' | 'terminal_b';

export interface Port {
  id: string;
  componentId: string;
  role: PortRole;
  label: string;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface BaseComponent {
  id: string;
  kind: ComponentKind;
  name: string;
  position: Position2D;
  rotation: 0 | 90 | 180 | 270;
  ports: Port[];
}

export interface DcSourceComponent extends BaseComponent {
  kind: 'dc_source';
  voltageV: number; // typically 5.0
}

export interface ResistorComponent extends BaseComponent {
  kind: 'resistor';
  resistanceOhms: number; // typically 330.0
}

export interface LedComponent extends BaseComponent {
  kind: 'led';
  forwardVoltageV: number; // typically 2.0
  maxCurrentA: number; // typically 0.020 (20mA)
}

export interface SwitchComponent extends BaseComponent {
  kind: 'switch';
  isOpen: boolean;
}

export interface MeterComponent extends BaseComponent {
  kind: 'meter';
  mode: 'voltage' | 'current';
}

export type CircuitComponent =
  | DcSourceComponent
  | ResistorComponent
  | LedComponent
  | SwitchComponent
  | MeterComponent;

export interface Wire {
  id: string;
  fromPortId: string;
  toPortId: string;
}

export interface LabSnapshot {
  schemaVersion: 1;
  experimentId: 'ohms-law-led';
  revision: number;
  components: CircuitComponent[];
  wires: Wire[];
}

export type DiagnosticCode =
  | 'OK'
  | 'SWITCH_OPEN'
  | 'OPEN_CIRCUIT'
  | 'REVERSED_LED'
  | 'MISSING_RESISTOR'
  | 'BYPASSED_RESISTOR'
  | 'SOURCE_SHORT'
  | 'OVERCURRENT'
  | 'UNCONNECTED_PORT'
  | 'UNSUPPORTED_TOPOLOGY'
  | 'INVALID_DATA';

export interface Diagnostic {
  code: DiagnosticCode;
  severity: 'info' | 'warning' | 'error';
  affectedIds: string[];
  messageAr: string;
}

export type SimulationStatus = 'valid' | 'open' | 'unsafe' | 'unsupported';

export interface SimulationResult {
  modelVersion: '1.0.0';
  status: SimulationStatus;
  values: {
    sourceVoltageV: number | null;
    circuitCurrentA: number | null;
    resistorVoltageV: number | null;
    ledForwardVoltageV: number | null;
  };
  ledOn: boolean;
  diagnostics: Diagnostic[];
}
