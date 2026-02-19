import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Users, TrendingUp, TrendingDown, DollarSign, Receipt, GraduationCap, ShoppingBag, Wallet, Building2, Zap, Droplets, Landmark, MoreHorizontal, Eye, Calendar, CreditCard, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type DetailsModalType = "courses" | "enrollments" | "revenue" | "expenses" | "services" | "profit" | null;

export default function Home() {
  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [activeModal, setActiveModal] = useState<DetailsModalType>(null);

  const { data: dashboard, isLoading: dashboardLoading } = trpc.reports.dashboard.useQuery();
  const { data: instructorStats } = trpc.instructors.stats.useQuery();
  const { data: servicesStats } = trpc.services.getStatistics.useQuery();
  const { data: monthlyServices } = trpc.services.getMonthlyReport.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });
  const { data: monthlyReport, isLoading: monthlyLoading } = trpc.reports.monthly.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });
  const { data: operationalExpenses, isLoading: operationalLoading } = trpc.operationalExpenses.getMonthly.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  // Details queries - only fetch when modal is open
  const { data: coursesDetails, isLoading: coursesDetailsLoading } = trpc.reports.monthlyCoursesDetails.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: activeModal === "courses" }
  );

  const { data: enrollmentsDetails, isLoading: enrollmentsDetailsLoading } = trpc.reports.monthlyEnrollmentsDetails.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: activeModal === "enrollments" }
  );

  const { data: expensesDetails, isLoading: expensesDetailsLoading } = trpc.reports.monthlyExpensesDetails.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: activeModal === "expenses" || activeModal === "profit" }
  );

  const { data: servicesDetails, isLoading: servicesDetailsLoading } = trpc.reports.monthlyServicesDetails.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: activeModal === "services" || activeModal === "revenue" || activeModal === "profit" }
  );

  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [currentDate]);

  const expenseCategoryLabels: Record<string, string> = {
    certificates: "الشهادات",
    instructor: "المدرب",
    marketing: "التسويق",
    tax: "الضريبة",
    other: "أخرى",
  };

  const operationalCategoryLabels: Record<string, string> = {
    salaries: "الرواتب والأجور",
    electricity: "الكهرباء",
    water: "المياه",
    rent: "الإيجار",
    government: "المصروفات الحكومية",
    other: "أخرى",
  };

  const operationalCategoryIcons: Record<string, React.ReactNode> = {
    salaries: <Wallet className="h-4 w-4" />,
    electricity: <Zap className="h-4 w-4" />,
    water: <Droplets className="h-4 w-4" />,
    rent: <Building2 className="h-4 w-4" />,
    government: <Landmark className="h-4 w-4" />,
    other: <MoreHorizontal className="h-4 w-4" />,
  };

  // Calculate monthly totals
  const monthlyTotalRevenue = useMemo(() => {
    return (monthlyReport?.totalRevenue || 0) + (monthlyServices?.totalRevenue || 0);
  }, [monthlyReport, monthlyServices]);

  const monthlyTotalExpenses = useMemo(() => {
    return (monthlyReport?.totalExpenses || 0) + (operationalExpenses?.total || 0);
  }, [monthlyReport, operationalExpenses]);

  const monthlyNetProfit = useMemo(() => {
    return monthlyTotalRevenue - monthlyTotalExpenses;
  }, [monthlyTotalRevenue, monthlyTotalExpenses]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">نشطة</Badge>;
      case "completed":
        return <Badge variant="secondary">مكتملة</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border"></div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              لوحة التحكم
            </h1>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          <p className="text-muted-foreground text-center">
            نظرة عامة على أداء الدورات التدريبية
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الدورات</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{dashboard?.totalCourses || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المتدربين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{dashboard?.totalTrainees || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(dashboard?.totalRevenue || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">صافي الأرباح</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className={`text-3xl font-bold ${(dashboard?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(dashboard?.netProfit || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المدربين</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{instructorStats?.totalInstructors || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إيرادات الخدمات</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(servicesStats?.totalRevenue || 0)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Report Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-px bg-border"></div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
                التقرير الشهري
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {arabicMonths.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Active Courses Card - Clickable */}
            <Card 
              className="border-border/50 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              onClick={() => setActiveModal("courses")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">الدورات النشطة</CardTitle>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{monthlyReport?.activeCourses || 0}</div>
                )}
                <p className="text-xs text-primary mt-1">انقر لعرض التفاصيل</p>
              </CardContent>
            </Card>

            {/* Enrollments Card - Clickable */}
            <Card 
              className="border-border/50 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              onClick={() => setActiveModal("enrollments")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">المسجلين</CardTitle>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{monthlyReport?.totalEnrollments || 0}</div>
                )}
                <p className="text-xs text-primary mt-1">انقر لعرض التفاصيل</p>
              </CardContent>
            </Card>

            {/* Revenue Card - Clickable */}
            <Card 
              className="border-border/50 cursor-pointer hover:shadow-md hover:border-green-500/50 transition-all"
              onClick={() => setActiveModal("revenue")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">الإيرادات</CardTitle>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-green-600" />
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(monthlyTotalRevenue)}
                  </div>
                )}
                <p className="text-xs text-green-600 mt-1">انقر لعرض التفاصيل</p>
              </CardContent>
            </Card>

            {/* Expenses Card - Clickable */}
            <Card 
              className="border-border/50 cursor-pointer hover:shadow-md hover:border-destructive/50 transition-all"
              onClick={() => setActiveModal("expenses")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">المصروفات</CardTitle>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-destructive" />
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                {monthlyLoading || operationalLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-3xl font-bold text-destructive">
                    {formatCurrency(monthlyTotalExpenses)}
                  </div>
                )}
                <p className="text-xs text-destructive mt-1">انقر لعرض التفاصيل</p>
              </CardContent>
            </Card>

            {/* Net Profit Card - Clickable */}
            <Card 
              className="border-border/50 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              onClick={() => setActiveModal("profit")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">صافي الربح</CardTitle>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-primary" />
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {monthlyLoading || operationalLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className={`text-3xl font-bold ${monthlyNetProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(monthlyNetProfit)}
                  </div>
                )}
                <p className="text-xs text-primary mt-1">انقر لعرض التفاصيل</p>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout for Expenses */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Course Expenses Breakdown */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">مصروفات الدورات - {arabicMonths[selectedMonth - 1]} {selectedYear}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(expenseCategoryLabels).map(([key, label]) => {
                      const amount = monthlyReport?.expensesByCategory?.[key] || 0;
                      const totalExpenses = monthlyReport?.totalExpenses || 1;
                      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                      
                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <TrendingDown className="h-4 w-4 text-destructive" />
                            <span className="font-medium">{label}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-destructive/60 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-bold text-destructive min-w-[100px] text-left">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-4">
                      <span className="font-bold">إجمالي مصروفات الدورات</span>
                      <span className="font-bold text-destructive text-lg">
                        {formatCurrency(monthlyReport?.totalExpenses || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operational Expenses Breakdown */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">المصروفات التشغيلية - {arabicMonths[selectedMonth - 1]} {selectedYear}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {operationalLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(operationalCategoryLabels).map(([key, label]) => {
                      const amount = operationalExpenses?.byCategory?.[key] || 0;
                      const totalOperational = operationalExpenses?.total || 1;
                      const percentage = totalOperational > 0 ? (amount / totalOperational) * 100 : 0;
                      
                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="text-orange-600">{operationalCategoryIcons[key]}</span>
                            <span className="font-medium">{label}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-500/60 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-bold text-orange-600 min-w-[100px] text-left">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-100 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 mt-4">
                      <span className="font-bold">إجمالي المصروفات التشغيلية</span>
                      <span className="font-bold text-orange-600 text-lg">
                        {formatCurrency(operationalExpenses?.total || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Courses Details Modal */}
      <Dialog open={activeModal === "courses"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5" />
              الدورات النشطة - {arabicMonths[selectedMonth - 1]} {selectedYear}
            </DialogTitle>
          </DialogHeader>
          {coursesDetailsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : coursesDetails && coursesDetails.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">اسم الدورة</TableHead>
                  <TableHead className="text-right">المدرب</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">تاريخ النهاية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesDetails.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono text-sm">{course.code || '-'}</TableCell>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.instructorName}</TableCell>
                    <TableCell>{course.startDate ? new Date(course.startDate).toLocaleDateString('ar-SA') : '-'}</TableCell>
                    <TableCell>{course.endDate ? new Date(course.endDate).toLocaleDateString('ar-SA') : '-'}</TableCell>
                    <TableCell>{getStatusBadge(course.status || 'active')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد دورات نشطة في هذا الشهر</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enrollments Details Modal */}
      <Dialog open={activeModal === "enrollments"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5" />
              تفاصيل المسجلين - {arabicMonths[selectedMonth - 1]} {selectedYear}
            </DialogTitle>
          </DialogHeader>
          {enrollmentsDetailsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : enrollmentsDetails && enrollmentsDetails.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الدورة</TableHead>
                    <TableHead className="text-right">عدد المتدربين</TableHead>
                    <TableHead className="text-right">المبلغ المدفوع</TableHead>
                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentsDetails.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.courseName}
                        {enrollment.courseCode && (
                          <span className="text-xs text-muted-foreground block">{enrollment.courseCode}</span>
                        )}
                      </TableCell>
                      <TableCell>{enrollment.traineeCount}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(Number(enrollment.paidAmount) || 0)}
                      </TableCell>
                      <TableCell>
                        {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString('ar-SA') : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {enrollment.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <span className="font-bold">إجمالي المسجلين</span>
                <span className="font-bold text-xl">
                  {enrollmentsDetails.reduce((sum, e) => sum + (e.traineeCount || 0), 0)} متدرب
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تسجيلات في هذا الشهر</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revenue Details Modal */}
      <Dialog open={activeModal === "revenue"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-5 w-5 text-green-600" />
              تفاصيل الإيرادات - {arabicMonths[selectedMonth - 1]} {selectedYear}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Courses Revenue */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                إيرادات الدورات
              </h3>
              {enrollmentsDetailsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : enrollmentsDetails && enrollmentsDetails.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الدورة</TableHead>
                      <TableHead className="text-right">عدد المتدربين</TableHead>
                      <TableHead className="text-right">الإيراد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollmentsDetails.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.courseName}</TableCell>
                        <TableCell>{enrollment.traineeCount}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(Number(enrollment.paidAmount) || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد إيرادات من الدورات</p>
              )}
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg flex items-center justify-between">
                <span className="font-medium">إجمالي إيرادات الدورات</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(monthlyReport?.totalRevenue || 0)}
                </span>
              </div>
            </div>

            {/* Services Revenue */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                إيرادات الخدمات
              </h3>
              {servicesDetailsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : servicesDetails && servicesDetails.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الخدمة</TableHead>
                      <TableHead className="text-right">السعر</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicesDetails.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{formatCurrency(Number(service.price) || 0)}</TableCell>
                        <TableCell>{service.quantity}</TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          {formatCurrency(Number(service.totalAmount) || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد إيرادات من الخدمات</p>
              )}
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-between">
                <span className="font-medium">إجمالي إيرادات الخدمات</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(monthlyServices?.totalRevenue || 0)}
                </span>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="p-4 bg-green-100 dark:bg-green-950/50 rounded-lg flex items-center justify-between border border-green-200 dark:border-green-900">
              <span className="font-bold text-lg">إجمالي الإيرادات</span>
              <span className="font-bold text-2xl text-green-600">
                {formatCurrency(monthlyTotalRevenue)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expenses Details Modal */}
      <Dialog open={activeModal === "expenses"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <TrendingDown className="h-5 w-5 text-destructive" />
              تفاصيل المصروفات - {arabicMonths[selectedMonth - 1]} {selectedYear}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Course Expenses */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                مصروفات الدورات
              </h3>
              {expensesDetailsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : expensesDetails && expensesDetails.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الدورة</TableHead>
                      <TableHead className="text-right">الفئة</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesDetails.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.courseName || '-'}</TableCell>
                        <TableCell>{expenseCategoryLabels[expense.category || ''] || expense.category}</TableCell>
                        <TableCell className="text-destructive font-medium">
                          {formatCurrency(Number(expense.amount) || 0)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                          {expense.description || '-'}
                        </TableCell>
                        <TableCell>
                          {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('ar-SA') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد مصروفات للدورات</p>
              )}
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center justify-between">
                <span className="font-medium">إجمالي مصروفات الدورات</span>
                <span className="font-bold text-destructive">
                  {formatCurrency(monthlyReport?.totalExpenses || 0)}
                </span>
              </div>
            </div>

            {/* Operational Expenses */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                المصروفات التشغيلية
              </h3>
              <div className="space-y-2">
                {Object.entries(operationalCategoryLabels).map(([key, label]) => {
                  const amount = operationalExpenses?.byCategory?.[key] || 0;
                  if (amount === 0) return null;
                  return (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600">{operationalCategoryIcons[key]}</span>
                        <span>{label}</span>
                      </div>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-between">
                <span className="font-medium">إجمالي المصروفات التشغيلية</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(operationalExpenses?.total || 0)}
                </span>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="p-4 bg-red-100 dark:bg-red-950/50 rounded-lg flex items-center justify-between border border-red-200 dark:border-red-900">
              <span className="font-bold text-lg">إجمالي المصروفات</span>
              <span className="font-bold text-2xl text-destructive">
                {formatCurrency(monthlyTotalExpenses)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Net Profit Details Modal */}
      <Dialog open={activeModal === "profit"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-5 w-5 text-primary" />
              تفاصيل صافي الربح - {arabicMonths[selectedMonth - 1]} {selectedYear}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Revenue Summary */}
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                الإيرادات
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>إيرادات الدورات</span>
                  <span className="font-medium text-green-600">{formatCurrency(monthlyReport?.totalRevenue || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>إيرادات الخدمات</span>
                  <span className="font-medium text-blue-600">{formatCurrency(monthlyServices?.totalRevenue || 0)}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between font-bold">
                  <span>إجمالي الإيرادات</span>
                  <span className="text-green-600">{formatCurrency(monthlyTotalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Expenses Summary */}
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
                المصروفات
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>مصروفات الدورات</span>
                  <span className="font-medium text-destructive">{formatCurrency(monthlyReport?.totalExpenses || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>المصروفات التشغيلية</span>
                  <span className="font-medium text-orange-600">{formatCurrency(operationalExpenses?.total || 0)}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between font-bold">
                  <span>إجمالي المصروفات</span>
                  <span className="text-destructive">{formatCurrency(monthlyTotalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Profit Calculation */}
            <div className={`p-6 rounded-lg border-2 ${monthlyNetProfit >= 0 ? 'bg-green-100 dark:bg-green-950/50 border-green-300 dark:border-green-800' : 'bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-800'}`}>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">صافي الربح = إجمالي الإيرادات - إجمالي المصروفات</p>
                <p className="text-lg mb-4">
                  {formatCurrency(monthlyTotalRevenue)} - {formatCurrency(monthlyTotalExpenses)}
                </p>
                <div className={`text-4xl font-bold ${monthlyNetProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(monthlyNetProfit)}
                </div>
                {monthlyTotalRevenue > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    هامش الربح: {((monthlyNetProfit / monthlyTotalRevenue) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
