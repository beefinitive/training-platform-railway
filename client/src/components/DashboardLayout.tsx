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
import { LayoutDashboard, LogOut, PanelRight, BookOpen, Receipt, Settings, Users, Archive, ShoppingBag, Wallet, Target, Handshake, Lightbulb, FileText, Shield, UserCog, FolderKanban, UserCheck, Clock, ClipboardList, Award, Banknote, Lock, Trash2, ClipboardCheck, BarChart3, Globe, ExternalLink, PlayCircle, TrendingUp, Bell } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

// Role IDs
const ROLE_ADMIN = 1;
const ROLE_SUPERVISOR = 2;
const ROLE_USER = 3;
const ROLE_CUSTOMER_SERVICE = 4; // دور خدمة العملاء

// تعريف مجموعات القائمة مع الصلاحيات
type MenuItem = {
  icon: any;
  label: string;
  path: string;
  requiredPermission?: string;
  customerServiceOnly?: boolean;
  adminOnly?: boolean;
  isSubItem?: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "الرئيسية",
    items: [
      { icon: LayoutDashboard, label: "لوحة التحكم", path: "/", requiredPermission: PERMISSIONS.DASHBOARD_VIEW },
    ],
  },
  {
    title: "إدارة الأعمال",
    items: [
      { icon: BookOpen, label: "إدارة الدورات", path: "/courses", requiredPermission: PERMISSIONS.COURSES_VIEW },
      { icon: ShoppingBag, label: "الخدمات", path: "/services", requiredPermission: PERMISSIONS.SERVICES_VIEW },
      { icon: FolderKanban, label: "المشاريع", path: "/projects", requiredPermission: PERMISSIONS.COURSES_VIEW },
      { icon: PlayCircle, label: "الدورات المسجلة", path: "/recorded-courses", requiredPermission: PERMISSIONS.COURSES_VIEW },
      { icon: Wallet, label: "المصروفات التشغيلية", path: "/operational-expenses", requiredPermission: PERMISSIONS.EXPENSES_VIEW },
    ],
  },
  {
    title: "التخطيط والتطوير",
    items: [
      { icon: Target, label: "المستهدفات", path: "/strategic-targets", requiredPermission: PERMISSIONS.TARGETS_VIEW },
      { icon: Handshake, label: "الشراكات", path: "/partnerships", requiredPermission: PERMISSIONS.PARTNERSHIPS_VIEW },
      { icon: Lightbulb, label: "الأفكار النوعية", path: "/innovative-ideas", requiredPermission: PERMISSIONS.IDEAS_VIEW },
    ],
  },
  {
    title: "التقارير والأرشيف",
    items: [
      { icon: Receipt, label: "التقارير", path: "/reports", requiredPermission: PERMISSIONS.REPORTS_VIEW },
      { icon: Archive, label: "الأرشيف", path: "/archive", requiredPermission: PERMISSIONS.ARCHIVE_VIEW },
    ],
  },
  {
    title: "حسابي",
    items: [
      { icon: Award, label: "شهاداتي", path: "/my-certificates" },
      { icon: Banknote, label: "مدفوعاتي", path: "/my-payments" },
      { icon: TrendingUp, label: "لوحة المدرب", path: "/instructor-dashboard" },
    ],
  },
  {
    title: "خدمة العملاء",
    items: [
      { icon: Target, label: "مستهدفاتي", path: "/my-targets", customerServiceOnly: true },
    ],
  },
  {
    title: "إدارة الموظفين",
    items: [
      { icon: UserCheck, label: "إدارة الموظفين", path: "/employee-management", requiredPermission: PERMISSIONS.EMPLOYEES_VIEW },
      { icon: Clock, label: "الحضور والانصراف", path: "/attendance", requiredPermission: PERMISSIONS.EMPLOYEES_VIEW },
      { icon: ClipboardList, label: "تقارير الإنجاز", path: "/daily-reports", requiredPermission: PERMISSIONS.EMPLOYEES_VIEW },
      { icon: ClipboardCheck, label: "مراجعة الإحصائيات", path: "/daily-stats-review", requiredPermission: PERMISSIONS.EMPLOYEE_STATS_REVIEW, isSubItem: true },
      { icon: Award, label: "مستهدفات الموظفين", path: "/employee-targets", requiredPermission: PERMISSIONS.EMPLOYEE_TARGETS_VIEW, isSubItem: true },
      { icon: BarChart3, label: "تقارير الإحصائيات المعتمدة", path: "/approved-stats-report", requiredPermission: PERMISSIONS.EMPLOYEE_PERFORMANCE_VIEW, isSubItem: true },
      { icon: Bell, label: "تنبيهات المستهدفات", path: "/target-alerts", requiredPermission: PERMISSIONS.EMPLOYEE_TARGETS_VIEW, isSubItem: true },
    ],
  },
  {
    title: "النظام",
    items: [
      { icon: Settings, label: "الإعدادات", path: "/settings", requiredPermission: PERMISSIONS.SETTINGS_VIEW },
      { icon: Lock, label: "إدارة كلمات المرور", path: "/password-management", requiredPermission: PERMISSIONS.USERS_PERMISSIONS },
      { icon: Users, label: "إدارة المستخدمين", path: "/user-management", requiredPermission: PERMISSIONS.USERS_VIEW },
    ],
  },
];

