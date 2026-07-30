import React, { useState, useMemo } from 'react';
import {
  Folder,
  Code2,
  Plus,
  Search,
  AlertCircle,
  Award,
  Filter,
  X,
} from 'lucide-react';
import { ErrorRecord } from '../types/api';

interface ProjectLanguageManagerProps {
  errors: ErrorRecord[];
  setActiveTab: (tab: string) => void;
  setSelectedProject: (project: string) => void;
  setSelectedLanguage: (language: string) => void;
  onOpenLogError: (initialProject?: string, initialLanguage?: string) => void;
  customProjects: string[];
  customLanguages: string[];
  onAddProject: (projectName: string) => void;
  onAddLanguage: (languageName: string) => void;
}

interface ProjectStat {
  name: string;
  errorCount: number;
  solutionCount: number;
  languages: string[];
  tags: string[];
  lastTimestamp?: string;
}

interface LanguageStat {
  name: string;
  errorCount: number;
  solutionCount: number;
  projects: string[];
  tags: string[];
}

export const ProjectLanguageManager: React.FC<ProjectLanguageManagerProps> = ({
  errors,
  setActiveTab,
  setSelectedProject,
  setSelectedLanguage,
  onOpenLogError,
  customProjects,
  customLanguages,
  onAddProject,
  onAddLanguage,
}) => {
  const [subTab, setSubTab] = useState<'projects' | 'languages'>('projects');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Project / Language Modal States
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');

  // 1. Calculate Project Stats
  const projectStatsMap = useMemo(() => {
    const map = new Map<string, ProjectStat>();

    // Seed default projects from errors
    errors.forEach((err) => {
      const proj = err.project ? err.project.trim() : 'Uncategorized';
      const key = proj.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: proj,
          errorCount: 0,
          solutionCount: 0,
          languages: [],
          tags: [],
          lastTimestamp: err.timestamp,
        });
      }
      const stat = map.get(key)!;
      stat.errorCount += 1;
      stat.solutionCount += err.solutions?.length || 0;
      if (err.language && !stat.languages.includes(err.language)) {
        stat.languages.push(err.language);
      }
      err.tags.forEach((t) => {
        if (!stat.tags.includes(t)) stat.tags.push(t);
      });
    });

    // Add custom created projects that don't have errors yet
    customProjects.forEach((projName) => {
      if (!projName) return;
      const key = projName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: projName.trim(),
          errorCount: 0,
          solutionCount: 0,
          languages: [],
          tags: [],
        });
      }
    });

    return map;
  }, [errors, customProjects]);

  // 2. Calculate Language Stats
  const languageStatsMap = useMemo(() => {
    const map = new Map<string, LanguageStat>();

    errors.forEach((err) => {
      const lang = err.language ? err.language.trim() : 'Unknown';
      const key = lang.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: lang,
          errorCount: 0,
          solutionCount: 0,
          projects: [],
          tags: [],
        });
      }
      const stat = map.get(key)!;
      stat.errorCount += 1;
      stat.solutionCount += err.solutions?.length || 0;
      if (err.project && !stat.projects.includes(err.project)) {
        stat.projects.push(err.project);
      }
      err.tags.forEach((t) => {
        if (!stat.tags.includes(t)) stat.tags.push(t);
      });
    });

    // Add custom created languages
    customLanguages.forEach((langName) => {
      if (!langName) return;
      const key = langName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: langName.trim(),
          errorCount: 0,
          solutionCount: 0,
          projects: [],
          tags: [],
        });
      }
    });

    return map;
  }, [errors, customLanguages]);

  const projectsList = Array.from(projectStatsMap.values()).filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const languagesList = Array.from(languageStatsMap.values()).filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProjects = projectStatsMap.size;
  const totalLanguages = languageStatsMap.size;
  const totalSolutions = Array.from(projectStatsMap.values()).reduce(
    (acc, cur) => acc + cur.solutionCount,
    0
  );

  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isSubmittingLanguage, setIsSubmittingLanguage] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsSubmittingProject(true);
    try {
      const names = newProjectName
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      for (const name of names) {
        await onAddProject(name);
      }
      setNewProjectName('');
      setIsAddProjectOpen(false);
      setSubTab('projects');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleCreateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLanguageName.trim()) return;
    setIsSubmittingLanguage(true);
    try {
      const names = newLanguageName
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      for (const name of names) {
        await onAddLanguage(name);
      }
      setNewLanguageName('');
      setIsAddLanguageOpen(false);
      setSubTab('languages');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingLanguage(false);
    }
  };

  const navigateToExplorerWithProject = (proj: string) => {
    setSelectedProject(proj);
    setSelectedLanguage('');
    setActiveTab('explorer');
  };

  const navigateToExplorerWithLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    setSelectedProject('');
    setActiveTab('explorer');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Toolbar */}
      <div className="tool-toolbar">
        <Folder style={{ width: 14, height: 14, color: 'var(--primary)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          Projects & Languages Manager
        </span>

        <div className="vert-divider" style={{ height: 18, margin: '0 10px' }} />

        {/* Sub-Tab Selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setSubTab('projects')}
            className={`btn btn-sm ${subTab === 'projects' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Folder style={{ width: 12, height: 12 }} />
            Projects ({totalProjects})
          </button>
          <button
            onClick={() => setSubTab('languages')}
            className={`btn btn-sm ${subTab === 'languages' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Code2 style={{ width: 12, height: 12 }} />
            Languages ({totalLanguages})
          </button>
        </div>

        {/* Search & Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="tool-search" style={{ width: 200 }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder={`Search ${subTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsAddProjectOpen(true)}
            className="btn btn-ghost btn-sm"
          >
            <Plus style={{ width: 12, height: 12 }} />
            <span>Add Project</span>
          </button>

          <button
            onClick={() => setIsAddLanguageOpen(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus style={{ width: 12, height: 12 }} />
            <span>Add Language</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Ribbon */}
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          background: 'rgba(15, 23, 42, 0.4)',
        }}
      >
        <div className="tool-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Folder style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Projects
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>
              {totalProjects}
            </div>
          </div>
        </div>

        <div className="tool-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Code2 style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Languages Tracked
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>
              {totalLanguages}
            </div>
          </div>
        </div>

        <div className="tool-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <AlertCircle style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Indexed Errors
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>
              {errors.length}
            </div>
          </div>
        </div>

        <div className="tool-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Award style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Solutions Available
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>
              {totalSolutions}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {subTab === 'projects' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {projectsList.map((proj) => (
              <div key={proj.name} className="tool-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="h-9 w-9 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
                      <Folder style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{proj.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                        {proj.errorCount} error records • {proj.solutionCount} solutions
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-blue mono">Project</span>
                </div>

                {/* Languages list */}
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
                    Tech Stack / Languages
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {proj.languages.length > 0 ? (
                      proj.languages.map((l) => (
                        <span key={l} className="badge badge-muted mono" style={{ fontSize: 10 }}>
                          <Code2 style={{ width: 10, height: 10, marginRight: 4 }} />
                          {l}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>No errors logged yet</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => navigateToExplorerWithProject(proj.name)}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Filter style={{ width: 11, height: 11 }} />
                    Filter Errors
                  </button>
                  <button
                    onClick={() => onOpenLogError(proj.name)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Plus style={{ width: 11, height: 11 }} />
                    Log Error
                  </button>
                </div>
              </div>
            ))}

            {projectsList.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>
                No projects found matching search query.
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {languagesList.map((lang) => (
              <div key={lang.name} className="tool-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="h-9 w-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                      <Code2 style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{lang.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                        {lang.errorCount} errors across {lang.projects.length} project(s)
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-green mono">Language</span>
                </div>

                {/* Projects using this language */}
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
                    Associated Projects
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {lang.projects.length > 0 ? (
                      lang.projects.map((p) => (
                        <span key={p} className="badge badge-blue mono" style={{ fontSize: 10 }}>
                          {p}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>No active projects linked</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => navigateToExplorerWithLanguage(lang.name)}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Filter style={{ width: 11, height: 11 }} />
                    Filter Errors
                  </button>
                  <button
                    onClick={() => onOpenLogError(undefined, lang.name)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Plus style={{ width: 11, height: 11 }} />
                    Log Error
                  </button>
                </div>
              </div>
            ))}

            {languagesList.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>
                No languages found matching search query.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {isAddProjectOpen && (
        <div className="modal-backdrop fade-in">
          <div className="modal-content scale-in" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Folder style={{ width: 16, height: 16, color: '#60a5fa' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Add New Project</span>
              </div>
              <button onClick={() => setIsAddProjectOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="section-label" style={{ marginBottom: 6, display: 'block' }}>
                  Project Identifier / Name (comma separated for multiple)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. backend-api, PaymentGateway, CLI-Tool"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="pro-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono text-white placeholder-slate-500"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setIsAddProjectOpen(false)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingProject} className="btn btn-primary btn-sm">
                  {isSubmittingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Language Modal */}
      {isAddLanguageOpen && (
        <div className="modal-backdrop fade-in">
          <div className="modal-content scale-in" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 style={{ width: 16, height: 16, color: '#34d399' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Register Language Preset</span>
              </div>
              <button onClick={() => setIsAddLanguageOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <form onSubmit={handleCreateLanguage} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="section-label" style={{ marginBottom: 6, display: 'block' }}>
                  Language / Stack Name (comma separated for multiple)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. TypeScript, Python, Rust, Go, Java"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  className="pro-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono text-white placeholder-slate-500"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setIsAddLanguageOpen(false)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingLanguage} className="btn btn-primary btn-sm">
                  {isSubmittingLanguage ? 'Registering...' : 'Register Language'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
