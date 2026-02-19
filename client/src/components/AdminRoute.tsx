import { ReactNode, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface AdminRouteProps {
  children: ReactNode;
}

// التحقق من أن المستخدم هو Admin (roleId = 1)
function isAdmin(user: any): boolean {
  return user?.roleId === 1;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    } else if (!loading && user && !isAdmin(user)) {
      // المستخدم ليس Admin - إعادة توجيه إلى الصفحة الرئيسية
      setLocation("/");
    }
  }, [loading, user, setLocation]);

  if (loading) {
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

  if (!isAdmin(user)) {
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
