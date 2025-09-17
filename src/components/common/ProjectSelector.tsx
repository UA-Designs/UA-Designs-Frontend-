import React, { useEffect, useState } from 'react';
import { Select, Button, Space, Typography, message, Spin } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Project } from '../../types';
import { projectService } from '../../services/projectService';
import { useProject } from '../../contexts/ProjectContext';
import ProjectCreationModal from './ProjectCreationModal';

const { Text } = Typography;
const { Option } = Select;

interface ProjectSelectorProps {
  onProjectChange?: (project: Project | null) => void;
  showCreateButton?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  onProjectChange,
  showCreateButton = true,
  placeholder = "Select a project to manage",
  style = {},
}) => {
  const { selectedProject, setSelectedProject, projects, setProjects, isLoading, setIsLoading } = useProject();
  
  // Ensure projects is always an array
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('ProjectSelector - Component mounted, safeProjects length:', safeProjects.length);
    
    // Check authentication status
    const token = localStorage.getItem('ua_designs_token');
    const user = localStorage.getItem('ua_designs_user');
    console.log('ProjectSelector - Auth check - Token exists:', !!token);
    console.log('ProjectSelector - Auth check - User exists:', !!user);
    console.log('ProjectSelector - Auth check - All localStorage keys:', Object.keys(localStorage));
    
    if (safeProjects.length === 0) {
      console.log('ProjectSelector - No projects found, loading from backend...');
      loadProjects();
    } else {
      console.log('ProjectSelector - Projects already loaded:', safeProjects.length);
    }
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      console.log('Loading projects from backend...');
      const fetchedProjects = await projectService.getProjects();
      console.log('Fetched projects:', fetchedProjects);
      setProjects(fetchedProjects);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      message.error(error.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadProjects();
      message.success('Projects refreshed successfully');
    } catch (error: any) {
      message.error('Failed to refresh projects');
    } finally {
      setRefreshing(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = safeProjects.find(p => p.id === projectId) || null;
    setSelectedProject(project);
    onProjectChange?.(project);
  };

  const handleProjectCreated = (newProject: Project) => {
    setModalVisible(false);
    setSelectedProject(newProject);
    onProjectChange?.(newProject);
    message.success(`Project "${newProject.name}" created and selected!`);
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return '#1890ff';
      case 'in_progress': return '#52c41a';
      case 'on_hold': return '#faad14';
      case 'completed': return '#722ed1';
      case 'cancelled': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  const getProjectPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#fa8c16';
      case 'critical': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  return (
    <div style={{ marginBottom: 24, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text strong style={{ color: '#ffffff', fontSize: '16px' }}>
          Project Management
        </Text>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            size="small"
            style={{
              color: '#009944',
              borderColor: '#009944',
            }}
          >
            Refresh
          </Button>
          <Button
            onClick={async () => {
              try {
                console.log('Manual test - Fetching projects...');
                const token = localStorage.getItem('ua_designs_token') || localStorage.getItem('token');
                console.log('Manual test - Using token:', token ? token.substring(0, 20) + '...' : 'null');
                
                const response = await fetch('http://localhost:5000/api/projects', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                const data = await response.json();
                console.log('Manual test - Raw fetch response:', data);
                console.log('Manual test - Response status:', response.status);
                console.log('Manual test - Data type:', typeof data);
                console.log('Manual test - Data keys:', Object.keys(data || {}));
                console.log('Manual test - Is array:', Array.isArray(data));
                
                // Try different response formats
                let projects = null;
                
                if (data.success && data.data) {
                  console.log('Manual test - Using wrapped format, data.data:', data.data);
                  projects = data.data;
                } else if (Array.isArray(data)) {
                  console.log('Manual test - Using direct array format:', data);
                  projects = data;
                } else if (data.projects) {
                  console.log('Manual test - Using projects property:', data.projects);
                  projects = data.projects;
                } else if (data.results) {
                  console.log('Manual test - Using results property:', data.results);
                  projects = data.results;
                } else {
                  console.log('Manual test - Unknown format, trying to use data directly:', data);
                  projects = data;
                }
                
                console.log('Manual test - Final projects:', projects);
                console.log('Manual test - Projects length:', projects ? projects.length : 'undefined');
                
                if (projects && Array.isArray(projects)) {
                  console.log('Manual test - Setting projects:', projects.length);
                  setProjects(projects);
                } else {
                  console.log('Manual test - Projects is not an array, cannot set');
                }
              } catch (error) {
                console.error('Manual test - Error:', error);
              }
            }}
            size="small"
            style={{
              color: '#ff4d4f',
              borderColor: '#ff4d4f',
            }}
          >
            Test Backend
          </Button>
          {showCreateButton && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
              size="small"
              style={{
                background: '#009944',
                borderColor: '#009944',
                fontWeight: '600',
              }}
            >
              New Project
            </Button>
          )}
        </Space>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: 8, color: '#8c8c8c' }}>
            Loading projects...
          </Text>
        </div>
      ) : (
        <Select
          value={selectedProject?.id}
          onChange={handleProjectChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'rgba(13, 13, 13, 0.8)',
          }}
          dropdownStyle={{
            background: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid rgba(0, 204, 102, 0.3)',
          }}
          size="large"
          showSearch
          filterOption={(input, option) =>
            (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {safeProjects.map(project => (
            <Option key={project.id} value={project.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text strong style={{ color: '#ffffff' }}>
                    {project.name}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {project.description}
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: getProjectStatusColor(project.status),
                    }}
                    title={`Status: ${project.status}`}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: getProjectPriorityColor(project.priority),
                    }}
                    title={`Priority: ${project.priority}`}
                  />
                </div>
              </div>
            </Option>
          ))}
        </Select>
      )}

      {selectedProject && (
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(0, 204, 102, 0.1)', borderRadius: 8, border: '1px solid rgba(0, 204, 102, 0.2)' }}>
          <Text style={{ color: '#009944', fontSize: '14px', fontWeight: '500' }}>
            Selected: {selectedProject.name}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {selectedProject.description} • Budget: ${selectedProject.budget.toLocaleString()} • Progress: {selectedProject.progress}%
          </Text>
        </div>
      )}

      <ProjectCreationModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
};

export default ProjectSelector;
