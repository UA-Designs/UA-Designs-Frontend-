import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Select,
  Table,
  Modal,
  Form,
  InputNumber,
  message,
  Spin,
  Popconfirm,
  Space,
  Grid,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { resourceService, Material } from '../../services/resourceService';
import { projectService } from '../../services/projectService';
import type { Project } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

// Catalog uses global materials (no projectId)
const MATERIAL_UNITS = [
  'Pieces (pc)',
  'Square Meters (sq.m)',
  'Cubic Meters (cu.m)',
  'Length',
  'Sets',
  'Kilograms (kg)',
  'Liters (L)',
  'Rolls',
  'Bags',
  'Boxes',
];

const MATERIAL_CATEGORIES = [
  'Other',
  'Steel & Metal',
  'Wood & Lumber',
  'Cement & Concrete',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Finishing',
  'Hardware',
];

export interface MaterialCatalogItem extends Material {
  unit?: string;
  category?: string;
  defaultCost?: number;
  description?: string;
}

const formatCurrency = (v?: number) =>
  v !== undefined && v !== null ? `₱${Number(v).toLocaleString('en-PH')}` : '—';

const Materials: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [materials, setMaterials] = useState<MaterialCatalogItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialCatalogItem | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    projectService.getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const list = await resourceService.getMaterials();
      setMaterials(Array.isArray(list) ? list : []);
    } catch (err: any) {
      message.error(err.message || 'Failed to load materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(q) ||
          (m.category || '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      list = list.filter((m) => (m.category || 'Other') === categoryFilter);
    }
    return list;
  }, [materials, search, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Total: materials.length };
    MATERIAL_CATEGORIES.forEach((cat) => {
      counts[cat] = materials.filter((m) => (m.category || 'Other') === cat).length;
    });
    return counts;
  }, [materials]);

  const openAddModal = () => {
    addForm.resetFields();
    setAddModalVisible(true);
  };

  const handleAdd = async (values: any) => {
    setSubmitLoading(true);
    try {
      await resourceService.createMaterial({
        name: values.name,
        projectId: values.projectId,
        unit: values.unit ?? 'Pieces (pc)',
        unitCost: Number(values.defaultCost ?? values.unitCost ?? 0),
        quantity: Number(values.quantity ?? 0),
        category: values.category || 'Other',
        description: values.description,
      });
      message.success('Material added');
      setAddModalVisible(false);
      addForm.resetFields();
      fetchMaterials();
    } catch (err: any) {
      message.error(err.message || 'Failed to add material');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEdit = (record: MaterialCatalogItem) => {
    setEditingMaterial(record);
    editForm.setFieldsValue({
      name: record.name,
      unit: record.unit || 'Pieces (pc)',
      category: record.category || 'Other',
      defaultCost: record.defaultCost ?? 0,
      description: record.description,
    });
    setEditModalVisible(true);
  };

  const handleEdit = async (values: any) => {
    if (!editingMaterial) return;
    setSubmitLoading(true);
    try {
      await resourceService.updateMaterial(editingMaterial.id, {
        name: values.name,
        unit: values.unit,
        category: values.category || 'Other',
        defaultCost: values.defaultCost ?? 0,
        description: values.description,
      });
      message.success('Material updated');
      setEditModalVisible(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (err: any) {
      message.error(err.message || 'Failed to update material');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resourceService.deleteMaterial(id);
      message.success('Material deleted');
      fetchMaterials();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete material');
    }
  };

  const columns: ColumnsType<MaterialCatalogItem> = [
    {
      title: 'Material Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Text strong style={{ color: '#ffffff' }}>
          {name || '—'}
        </Text>
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (v: string) => (
        <Text style={{ color: '#bbb' }}>{v || '—'}</Text>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => (
        <span
          style={{
            background: v === 'Other' ? 'rgba(255,255,255,0.1)' : 'rgba(0,153,68,0.2)',
            color: v === 'Other' ? '#aaa' : '#00ff88',
            padding: '2px 10px',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {v || 'Other'}
        </span>
      ),
    },
    {
      title: 'Default Cost',
      dataIndex: 'defaultCost',
      key: 'defaultCost',
      render: (v: number) => (
        <Text style={{ color: '#00ff88' }}>{formatCurrency(v)}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            style={{ color: '#009944' }}
          />
          <Popconfirm
            title="Delete this material?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? '16px 8px' : '24px', background: 'transparent', minHeight: '100vh' }}>
      <Row justify="space-between" align="middle" gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
            <AppstoreOutlined style={{ color: '#009944', marginRight: 12 }} />
            Materials Catalog
          </Title>
          <Text style={{ color: '#aaa', display: 'block', marginTop: 4 }}>
            Manage your construction materials master list
          </Text>
        </Col>
        <Col xs={24} md="auto">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            style={{ background: '#009944', borderColor: '#009944' }}
          >
            Add Material
          </Button>
        </Col>
      </Row>

      {/* Metric cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: '#aaa', fontSize: 13 }}>Total Materials</Text>
            <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700 }}>
              {categoryCounts.Total}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: '#aaa', fontSize: 13 }}>Steel & Metal</Text>
            <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700 }}>
              {categoryCounts['Steel & Metal'] ?? 0}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: '#aaa', fontSize: 13 }}>Wood & Lumber</Text>
            <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700 }}>
              {categoryCounts['Wood & Lumber'] ?? 0}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: '#aaa', fontSize: 13 }}>Cement & Concrete</Text>
            <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700 }}>
              {categoryCounts['Cement & Concrete'] ?? 0}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search and filter */}
      <Card
        style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: isMobile ? '12px 16px' : '16px 24px' }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={14} md={10}>
            <Input
              prefix={<SearchOutlined style={{ color: '#aaa' }} />}
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ background: '#141414', borderColor: 'rgba(0,153,68,0.3)', color: '#fff' }}
            />
          </Col>
          <Col xs={24} sm={10} md={6}>
            <Select
              placeholder="All Categories"
              allowClear
              style={{ width: '100%' }}
              value={categoryFilter || undefined}
              onChange={(v) => setCategoryFilter(v || '')}
            >
              <Option value="">All Categories</Option>
              {MATERIAL_CATEGORIES.map((c) => (
                <Option key={c} value={c}>{c}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="id"
          dataSource={filteredMaterials}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (t) => `${t} materials`,
            style: { padding: '16px 24px' },
          }}
          style={{ background: '#1f1f1f' }}
        />
      </Card>

      {/* Add New Material modal */}
      <Modal
        title="Add New Material"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={520}
        destroyOnClose
        styles={{
          body: { background: '#1f1f1f', padding: 24 },
          header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' },
          content: { background: '#1f1f1f' },
        }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAdd}
        >
          <Form.Item
            name="projectId"
            label="Project"
            rules={[{ required: true, message: 'Select a project' }]}
          >
            <Select
              placeholder="Select project"
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Material Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Steel Bar 10mm" style={{ background: '#141414', borderColor: 'rgba(0,153,68,0.3)', color: '#fff' }} />
          </Form.Item>
          <Form.Item
            name="unit"
            label="Unit of Measure"
            rules={[{ required: true, message: 'Required' }]}
            initialValue="Pieces (pc)"
          >
            <Select
              placeholder="Select unit"
              style={{ background: '#141414' }}
              options={MATERIAL_UNITS.map((u) => ({ label: u, value: u }))}
            />
          </Form.Item>
          <Form.Item
            name="defaultCost"
            label="Unit Cost (₱)"
            rules={[{ required: true, message: 'Required' }]}
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Required' }]}
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            initialValue="Other"
          >
            <Select
              placeholder="Select category"
              style={{ background: '#141414' }}
              options={MATERIAL_CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Optional" style={{ background: '#141414', borderColor: 'rgba(0,153,68,0.3)', color: '#fff' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitLoading} style={{ background: '#009944', borderColor: '#009944' }}>
                Add Material
              </Button>
              <Button onClick={() => setAddModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Material modal */}
      <Modal
        title="Edit Material"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setEditingMaterial(null); }}
        footer={null}
        width={520}
        destroyOnClose
        styles={{
          body: { background: '#1f1f1f', padding: 24 },
          header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' },
          content: { background: '#1f1f1f' },
        }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="Material Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., Steel Bar 10mm" style={{ background: '#141414', borderColor: 'rgba(0,153,68,0.3)', color: '#fff' }} />
          </Form.Item>
          <Form.Item name="unit" label="Unit of Measure" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select unit"
              style={{ background: '#141414' }}
              options={MATERIAL_UNITS.map((u) => ({ label: u, value: u }))}
            />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select category"
              style={{ background: '#141414' }}
              options={MATERIAL_CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </Form.Item>
          <Form.Item name="defaultCost" label="Default Unit Cost (₱)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Optional description or specifications" style={{ background: '#141414', borderColor: 'rgba(0,153,68,0.3)', color: '#fff' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitLoading} style={{ background: '#009944', borderColor: '#009944' }}>
                Save Changes
              </Button>
              <Button onClick={() => { setEditModalVisible(false); setEditingMaterial(null); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Materials;
