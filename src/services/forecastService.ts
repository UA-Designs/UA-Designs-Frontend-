import { AxiosError } from 'axios';
import { apiService } from './api';
import { projectService, ProjectDashboardData } from './projectService';

// ── Status / quality ──────────────────────────────────────────────────────────

export type ForecastStatusCode =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'OVER_BUDGET'
  | 'DELAYED'
  | 'SHORTAGE'
  | 'INSUFFICIENT_DATA'
  | 'UNAVAILABLE'
  | string;

export type ProgressTrend =
  | 'INCREASING'
  | 'DECREASING'
  | 'STABLE'
  | 'UNKNOWN'
  | string;

export type ForecastScenarioType =
  | 'ADD_WORKERS'
  | 'DELAY_TASK'
  | 'MATERIAL_COST_INCREASE'
  | 'REDUCE_REMAINING_DURATION';

export interface ForecastDataQuality {
  sufficientData?: boolean;
  missingData?: string[];
  issues?: string[];
  [key: string]: unknown;
}

export interface ForecastCostSlice {
  budget: number | null;
  actualCost: number | null;
  forecastFinalCost: number | null;
  expectedOverrun: number | null;
  cpi: number | null;
  status: string | null;
  raw?: Record<string, unknown>;
}

export interface ForecastScheduleSlice {
  plannedCompletion: string | null;
  forecastCompletion: string | null;
  expectedDelayDays: number | null;
  spi: number | null;
  status: string | null;
  raw?: Record<string, unknown>;
}

export interface ForecastProgressSlice {
  currentProgress: number | null;
  plannedProgress: number | null;
  forecastProgress: number | null;
  trend: ProgressTrend | null;
  raw?: Record<string, unknown>;
}

export interface ForecastResourceSlice {
  currentResources: number | null;
  forecastRequirement: number | null;
  shortageSurplus: number | null;
  utilization: number | null;
  status: string | null;
  raw?: Record<string, unknown>;
}

export interface CostChartPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
  budget: number | null;
}

export interface ProgressChartPoint {
  date: string;
  planned: number | null;
  actual: number | null;
  forecast: number | null;
}

export interface ScheduleChartData {
  baselineCompletion: string | null;
  forecastCompletion: string | null;
  delayDays: number | null;
}

export interface ForecastCharts {
  cost: CostChartPoint[];
  schedule: ScheduleChartData | null;
  progress: ProgressChartPoint[];
}

export interface ForecastAlert {
  type?: string;
  severity?: string;
  title?: string;
  message?: string;
  metric?: string;
  value?: unknown;
  threshold?: unknown;
  recommendedAction?: string;
  [key: string]: unknown;
}

export interface ForecastHistorySnapshot {
  forecastDate: string | null;
  costForecastValue: number | null;
  scheduleForecastDate: string | null;
  progressForecastValue: number | null;
  status: string | null;
  [key: string]: unknown;
}

export interface AtRiskForecastItem {
  projectId: string;
  projectName: string | null;
  overallStatus: string | null;
  costStatus: string | null;
  scheduleStatus: string | null;
  progressStatus: string | null;
  resourceStatus: string | null;
  expectedOverrun: number | null;
  expectedDelayDays: number | null;
  raw: Record<string, unknown>;
}

export interface NormalizedProjectForecast {
  overallStatus: string | null;
  insufficient: boolean;
  methodology: string | null;
  dataQuality: ForecastDataQuality;
  cost: ForecastCostSlice;
  schedule: ForecastScheduleSlice;
  progress: ForecastProgressSlice;
  resources: ForecastResourceSlice;
  charts: ForecastCharts;
  alerts: ForecastAlert[];
}

export interface ForecastScenarioPayload {
  scenarioType: ForecastScenarioType | string;
  workersToAdd?: number;
  taskId?: string;
  delayDays?: number;
  percent?: number;
  [key: string]: unknown;
}

