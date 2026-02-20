import { ReactNode, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionRouteProps {
  children: ReactNode;
  permission: string;
}

// مسار محمي بالصلاحيات - يسمح للأدمن أو لمن لديه الصلاحية المطلوبة
export function PermissionRoute({ children, permission }: PermissionRouteProps) {
  const { user, loading } = useAuth();
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const [, setLocation] = useLocation();

  const isAdmin = user?.roleId === 1;
  const hasAccess = isAdmin || hasPermission(permission);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-destructive mb-4">غير مصرح</h1>
          <p className="text-muted-foreground mb-4">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <button 
            onClick={() => setLocation("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
