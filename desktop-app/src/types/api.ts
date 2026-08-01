export interface Solution {
  id: number;
  errorRecordId?: number;
  description: string;
  successCount: number;
  failureCount: number;
  totalAttempts?: number;
  lastSuccessDate: string | null;
  feedbackScore: number; // 0-5
  decayScore?: number;   // Calculated score returned from server or calculated locally
  successRate?: number;  // Normalised rate 0-1
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
  initialSolution?: string;
}

export interface CreateSolutionRequest {
  description: string;
  successCount?: number;
  lastSuccessDate?: string;
  feedbackScore?: number;
}

export interface SolutionFeedbackRequest {
  success: boolean;
  rating?: number; // 1-5
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
  sourceErrorId: number;
  targetErrorId: number;
  relationType: 'MANUAL' | 'FUZZY_MATCH' | 'SHARED_TAG';
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