function asRec(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function unwrapData(payload: unknown): unknown {
  const rec = asRec(payload);
  if (!rec) return payload;
  if (rec.data !== undefined) return rec.data;
  return payload;
}

function pickStr(
  obj: Record<string, unknown> | undefined,
  ...keys: string[]
): string | null {
  if (!obj) return null;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function pickNum(
  obj: Record<string, unknown> | undefined,
  ...keys: string[]
): number | null {
  if (!obj) return null;
  for (const key of keys) {
    const value = obj[key];
    if (value == null || value === '') continue;
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickStrDeep(obj: Record<string, unknown> | undefined, keys: string[]): string | null {
  return pickStr(obj, ...keys);
}

function toMessage(error: unknown, fallback: string): string {
  const axiosErr = error as AxiosError<{ message?: string }>;
  return axiosErr.response?.data?.message || (error as Error)?.message || fallback;
}

function toStatus(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}

export class ForecastRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ForecastRequestError';
    this.status = status;
  }
}

function fail(error: unknown, fallback: string): never {
  throw new ForecastRequestError(toMessage(error, fallback), toStatus(error));
}

function forecastRoot(raw: unknown): Record<string, unknown> {
  const rec = asRec(raw);
  if (!rec) return {};
  return (
    asRec(rec.forecasting) ||
    asRec(rec.forecast) ||
    asRec(rec.data) ||
    rec
  );
}

function nest(
  root: Record<string, unknown>,
  ...keys: string[]
): Record<string, unknown> | undefined {
  for (const key of keys) {
    const found = asRec(root[key]);
    if (found) return found;
  }
  return undefined;
}

function normalizeCost(root: Record<string, unknown>): ForecastCostSlice {
  const slice = nest(root, 'cost', 'costForecast', 'costOverview') ?? root;
  return {
    budget: pickNum(slice, 'budget', 'BAC', 'bac', 'totalBudget', 'plannedBudget'),
    actualCost: pickNum(slice, 'actualCost', 'actual', 'AC', 'ac', 'spent', 'totalActualCost'),
    forecastFinalCost: pickNum(
      slice,
      'forecastFinalCost',
      'forecastCost',
      'eac',
      'EAC',
      'estimatedAtCompletion',
      'forecastedTotalCost'
    ),
    expectedOverrun: pickNum(
      slice,
      'expectedOverrun',
      'overrun',
      'vac',
      'VAC',
      'costVariance',
      'variance'
    ),
    cpi: pickNum(slice, 'cpi', 'CPI'),
    status: pickStr(slice, 'status', 'costStatus'),
    raw: slice,
  };
}

function normalizeSchedule(root: Record<string, unknown>): ForecastScheduleSlice {
  const slice = nest(root, 'schedule', 'scheduleForecast', 'scheduleOverview') ?? root;
  return {
    plannedCompletion: pickStr(
      slice,
      'plannedCompletion',
      'baselineCompletion',
      'plannedEndDate',
      'baselineFinishDate',
      'plannedFinish'
    ),
    forecastCompletion: pickStr(
      slice,
      'forecastCompletion',
      'forecastEndDate',
      'forecastFinishDate',
      'estimatedFinish',
      'riskAdjustedFinishDate'
    ),
    expectedDelayDays: pickNum(
      slice,
      'expectedDelayDays',
      'delayDays',
      'expectedDelay',
      'scheduleVarianceDays',
      'totalProjectRiskDelayDays'
    ),
    spi: pickNum(slice, 'spi', 'SPI'),
    status: pickStr(slice, 'status', 'scheduleStatus'),
    raw: slice,
  };
}

function normalizeProgress(root: Record<string, unknown>): ForecastProgressSlice {
  const slice = nest(root, 'progress', 'progressForecast', 'progressOverview') ?? root;
  return {
    currentProgress: pickNum(slice, 'currentProgress', 'actualProgress', 'progress', 'actual'),
    plannedProgress: pickNum(slice, 'plannedProgress', 'planned'),
    forecastProgress: pickNum(slice, 'forecastProgress', 'forecast'),
    trend: pickStr(slice, 'trend', 'progressTrend') as ProgressTrend | null,
    raw: slice,
  };
}

function normalizeResources(root: Record<string, unknown>): ForecastResourceSlice {
  const slice = nest(root, 'resources', 'resourceForecast', 'resourceOverview') ?? root;
  return {
    currentResources: pickNum(
      slice,
      'currentResources',
      'current',
      'available',
      'currentCount'
    ),
    forecastRequirement: pickNum(
      slice,
      'forecastRequirement',
      'required',
      'forecastRequired',
      'requirement'
    ),
    shortageSurplus: pickNum(
      slice,
      'shortageSurplus',
      'shortage',
      'surplus',
      'gap',
      'variance'
    ),
    utilization: pickNum(slice, 'utilization', 'utilizationRate', 'util'),
    status: pickStr(slice, 'status', 'resourceStatus'),
    raw: slice,
  };
}

function asPointArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(item => item && typeof item === 'object') as Record<string, unknown>[];
  }
  const rec = asRec(raw);
  if (!rec) return [];
  for (const key of ['points', 'data', 'series', 'items']) {
    if (Array.isArray(rec[key])) {
      return (rec[key] as unknown[]).filter(
        item => item && typeof item === 'object'
      ) as Record<string, unknown>[];
    }
  }
  return [];
}

