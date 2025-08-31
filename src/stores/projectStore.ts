import { create } from 'zustand';
import { Project, ProjectStatus, ProjectPriority, Task } from '../types';
import { projectService } from '../services/projectService';
import toast from 'react-hot-toast';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Project actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<void>;
  updateProject: (id: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;

  // Task actions
  fetchTasks: (projectId?: string) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (taskId: string, userId: string) => Promise<void>;

  // Filter and search
  filterProjects: (
    status?: ProjectStatus,
    priority?: ProjectPriority
  ) => Project[];
  searchProjects: (query: string) => Project[];
  getProjectStats: () => {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    cancelled: number;
  };
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.getProjects();
      set({ projects: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch projects',
        isLoading: false,
      });
      toast.error('Failed to fetch projects');
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.getProject(id);
      set({ currentProject: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch project',
        isLoading: false,
      });
      toast.error('Failed to fetch project');
    }
  },

  createProject: async (projectData: Partial<Project>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.createProject(projectData);
      const newProject = response.data;

      set(state => ({
        projects: [...state.projects, newProject],
        isLoading: false,
      }));

      toast.success('Project created successfully');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create project',
        isLoading: false,
      });
      toast.error('Failed to create project');
      throw error;
    }
  },

  updateProject: async (id: string, projectData: Partial<Project>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.updateProject(id, projectData);
      const updatedProject = response.data;

      set(state => ({
        projects: state.projects.map(p => (p.id === id ? updatedProject : p)),
        currentProject:
          state.currentProject?.id === id
            ? updatedProject
            : state.currentProject,
        isLoading: false,
      }));

      toast.success('Project updated successfully');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update project',
        isLoading: false,
      });
      toast.error('Failed to update project');
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteProject(id);

      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }));

      toast.success('Project deleted successfully');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete project',
        isLoading: false,
      });
      toast.error('Failed to delete project');
      throw error;
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  fetchTasks: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.getTasks(projectId);
      set({ tasks: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch tasks',
        isLoading: false,
      });
      toast.error('Failed to fetch tasks');
    }
  },

  createTask: async (taskData: Partial<Task>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.createTask(taskData);
      const newTask = response.data;

      set(state => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));

      toast.success('Task created successfully');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create task',
        isLoading: false,
      });
      toast.error('Failed to create task');
      throw error;
    }
  },

  updateTask: async (id: string, taskData: Partial<Task>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.updateTask(id, taskData);
      const updatedTask = response.data;

      set(state => ({
        tasks: state.tasks.map(t => (t.id === id ? updatedTask : t)),
        isLoading: false,
      }));

      toast.success('Task updated successfully');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update task',
        isLoading: false,
      });
      toast.error('Failed to update task');
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.deleteTask(id);

      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
        isLoading: false,
      }));

      toast.success('Task deleted successfully');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete task',
        isLoading: false,
      });
      toast.error('Failed to delete task');
      throw error;
    }
  },

  assignTask: async (taskId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.assignTask(taskId, userId);
      const updatedTask = response.data;

      set(state => ({
        tasks: state.tasks.map(t => (t.id === taskId ? updatedTask : t)),
        isLoading: false,
      }));

      toast.success('Task assigned successfully');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to assign task',
        isLoading: false,
      });
      toast.error('Failed to assign task');
      throw error;
    }
  },

  filterProjects: (status?: ProjectStatus, priority?: ProjectPriority) => {
    const { projects } = get();
    return projects.filter(project => {
      const statusMatch = !status || project.status === status;
      const priorityMatch = !priority || project.priority === priority;
      return statusMatch && priorityMatch;
    });
  },

  searchProjects: (query: string) => {
    const { projects } = get();
    const lowercaseQuery = query.toLowerCase();
    return projects.filter(
      project =>
        project.name.toLowerCase().includes(lowercaseQuery) ||
        project.description.toLowerCase().includes(lowercaseQuery)
    );
  },

  getProjectStats: () => {
    const { projects } = get();
    return {
      total: projects.length,
      active: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS)
        .length,
      completed: projects.filter(p => p.status === ProjectStatus.COMPLETED)
        .length,
      onHold: projects.filter(p => p.status === ProjectStatus.ON_HOLD).length,
      cancelled: projects.filter(p => p.status === ProjectStatus.CANCELLED)
        .length,
    };
  },
}));
