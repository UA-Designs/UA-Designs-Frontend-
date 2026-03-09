import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Project, ProjectStatus, ProjectPriority } from '../types';
import { projectService } from '../services/projectService';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'pms_selected_project_id';

interface ProjectContextType {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadProjects: () => Promise<void>;
  filterStatus: ProjectStatus | 'all';
  setFilterStatus: (status: ProjectStatus | 'all') => void;
  filterPriority: ProjectPriority | 'all';
  setFilterPriority: (priority: ProjectPriority | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true); // true until first load completes
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<ProjectPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Persist selection to localStorage
  const setSelectedProject = useCallback((project: Project | null) => {
    setSelectedProjectState(project);
    if (project) {
      localStorage.setItem(STORAGE_KEY, project.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Load projects from API; restore or auto-select after load
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await projectService.getProjects();
      const list: Project[] = Array.isArray(fetched) ? fetched : [];
      setProjects(list);

      if (list.length > 0) {
        const storedId = localStorage.getItem(STORAGE_KEY);
        const restore = storedId ? list.find(p => p.id === storedId) : null;
        // Restore last-used project, or auto-select the first one
        setSelectedProjectState(restore ?? list[0]);
        localStorage.setItem(STORAGE_KEY, (restore ?? list[0]).id);
      }
    } catch {
      // silently fail — pages handle their own error states
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load projects once on mount
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      setProjects([]);
      setSelectedProject(null);
      setIsLoading(false);
      return;
    }

    loadProjects();
  }, [isAuthenticated, isAuthLoading, loadProjects, setSelectedProject]);

  const value: ProjectContextType = {
    selectedProject,
    setSelectedProject,
    projects,
    setProjects,
    isLoading,
    setIsLoading,
    loadProjects,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    searchQuery,
    setSearchQuery,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
