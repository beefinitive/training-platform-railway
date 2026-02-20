import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Trophy, Target, CheckCheck, Trash2, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";

const targetTypeLabels: Record<string, string> = {
  targeted_customers: "العملاء المستهدفين",
  confirmed_customers: "العملاء المؤكدين",
  registered_customers: "العملاء المسجلين في النموذج",
  services_sold: "الخدمات المباعة",
  retargeting: "إعادة الاستهداف",
  daily_calls: "المكالمات اليومية",
  campaigns: "الحملات",
  leads_generated: "العملاء المحتملين",
  conversion_rate: "معدل التحويل",
  features_completed: "المهام المنجزة",
  bugs_fixed: "الأخطاء المصلحة",
  sales_amount: "مبلغ المبيعات",
  customer_satisfaction: "رضا العملاء",
  attendance_hours: "ساعات الحضور",
  contacted_old_customers: "العملاء القدامى المتواصل معهم",
  other: "أخرى",
};

const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function TargetAlerts() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const queryInput = useMemo(() => {
    const input: any = {
      month: selectedMonth,
      year: selectedYear,
    };
    if (filterType !== "all") {
      input.alertType = filterType;
    }
    if (filterRead !== "all") {
      input.isRead = filterRead === "read";
    }
    return input;
  }, [selectedMonth, selectedYear, filterType, filterRead]);

  const { data: alerts, isLoading, refetch } = trpc.targetAlerts.list.useQuery(queryInput);
  const { data: unreadCount } = trpc.targetAlerts.unreadCount.useQuery({});

  const markAsReadMutation = trpc.targetAlerts.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم تحديث التنبيه");
    },
  });

  const markAllAsReadMutation = trpc.targetAlerts.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم تحديث جميع التنبيهات");
    },
  });

  const deleteMutation = trpc.targetAlerts.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم حذف التنبيه");
    },
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              تنبيهات المستهدفات
            </h1>
            <p className="text-muted-foreground mt-1">
              تنبيهات تلقائية عند وصول الموظفين لـ 80% أو 100% من مستهدفاتهم
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(unreadCount ?? 0) > 0 && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                {unreadCount} غير مقروء
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate({})}
              disabled={!unreadCount || unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 ml-1" />
              تحديد الكل كمقروء
            </Button>
          </div>
        </div>

        {/* الفلاتر */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="reached_80">وصل 80% 🎯</SelectItem>
                    <SelectItem value="reached_100">وصل 100% 🏆</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="unread">غير مقروء</SelectItem>
                    <SelectItem value="read">مقروء</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إحصائيات سريعة */}
        {alerts && alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">
                    {alerts.filter(a => a.alertType === "reached_80").length}
                  </p>
                  <p className="text-xs text-amber-600">وصلوا 80%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {alerts.filter(a => a.alertType === "reached_100").length}
                  </p>
                  <p className="text-xs text-green-600">حققوا 100%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {alerts.length}
                  </p>
                  <p className="text-xs text-blue-600">إجمالي التنبيهات</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* قائمة التنبيهات */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <BellOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">لا توجد تنبيهات</h3>
              <p className="text-muted-foreground text-sm">
                لم يتم إنشاء أي تنبيهات لـ {monthNames[selectedMonth - 1]} {selectedYear} بعد.
                <br />
                سيتم إنشاء التنبيهات تلقائياً عند وصول الموظفين لـ 80% أو 100% من مستهدفاتهم.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`transition-all ${
                  !alert.isRead
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : "opacity-80"
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {/* أيقونة النوع */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      alert.alertType === "reached_100"
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-600"
                    }`}>
                      {alert.alertType === "reached_100" ? (
                        <Trophy className="h-6 w-6" />
                      ) : (
                        <Target className="h-6 w-6" />
                      )}
                    </div>

                    {/* المحتوى */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {alert.employeeName || `موظف #${alert.employeeId}`}
                        </span>
                        <Badge
                          variant={alert.alertType === "reached_100" ? "default" : "secondary"}
                          className={`text-xs ${
                            alert.alertType === "reached_100"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-amber-500 hover:bg-amber-600 text-white"
                          }`}
                        >
                          {alert.alertType === "reached_100" ? "إنجاز 100%" : "تقدم 80%"}
                        </Badge>
                        {!alert.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {targetTypeLabels[alert.targetType] || alert.targetType}
                        </span>
                        <span>•</span>
                        <span>
                          {alert.achievedValue} / {alert.targetValue}
                        </span>
                        <span>•</span>
                        <span>{formatDate(alert.createdAt)}</span>
                      </div>
                    </div>

                    {/* الإجراءات */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markAsReadMutation.mutate({ alertId: alert.id })}
                          title="تحديد كمقروء"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ alertId: alert.id })}
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
