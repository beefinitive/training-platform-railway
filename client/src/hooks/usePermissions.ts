import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export function usePermissions() {
  const { user } = useAuth();
  
  const { data: userPermissions, isLoading } = trpc.userPermissions.getUserPermissions.useQuery(
    { userId: user?.id || 0 },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: !!user?.id,
    }
  );

  const permissionSet = useMemo(() => {
    if (!userPermissions) return new Set<string>();
    return new Set(userPermissions.map(p => p.permission?.name).filter(Boolean));
  }, [userPermissions]);

  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false;
    return permissionSet.has(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (!userPermissions) return false;
    return perms.some(p => permissionSet.has(p));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    if (!userPermissions) return false;
    return perms.every(p => permissionSet.has(p));
  };

  const isAdmin = useMemo(() => {
    // Check if user is owner or has users.permissions
    return permissionSet.has('users.permissions') || (user as any)?.isOwner === true;
  }, [permissionSet, user])

  return {
    permissions: userPermissions || [],
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  };
}

// Permission constants for easy reference
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Courses
  COURSES_VIEW: 'courses.view',
  COURSES_CREATE: 'courses.create',
  COURSES_EDIT: 'courses.edit',
  COURSES_DELETE: 'courses.delete',
  
  // Templates
  TEMPLATES_VIEW: 'templates.view',
  TEMPLATES_CREATE: 'templates.create',
  TEMPLATES_EDIT: 'templates.edit',
  TEMPLATES_DELETE: 'templates.delete',
  
  // Instructors
  INSTRUCTORS_VIEW: 'instructors.view',
  INSTRUCTORS_CREATE: 'instructors.create',
  INSTRUCTORS_EDIT: 'instructors.edit',
  INSTRUCTORS_DELETE: 'instructors.delete',
  
  // Services
  SERVICES_VIEW: 'services.view',
  SERVICES_CREATE: 'services.create',
  SERVICES_EDIT: 'services.edit',
  SERVICES_DELETE: 'services.delete',
  
  // Expenses
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_EDIT: 'expenses.edit',
  EXPENSES_DELETE: 'expenses.delete',
  
  // Targets
  TARGETS_VIEW: 'targets.view',
  TARGETS_CREATE: 'targets.create',
  TARGETS_EDIT: 'targets.edit',
  TARGETS_DELETE: 'targets.delete',
  
  // Partnerships
  PARTNERSHIPS_VIEW: 'partnerships.view',
  PARTNERSHIPS_CREATE: 'partnerships.create',
  PARTNERSHIPS_EDIT: 'partnerships.edit',
  PARTNERSHIPS_DELETE: 'partnerships.delete',
  
  // Ideas
  IDEAS_VIEW: 'ideas.view',
  IDEAS_CREATE: 'ideas.create',
  IDEAS_EDIT: 'ideas.edit',
  IDEAS_DELETE: 'ideas.delete',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Archive
  ARCHIVE_VIEW: 'archive.view',
  ARCHIVE_RESTORE: 'archive.restore',
  ARCHIVE_DELETE: 'archive.delete',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_PERMISSIONS: 'users.permissions',
  
  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_EDIT: 'employees.edit',
  EMPLOYEES_DELETE: 'employees.delete',
} as const;
