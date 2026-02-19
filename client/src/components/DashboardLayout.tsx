import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import { LayoutDashboard, LogOut, PanelRight, BookOpen, Receipt, Settings, Users, Archive, ShoppingBag, Wallet, Target, Handshake, Lightbulb, FileText, Shield, UserCog, FolderKanban, UserCheck, Clock, ClipboardList, Award, Banknote, Lock, Trash2, ClipboardCheck } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// Role IDs
const ROLE_ADMIN = 1;
const ROLE_SUPERVISOR = 2;
const ROLE_USER = 3;
const ROLE_CUSTOMER_SERVICE = 4; // دور خدمة العملاء

// تعريف عناصر القائمة مع تحديد الأدوار المسموح لها
// allowedRoles: null = جميع المستخدمين (ماعدا خدمة العملاء)، array = الأدوار المحددة فقط
const allMenuItems = [
  // صفحات عامة لجميع المستخدمين (ماعدا خدمة العملاء)
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: BookOpen, label: "إدارة الدورات", path: "/courses", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: ShoppingBag, label: "الخدمات", path: "/services", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: FolderKanban, label: "المشاريع", path: "/projects", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: Wallet, label: "المصروفات التشغيلية", path: "/operational-expenses", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: Target, label: "المستهدفات", path: "/strategic-targets", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: Handshake, label: "الشراكات", path: "/partnerships", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: Lightbulb, label: "الأفكار النوعية", path: "/innovative-ideas", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: Receipt, label: "التقارير", path: "/reports", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  { icon: Archive, label: "الأرشيف", path: "/archive", allowedRoles: [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER] },
  
  // صفحة مستهدفاتي - لخدمة العملاء فقط
  { icon: Target, label: "مستهدفاتي", path: "/my-targets", allowedRoles: [ROLE_CUSTOMER_SERVICE] },
  
  // صفحات إدارية - للـ Admin فقط
  { icon: Settings, label: "الإعدادات", path: "/settings", allowedRoles: [ROLE_ADMIN] },
  { icon: UserCheck, label: "إدارة الموظفين", path: "/employee-management", allowedRoles: [ROLE_ADMIN] },
  { icon: Clock, label: "الحضور والانصراف", path: "/attendance", allowedRoles: [ROLE_ADMIN] },
  { icon: ClipboardList, label: "تقارير الإنجاز", path: "/daily-reports", allowedRoles: [ROLE_ADMIN] },
  { icon: ClipboardCheck, label: "مراجعة الإحصائيات", path: "/daily-stats-review", allowedRoles: [ROLE_ADMIN] },
  { icon: Lock, label: "إدارة كلمات المرور", path: "/password-management", allowedRoles: [ROLE_ADMIN] },
  { icon: Users, label: "إدارة المستخدمين", path: "/user-management", allowedRoles: [ROLE_ADMIN] },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

// التحقق من صلاحية الوصول للعنصر
function canAccessMenuItem(user: any, allowedRoles: number[] | null): boolean {
  if (!user) return false;
  if (allowedRoles === null) return true; // متاح للجميع
  return allowedRoles.includes(user.roleId);
}

// التحقق من أن المستخدم هو Admin
function isAdmin(user: any): boolean {
  return user?.roleId === ROLE_ADMIN;
}

// التحقق من أن المستخدم هو خدمة عملاء
function isCustomerService(user: any): boolean {
  return user?.roleId === ROLE_CUSTOMER_SERVICE;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { settings } = usePlatformSettings();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.platformName}
                className="h-20 w-auto object-contain"
              />
            ) : (
              <div className="w-16 h-px bg-foreground/20"></div>
            )}
            <h1 className="text-4xl font-bold tracking-tight text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              {settings.platformName}
            </h1>
            <div className="w-16 h-px bg-foreground/20"></div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              يرجى تسجيل الدخول للوصول إلى لوحة التحكم
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { settings } = usePlatformSettings();
  
  // الحصول على بيانات الموظف المرتبط بالمستخدم (لعرض الصورة)
  const { data: employeeData } = trpc.employees.getByUserId.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  // فلترة عناصر القائمة بناءً على صلاحيات المستخدم
  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => canAccessMenuItem(user, item.allowedRoles));
  }, [user]);

  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarRight = sidebarRef.current?.getBoundingClientRect().right ?? 0;
      const newWidth = sidebarRight - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-l-0 border-r"
          side="right"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="تبديل القائمة"
              >
                <PanelRight className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  {settings.logoUrl ? (
                    <img 
                      src={settings.logoUrl} 
                      alt={settings.platformName}
                      className="h-8 w-auto object-contain"
                    />
                  ) : null}
                  <span className="font-semibold tracking-tight truncate" style={{ fontFamily: 'var(--font-serif)' }}>
                    {settings.platformName}
                  </span>
                </div>
              ) : settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.platformName}
                  className="h-6 w-auto object-contain"
                />
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-right group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    {employeeData?.profileImage && (
                      <AvatarImage src={employeeData.profileImage} alt={user?.name || ''} />
                    )}
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                {settings.logoUrl && (
                  <img 
                    src={settings.logoUrl} 
                    alt={settings.platformName}
                    className="h-6 w-auto object-contain"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "القائمة"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