// التحقق من أن المستخدم هو خدمة عملاء
function isCustomerService(user: any): boolean {
  return user?.roleId === ROLE_CUSTOMER_SERVICE;
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

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
  
  // الحصول على صلاحيات المستخدم
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  // الحصول على بيانات الموظف المرتبط بالمستخدم (لعرض الصورة)
  const { data: employeeData } = trpc.employees.getByUserId.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  // عدد التنبيهات غير المقروءة
  const { data: unreadAlertCount } = trpc.targetAlerts.unreadCount.useQuery(
    {},
    { refetchInterval: 60000 } // تحديث كل دقيقة
  );

  // فلترة مجموعات القائمة بناءً على صلاحيات المستخدم
  const filteredGroups = useMemo(() => {
    if (!user) return [];
    
    const isAdmin = user.roleId === ROLE_ADMIN;
    
    return menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          // إذا كان العنصر خاص بخدمة العملاء فقط
          if (item.customerServiceOnly) {
            return isCustomerService(user);
          }
          
          // إذا كان المستخدم خدمة عملاء، لا يرى الصفحات الأخرى
          if (isCustomerService(user)) {
            return false;
          }
          
          // المدير يرى كل شيء
          if (isAdmin) {
            return true;
          }
          
          // المستخدم العادي يحتاج صلاحية محددة
          if (item.requiredPermission) {
            return hasPermission(item.requiredPermission);
          }
          
          return false;
        }),
      }))
      .filter(group => group.items.length > 0);
  }, [user, hasPermission]);

  // قائمة مسطحة لتحديد العنصر النشط
  const allFilteredItems = useMemo(() => {
    return filteredGroups.flatMap(g => g.items);
  }, [filteredGroups]);

  const activeMenuItem = allFilteredItems.find(item => item.path === location);

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

          <SidebarContent className="gap-0 overflow-y-auto">
            {filteredGroups.map((group, groupIndex) => (
              <div key={group.title}>
                {/* فاصل بين المجموعات */}
                {groupIndex > 0 && (
                  <div className="mx-3 my-1.5 border-t border-border/50" />
                )}
                {/* عنوان المجموعة - يظهر فقط عند فتح القائمة */}
                {!isCollapsed && (
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {group.title}
                    </span>
                  </div>
                )}
                <SidebarMenu className="px-2 py-0.5">
                  {group.items.map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-9 transition-all font-normal ${item.isSubItem ? 'mr-4 text-sm' : ''}`}
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""} ${item.isSubItem ? 'h-3.5 w-3.5' : ''}`}
                          />
                          <span className="truncate">{item.label}</span>
                          {item.path === '/target-alerts' && (unreadAlertCount ?? 0) > 0 && (
                            <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadAlertCount}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-2 space-y-1">
            {/* رابط الواجهة العامة - للأدمن فقط */}
            {user?.roleId === ROLE_ADMIN && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => window.open('/public', '_blank')}
                    tooltip="الواجهة العامة"
                    className="h-9 transition-all font-normal text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="truncate">الواجهة العامة</span>
                    <ExternalLink className="h-3 w-3 mr-auto opacity-50" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
            
            {/* معلومات المستخدم */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-accent/50 transition-colors w-full text-right group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border shrink-0">
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
                    <p className="text-xs text-muted-foreground truncate mt-1">
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
        <main className="flex-1 p-4 md:p-6">
          {/* عرض رسالة للمستخدم بدون صلاحيات */}
          {allFilteredItems.length === 0 && user?.roleId !== ROLE_ADMIN && !isCustomerService(user) ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Shield className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">لا توجد صلاحيات</h2>
              <p className="text-muted-foreground max-w-md mb-4">
                لم يتم تعيين أي صلاحيات لحسابك بعد. يرجى التواصل مع مدير النظام للحصول على الصلاحيات المطلوبة.
              </p>
              <p className="text-sm text-muted-foreground">
                البريد الإلكتروني: {user?.email}
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </SidebarInset>
    </>
  );
}