function normalizeCharts(root: Record<string, unknown>): ForecastCharts {
  const charts = asRec(root.charts) ?? root;
  const costPoints = asPointArray(charts.cost).map(p => ({
    date: pickStr(p, 'date', 'x', 'period', 'label') || '',
    actual: pickNum(p, 'actual', 'actualCost', 'ac'),
    forecast: pickNum(p, 'forecast', 'forecastCost', 'eac'),
    budget: pickNum(p, 'budget', 'bac', 'planned'),
  }));

  const scheduleRaw = charts.schedule;
  let schedule: ScheduleChartData | null = null;
  if (Array.isArray(scheduleRaw) && scheduleRaw.length > 0) {
    const last = asRec(scheduleRaw[scheduleRaw.length - 1]);
    schedule = {
      baselineCompletion: pickStr(last, 'baselineCompletion', 'baseline', 'plannedCompletion'),
      forecastCompletion: pickStr(last, 'forecastCompletion', 'forecast', 'forecastEndDate'),
      delayDays: pickNum(last, 'delayDays', 'expectedDelayDays', 'delay'),
    };
  } else {
    const rec = asRec(scheduleRaw);
    if (rec) {
      schedule = {
        baselineCompletion: pickStr(
          rec,
          'baselineCompletion',
          'plannedCompletion',
          'baselineFinishDate'
        ),
        forecastCompletion: pickStr(
          rec,
          'forecastCompletion',
          'forecastEndDate',
          'forecastFinishDate'
        ),
        delayDays: pickNum(rec, 'delayDays', 'expectedDelayDays', 'delay'),
      };
    }
  }

  const progressPoints = asPointArray(charts.progress).map(p => ({
    date: pickStr(p, 'date', 'x', 'period', 'label') || '',
    planned: pickNum(p, 'planned', 'plannedProgress', 'pv'),
    actual: pickNum(p, 'actual', 'actualProgress', 'ev'),
    forecast: pickNum(p, 'forecast', 'forecastProgress'),
  }));

  return { cost: costPoints, schedule, progress: progressPoints };
}

function qualityItemText(item: unknown): string {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }
  const rec = asRec(item);
  if (!rec) return '';
  const field = typeof rec.field === 'string' ? rec.field : '';
  const message =
    typeof rec.message === 'string'
      ? rec.message
      : typeof rec.title === 'string'
        ? rec.title
        : typeof rec.issue === 'string'
          ? rec.issue
          : typeof rec.reason === 'string'
            ? rec.reason
            : '';
  const severity = typeof rec.severity === 'string' ? rec.severity : '';
  const core = [field, message].filter(Boolean).join(' — ');
  if (core && severity) return `${severity}: ${core}`;
  if (core) return core;
  if (severity) return severity;
  return '';
}

