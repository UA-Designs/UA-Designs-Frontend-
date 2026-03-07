import { useAuth } from '../contexts/AuthContext';
import type { AccessLevel } from '../lib/rbac';

/** Generic: does the current user meet this access level? */
export function useHasAccess(level: AccessLevel): boolean {
  const { can } = useAuth();
  return can(level);
}

/** Can the user create / modify project-level configuration? */
export function useCanManageProject(): boolean {
  return useHasAccess('MANAGER_AND_ABOVE');
}

/** Can the user input operational data (costs, resources, tasks, risks)? */
export function useCanWriteData(): boolean {
  return useHasAccess('ENGINEER_AND_ABOVE');
}

/** Can the user perform admin-only actions (user management, audit log)? */
export function useIsAdmin(): boolean {
  return useHasAccess('ADMIN_ONLY');
}
