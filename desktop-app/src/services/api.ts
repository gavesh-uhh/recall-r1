import {
  ErrorRecord,
  Solution,
  ErrorRelation,
  PatternCluster,
  HealthStatus,
  CreateErrorRequest,
  CreateSolutionRequest,
  SolutionFeedbackRequest,
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

  public async checkHealth(): Promise<HealthStatus> {
    const res = await this.executeRequest<{ status: string; indexStale: boolean }>('/health');
    if (res.ok && res.data) {
      this.isOnline = true;
      return { status: 'ok', indexStale: !!res.data.indexStale };
    }
    
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

  public async seedSampleData(): Promise<boolean> {
    const res = await this.executeRequest<string>('/errors/seed', {
      method: 'POST',
    });
    return res.ok;
  }

  public async clearDatabase(): Promise<boolean> {
    const res = await this.executeRequest<string>('/errors/clear', {
      method: 'POST',
    });
    return res.ok;
  }

  public async createError(req: CreateErrorRequest): Promise<ErrorRecord> {
    const res = await this.executeRequest<ErrorRecord>('/errors', {
      method: 'POST',
      body: req,
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || `Failed to create error: status ${res.status}`);
    }

    const created = res.data;
    return this.attachDecayScores(created);
  }

  public async getErrorById(id: number): Promise<ErrorRecord | null> {
    const res = await this.executeRequest<ErrorRecord>(`/errors/${id}`);
    if (res.ok && res.data) {
      return this.attachDecayScores(res.data);
    }
    return null;
  }

  public async searchBySignature(signature: string): Promise<ErrorRecord | null> {
    const res = await this.executeRequest<ErrorRecord>(
      `/errors/search?signature=${encodeURIComponent(signature)}`
    );
    if (res.ok && res.data) {
      return this.attachDecayScores(res.data);
    }
    return null;
  }

  public async getErrors(query = '', project = '', language = ''): Promise<ErrorRecord[]> {
    let endpoint = '/errors';
    const params = new URLSearchParams();
    if (project) params.append('project', project);
    if (language) params.append('language', language);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const res = await this.executeRequest<ErrorRecord[]>(endpoint);
    let list: ErrorRecord[] = [];

    if (res.ok && res.data) {
      this.isOnline = true;
      list = res.data.map((err) => this.attachDecayScores(err));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (err) =>
          err.signature?.toLowerCase().includes(q) ||
          err.message?.toLowerCase().includes(q) ||
          err.project?.toLowerCase().includes(q) ||
          err.language?.toLowerCase().includes(q) ||
          err.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public async getProjects(): Promise<string[]> {
    const res = await this.executeRequest<string[]>('/projects');
    if (res.ok && res.data) {
      return res.data;
    }
    return [];
  }

  public async createProject(name: string): Promise<boolean> {
    const res = await this.executeRequest('/projects', {
      method: 'POST',
      body: { name },
    });
    return res.ok;
  }

  public async getLanguages(): Promise<string[]> {
    const res = await this.executeRequest<string[]>('/languages');
    if (res.ok && res.data) {
      return res.data;
    }
    return [];
  }

  public async createLanguage(name: string): Promise<boolean> {
    const res = await this.executeRequest('/languages', {
      method: 'POST',
      body: { name },
    });
    return res.ok;
  }

  public async deleteError(id: number): Promise<boolean> {
    const res = await this.executeRequest(`/errors/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete error #${id}`);
    }
    return true;
  }

  public async addSolution(errorId: number, req: CreateSolutionRequest): Promise<Solution> {
    // New solutions start with zero history — only the description is sent.
    const res = await this.executeRequest<Solution>(`/errors/${errorId}/solutions`, {
      method: 'POST',
      body: {
        description: req.description,
      },
    });
    if (!res.ok || !res.data) {
      throw new Error(`Failed to add solution to error #${errorId}`);
    }
    return res.data;
  }

  public async getRankedSolutions(errorId: number): Promise<Solution[]> {
    const res = await this.executeRequest<Solution[]>(`/errors/${errorId}/solutions`);
    if (res.ok && res.data) {
      return res.data;
    }
    return [];
  }

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

  public async getRelatedErrors(errorId: number, depth = 2): Promise<ErrorRecord[]> {
    const res = await this.executeRequest<ErrorRecord[]>(
      `/errors/${errorId}/related?depth=${depth}`
    );
    if (res.ok && res.data) return res.data;
    return [];
  }

  public async getPatterns(): Promise<PatternCluster[]> {
    const res = await this.executeRequest<PatternCluster[]>('/patterns');
    if (res.ok && res.data) return res.data;
    return [];
  }

  public async getRelations(): Promise<ErrorRelation[]> {
    const res = await this.executeRequest<ErrorRelation[]>('/relations');
    if (res.ok && res.data) return res.data;
    return [];
  }

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
