import {
  ErrorRecord,
  Solution,
  DebugSession,
  ErrorRelation,
  PatternCluster,
  HealthStatus,
  CreateErrorRequest,
  CreateSolutionRequest,
  SolutionFeedbackRequest,
  CreateSessionRequest,
  SystemConfig,
} from '../types/api';

const DEFAULT_CONFIG: SystemConfig = {
  decayLambda: 0.05,
  w1SuccessRate: 0.5,
  w2Frequency: 0.3,
  w3Feedback: 0.2,
  frequencySaturation: 10.0,
  fuzzyThreshold: 0.6,
  backendUrl: 'http://127.0.0.1:8080/api',
};

export class RecallApiService {
  private config: SystemConfig = { ...DEFAULT_CONFIG };
  private isOnline = false;

  public getConfig(): SystemConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<SystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Universal HTTP Request Executor using IPC bridge (or standard fetch fallback)
   */
  private async executeRequest<T>(
    url: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const fullUrl = url.startsWith('http') ? url : `${this.config.backendUrl}${url}`;
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;
    const headers = options.headers || { 'Content-Type': 'application/json' };

    // Method 1: Electron Native IPC Request (Bypasses browser CORS & IPv6 resolution)
    if (window.electronAPI?.apiRequest) {
      try {
        const res = await window.electronAPI.apiRequest({
          url: fullUrl,
          method: options.method || 'GET',
          body: bodyStr,
          headers,
        });
        return res;
      } catch (err: any) {
        console.warn('IPC request failed, falling back to fetch:', err);
      }
    }

    // Method 2: Standard Fetch Fallback
    try {
      const res = await fetch(fullUrl, {
        method: options.method || 'GET',
        headers,
        body: bodyStr,
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err: any) {
      return { ok: false, status: 500, error: err?.message || 'Network error' };
    }
  }

  /**
   * Calculates solution decay score based on Recall formula:
   * score = (successRate*w1 + usageFreq*w2 + feedbackNorm*w3) * exp(-lambda * days)
   */
  public calculateDecayScore(solution: Solution, config = this.config): {
    totalScore: number;
    successRate: number;
    usageFreq: number;
    feedbackNorm: number;
    daysSinceSuccess: number;
    decayFactor: number;
  } {
    const totalAttempts = (solution.successCount || 0) + (solution.failureCount || 0);
    const successRate = totalAttempts > 0 ? solution.successCount / totalAttempts : 0;
    const usageFreq = Math.min(totalAttempts / config.frequencySaturation, 1.0);
    const feedbackNorm = Math.min(Math.max((solution.feedbackScore || 0) / 5.0, 0), 1.0);

    let daysSinceSuccess = 365;
    if (solution.lastSuccessDate) {
      const msDiff = Date.now() - new Date(solution.lastSuccessDate).getTime();
      daysSinceSuccess = Math.max(0, msDiff / (1000 * 60 * 60 * 24));
    }

    const decayFactor = Math.exp(-config.decayLambda * daysSinceSuccess);
    const baseScore =
      successRate * config.w1SuccessRate +
      usageFreq * config.w2Frequency +
      feedbackNorm * config.w3Feedback;

    const totalScore = solution.successCount > 0 ? baseScore * decayFactor : 0;

    return {
      totalScore,
      successRate,
      usageFreq,
      feedbackNorm,
      daysSinceSuccess,
      decayFactor,
    };
  }

  // =========================================================================
  // BACKEND REST API ENDPOINTS
  // =========================================================================

  /**
   * 1. GET /api/health
   */
  public async checkHealth(): Promise<HealthStatus> {
    const res = await this.executeRequest<{ status: string; indexStale: boolean }>('/health');
    if (res.ok && res.data) {
      this.isOnline = true;
      return { status: 'ok', indexStale: !!res.data.indexStale };
    }
    
    // Also try direct localhost fallback
    const res2 = await this.executeRequest<{ status: string; indexStale: boolean }>(
      'http://localhost:8080/api/health'
    );
    if (res2.ok && res2.data) {
      this.isOnline = true;
      return { status: 'ok', indexStale: !!res2.data.indexStale };
    }

    this.isOnline = false;
    return { status: 'offline', indexStale: false };
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Seed rich sample data into the database
   */
  public async seedSampleData(): Promise<boolean> {
    const res = await this.executeRequest<string>('/errors/seed', {
      method: 'POST',
    });
    return res.ok;
  }

  /**
   * Clear all errors, solutions, relations, and debug sessions from the database
   */
  public async clearDatabase(): Promise<boolean> {
    const res = await this.executeRequest<string>('/errors/clear', {
      method: 'POST',
    });
    return res.ok;
  }

  /**
   * 2. POST /api/errors
   */
  public async createError(req: CreateErrorRequest): Promise<ErrorRecord> {
    const res = await this.executeRequest<ErrorRecord>('/errors', {
      method: 'POST',
      body: req,
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || `Failed to create error: status ${res.status}`);
    }

    const created = res.data;
    if (req.initialSolution) {
      await this.addSolution(created.id, {
        description: req.initialSolution,
        successCount: 1,
        feedbackScore: 5.0,
      });
    }
    return this.attachDecayScores(created);
  }

  /**
   * 3. GET /api/errors/{id}
   */
  public async getErrorById(id: number): Promise<ErrorRecord | null> {
    const res = await this.executeRequest<ErrorRecord>(`/errors/${id}`);
    if (res.ok && res.data) {
      return this.attachDecayScores(res.data);
    }
    return null;
  }

  /**
   * 4. GET /api/errors/search?signature=
   */
  public async searchBySignature(signature: string): Promise<ErrorRecord | null> {
    const res = await this.executeRequest<ErrorRecord>(
      `/errors/search?signature=${encodeURIComponent(signature)}`
    );
    if (res.ok && res.data) {
      return this.attachDecayScores(res.data);
    }
    return null;
  }

  /**
   * 5. GET /api/errors?project=&language=
   */
  public async getErrors(query = '', project = '', language = ''): Promise<ErrorRecord[]> {
    if (query.trim()) {
      const single = await this.searchBySignature(query.trim());
      if (single) return [single];
    }

    let endpoint = '/errors';
    const params = new URLSearchParams();
    if (project) params.append('project', project);
    if (language) params.append('language', language);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const res = await this.executeRequest<ErrorRecord[]>(endpoint);
    if (res.ok && res.data) {
      this.isOnline = true;
      return res.data.map((err) => this.attachDecayScores(err));
    }

    return [];
  }

  /**
   * 6. DELETE /api/errors/{id}
   */
  public async deleteError(id: number): Promise<boolean> {
    const res = await this.executeRequest(`/errors/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete error #${id}`);
    }
    return true;
  }

  /**
   * 7. POST /api/errors/{id}/solutions
   */
  public async addSolution(errorId: number, req: CreateSolutionRequest): Promise<Solution> {
    const res = await this.executeRequest<Solution>(`/errors/${errorId}/solutions`, {
      method: 'POST',
      body: {
        description: req.description,
        successCount: req.successCount ?? 1,
        lastSuccessDate: req.lastSuccessDate || new Date().toISOString(),
        feedbackScore: req.feedbackScore ?? 5.0,
      },
    });
    if (!res.ok || !res.data) {
      throw new Error(`Failed to add solution to error #${errorId}`);
    }
    return res.data;
  }

  /**
   * 8. GET /api/errors/{id}/solutions
   */
  public async getRankedSolutions(errorId: number): Promise<Solution[]> {
    const res = await this.executeRequest<Solution[]>(`/errors/${errorId}/solutions`);
    if (res.ok && res.data) {
      return res.data;
    }
    return [];
  }

  /**
   * 9. PATCH /api/solutions/{id}/feedback
   */
  public async submitSolutionFeedback(
    solutionId: number,
    feedback: SolutionFeedbackRequest
  ): Promise<Solution> {
    const res = await this.executeRequest<Solution>(`/solutions/${solutionId}/feedback`, {
      method: 'PATCH',
      body: feedback,
    });
    if (!res.ok || !res.data) {
      throw new Error(`Failed to submit solution feedback: ${res.error}`);
    }
    return res.data;
  }

  /**
   * 10. POST /api/sessions
   */
  public async createSession(req: CreateSessionRequest): Promise<DebugSession> {
    const payload = {
      errorId: req.errorRecordIds?.[0] || null,
      project: req.project,
      actionsPerformed: `${req.title}: ${req.notes}`,
      sessionDate: new Date().toISOString(),
      feedback: req.notes,
    };
    const res = await this.executeRequest<any>('/sessions', {
      method: 'POST',
      body: payload,
    });
    if (!res.ok || !res.data) {
      throw new Error(`Failed to log debug session: ${res.error}`);
    }
    const d = res.data;
    return {
      id: d.id,
      title: req.title,
      durationMinutes: req.durationMinutes,
      notes: req.notes,
      project: d.project || req.project,
      timestamp: d.sessionDate || new Date().toISOString(),
      errorRecordIds: req.errorRecordIds,
      errorRecordId: d.errorRecordId,
      actionsPerformed: d.actionsPerformed,
      sessionDate: d.sessionDate,
      feedback: d.feedback,
    };
  }

  /**
   * 11. GET /api/sessions?project=&errorId=
   */
  public async getSessions(project = '', errorId?: number): Promise<DebugSession[]> {
    let endpoint = '/sessions';
    const params = new URLSearchParams();
    if (project) params.append('project', project);
    if (errorId) params.append('errorId', errorId.toString());
    if (params.toString()) endpoint += `?${params.toString()}`;

    const res = await this.executeRequest<any[]>(endpoint);
    if (res.ok && Array.isArray(res.data)) {
      return res.data.map((s) => ({
        id: s.id,
        title: s.title || s.actionsPerformed || `Debug Session #${s.id}`,
        durationMinutes: s.durationMinutes || 30,
        notes: s.notes || s.feedback || s.actionsPerformed || 'No notes',
        project: s.project || 'General',
        timestamp: s.timestamp || s.sessionDate || new Date().toISOString(),
        errorRecordIds: s.errorRecordIds || (s.errorRecordId ? [s.errorRecordId] : []),
        errorRecordId: s.errorRecordId,
        actionsPerformed: s.actionsPerformed,
        sessionDate: s.sessionDate,
        feedback: s.feedback,
      }));
    }
    return [];
  }

  /**
   * 12. POST /api/errors/{id}/relations
   */
  public async linkErrors(sourceId: number, targetId: number): Promise<ErrorRelation> {
    const res = await this.executeRequest<ErrorRelation>(`/errors/${sourceId}/relations`, {
      method: 'POST',
      body: { targetErrorId: targetId },
    });
    if (!res.ok || !res.data) {
      throw new Error(`Failed to link errors: ${res.error}`);
    }
    return res.data;
  }

  /**
   * 13. GET /api/errors/{id}/related?depth=
   */
  public async getRelatedErrors(errorId: number, depth = 2): Promise<ErrorRecord[]> {
    const res = await this.executeRequest<ErrorRecord[]>(
      `/errors/${errorId}/related?depth=${depth}`
    );
    if (res.ok && res.data) return res.data;
    return [];
  }

  /**
   * 14. GET /api/patterns
   */
  public async getPatterns(): Promise<PatternCluster[]> {
    const res = await this.executeRequest<PatternCluster[]>('/patterns');
    if (res.ok && res.data) return res.data;
    return [];
  }

  /**
   * 15. POST /api/admin/rebuild-index
   */
  public async rebuildIndex(): Promise<boolean> {
    const res = await this.executeRequest('/admin/rebuild-index', {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to rebuild index`);
    }
    return true;
  }

  private attachDecayScores(err: ErrorRecord): ErrorRecord {
    if (!err.solutions) return err;

    const rankedSolutions = err.solutions
      .map((sol) => {
        const math = this.calculateDecayScore(sol);
        return {
          ...sol,
          decayScore: Number(math.totalScore.toFixed(4)),
          successRate: Number(math.successRate.toFixed(2)),
          usageFrequency: Number(math.usageFreq.toFixed(2)),
        };
      })
      .sort((a, b) => (b.decayScore || 0) - (a.decayScore || 0));

    return {
      ...err,
      solutions: rankedSolutions,
    };
  }
}

export const recallApi = new RecallApiService();
