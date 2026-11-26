/**
 * Candidate Tutor Contract v1.0.0 (DRAFT)
 * Agreement between Simulation Lab UI (Saqr) and AI Assistant (Team Leader)
 */

import type { DiagnosticCode, SimulationStatus } from '../../../src/domain/circuit/types.ts';

export interface TutorEvidenceV1 {
  modelVersion: '1.0.0';
  status: SimulationStatus;
  diagnostics: Array<{
    code: DiagnosticCode;
    affectedIds: string[];
  }>;
  measurements: {
    sourceVoltageV: number | null;
    circuitCurrentA: number | null;
    resistorVoltageV: number | null;
    ledForwardVoltageV: number | null;
  };
  knownComponentIds: string[];
}

export interface TutorRequestV1 {
  contractVersion: '1.0.0';
  requestId: string;
  snapshotRevision: number;
  experimentId: 'ohms-law-led';
  stepId: string;
  locale: 'ar';
  question?: string;
  evidence: TutorEvidenceV1;
}

export type TutorActionKind = 'highlight' | 'show_step' | 'select_part';

export interface TutorSuggestedActionV1 {
  kind: TutorActionKind;
  targetId: string;
}

export interface TutorResponseV1 {
  contractVersion: '1.0.0';
  requestId: string;
  snapshotRevision: number;
  message: string;
  suggestedAction?: TutorSuggestedActionV1;
  stepId?: string;
}

export interface TutorAdapter {
  getHint(request: TutorRequestV1, signal?: AbortSignal): Promise<TutorResponseV1>;
}
