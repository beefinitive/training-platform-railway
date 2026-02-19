import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Users, TrendingUp, TrendingDown, DollarSign, Receipt, Calendar, ShoppingBag, Wallet, Building2, Zap, Droplets, Landmark, MoreHorizontal, BarChart3, X } from "lucide-react";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

type DetailsModalType = "courses" | "enrollments" | "revenue" | "expenses" | "services" | null;

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const quarterLabels = ["الربع الأول", "الربع الثاني", "الربع الثالث", "الربع الرابع"];
const halfLabels = ["النصف الأول", "النصف الثاني"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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

type ReportType = "monthly" | "quarterly" | "semiAnnual" | "annual";

export default function Reports() {
  const { hasPermission } = usePermissions();
  const currentDate = useMemo(() => new Date(), []);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((currentDate.getMonth() + 1) / 3));
  const [selectedHalf, setSelectedHalf] = useState(currentDate.getMonth() < 6 ? 1 : 2);

  // Monthly report query
  const { data: monthlyReport, isLoading: monthlyLoading } = trpc.reports.monthly.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: reportType === "monthly" }
  );

  const { data: monthlyServices } = trpc.services.getMonthlyReport.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: reportType === "monthly" }
  );

  const { data: monthlyOperational, isLoading: monthlyOperationalLoading } = trpc.operationalExpenses.getMonthly.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: reportType === "monthly" }
  );

  // Quarterly report query
  const { data: quarterlyReport, isLoading: quarterlyLoading } = trpc.reports.quarterly.useQuery(
    { year: selectedYear, quarter: selectedQuarter },
    { enabled: reportType === "quarterly" }
  );

  // Semi-annual report query
  const { data: semiAnnualReport, isLoading: semiAnnualLoading } = trpc.reports.semiAnnual.useQuery(
    { year: selectedYear, half: selectedHalf },
    { enabled: reportType === "semiAnnual" }
  );

  // Annual report query
  const { data: annualReport, isLoading: annualLoading } = trpc.reports.annual.useQuery(
    { year: selectedYear },
    { enabled: reportType === "annual" }
  );

  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [currentDate]);

  // Get current report data based on type
  const currentReport = useMemo(() => {
    switch (reportType) {
      case "monthly":
        const totalRevenue = (monthlyReport?.totalRevenue || 0) + (monthlyServices?.totalRevenue || 0);
        const totalExpenses = (monthlyReport?.totalExpenses || 0) + (monthlyOperational?.total || 0);
        return {
          activeCourses: monthlyReport?.activeCourses || 0,
          totalEnrollments: monthlyReport?.totalEnrollments || 0,
          coursesRevenue: monthlyReport?.totalRevenue || 0,
          servicesRevenue: monthlyServices?.totalRevenue || 0,
          servicesCount: monthlyServices?.count || 0,
          totalRevenue,
          courseExpenses: monthlyReport?.totalExpenses || 0,
          expensesByCategory: monthlyReport?.expensesByCategory || {},
          operationalExpenses: monthlyOperational?.total || 0,
          operationalByCategory: monthlyOperational?.byCategory || {},
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
          monthlyData: null,
        };
      case "quarterly":
        return quarterlyReport || null;
      case "semiAnnual":
        return semiAnnualReport || null;
      case "annual":
        return annualReport || null;
      default:
        return null;
    }
  }, [reportType, monthlyReport, monthlyServices, monthlyOperational, quarterlyReport, semiAnnualReport, annualReport]);

  const isLoading = useMemo(() => {
    switch (reportType) {
      case "monthly":
        return monthlyLoading || monthlyOperationalLoading;
      case "quarterly":
        return quarterlyLoading;
      case "semiAnnual":
        return semiAnnualLoading;
      case "annual":
        return annualLoading;
      default:
        return false;
    }
  }, [reportType, monthlyLoading, monthlyOperationalLoading, quarterlyLoading, semiAnnualLoading, annualLoading]);

  const reportTitle = useMemo(() => {
    switch (reportType) {
      case "monthly":
        return `تقرير شهر ${arabicMonths[selectedMonth - 1]} ${selectedYear}`;
      case "quarterly":
        return `تقرير ${quarterLabels[selectedQuarter - 1]} ${selectedYear}`;
      case "semiAnnual":
        return `تقرير ${halfLabels[selectedHalf - 1]} ${selectedYear}`;
      case "annual":
        return `التقرير السنوي ${selectedYear}`;
      default:
        return "";
    }
  }, [reportType, selectedYear, selectedMonth, selectedQuarter, selectedHalf]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border"></div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              التقارير المالية
            </h1>
            <div className="h-px flex-1 bg-border"></div>
          </div>
        </div>

        {/* Report Type Tabs */}
        <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monthly">شهري</TabsTrigger>
            <TabsTrigger value="quarterly">ربعي</TabsTrigger>
            <TabsTrigger value="semiAnnual">نصفي</TabsTrigger>
            <TabsTrigger value="annual">سنوي</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period Selector */}
        <Card className="border-border/50">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">اختر الفترة الزمنية</span>
            </div>
            <div className="flex items-center gap-3">
              {reportType === "monthly" && (
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-[160px]">
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
              )}
              {reportType === "quarterly" && (
                <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="الربع" />
                  </SelectTrigger>
                  <SelectContent>
                    {quarterLabels.map((label, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {reportType === "semiAnnual" && (
                <Select value={selectedHalf.toString()} onValueChange={(v) => setSelectedHalf(parseInt(v))}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="النصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {halfLabels.map((label, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
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
          </CardContent>
        </Card>

        {/* Report Title */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
            {reportTitle}
          </h2>
          <div className="w-24 h-px bg-border mx-auto mt-4"></div>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">الدورات النشطة</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{currentReport?.activeCourses || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">دورة خلال هذه الفترة</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">عدد المسجلين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{currentReport?.totalEnrollments || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">متدرب مسجل</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(currentReport?.totalRevenue || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">دورات + خدمات</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-3xl font-bold text-destructive">
                  {formatCurrency(currentReport?.totalExpenses || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">دورات + تشغيلية</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إيرادات الخدمات</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(currentReport?.servicesRevenue || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{currentReport?.servicesCount || 0} خدمة مباعة</p>
            </CardContent>
          </Card>
        </div>

        {/* Net Profit Card */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">صافي الأرباح (بعد جميع المصروفات)</p>
                  {isLoading ? (
                    <Skeleton className="h-12 w-40" />
                  ) : (
                    <div className={`text-4xl md:text-5xl font-bold ${(currentReport?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatCurrency(currentReport?.netProfit || 0)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-1">هامش الربح</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className={`text-2xl font-bold ${(currentReport?.profitMargin || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {(currentReport?.profitMargin || 0).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown Chart (for quarterly, semi-annual, annual) */}
        {reportType !== "monthly" && currentReport?.monthlyData && currentReport.monthlyData.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">التفاصيل الشهرية</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-right font-medium">الشهر</th>
                      <th className="py-3 text-center font-medium text-green-600">الإيرادات</th>
                      <th className="py-3 text-center font-medium text-destructive">المصروفات</th>
                      <th className="py-3 text-left font-medium">صافي الربح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentReport.monthlyData.map((month: { month: number; year: number; revenue: number; expenses: number; profit: number }) => (
                      <tr key={`${month.year}-${month.month}`}>
                        <td className="py-3 font-medium">{arabicMonths[month.month - 1]} {month.year}</td>
                        <td className="py-3 text-center text-green-600">{formatCurrency(month.revenue)}</td>
                        <td className="py-3 text-center text-destructive">{formatCurrency(month.expenses)}</td>
                        <td className={`py-3 text-left font-bold ${month.profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {formatCurrency(month.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2">
                    <tr className="bg-muted/50">
                      <td className="py-3 font-bold">الإجمالي</td>
                      <td className="py-3 text-center font-bold text-green-600">{formatCurrency(currentReport.totalRevenue || 0)}</td>
                      <td className="py-3 text-center font-bold text-destructive">{formatCurrency(currentReport.totalExpenses || 0)}</td>
                      <td className={`py-3 text-left font-bold ${(currentReport.netProfit || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatCurrency(currentReport.netProfit || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout for Expenses */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Course Expenses Breakdown */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">مصروفات الدورات</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(expenseCategoryLabels).map(([key, label]) => {
                    const amount = currentReport?.expensesByCategory?.[key] || 0;
                    const courseExpenses = currentReport?.courseExpenses || 1;
                    const percentage = courseExpenses > 0 ? (amount / courseExpenses) * 100 : 0;
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                          <span className="font-bold text-destructive">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-destructive/60 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-4 mt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">إجمالي مصروفات الدورات</span>
                      <span className="font-bold text-destructive">
                        {formatCurrency(currentReport?.courseExpenses || 0)}
                      </span>
                    </div>
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
                <CardTitle className="text-lg">المصروفات التشغيلية</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(operationalCategoryLabels).map(([key, label]) => {
                    const amount = currentReport?.operationalByCategory?.[key] || 0;
                    const opTotal = currentReport?.operationalExpenses || 1;
                    const percentage = opTotal > 0 ? (amount / opTotal) * 100 : 0;
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{operationalCategoryIcons[key]}</span>
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                          <span className="font-bold text-orange-600">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500/60 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-4 mt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">إجمالي المصروفات التشغيلية</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(currentReport?.operationalExpenses || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">ملخص التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 text-muted-foreground">الفترة</td>
                    <td className="py-3 text-left font-medium">{reportTitle}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">عدد الدورات النشطة</td>
                    <td className="py-3 text-left font-medium">{currentReport?.activeCourses || 0}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">عدد المسجلين</td>
                    <td className="py-3 text-left font-medium">{currentReport?.totalEnrollments || 0}</td>
                  </tr>
                  <tr className="bg-green-50 dark:bg-green-950/20">
                    <td className="py-3 text-muted-foreground">إيرادات الدورات</td>
                    <td className="py-3 text-left font-medium text-green-600">{formatCurrency(currentReport?.coursesRevenue || 0)}</td>
                  </tr>
                  <tr className="bg-blue-50 dark:bg-blue-950/20">
                    <td className="py-3 text-muted-foreground">إيرادات الخدمات</td>
                    <td className="py-3 text-left font-medium text-blue-600">{formatCurrency(currentReport?.servicesRevenue || 0)}</td>
                  </tr>
                  <tr className="bg-green-100 dark:bg-green-950/40">
                    <td className="py-3 font-semibold">إجمالي الإيرادات</td>
                    <td className="py-3 text-left font-bold text-green-600">{formatCurrency(currentReport?.totalRevenue || 0)}</td>
                  </tr>
                  <tr className="bg-red-50 dark:bg-red-950/20">
                    <td className="py-3 text-muted-foreground">مصروفات الدورات</td>
                    <td className="py-3 text-left font-medium text-destructive">{formatCurrency(currentReport?.courseExpenses || 0)}</td>
                  </tr>
                  <tr className="bg-orange-50 dark:bg-orange-950/20">
                    <td className="py-3 text-muted-foreground">المصروفات التشغيلية</td>
                    <td className="py-3 text-left font-medium text-orange-600">{formatCurrency(currentReport?.operationalExpenses || 0)}</td>
                  </tr>
                  <tr className="bg-red-100 dark:bg-red-950/40">
                    <td className="py-3 font-semibold">إجمالي المصروفات</td>
                    <td className="py-3 text-left font-bold text-destructive">{formatCurrency(currentReport?.totalExpenses || 0)}</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="py-4 font-bold text-lg">صافي الأرباح</td>
                    <td className={`py-4 text-left font-bold text-xl ${(currentReport?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatCurrency(currentReport?.netProfit || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
