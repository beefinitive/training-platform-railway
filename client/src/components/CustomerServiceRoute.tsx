import { ReactNode, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface CustomerServiceRouteProps {
  children: ReactNode;
}

const ROLE_CUSTOMER_SERVICE = 4;

/**
 * مكون يتحقق من صلاحية الوصول للصفحات العامة
 * إذا كان المستخدم من خدمة العملاء، يتم توجيهه إلى صفحة مستهدفاتي
 */
export function CustomerServiceRoute({ children }: CustomerServiceRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  useEffect(() => {
    // إذا كان المستخدم من خدمة العملاء، توجيهه إلى مستهدفاتي
    if (!loading && user && user.roleId === ROLE_CUSTOMER_SERVICE) {
      setLocation("/my-targets");
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

  // إذا كان المستخدم من خدمة العملاء، لا نعرض المحتوى (سيتم التوجيه)
  if (user.roleId === ROLE_CUSTOMER_SERVICE) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
