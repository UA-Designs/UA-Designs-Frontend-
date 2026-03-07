import React, { useState } from 'react';
import { Select, Typography, message, Spin } from 'antd';
import { Project } from '../../types';
import { useProject } from '../../contexts/ProjectContext';
import ProjectCreationModal from './ProjectCreationModal';

const { Text } = Typography;
const { Option } = Select;

interface ProjectSelectorProps {
  onProjectChange?: (project: Project | null) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  onProjectChange,
  placeholder = "Select a project to manage",
  style = {},
}) => {
  const { selectedProject, setSelectedProject, projects, isLoading } = useProject();
  
  // Ensure projects is always an array
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  const [modalVisible, setModalVisible] = useState(false);

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
    <div style={{ ...style }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        {/* Dropdown */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 250 }}>
            <Spin size="small" />
            <Text type="secondary" style={{ color: '#8c8c8c' }}>Loading projects...</Text>
          </div>
        ) : (
          <Select
            value={selectedProject?.id}
            onChange={handleProjectChange}
            placeholder={placeholder}
            style={{ minWidth: 250, background: 'rgba(13, 13, 13, 0.8)' }}
            dropdownStyle={{
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.3)',
            }}
            size="large"
            showSearch
            optionLabelProp="label"
            filterOption={(input, option) => {
              const proj = safeProjects.find(p => p.id === option?.value);
              return proj?.name.toLowerCase().includes(input.toLowerCase()) ?? false;
            }}
          >
            {safeProjects.map(project => (
              <Option key={project.id} value={project.id} label={project.name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong style={{ color: '#ffffff' }}>{project.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {project.description}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div
                      style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getProjectStatusColor(project.status) }}
                      title={`Status: ${project.status}`}
                    />
                    <div
                      style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getProjectPriorityColor(project.priority) }}
                      title={`Priority: ${project.priority}`}
                    />
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        )}

        {/* Inline info banner — side-by-side with the dropdown */}
        {selectedProject && (
          <div style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            background: 'rgba(0, 153, 68, 0.05)',
            border: '1px solid rgba(0, 153, 68, 0.2)',
            borderRadius: 6,
            padding: '8px 16px',
          }}>
            <span style={{ fontWeight: 600, color: '#009944', whiteSpace: 'nowrap' }}>
              {selectedProject.name}
            </span>
            <span style={{ color: '#4b5563' }}>•</span>
            <span style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
              {selectedProject.description || '—'}
            </span>
            <span style={{ color: '#4b5563' }}>•</span>
            <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>
              Budget: ₱{selectedProject.budget?.toLocaleString() ?? '—'}
            </span>
            <span style={{ color: '#4b5563' }}>•</span>
            <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>
              Progress: {selectedProject.progress ?? 0}%
            </span>
          </div>
        )}
      </div>

      <ProjectCreationModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
};

export default ProjectSelector;
