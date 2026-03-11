// ── Roles ─────────────────────────────────────────────────────────────────────
// Single source of truth — mirrors backend src/middleware/roles.js

export const ROLES = {
  ADMIN:           'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  ARCHITECT:       'ARCHITECT',
  ENGINEER:        'ENGINEER',
  STAFF:           'STAFF',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ── Access Levels ─────────────────────────────────────────────────────────────
export const ACCESS_LEVELS = {
  ADMIN_ONLY:         [ROLES.ADMIN],
  MANAGER_AND_ABOVE:  [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.ARCHITECT, ROLES.ENGINEER],
  ENGINEER_AND_ABOVE: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.ARCHITECT, ROLES.ENGINEER],
  /** Audit Log: all roles except Staff */
  ALL_EXCEPT_STAFF:  [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.ARCHITECT, ROLES.ENGINEER],
  ALL_ROLES:          Object.values(ROLES),
} as const;

export type AccessLevel = keyof typeof ACCESS_LEVELS;

// ── Core checker ──────────────────────────────────────────────────────────────
/** Returns true if `role` is included in the given access level. */
export function hasAccess(role: Role | string | undefined, level: AccessLevel): boolean {
  if (!role) return false;
  return (ACCESS_LEVELS[level] as readonly string[]).includes(role);
}

// ── Convenience checks ────────────────────────────────────────────────────────
export const isAdmin           = (r?: Role | string) => hasAccess(r, 'ADMIN_ONLY');
export const isManagerOrAbove  = (r?: Role | string) => hasAccess(r, 'MANAGER_AND_ABOVE');
export const isEngineerOrAbove = (r?: Role | string) => hasAccess(r, 'ENGINEER_AND_ABOVE');

// ── Tier display config ───────────────────────────────────────────────────────
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN:           'System Admin',
  PROJECT_MANAGER: 'Project Manager',
  ARCHITECT:       'Architect',
  ENGINEER:        'Engineer',
  STAFF:           'Staff',
};

export const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  ADMIN:           { bg: '#fee2e2', text: '#b91c1c' },
  PROJECT_MANAGER: { bg: '#dbeafe', text: '#1d4ed8' },
  ARCHITECT:       { bg: '#ede9fe', text: '#6d28d9' },
  ENGINEER:        { bg: '#dcfce7', text: '#15803d' },
  STAFF:           { bg: '#f3f4f6', text: '#4b5563' },
};
