import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, ProjectStatus, ProjectPriority } from '../types';

interface ProjectContextType {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>(
    'all'
  );
  const [filterPriority, setFilterPriority] = useState<ProjectPriority | 'all'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const value: ProjectContextType = {
    selectedProject,
    setSelectedProject,
    projects,
    setProjects,
    isLoading,
    setIsLoading,
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