function qualityItemList(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.map(qualityItemText).filter(Boolean);
  return items.length ? items : undefined;
}

function normalizeQuality(root: Record<string, unknown>): ForecastDataQuality {
  const q = asRec(root.dataQuality) ?? asRec(root.quality) ?? {};
  const missing = q.missingData ?? q.missing ?? root.missingData;
  const issues = q.issues ?? q.warnings ?? root.issues;
  const { missingData: _md, issues: _iss, missing: _miss, warnings: _warn, ...rest } = q;
  return {
    ...rest,
    sufficientData:
      typeof q.sufficientData === 'boolean'
        ? q.sufficientData
        : typeof root.sufficientData === 'boolean'
          ? (root.sufficientData as boolean)
          : undefined,
    missingData: qualityItemList(missing),
    issues: qualityItemList(issues),
  };
}

function normalizeAlerts(raw: unknown): ForecastAlert[] {
  const rec = asRec(raw);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(rec?.alerts)
      ? rec.alerts
      : Array.isArray(rec?.items)
        ? rec.items
        : [];
  return list.filter(item => item && typeof item === 'object') as ForecastAlert[];
}

function normalizeSnapshots(raw: unknown): ForecastHistorySnapshot[] {
  const rec = asRec(raw);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(rec?.snapshots)
      ? rec.snapshots
      : Array.isArray(rec?.history)
        ? rec.history
        : Array.isArray(rec?.items)
          ? rec.items
          : [];
  return list
    .map(item => {
      const row = asRec(item);
      if (!row) return null;
      return {
        forecastDate: pickStr(row, 'forecastDate', 'date', 'createdAt', 'snapshotDate'),
        costForecastValue: pickNum(
          row,
          'costForecastValue',
          'forecastFinalCost',
          'eac',
          'EAC',
          'forecastCost'
        ),
        scheduleForecastDate: pickStr(
          row,
          'scheduleForecastDate',
          'forecastCompletion',
          'forecastEndDate'
        ),
        progressForecastValue: pickNum(
          row,
          'progressForecastValue',
          'forecastProgress',
          'progress'
        ),
        status: pickStr(row, 'status', 'overallStatus'),
        ...row,
      } as ForecastHistorySnapshot;
    })
    .filter((row): row is ForecastHistorySnapshot => row != null);
}

function normalizeAtRisk(raw: unknown): AtRiskForecastItem[] {
  const rec = asRec(raw);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(rec?.projects)
      ? rec.projects
      : Array.isArray(rec?.atRisk)
        ? rec.atRisk
        : Array.isArray(rec?.items)
          ? rec.items
          : Array.isArray(rec?.results)
            ? rec.results
            : [];

  return list
    .map(item => {
      const row = asRec(item);
      if (!row) return null;
      const project = asRec(row.project);
      const projectId =
        pickStr(row, 'projectId', 'id') ||
        pickStr(project, 'id', 'projectId');
      if (!projectId) return null;
      const cost = asRec(row.cost);
      const schedule = asRec(row.schedule);
      return {
        projectId,
        projectName:
          pickStr(row, 'projectName', 'name') || pickStr(project, 'name'),
        overallStatus: pickStr(row, 'overallStatus', 'status'),
        costStatus: pickStr(row, 'costStatus') || pickStr(cost, 'status'),
        scheduleStatus: pickStr(row, 'scheduleStatus') || pickStr(schedule, 'status'),
        progressStatus: pickStr(row, 'progressStatus') || pickStr(asRec(row.progress), 'status'),
        resourceStatus:
          pickStr(row, 'resourceStatus') || pickStr(asRec(row.resources), 'status'),
        expectedOverrun:
          pickNum(row, 'expectedOverrun', 'overrun') ??
          pickNum(cost, 'expectedOverrun', 'overrun'),
        expectedDelayDays:
          pickNum(row, 'expectedDelayDays', 'delayDays') ??
          pickNum(schedule, 'expectedDelayDays', 'delayDays'),
        raw: row,
      } as AtRiskForecastItem;
    })
    .filter((row): row is AtRiskForecastItem => row != null);
}

