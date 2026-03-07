import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { AccessLevel } from '../../lib/rbac';

interface CanProps {
  /** Required access level to render children. */
  access: AccessLevel;
  /** Rendered when user does NOT have access (optional, defaults to null). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative visibility wrapper.
 * Renders `children` only when the current user meets the required access level.
 *
 * @example
 * <Can access="MANAGER_AND_ABOVE">
 *   <Button onClick={openEditModal}>Edit Project</Button>
 * </Can>
 */
export function Can({ access, fallback = null, children }: CanProps) {
  const { can } = useAuth();
  return can(access) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Complement of `<Can>` — renders children when the user does NOT have the access level.
 * Useful for showing read-only notices.
 */
export function Cannot({ access, children }: Omit<CanProps, 'fallback'>) {
  const { can } = useAuth();
  return !can(access) ? <>{children}</> : null;
}
