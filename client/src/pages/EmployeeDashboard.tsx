import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function EmployeeDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get current user
  const { data: user } = trpc.auth.me.useQuery();

  // Get employee profile - use a default employeeId for now
  // In a real app, you'd need to link users to employees
  const employeeId = 1; // TODO: Get from user context or URL params
  const { data: profile, isLoading: profileLoading } = trpc.employees.profile.useQuery(
    employeeId > 0 ? { employeeId } : { employeeId: 0 },
    { enabled: employeeId > 0 }
  );

  // Get targets with progress
  const { data: targets = [] } = trpc.employees.targetsWithProgress.useQuery(
    employeeId > 0 ? { employeeId, month: selectedMonth, year: selectedYear } : { employeeId: 0 },
    { enabled: employeeId > 0 }
  );

  // Get attendance records
  const { data: attendance = [] } = trpc.employees.attendance.useQuery(
    employeeId > 0 ? { employeeId, month: selectedMonth, year: selectedYear } : { employeeId: 0 },
    { enabled: employeeId > 0 }
  );

  // Get salary records
  const { data: salaries = [] } = trpc.employees.salaryRecords.useQuery(
    employeeId > 0 ? { employeeId, year: selectedYear } : { employeeId: 0 },
    { enabled: employeeId > 0 }
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTargets = targets.reduce((sum, t) => sum + (parseFloat(t.targetValue as string) || 0), 0);
    const totalAchieved = targets.reduce((sum, t) => sum + (t.achieved || 0), 0);
    const averagePercentage = targets.length > 0 
      ? targets.reduce((sum, t) => sum + (t.percentage || 0), 0) / targets.length 
      : 0;

    const presentDays = attendance.filter(a => a.status === "present").length;
    const absentDays = attendance.filter(a => a.status === "absent").length;
    const lateDays = attendance.filter(a => a.status === "late").length;

    const currentSalary = salaries.find(s => s.month === selectedMonth && s.year === selectedYear);
    const totalSalariesPaid = salaries.filter(s => s.status === "paid").reduce((sum, s) => sum + (parseFloat(s.netSalary as string) || 0), 0);

    return {
      totalTargets,
      totalAchieved,
      averagePercentage: Math.round(averagePercentage),
      presentDays,
      absentDays,
      lateDays,
      currentSalary,
      totalSalariesPaid,
    };
  }, [targets, attendance, salaries, selectedMonth]);

  // Prepare chart data
  const targetChartData = useMemo(() => {
    return targets.map(t => ({
      name: t.targetType || "مستهدف",
      target: parseFloat(t.targetValue as string) || 0,
      achieved: t.achieved || 0,
      percentage: t.percentage || 0,
    }));
  }, [targets]);

  const attendanceChartData = useMemo(() => {
    return [
      { name: "حاضر", value: stats.presentDays, color: "#22c55e" },
      { name: "غائب", value: stats.absentDays, color: "#ef4444" },
      { name: "متأخر", value: stats.lateDays, color: "#f59e0b" },
    ];
  }, [stats]);

  const salaryChartData = useMemo(() => {
    return salaries.map(s => ({
      month: s.month,
      salary: parseFloat(s.netSalary as string) || 0,
      status: s.status,
    }));
  }, [salaries]);

  const months = [
    { value: 1, label: "يناير" },
    { value: 2, label: "فبراير" },
    { value: 3, label: "مارس" },
    { value: 4, label: "أبريل" },
    { value: 5, label: "مايو" },
    { value: 6, label: "يونيو" },
    { value: 7, label: "يوليو" },
    { value: 8, label: "أغسطس" },
    { value: 9, label: "سبتمبر" },
    { value: 10, label: "أكتوبر" },
    { value: 11, label: "نوفمبر" },
    { value: 12, label: "ديسمبر" },
  ];

  if (profileLoading) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-600">لم يتم العثور على بيانات الموظف</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1">أهلاً {profile.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">الراتب الأساسي</p>
          <p className="text-2xl font-bold text-green-600">{profile.salary} ريال</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">متوسط الإنجاز</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.averagePercentage}%</div>
            <p className="text-xs text-gray-500 mt-1">من المستهدفات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">أيام الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.presentDays}</div>
            <p className="text-xs text-gray-500 mt-1">في هذا الشهر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">الراتب الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.currentSalary ? `${stats.currentSalary.netSalary}` : "قيد المعالجة"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.currentSalary?.status === "paid" ? "مدفوع" : "معلق"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">إجمالي الرواتب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{Math.round(stats.totalSalariesPaid)}</div>
            <p className="text-xs text-gray-500 mt-1">المدفوعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="text-sm font-medium">الشهر</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded px-3 py-2 mt-1"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">السنة</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded px-3 py-2 mt-1"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="targets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="targets">المستهدفات</TabsTrigger>
          <TabsTrigger value="attendance">الحضور</TabsTrigger>
          <TabsTrigger value="salary">الراتب</TabsTrigger>
        </TabsList>

        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المستهدفات والإنجازات</CardTitle>
            </CardHeader>
            <CardContent>
              {targetChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={targetChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="target" fill="#3b82f6" name="المستهدف" />
                    <Bar dataKey="achieved" fill="#22c55e" name="الإنجاز" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">لا توجد مستهدفات</p>
              )}
            </CardContent>
          </Card>

          {/* Targets Table */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المستهدفات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-right py-2">نوع المستهدف</th>
                      <th className="text-right py-2">المستهدف</th>
                      <th className="text-right py-2">الإنجاز</th>
                      <th className="text-right py-2">النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map((target, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">{target.targetType || "مستهدف"}</td>
                        <td className="py-2">{target.targetValue}</td>
                        <td className="py-2">{target.achieved || 0}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            target.percentage >= 100 ? "bg-green-100 text-green-800" :
                            target.percentage >= 75 ? "bg-blue-100 text-blue-800" :
                            target.percentage >= 50 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {target.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ملخص الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceChartData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={attendanceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendanceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">لا توجد سجلات حضور</p>
              )}
            </CardContent>
          </Card>

          {/* Attendance Details */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span>أيام الحضور</span>
                  <span className="font-bold text-green-600">{stats.presentDays}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span>أيام الغياب</span>
                  <span className="font-bold text-red-600">{stats.absentDays}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span>أيام التأخير</span>
                  <span className="font-bold text-yellow-600">{stats.lateDays}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>سجل الحضور التفصيلي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-right py-2">التاريخ</th>
                      <th className="text-right py-2">الحالة</th>
                      <th className="text-right py-2">وقت الدخول</th>
                      <th className="text-right py-2">وقت الخروج</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">{format(new Date(record.date), "dd/MM/yyyy", { locale: ar })}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === "present" ? "bg-green-100 text-green-800" :
                            record.status === "absent" ? "bg-red-100 text-red-800" :
                            record.status === "late" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {record.status === "present" && "حاضر"}
                            {record.status === "absent" && "غائب"}
                            {record.status === "late" && "متأخر"}
                            {record.status === "half_day" && "نصف يوم"}
                            {record.status === "on_leave" && "إجازة"}
                          </span>
                        </td>
                        <td className="py-2">{record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "-"}</td>
                        <td className="py-2">{record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الرواتب الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              {salaryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salaryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="salary" stroke="#8b5cf6" name="الراتب الصافي" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">لا توجد سجلات رواتب</p>
              )}
            </CardContent>
          </Card>

          {/* Salary Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الرواتب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-right py-2">الشهر</th>
                      <th className="text-right py-2">الراتب الأساسي</th>
                      <th className="text-right py-2">الخصومات</th>
                      <th className="text-right py-2">المكافآت</th>
                      <th className="text-right py-2">الراتب الصافي</th>
                      <th className="text-right py-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map((salary, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">{salary.month}/{salary.year}</td>
                        <td className="py-2">{salary.baseSalary}</td>
                        <td className="py-2 text-red-600">-{salary.totalDeductions}</td>
                        <td className="py-2 text-green-600">+{salary.totalBonuses}</td>
                        <td className="py-2 font-bold">{salary.netSalary}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            salary.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {salary.status === "paid" ? "مدفوع" : "معلق"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