export function isForecastInsufficient(
  overallStatus: string | null,
  quality: ForecastDataQuality
): boolean {
  const status = (overallStatus || '').toUpperCase();
  if (status === 'UNAVAILABLE' || status === 'INSUFFICIENT_DATA') return true;
  if (quality.sufficientData === false) return true;
  return false;
}

export function mergeProjectForecast(
  dashboardData: unknown,
  engineData: unknown
): NormalizedProjectForecast {
  const dashRoot = forecastRoot(asRec(dashboardData)?.forecasting ?? dashboardData);
  const engineRoot = forecastRoot(engineData);
  const overviewRoot = Object.keys(dashRoot).length ? dashRoot : engineRoot;
  const chartRoot = asRec(engineRoot.charts) ? engineRoot : overviewRoot;
  const quality = {
    ...normalizeQuality(engineRoot),
    ...normalizeQuality(overviewRoot),
  };
  const overallStatus =
    pickStrDeep(overviewRoot, ['overallStatus', 'status']) ||
    pickStrDeep(engineRoot, ['overallStatus', 'status']);
  const alerts = normalizeAlerts(engineRoot.alerts ?? engineRoot);
  const methodology =
    pickStr(engineRoot, 'methodology', 'method', 'engine') ||
    pickStr(overviewRoot, 'methodology', 'method');

  const cost = { ...normalizeCost(engineRoot), ...normalizeCost(overviewRoot) };
  const schedule = { ...normalizeSchedule(engineRoot), ...normalizeSchedule(overviewRoot) };
  const progress = { ...normalizeProgress(engineRoot), ...normalizeProgress(overviewRoot) };
  const resources = { ...normalizeResources(engineRoot), ...normalizeResources(overviewRoot) };

  // Prefer nested slices when present so flat engine fields don't overwrite
  const costSlice = nest(overviewRoot, 'cost', 'costForecast')
    ? normalizeCost(overviewRoot)
    : nest(engineRoot, 'cost', 'costForecast')
      ? normalizeCost(engineRoot)
      : cost;
  const scheduleSlice = nest(overviewRoot, 'schedule', 'scheduleForecast')
    ? normalizeSchedule(overviewRoot)
    : nest(engineRoot, 'schedule', 'scheduleForecast')
      ? normalizeSchedule(engineRoot)
      : schedule;
  const progressSlice = nest(overviewRoot, 'progress', 'progressForecast')
    ? normalizeProgress(overviewRoot)
    : nest(engineRoot, 'progress', 'progressForecast')
      ? normalizeProgress(engineRoot)
      : progress;
  const resourceSlice = nest(overviewRoot, 'resources', 'resourceForecast')
    ? normalizeResources(overviewRoot)
    : nest(engineRoot, 'resources', 'resourceForecast')
      ? normalizeResources(engineRoot)
      : resources;

  return {
    overallStatus,
    insufficient: isForecastInsufficient(overallStatus, quality),
    methodology,
    dataQuality: quality,
    cost: costSlice,
    schedule: scheduleSlice,
    progress: progressSlice,
    resources: resourceSlice,
    charts: normalizeCharts(chartRoot),
    alerts: alerts.length ? alerts : normalizeAlerts(overviewRoot),
  };
}

class ForecastService {
  async getProjectDashboard(projectId: string): Promise<ProjectDashboardData> {
    return projectService.getProjectDashboard(projectId);
  }

  async getProjectForecast(projectId: string): Promise<unknown> {
    try {
      const response = await apiService.get<unknown>(`/forecast/projects/${projectId}`);
      return unwrapData(response.data);
    } catch (error) {
      fail(error, 'Failed to fetch project forecast');
    }
  }

