import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  PrinterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { resourceService, Material } from '../../services/resourceService';
import {
  DEFAULT_MATERIAL_CATEGORY,
  getMaterialCategoryFromRecord,
  MATERIAL_CATEGORIES,
} from '../../utils/materialCategory';
import dayjs from 'dayjs';
import './MaterialsPrint.css';

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
  'Lot',
  'Lump Sum',
];

const DEFAULT_MATERIALS_PAGE_SIZE = 25;
const MATERIALS_PAGE_SIZE_OPTIONS = ['10', '25', '50'];

export interface MaterialCatalogItem extends Material {
  unit?: string;
  category?: string;
  defaultCost?: number;
  description?: string;
}

type MaterialCatalogSortMode = 'alphabetical' | 'recent';

const formatCurrency = (v?: number) =>
  v !== undefined && v !== null ? `₱${Number(v).toLocaleString('en-PH')}` : '—';

const getCatalogCategory = (m: MaterialCatalogItem): string =>
  getMaterialCategoryFromRecord(m as Record<string, unknown>);

const getMaterialDefaultCost = (m: MaterialCatalogItem): number | undefined => {
  const raw =
    m.defaultCost ??
    (m as any).unitCost ??
    (m as any).unit_cost ??
    (m as any).costPerUnit ??
    (m as any).cost_per_unit;
  if (raw === undefined || raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

const Materials: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [materials, setMaterials] = useState<MaterialCatalogItem[]>([]);
  const [allMaterialsForStats, setAllMaterialsForStats] = useState<MaterialCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_MATERIALS_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortMode, setSortMode] = useState<MaterialCatalogSortMode>('alphabetical');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialCatalogItem | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const sortParams = useMemo(
    () =>
      sortMode === 'alphabetical'
        ? { sortBy: 'name' as const, sortOrder: 'asc' as const }
        : { sortBy: 'createdAt' as const, sortOrder: 'desc' as const },
    [sortMode]
  );

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const result = await resourceService.getMaterials({
        page,
        limit: pageSize,
        category: categoryFilter || undefined,
        ...sortParams,
      });
      setMaterials(Array.isArray(result.materials) ? result.materials : []);
      setTotalItems(result.pagination.totalItems);
      if (page > result.pagination.totalPages && result.pagination.totalPages > 0) {
        setPage(result.pagination.totalPages);
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to load materials');
      setMaterials([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortParams, categoryFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    let cancelled = false;
    resourceService
      .getAllMaterials(sortParams)
      .then((list) => {
        if (!cancelled) setAllMaterialsForStats(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setAllMaterialsForStats([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sortParams]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(q) ||
          getCatalogCategory(m).toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      list = list.filter((m) => getCatalogCategory(m) === categoryFilter);
    }
    return list;
  }, [materials, search, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const source = allMaterialsForStats.length > 0 ? allMaterialsForStats : materials;
    const counts: Record<string, number> = { Total: totalItems || source.length };
    MATERIAL_CATEGORIES.forEach((cat) => {
      counts[cat] = source.filter((m) => getCatalogCategory(m) === cat).length;
    });
    return counts;
  }, [allMaterialsForStats, materials, totalItems]);

  const printableGroups = useMemo(() => {
    const byCategory = new Map<string, MaterialCatalogItem[]>();
    filteredMaterials.forEach((m) => {
      const category = getCatalogCategory(m);
      const existing = byCategory.get(category) || [];
      existing.push(m);
      byCategory.set(category, existing);
    });
    const categoryOrder = [
      ...MATERIAL_CATEGORIES.filter((category) => byCategory.has(category)),
      ...Array.from(byCategory.keys()).filter((category) => !MATERIAL_CATEGORIES.includes(category)),
    ];
    return categoryOrder
      .map((category) => ({
        category,
        items: (byCategory.get(category) || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      }))
      .filter((g) => g.items.length > 0);
  }, [filteredMaterials]);

  const handlePrintCatalog = () => {
    window.print();
  };

  const openAddModal = () => {
    addForm.resetFields();
    setAddModalVisible(true);
  };

  const handleAdd = async (values: any) => {
    setSubmitLoading(true);
    try {
      await resourceService.createMaterial({
        name: values.name,
        unit: values.unit ?? 'Pieces (pc)',
        unitCost: Number(values.defaultCost ?? values.unitCost ?? 0),
        category: values.category || DEFAULT_MATERIAL_CATEGORY,
        description: values.description,
      });
      message.success('Material added');
      setAddModalVisible(false);
      addForm.resetFields();
      if (sortMode === 'recent' && page !== 1) {
        setPage(1);
      } else {
        fetchMaterials();
        resourceService.getAllMaterials(sortParams).then((list) => {
          setAllMaterialsForStats(Array.isArray(list) ? list : []);
        }).catch(() => {});
      }
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
      category: getCatalogCategory(record),
      defaultCost: getMaterialDefaultCost(record) ?? 0,
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
        category: values.category || DEFAULT_MATERIAL_CATEGORY,
        defaultCost: values.defaultCost ?? 0,
        description: values.description,
      });
      message.success('Material updated');
      setEditModalVisible(false);
      setEditingMaterial(null);
      fetchMaterials();
      resourceService.getAllMaterials(sortParams).then((list) => {
        setAllMaterialsForStats(Array.isArray(list) ? list : []);
      }).catch(() => {});
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
      resourceService.getAllMaterials(sortParams).then((list) => {
        setAllMaterialsForStats(Array.isArray(list) ? list : []);
      }).catch(() => {});
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
      render: (_: string, record: MaterialCatalogItem) => (
        <span
          style={{
            background: 'rgba(0,153,68,0.2)',
            color: '#00ff88',
            padding: '2px 10px',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {getCatalogCategory(record)}
        </span>
      ),
    },
    {
      title: 'Default Cost',
      dataIndex: 'defaultCost',
      key: 'defaultCost',
      render: (_: number, record: MaterialCatalogItem) => (
        <Text style={{ color: '#00ff88' }}>{formatCurrency(getMaterialDefaultCost(record))}</Text>
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
          <Space>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrintCatalog}
              style={{ borderColor: '#009944', color: '#009944' }}
            >
              Export Printable Catalog
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              style={{ background: '#009944', borderColor: '#009944' }}
            >
              Add Material
            </Button>
          </Space>
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
            <Text style={{ color: '#aaa', fontSize: 13 }}>Structural</Text>
            <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700 }}>
              {categoryCounts.Structural ?? 0}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: '#aaa', fontSize: 13 }}>Architectural</Text>
            <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700 }}>
              {categoryCounts.Architectural ?? 0}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <Text style={{ color: '#aaa', fontSize: 13 }}>Mechanical</Text>
            <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700 }}>
              {categoryCounts.Mechanical ?? 0}
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
          <Col xs={24} sm={10} md={8}>
            <Select
              style={{ width: '100%' }}
              value={sortMode}
              onChange={(v) => {
                setSortMode(v as MaterialCatalogSortMode);
                setPage(1);
              }}
              options={[
                { label: 'Sort: Alphabetical', value: 'alphabetical' },
                { label: 'Sort: Recently Added', value: 'recent' },
              ]}
            />
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
            current: page,
            pageSize,
            total: totalItems,
            showSizeChanger: true,
            pageSizeOptions: MATERIALS_PAGE_SIZE_OPTIONS,
            showTotal: (total, [start, end]) =>
              total > 0 ? `${start}-${end} of ${total} materials` : '0 materials',
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
                setPage(1);
              } else {
                setPage(nextPage);
              }
            },
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
            name="category"
            label="Category"
            initialValue={DEFAULT_MATERIAL_CATEGORY}
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

      <div className="materials-print-page" aria-hidden>
        <div className="materials-print-document">
          <h1>Materials Catalog</h1>
          <p className="materials-print-convention">
            Printable materials catalog for inventory reference. Cost fields are intentionally excluded.
          </p>

          <div className="materials-print-meta">
            <div className="materials-print-meta-row">
              <span>
                <span className="materials-print-meta-label">Generated: </span>
                {dayjs().format('MMM DD, YYYY hh:mm A')}
              </span>
            </div>
            <div className="materials-print-meta-row">
              <span>
                <span className="materials-print-meta-label">Total Materials: </span>
                {filteredMaterials.length}
              </span>
              <span>
                <span className="materials-print-meta-label">Category Filter: </span>
                {categoryFilter || 'All Categories'}
              </span>
              <span>
                <span className="materials-print-meta-label">Search: </span>
                {search.trim() || '—'}
              </span>
            </div>
          </div>

          <div className="materials-print-table-wrap">
            <table className="materials-print-table">
              <thead>
                <tr>
                  <th className="col-no">Item No.</th>
                  <th className="col-desc">Material Name</th>
                  <th className="col-unit">Unit</th>
                  <th className="col-category">Category</th>
                  <th className="col-desc2">Description</th>
                </tr>
              </thead>
              <tbody>
                {printableGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                      No materials to print.
                    </td>
                  </tr>
                ) : (
                  printableGroups.flatMap((group) => {
                    const rows: React.ReactNode[] = [];
                    rows.push(
                      <tr key={`group-${group.category}`} className="materials-print-group-row">
                        <td className="col-no">—</td>
                        <td className="col-desc" colSpan={4}>{group.category.toUpperCase()}</td>
                      </tr>
                    );
                    group.items.forEach((item, index) => {
                      rows.push(
                        <tr key={item.id}>
                          <td className="col-no">{index + 1}</td>
                          <td className="col-desc">{item.name || '—'}</td>
                          <td className="col-unit">{item.unit || '—'}</td>
                          <td className="col-category">{getCatalogCategory(item)}</td>
                          <td className="col-desc2">{item.description || '—'}</td>
                        </tr>
                      );
                    });
                    return rows;
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Materials;
