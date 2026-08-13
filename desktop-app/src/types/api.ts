export interface Solution {
  id: number;
  errorRecordId?: number;
  description: string;
  successCount: number;
  failureCount: number;
  totalAttempts?: number;
  lastSuccessDate: string | null;
  feedbackScore: number;
  decayScore?: number;
  successRate?: number;
  usageFrequency?: number;
}

export interface ErrorRecord {
  id: number;
  signature: string;
  message: string;
  language: string;
  project: string;
  tags: string[];
  timestamp?: string;
  solutions?: Solution[];
}

export interface CreateErrorRequest {
  signature: string;
  message: string;
  language: string;
  project: string;
  tags: string[];
}

/** A new solution carries no history: counters/rating are earned only via feedback. */
export interface CreateSolutionRequest {
  description: string;
}

/** success may be omitted for rating-only feedback; rating (0..5) is always optional. */
export interface SolutionFeedbackRequest {
  success?: boolean;
  rating?: number;
}

export interface DebugSession {
  id: number;
  title: string;
  durationMinutes: number;
  notes: string;
  project: string;
  timestamp: string;
  errorRecordIds: number[];
  errorRecordId?: number;
  actionsPerformed?: string;
  sessionDate?: string;
  feedback?: string;
}

export interface CreateSessionRequest {
  title: string;
  durationMinutes: number;
  notes: string;
  project: string;
  errorRecordIds: number[];
}

export interface ErrorRelation {
  id?: number;
  errorAId: number;
  errorBId: number;
  relationType: 'MANUAL' | 'SIGNATURE_MATCH' | 'TAG_MATCH';
  weight?: number;
}

export interface PatternCluster {
  id: string;
  name: string;
  projectCount: number;
  projects: string[];
  errorIds: number[];
  errors: ErrorRecord[];
  description: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'offline';
  indexStale: boolean;
}

export interface SystemConfig {
  decayLambda: number;
  w1SuccessRate: number;
  w2Frequency: number;
  w3Feedback: number;
  frequencySaturation: number;
  fuzzyThreshold: number;
  backendUrl: string;
}