  async getCostForecast(projectId: string): Promise<unknown> {
    try {
      const response = await apiService.get<unknown>(`/forecast/projects/${projectId}/cost`);
      return unwrapData(response.data);
    } catch (error) {
      fail(error, 'Failed to fetch cost forecast');
    }
  }

  async getScheduleForecast(projectId: string): Promise<unknown> {
    try {
      const response = await apiService.get<unknown>(
        `/forecast/projects/${projectId}/schedule`
      );
      return unwrapData(response.data);
    } catch (error) {
      fail(error, 'Failed to fetch schedule forecast');
    }
  }

  async getProgressForecast(projectId: string): Promise<unknown> {
    try {
      const response = await apiService.get<unknown>(
        `/forecast/projects/${projectId}/progress`
      );
      return unwrapData(response.data);
    } catch (error) {
      fail(error, 'Failed to fetch progress forecast');
    }
  }

  async getResourceForecast(projectId: string): Promise<unknown> {
    try {
      const response = await apiService.get<unknown>(
        `/forecast/projects/${projectId}/resources`
      );
      return unwrapData(response.data);
    } catch (error) {
      fail(error, 'Failed to fetch resource forecast');
    }
  }

  async getForecastAlerts(projectId: string): Promise<ForecastAlert[]> {
    try {
      const response = await apiService.get<unknown>(
        `/forecast/projects/${projectId}/alerts`
      );
      return normalizeAlerts(unwrapData(response.data));
    } catch (error) {
      fail(error, 'Failed to fetch forecast alerts');
    }
  }

  async getForecastHistory(projectId: string): Promise<ForecastHistorySnapshot[]> {
    try {
      const response = await apiService.get<unknown>(
        `/forecast/projects/${projectId}/history`
      );
      return normalizeSnapshots(unwrapData(response.data));
    } catch (error) {
      fail(error, 'Failed to fetch forecast history');
    }
  }

  async generateForecastSnapshot(projectId: string): Promise<unknown> {
    try {
      const response = await apiService.post<unknown>(
        `/forecast/projects/${projectId}/generate`
      );
      return unwrapData(response.data);
    } catch (error) {
      fail(error, 'Failed to generate forecast snapshot');
    }
  }

  async runForecastScenario(
    projectId: string,
    payload: ForecastScenarioPayload
  ): Promise<unknown> {
    try {
      const response = await apiService.post<unknown>(
        `/forecast/projects/${projectId}/scenarios`,
        payload
      );
      return unwrapData(response.data);
    } catch (error) {
      fail(error, 'Failed to run forecast scenario');
    }
  }

  async getAtRiskForecasts(): Promise<AtRiskForecastItem[]> {
    try {
      const response = await apiService.get<unknown>('/forecast/at-risk');
      return normalizeAtRisk(unwrapData(response.data));
    } catch (error) {
      fail(error, 'Failed to fetch at-risk forecasts');
    }
  }
}

export const forecastService = new ForecastService();

export const getProjectDashboard = (projectId: string) =>
  forecastService.getProjectDashboard(projectId);
export const getProjectForecast = (projectId: string) =>
  forecastService.getProjectForecast(projectId);
export const getCostForecast = (projectId: string) =>
  forecastService.getCostForecast(projectId);
export const getScheduleForecast = (projectId: string) =>
  forecastService.getScheduleForecast(projectId);
export const getProgressForecast = (projectId: string) =>
  forecastService.getProgressForecast(projectId);
export const getResourceForecast = (projectId: string) =>
  forecastService.getResourceForecast(projectId);
export const getForecastAlerts = (projectId: string) =>
  forecastService.getForecastAlerts(projectId);
export const getForecastHistory = (projectId: string) =>
  forecastService.getForecastHistory(projectId);
export const generateForecastSnapshot = (projectId: string) =>
  forecastService.generateForecastSnapshot(projectId);
export const runForecastScenario = (
  projectId: string,
  payload: ForecastScenarioPayload
) => forecastService.runForecastScenario(projectId, payload);
export const getAtRiskForecasts = () => forecastService.getAtRiskForecasts();
