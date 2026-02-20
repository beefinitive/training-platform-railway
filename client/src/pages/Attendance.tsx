import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Clock, LogIn, LogOut, Calendar, Timer, 
  CheckCircle, XCircle, AlertCircle
} from "lucide-react";

const statusLabels: Record<string, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  early_leave: "انصراف مبكر",
};

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-yellow-100 text-yellow-800",
  early_leave: "bg-orange-100 text-orange-800",
};

export default function Attendance() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const utils = trpc.useUtils();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: attendanceRecords = [], isLoading } = trpc.attendance.list.useQuery({
    employeeId: selectedEmployeeId,
    month: selectedMonth,
    year: selectedYear,
  });

  const checkInMutation = trpc.attendance.checkIn.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدخول بنجاح");
      utils.attendance.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تسجيل الدخول");
    },
  });

  const checkOutMutation = trpc.attendance.checkOut.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الخروج بنجاح");
      utils.attendance.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تسجيل الخروج");
    },
  });

  const handleCheckIn = (employeeId: number) => {
    checkInMutation.mutate({ employeeId });
  };

  const handleCheckOut = (employeeId: number) => {
    checkOutMutation.mutate({ employeeId });
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateHours = (checkIn: Date | string | null, checkOut: Date | string | null) => {
    if (!checkIn || !checkOut) return "-";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${diff.toFixed(1)} ساعة`;
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((e: any) => e.id === employeeId);
    return employee?.name || "غير معروف";
  };

  // Get today's attendance for quick actions
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r: any) => {
    const recordDate = new Date(r.date).toISOString().split('T')[0];
    return recordDate === today;
  });

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

  // Calculate stats
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((r: any) => r.status === "present").length;
  const lateDays = attendanceRecords.filter((r: any) => r.status === "late").length;
  const totalHours = attendanceRecords.reduce((acc: number, r: any) => {
    if (r.checkIn && r.checkOut) {
      const start = new Date(r.checkIn);
      const end = new Date(r.checkOut);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return acc;
  }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">الحضور والانصراف</h1>
          <p className="text-muted-foreground">تسجيل ومتابعة حضور الموظفين</p>
        </div>

        {/* Quick Actions - Check In/Out */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              تسجيل الحضور اليوم
            </CardTitle>
            <CardDescription>{formatDate(new Date())}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee: any) => {
                const todayRecord = todayRecords.find((r: any) => r.employeeId === employee.id);
                const hasCheckedIn = todayRecord?.checkIn;
                const hasCheckedOut = todayRecord?.checkOut;

                return (
                  <Card key={employee.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {hasCheckedIn ? `دخول: ${formatTime(todayRecord.checkIn)}` : "لم يسجل الدخول"}
                          {hasCheckedOut && ` | خروج: ${formatTime(todayRecord.checkOut)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!hasCheckedIn && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(employee.id)}
                            disabled={checkInMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <LogIn className="h-4 w-4 ml-1" />
                            دخول
                          </Button>
                        )}
                        {hasCheckedIn && !hasCheckedOut && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckOut(employee.id)}
                            disabled={checkOutMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <LogOut className="h-4 w-4 ml-1" />
                            خروج
                          </Button>
                        )}
                        {hasCheckedIn && hasCheckedOut && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            مكتمل
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أيام الحضور</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentDays}</div>
              <p className="text-xs text-muted-foreground">من {totalDays} يوم</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أيام التأخير</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lateDays}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الساعات</CardTitle>
              <Timer className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">ساعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل الحضور</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label>الموظف:</Label>
            <Select
              value={selectedEmployeeId?.toString() || "all"}
              onValueChange={(v) => setSelectedEmployeeId(v && v !== "all" ? parseInt(v) : undefined)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="جميع الموظفين" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموظفين</SelectItem>
                {employees.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>الشهر:</Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>السنة:</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>سجل الحضور</CardTitle>
            <CardDescription>
              {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد سجلات حضور لهذه الفترة
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">وقت الدخول</TableHead>
                    <TableHead className="text-right">وقت الخروج</TableHead>
                    <TableHead className="text-right">ساعات العمل</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(record.employeeId)}
                      </TableCell>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString("en-US")}
                      </TableCell>
                      <TableCell>{formatTime(record.checkIn)}</TableCell>
                      <TableCell>{formatTime(record.checkOut)}</TableCell>
                      <TableCell>{calculateHours(record.checkIn, record.checkOut)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[record.status] || ""}>
                          {statusLabels[record.status] || record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
