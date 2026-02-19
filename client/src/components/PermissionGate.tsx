import { usePermissions } from "@/hooks/usePermissions";
import { ReactNode } from "react";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render children based on user permissions.
 * 
 * Usage:
 * - Single permission: <PermissionGate permission="courses.create">...</PermissionGate>
 * - Multiple permissions (any): <PermissionGate permissions={["courses.create", "courses.edit"]}>...</PermissionGate>
 * - Multiple permissions (all): <PermissionGate permissions={["courses.create", "courses.edit"]} requireAll>...</PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  // While loading, don't show anything
  if (isLoading) {
    return null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * HOC to wrap a component with permission check
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  FallbackComponent?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGate 
        permission={permission} 
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}
