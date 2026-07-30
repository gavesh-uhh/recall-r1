import React, { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { Header, Sidebar } from './components/Header';
import { ErrorExplorer } from './components/ErrorExplorer';
import { SolutionRanker } from './components/SolutionRanker';
import { GraphVisualizer } from './components/GraphVisualizer';
import { SessionLogger } from './components/SessionLogger';
import { ProjectLanguageManager } from './components/ProjectLanguageManager';
import { LogErrorModal } from './components/LogErrorModal';
import { AddSolutionModal } from './components/AddSolutionModal';
import { LinkErrorModal } from './components/LinkErrorModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SplashScreen } from './components/SplashScreen';
import {
  ErrorRecord,
  DebugSession,
  HealthStatus,
  CreateErrorRequest,
  CreateSolutionRequest,
  SolutionFeedbackRequest,
  CreateSessionRequest,
} from './types/api';
import { recallApi } from './services/api';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class TabErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TabErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-4">
          <div className="text-rose-400 font-mono font-bold text-xs bg-rose-950/60 p-4 rounded-xl border border-rose-900 max-w-lg mx-auto">
            Render Exception: {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="pro-button-primary px-4 py-2 text-xs rounded-lg font-semibold"
          >
            Reset View State
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('explorer');
  const [health, setHealth] = useState<HealthStatus>({ status: 'offline', indexStale: false });
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorRecord | null>(null);

  // Filters & Searches
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  // Custom added projects & languages (synced with backend DB & localStorage fallback)
  const [customProjects, setCustomProjects] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recall_custom_projects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customLanguages, setCustomLanguages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recall_custom_languages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadBackendMetadata = useCallback(async () => {
    try {
      const [backendProjects, backendLanguages] = await Promise.all([
        recallApi.getProjects(),
        recallApi.getLanguages(),
      ]);
      if (backendProjects.length > 0) {
        setCustomProjects((prev) => Array.from(new Set([...prev, ...backendProjects])));
      }
      if (backendLanguages.length > 0) {
        setCustomLanguages((prev) => Array.from(new Set([...prev, ...backendLanguages])));
      }
    } catch (err) {
      console.warn('Backend metadata load offline, using local cache:', err);
    }
  }, []);

  useEffect(() => {
    loadBackendMetadata();
  }, [loadBackendMetadata]);

  const handleAddProject = async (name: string) => {
    if (!customProjects.includes(name)) {
      setCustomProjects((prev) => {
        const next = Array.from(new Set([...prev, name]));
        try { localStorage.setItem('recall_custom_projects', JSON.stringify(next)); } catch {}
        return next;
      });
      try {
        await recallApi.createProject(name);
        showToast(`Persisted project "${name}" to backend database!`);
      } catch (err) {
        showToast(`Saved project "${name}" locally`);
      }
    }
  };

  const handleAddLanguage = async (name: string) => {
    if (!customLanguages.includes(name)) {
      setCustomLanguages((prev) => {
        const next = Array.from(new Set([...prev, name]));
        try { localStorage.setItem('recall_custom_languages', JSON.stringify(next)); } catch {}
        return next;
      });
      try {
        await recallApi.createLanguage(name);
        showToast(`Persisted language "${name}" to backend database!`);
      } catch (err) {
        showToast(`Registered language "${name}" locally`);
      }
    }
  };

  const availableProjects = Array.from(
    new Set([...errors.map((e) => e.project).filter(Boolean), ...customProjects])
  );

  const availableLanguages = Array.from(
    new Set([...errors.map((e) => e.language).filter(Boolean), ...customLanguages])
  );

  // Modals
  const [isLogErrorOpen, setIsLogErrorOpen] = useState(false);
  const [logErrorPreset, setLogErrorPreset] = useState<{ project?: string; language?: string }>({});
  const [addSolutionErrorId, setAddSolutionErrorId] = useState<number | null>(null);
  const [linkErrorSourceId, setLinkErrorSourceId] = useState<number | null>(null);

  const handleOpenLogErrorWithPreset = (project?: string, language?: string) => {
    setLogErrorPreset({ project, language });
    setIsLogErrorOpen(true);
  };
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadErrors = useCallback(async () => {
    try {
      const data = await recallApi.getErrors(searchQuery, selectedProject, selectedLanguage);
      setErrors(data);
      setSelectedError((prev) => {
        if (prev) {
          const updated = data.find((e) => e.id === prev.id);
          return updated || (data.length > 0 ? data[0] : null);
        }
        return data.length > 0 ? data[0] : null;
      });
    } catch (err) {
      console.error('Failed to load errors:', err);
    }
  }, [searchQuery, selectedProject, selectedLanguage]);

  const loadSessions = useCallback(async () => {
    try {
      const data = await recallApi.getSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const checkHealthStatus = useCallback(async () => {
    const status = await recallApi.checkHealth();
    setHealth(status);
  }, []);

  useEffect(() => {
    checkHealthStatus();
    const interval = setInterval(checkHealthStatus, 4000);
    return () => clearInterval(interval);
  }, [checkHealthStatus]);

  useEffect(() => {
    loadErrors();
  }, [loadErrors]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleCreateError = async (req: CreateErrorRequest) => {
    try {
      const created = await recallApi.createError(req);
      showToast(`Logged error "${created.signature}" successfully!`);
      await loadErrors();
      setSelectedError(created);
    } catch (err) {
      showToast('Error: Failed to connect to backend');
      console.error(err);
    }
  };

  const handleDeleteError = async (id: number) => {
    try {
      await recallApi.deleteError(id);
      showToast(`Removed error record #${id} from backend`);
      if (selectedError?.id === id) setSelectedError(null);
      await loadErrors();
    } catch (err) {
      showToast('Error: Delete failed');
    }
  };

  const handleAddSolution = async (errorId: number, req: CreateSolutionRequest) => {
    try {
      await recallApi.addSolution(errorId, req);
      showToast('Solution attached to error record');
      await loadErrors();
    } catch (err) {
      showToast('Error: Could not attach solution');
    }
  };

  const handleSolutionFeedback = async (
    solutionId: number,
    feedback: SolutionFeedbackRequest
  ) => {
    try {
      await recallApi.submitSolutionFeedback(solutionId, feedback);
      showToast(feedback.success ? 'Recorded fix success! (+1 Score)' : 'Recorded fix failure');
      await loadErrors();
    } catch (err) {
      showToast('Error: Feedback failed');
    }
  };

  const handleCreateSession = async (req: CreateSessionRequest) => {
    try {
      await recallApi.createSession(req);
      showToast('Logged debug investigation session!');
      await loadSessions();
    } catch (err) {
      showToast('Error: Failed to log session');
    }
  };

  const handleLinkErrors = async (sourceId: number, targetId: number) => {
    try {
      await recallApi.linkErrors(sourceId, targetId);
      showToast(`Linked Error #${sourceId} ↔ Error #${targetId}`);
      await loadErrors();
    } catch (err) {
      showToast('Error: Link failed');
    }
  };

  const handleRebuildIndex = async () => {
    setIsRebuilding(true);
    try {
      await recallApi.rebuildIndex();
      showToast('Rebuilt in-memory search index from storage!');
      await checkHealthStatus();
      await loadErrors();
    } catch (err) {
      showToast('Error: Could not rebuild index');
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleSeedData = async () => {
    try {
      showToast('Populating sample errors, fix strategies & sessions...');
      await recallApi.seedSampleData();
      showToast('Sample data seeded successfully into backend DB!');
      setSelectedError(null);
      await loadErrors();
      await loadSessions();
    } catch (err) {
      showToast('Error: Failed to seed sample data');
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      showToast('Clearing all database records...');
      await recallApi.clearDatabase();
      showToast('Cleared all errors, solutions, and debug sessions!');
      setSelectedError(null);
      setIsClearConfirmOpen(false);
      await loadErrors();
      await loadSessions();
    } catch (err) {
      showToast('Error: Failed to clear database');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="tool-root select-none">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}

      {/* Body: Sidebar + Content */}
      <div className="tool-body">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          errorCount={errors.length}
          health={health}
          onOpenLogError={() => setIsLogErrorOpen(true)}
          onRebuildIndex={handleRebuildIndex}
          onSeedData={handleSeedData}
          onClearData={() => setIsClearConfirmOpen(true)}
          isRebuilding={isRebuilding}
        />

        <div className="tool-content">
          <TabErrorBoundary key={activeTab}>
            {activeTab === 'explorer' && (
              <ErrorExplorer
                errors={errors}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                onSelectError={setSelectedError}
                selectedError={selectedError}
                onDeleteError={handleDeleteError}
                onAddSolution={(id) => setAddSolutionErrorId(id)}
                onLinkError={(id) => setLinkErrorSourceId(id)}
                onOpenLogError={() => setIsLogErrorOpen(true)}
                isOnline={health.status === 'ok'}
                availableProjects={availableProjects}
                availableLanguages={availableLanguages}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectLanguageManager
                errors={errors}
                setActiveTab={setActiveTab}
                setSelectedProject={setSelectedProject}
                setSelectedLanguage={setSelectedLanguage}
                onOpenLogError={handleOpenLogErrorWithPreset}
                customProjects={customProjects}
                customLanguages={customLanguages}
                onAddProject={handleAddProject}
                onAddLanguage={handleAddLanguage}
              />
            )}

            {activeTab === 'solutions' && (
              <SolutionRanker errors={errors} onFeedback={handleSolutionFeedback} />
            )}

            {activeTab === 'patterns' && (
              <GraphVisualizer
                errors={errors}
                onOpenLinkModal={() => setLinkErrorSourceId(errors[0]?.id || 1)}
              />
            )}

            {activeTab === 'sessions' && (
              <SessionLogger
                sessions={sessions}
                errors={errors}
                onCreateSession={handleCreateSession}
              />
            )}
          </TabErrorBoundary>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="toast fade-in">{toastMessage}</div>
      )}

      {/* Modals */}
      <LogErrorModal
        isOpen={isLogErrorOpen}
        onClose={() => {
          setIsLogErrorOpen(false);
          setLogErrorPreset({});
        }}
        onSubmit={handleCreateError}
        initialProject={logErrorPreset.project}
        initialLanguage={logErrorPreset.language}
        availableProjects={availableProjects}
        availableLanguages={availableLanguages}
      />
      <AddSolutionModal
        isOpen={addSolutionErrorId !== null}
        errorId={addSolutionErrorId}
        onClose={() => setAddSolutionErrorId(null)}
        onSubmit={handleAddSolution}
      />
      <LinkErrorModal
        isOpen={linkErrorSourceId !== null}
        sourceErrorId={linkErrorSourceId}
        errors={errors}
        onClose={() => setLinkErrorSourceId(null)}
        onSubmit={handleLinkErrors}
      />
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="Clear Database"
        message="Are you sure you want to delete all indexed error records, solution strategies, and debug sessions? This action cannot be undone."
        confirmText="Clear All Data"
        cancelText="Cancel"
        variant="danger"
        isSubmitting={isClearing}
        onConfirm={handleClearData}
        onClose={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
};
