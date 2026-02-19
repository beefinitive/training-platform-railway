import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  FileText, Plus, Users, UserCheck, UserPlus, 
  TrendingUp, Calendar, Target, Phone
} from "lucide-react";

export default function DailyReports() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: 0,
    reportDate: new Date().toISOString().split('T')[0],
    targetedCustomers: "",
    confirmedCustomers: "",
    registeredCustomers: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: employees = [] } = trpc.employees.list.useQuery({ specialization: "customer_service" });
  const { data: reports = [], isLoading } = trpc.dailyReports.list.useQuery({
    employeeId: selectedEmployeeId,
    month: selectedMonth,
    year: selectedYear,
  });
  const { data: stats } = trpc.dailyReports.stats.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const createMutation = trpc.dailyReports.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التقرير بنجاح");
      utils.dailyReports.list.invalidate();
      utils.dailyReports.stats.invalidate();
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة التقرير");
    },
  });

  const resetForm = () => {
    setFormData({
      employeeId: 0,
      reportDate: new Date().toISOString().split('T')[0],
      targetedCustomers: "",
      confirmedCustomers: "",
      registeredCustomers: "",
      notes: "",
    });
  };

  const handleCreate = () => {
    if (!formData.employeeId) {
      toast.error("يرجى اختيار الموظف");
      return;
    }
    createMutation.mutate({
      ...formData,
      targetedCustomers: parseInt(formData.targetedCustomers) || 0,
      confirmedCustomers: parseInt(formData.confirmedCustomers) || 0,
      registeredCustomers: parseInt(formData.registeredCustomers) || 0,
    });
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((e: any) => e.id === employeeId);
    return employee?.name || "غير معروف";
  };

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

  // Calculate conversion rate
  const conversionRate = stats?.totalTargeted 
    ? ((stats.totalConfirmed / stats.totalTargeted) * 100).toFixed(1) 
    : "0";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">تقارير الإنجاز اليومية</h1>
            <p className="text-muted-foreground">تقارير خدمة العملاء اليومية</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة تقرير
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>إضافة تقرير إنجاز يومي</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الموظف *</Label>
                    <Select
                      value={formData.employeeId.toString()}
                      onValueChange={(v) => setFormData({ ...formData, employeeId: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ التقرير</Label>
                    <Input
                      type="date"
                      value={formData.reportDate}
                      onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-blue-500" />
                      العملاء المستهدفين
                    </Label>
                    <Input
                      type="number"
                      value={formData.targetedCustomers}
                      onChange={(e) => setFormData({ ...formData, targetedCustomers: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      العملاء المؤكدين
                    </Label>
                    <Input
                      type="number"
                      value={formData.confirmedCustomers}
                      onChange={(e) => setFormData({ ...formData, confirmedCustomers: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <UserPlus className="h-4 w-4 text-purple-500" />
                      العملاء المسجلين
                    </Label>
                    <Input
                      type="number"
                      value={formData.registeredCustomers}
                      onChange={(e) => setFormData({ ...formData, registeredCustomers: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">إلغاء</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  إضافة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التقارير</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العملاء المستهدفين</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.totalTargeted || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العملاء المؤكدين</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.totalConfirmed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العملاء المسجلين</CardTitle>
              <UserPlus className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.totalRegistered || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل التحويل</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{conversionRate}%</div>
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

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>سجل التقارير اليومية</CardTitle>
            <CardDescription>
              {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد تقارير لهذه الفترة
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-blue-500" />
                        المستهدفين
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        المؤكدين
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4 text-purple-500" />
                        المسجلين
                      </div>
                    </TableHead>
                    <TableHead className="text-right">معدل التحويل</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: any) => {
                    const rate = report.targetedCustomers 
                      ? ((report.confirmedCustomers / report.targetedCustomers) * 100).toFixed(1)
                      : "0";
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(report.employeeId)}
                        </TableCell>
                        <TableCell>
                          {new Date(report.reportDate).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          {report.targetedCustomers}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {report.confirmedCustomers}
                        </TableCell>
                        <TableCell className="text-purple-600 font-medium">
                          {report.registeredCustomers}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${parseFloat(rate) >= 50 ? 'text-green-600' : parseFloat(rate) >= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {rate}%
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {report.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Employee Summary */}
        {employees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ملخص أداء الموظفين</CardTitle>
              <CardDescription>إجمالي الإنجازات لكل موظف هذا الشهر</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {employees.map((employee: any) => {
                  const empReports = reports.filter((r: any) => r.employeeId === employee.id);
                  const totalTargeted = empReports.reduce((sum: number, r: any) => sum + (r.targetedCustomers || 0), 0);
                  const totalConfirmed = empReports.reduce((sum: number, r: any) => sum + (r.confirmedCustomers || 0), 0);
                  const totalRegistered = empReports.reduce((sum: number, r: any) => sum + (r.registeredCustomers || 0), 0);
                  const rate = totalTargeted ? ((totalConfirmed / totalTargeted) * 100).toFixed(1) : "0";

                  return (
                    <Card key={employee.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{empReports.length} تقرير</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-blue-600">{totalTargeted}</p>
                          <p className="text-xs text-muted-foreground">مستهدف</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{totalConfirmed}</p>
                          <p className="text-xs text-muted-foreground">مؤكد</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">{totalRegistered}</p>
                          <p className="text-xs text-muted-foreground">مسجل</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t text-center">
                        <span className={`text-sm font-medium ${parseFloat(rate) >= 50 ? 'text-green-600' : parseFloat(rate) >= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                          معدل التحويل: {rate}%
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
