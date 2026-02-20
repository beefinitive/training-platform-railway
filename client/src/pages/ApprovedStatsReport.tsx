import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, Users, Target, TrendingUp, Calendar,
  CheckCircle2, Award, DollarSign, FileText, Download
} from "lucide-react";

const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

interface EmployeeStats {
  employeeId: number;
  employeeName: string;
  totalTargeted: number;
  totalConfirmed: number;
  totalRegistered: number;
  totalServicesSold: number;
  totalTargetedByServices: number;
  totalSalesAmount: number;
  totalRevenue: number;
  statsCount: number;
  conversionRate: number;
}

export default function ApprovedStatsReport() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("comparison");

  // جلب الإحصائيات المعتمدة فقط
  const { data: approvedStats = [], isLoading } = trpc.dailyStats.listForReview.useQuery({
    status: "approved",
    month: selectedMonth,
    year: selectedYear,
    employeeId: selectedEmployee === "all" ? undefined : parseInt(selectedEmployee),
  });

  const { data: employees = [] } = trpc.employees.list.useQuery();

  // حساب إحصائيات كل موظف
  const employeeStatsMap = useMemo(() => {
    const statsMap = new Map<number, EmployeeStats>();

    approvedStats.forEach((stat: any) => {
      const empId = stat.employeeId;
      const existing = statsMap.get(empId) || {
        employeeId: empId,
        employeeName: stat.employeeName || "غير معروف",
        totalTargeted: 0,
        totalConfirmed: 0,
        totalRegistered: 0,
        totalServicesSold: 0,
        totalTargetedByServices: 0,
        totalSalesAmount: 0,
        totalRevenue: 0,
        statsCount: 0,
        conversionRate: 0,
      };

      existing.totalTargeted += stat.targetedCustomers || 0;
      existing.totalConfirmed += stat.confirmedCustomers || 0;
      existing.totalRegistered += stat.registeredCustomers || 0;
      existing.totalServicesSold += stat.servicesSold || 0;
      existing.totalTargetedByServices += stat.targetedByServices || 0;
      existing.totalSalesAmount += parseFloat(stat.salesAmount || "0");
      existing.totalRevenue += parseFloat(stat.calculatedRevenue || "0");
      existing.statsCount += 1;

      statsMap.set(empId, existing);
    });

    // حساب معدل التحويل
    statsMap.forEach((stats) => {
      if (stats.totalTargeted > 0) {
        stats.conversionRate = Math.round((stats.totalConfirmed / stats.totalTargeted) * 100);
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalConfirmed - a.totalConfirmed);
  }, [approvedStats]);

  // إجمالي الإحصائيات
  const totals = useMemo(() => {
    return employeeStatsMap.reduce(
      (acc, emp) => ({
        totalTargeted: acc.totalTargeted + emp.totalTargeted,
        totalConfirmed: acc.totalConfirmed + emp.totalConfirmed,
        totalRegistered: acc.totalRegistered + emp.totalRegistered,
        totalServicesSold: acc.totalServicesSold + emp.totalServicesSold,
        totalTargetedByServices: acc.totalTargetedByServices + emp.totalTargetedByServices,
        totalSalesAmount: acc.totalSalesAmount + emp.totalSalesAmount,
        totalRevenue: acc.totalRevenue + emp.totalRevenue,
        statsCount: acc.statsCount + emp.statsCount,
      }),
      {
        totalTargeted: 0,
        totalConfirmed: 0,
        totalRegistered: 0,
        totalServicesSold: 0,
        totalTargetedByServices: 0,
        totalSalesAmount: 0,
        totalRevenue: 0,
        statsCount: 0,
      }
    );
  }, [employeeStatsMap]);

  // أفضل موظف
  const topPerformer = employeeStatsMap[0];

  // سنوات للاختيار
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const content = (
    <div className="space-y-6">
      {/* العنوان والفلاتر */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            تقارير الإحصائيات المعتمدة
          </h1>
          <p className="text-muted-foreground mt-1">
            مقارنة أداء الموظفات بناءً على الإحصائيات المعتمدة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="الشهر" />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, index) => (
                <SelectItem key={index} value={(index + 1).toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="الموظف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الموظفات</SelectItem>
              {employees.map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* بطاقات الإحصائيات الإجمالية */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Target className="h-4 w-4" />
              المستهدفين
            </div>
            <p className="text-2xl font-bold mt-1">{totals.totalTargeted.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              المؤكدين
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{totals.totalConfirmed.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FileText className="h-4 w-4 text-blue-600" />
              المسجلين
            </div>
            <p className="text-2xl font-bold mt-1 text-blue-600">{totals.totalRegistered.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4 text-purple-600" />
              مستهدفين بالخدمات
            </div>
            <p className="text-2xl font-bold mt-1 text-purple-600">{totals.totalTargetedByServices.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Award className="h-4 w-4 text-orange-600" />
              الخدمات المباعة
            </div>
            <p className="text-2xl font-bold mt-1 text-orange-600">{totals.totalServicesSold.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              إيرادات الدورات
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{totals.totalRevenue.toLocaleString()} ر.س</p>
          </CardContent>
        </Card>
      </div>

      {/* أفضل موظف */}
      {topPerformer && (
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">أفضل أداء هذا الشهر</p>
                  <p className="text-xl font-bold">{topPerformer.employeeName}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">العملاء المؤكدين</p>
                <p className="text-2xl font-bold text-amber-600">{topPerformer.totalConfirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="comparison">مقارنة الأداء</TabsTrigger>
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
        </TabsList>

        {/* تبويب مقارنة الأداء */}
        <TabsContent value="comparison" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                مقارنة أداء الموظفات - {monthNames[selectedMonth - 1]} {selectedYear}
              </CardTitle>
              <CardDescription>
                ترتيب الموظفات حسب عدد العملاء المؤكدين
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : employeeStatsMap.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد إحصائيات معتمدة لهذا الشهر
                </div>
              ) : (
                <div className="space-y-4">
                  {employeeStatsMap.map((emp, index) => {
                    const maxConfirmed = employeeStatsMap[0]?.totalConfirmed || 1;
                    const percentage = (emp.totalConfirmed / maxConfirmed) * 100;
                    
                    return (
                      <div key={emp.employeeId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? "bg-amber-100 text-amber-700" :
                              index === 1 ? "bg-gray-100 text-gray-700" :
                              index === 2 ? "bg-orange-100 text-orange-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-medium">{emp.employeeName}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              مستهدفين: <span className="font-medium text-foreground">{emp.totalTargeted}</span>
                            </span>
                            <span className="text-green-600 font-bold">
                              مؤكدين: {emp.totalConfirmed}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {emp.conversionRate}% تحويل
                            </Badge>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التفاصيل */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الإحصائيات المعتمدة</CardTitle>
              <CardDescription>
                جدول تفصيلي بجميع الإحصائيات المعتمدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الموظف</TableHead>
                      <TableHead className="text-center">المستهدفين</TableHead>
                      <TableHead className="text-center">المؤكدين</TableHead>
                      <TableHead className="text-center">المسجلين</TableHead>
                      <TableHead className="text-center">مستهدفين بالخدمات</TableHead>
                      <TableHead className="text-center">الخدمات المباعة</TableHead>
                      <TableHead className="text-center">الإيرادات</TableHead>
                      <TableHead className="text-center">معدل التحويل</TableHead>
                      <TableHead className="text-center">عدد الأيام</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeStatsMap.map((emp) => (
                      <TableRow key={emp.employeeId}>
                        <TableCell className="font-medium">{emp.employeeName}</TableCell>
                        <TableCell className="text-center">{emp.totalTargeted}</TableCell>
                        <TableCell className="text-center text-green-600 font-bold">{emp.totalConfirmed}</TableCell>
                        <TableCell className="text-center text-blue-600">{emp.totalRegistered}</TableCell>
                        <TableCell className="text-center text-purple-600">{emp.totalTargetedByServices}</TableCell>
                        <TableCell className="text-center text-orange-600">{emp.totalServicesSold}</TableCell>
                        <TableCell className="text-center text-emerald-600">{emp.totalRevenue.toLocaleString()} ر.س</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={emp.conversionRate >= 50 ? "default" : "secondary"}>
                            {emp.conversionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{emp.statsCount}</TableCell>
                      </TableRow>
                    ))}
                    {employeeStatsMap.length > 0 && (
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>الإجمالي</TableCell>
                        <TableCell className="text-center">{totals.totalTargeted}</TableCell>
                        <TableCell className="text-center text-green-600">{totals.totalConfirmed}</TableCell>
                        <TableCell className="text-center text-blue-600">{totals.totalRegistered}</TableCell>
                        <TableCell className="text-center text-purple-600">{totals.totalTargetedByServices}</TableCell>
                        <TableCell className="text-center text-orange-600">{totals.totalServicesSold}</TableCell>
                        <TableCell className="text-center text-emerald-600">{totals.totalRevenue.toLocaleString()} ر.س</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">{totals.statsCount}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإحصائيات اليومية */}
        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل الإحصائيات اليومية المعتمدة</CardTitle>
              <CardDescription>
                جميع الإحصائيات المعتمدة مرتبة حسب التاريخ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الموظف</TableHead>
                      <TableHead className="text-right">الدورة</TableHead>
                      <TableHead className="text-center">المستهدفين</TableHead>
                      <TableHead className="text-center">المؤكدين</TableHead>
                      <TableHead className="text-center">المسجلين</TableHead>
                      <TableHead className="text-center">مستهدفين بالخدمات</TableHead>
                      <TableHead className="text-center">الخدمات</TableHead>
                      <TableHead className="text-center">الإيراد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          لا توجد إحصائيات معتمدة
                        </TableCell>
                      </TableRow>
                    ) : (
                      approvedStats.map((stat: any) => (
                        <TableRow key={stat.id}>
                          <TableCell>
                            {new Date(stat.date).toLocaleDateString("ar-SA")}
                          </TableCell>
                          <TableCell>{stat.employeeName}</TableCell>
                          <TableCell>{stat.courseName || "-"}</TableCell>
                          <TableCell className="text-center">{stat.targetedCustomers || 0}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">{stat.confirmedCustomers || 0}</TableCell>
                          <TableCell className="text-center text-blue-600">{stat.registeredCustomers || 0}</TableCell>
                          <TableCell className="text-center text-purple-600">{stat.targetedByServices || 0}</TableCell>
                          <TableCell className="text-center text-orange-600">{stat.servicesSold || 0}</TableCell>
                          <TableCell className="text-center text-emerald-600">
                            {parseFloat(stat.calculatedRevenue || "0").toLocaleString()} ر.س
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
}
