import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, Empty, Grid, Select, Typography } from 'antd';
import { useLocation } from 'react-router-dom';
import { useProject } from '../../contexts/ProjectContext';
import ProjectAIChat from './ProjectAIChat';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface GlobalAIDrawerProps {
  open: boolean;
  onClose: () => void;
}

const GlobalAIDrawer: React.FC<GlobalAIDrawerProps> = ({ open, onClose }) => {
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { projects, selectedProject, setSelectedProject } = useProject();

  const routeProjectId = useMemo(() => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    const id = match?.[1];
    if (!id || id === 'forecasting') return undefined;
    return id;
  }, [location.pathname]);

  const defaultProjectId = routeProjectId || selectedProject?.id;
  const [drawerProjectId, setDrawerProjectId] = useState<string | undefined>(
    defaultProjectId
  );

  useEffect(() => {
    if (open) {
      setDrawerProjectId(defaultProjectId);
    }
  }, [open, defaultProjectId]);

  const drawerProject =
    projects.find(p => p.id === drawerProjectId) ||
    (selectedProject?.id === drawerProjectId ? selectedProject : null);

  const handleProjectChange = (id: string) => {
    setDrawerProjectId(id);
    const match = projects.find(p => p.id === id) || null;
    if (match) setSelectedProject(match);
  };

  return (
    <Drawer
      title="AI Assistant"
      placement="right"
      width={isMobile ? '100%' : 460}
      open={open}
      onClose={onClose}
      destroyOnClose={false}
      styles={{
        body: {
          padding: 12,
          background: '#141414',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
        header: {
          background: '#1f1f1f',
          borderBottom: '1px solid rgba(0,153,68,0.2)',
        },
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>
          Project context
        </Text>
        <Select
          showSearch
          placeholder="Select a project"
          style={{ width: '100%' }}
          value={drawerProjectId}
          optionFilterProp="label"
          onChange={handleProjectChange}
          options={(projects || []).map(p => ({ value: p.id, label: p.name }))}
        />
        {drawerProject && (
          <Text style={{ color: '#00cc66', fontSize: 12, display: 'block', marginTop: 6 }}>
            {drawerProject.name}
          </Text>
        )}
      </div>

      {!drawerProjectId ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text style={{ color: '#888' }}>
              Select a project before sending messages. The assistant always runs in a
              project context.
            </Text>
          }
          style={{ marginTop: 48 }}
        />
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <ProjectAIChat
            key={drawerProjectId}
            projectId={drawerProjectId}
            projectName={drawerProject?.name}
            variant="drawer"
          />
        </div>
      )}
    </Drawer>
  );
};

export default GlobalAIDrawer;
