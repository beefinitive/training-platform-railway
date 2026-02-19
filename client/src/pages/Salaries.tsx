import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Wallet, TrendingDown, TrendingUp, DollarSign, RefreshCw, Eye, Trash2, CheckCircle } from "lucide-react";

const MONTHS = [
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

export default function Salaries() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form states
  const [newSalary, setNewSalary] = useState({
    employeeId: "",
    baseSalary: "",
    notes: "",
  });

  const [newAdjustment, setNewAdjustment] = useState({
    type: "deduction" as "deduction" | "bonus",
    amount: "",
    reason: "",
    description: "",
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: salaries = [], isLoading } = trpc.salaries.list.useQuery({
    year: selectedYear,
    month: selectedMonth,
    employeeId: filterEmployeeId !== "all" ? parseInt(filterEmployeeId) : undefined,
  });
  const { data: stats } = trpc.salaries.stats.useQuery({ year: selectedYear });
  const { data: adjustments = [] } = trpc.salaryAdjustments.list.useQuery(
    { salaryId: selectedSalary || 0 },
    { enabled: !!selectedSalary }
  );

  // Mutations
  const createSalary = trpc.salaries.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الراتب بنجاح");
      utils.salaries.list.invalidate();
      utils.salaries.stats.invalidate();
      setIsCreateOpen(false);
      setNewSalary({ employeeId: "", baseSalary: "", notes: "" });
    },
    onError: (error) => toast.error(error.message),
  });

  const generateSalaries = trpc.salaries.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`تم توليد ${data.generatedCount} راتب للموظفين`);
      utils.salaries.list.invalidate();
      utils.salaries.stats.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const markAsPaid = trpc.salaries.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الراتب إلى مدفوع");
      utils.salaries.list.invalidate();
      utils.salaries.stats.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteSalary = trpc.salaries.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الراتب بنجاح");
      utils.salaries.list.invalidate();
      utils.salaries.stats.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const createAdjustment = trpc.salaryAdjustments.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التعديل بنجاح");
      utils.salaries.list.invalidate();
      utils.salaryAdjustments.list.invalidate();
      setIsAdjustmentOpen(false);
      setNewAdjustment({ type: "deduction", amount: "", reason: "", description: "" });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteAdjustment = trpc.salaryAdjustments.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التعديل بنجاح");
      utils.salaries.list.invalidate();
      utils.salaryAdjustments.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const getEmployeeName = (employeeId: number) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp?.name || "غير معروف";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">مدفوع</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">معلق</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">ملغي</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCreateSalary = () => {
    if (!newSalary.employeeId || !newSalary.baseSalary) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createSalary.mutate({
      employeeId: parseInt(newSalary.employeeId),
      month: selectedMonth,
      year: selectedYear,
      baseSalary: newSalary.baseSalary,
      notes: newSalary.notes || undefined,
    });
  };

  const handleAddAdjustment = () => {
    if (!selectedSalary || !newAdjustment.amount || !newAdjustment.reason) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const salary = salaries.find(s => s.id === selectedSalary);
    if (!salary) return;
    
    createAdjustment.mutate({
      salaryId: selectedSalary,
      employeeId: salary.employeeId,
      type: newAdjustment.type,
      amount: newAdjustment.amount,
      reason: newAdjustment.reason,
      description: newAdjustment.description || undefined,
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">إدارة الرواتب</h1>
            <p className="text-muted-foreground">إدارة رواتب الموظفين الشهرية مع الحسومات والمكافآت</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generateSalaries.mutate({ year: selectedYear, month: selectedMonth })}
              disabled={generateSalaries.isPending}
            >
              <RefreshCw className="ml-2 h-4 w-4" />
              توليد الرواتب
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة راتب
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة راتب جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>الموظف *</Label>
                    <Select value={newSalary.employeeId} onValueChange={(v) => setNewSalary({ ...newSalary, employeeId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(e => e.status === 'active').map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الراتب الأساسي *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newSalary.baseSalary}
                      onChange={(e) => setNewSalary({ ...newSalary, baseSalary: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ملاحظات</Label>
                    <Textarea
                      placeholder="ملاحظات إضافية..."
                      value={newSalary.notes}
                      onChange={(e) => setNewSalary({ ...newSalary, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">إلغاء</Button>
                  </DialogClose>
                  <Button onClick={handleCreateSalary} disabled={createSalary.isPending}>
                    إضافة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.totalPaid?.toLocaleString() || 0} ر.س.
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المعلق</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats?.totalPending?.toLocaleString() || 0} ر.س.
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عدد الموظفين</p>
                  <p className="text-2xl font-bold">{stats?.employeeCount || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">رواتب الشهر</p>
                  <p className="text-2xl font-bold">{salaries.length}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="w-32">
                <Label>السنة</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="w-32">
                <Label>الشهر</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label>الموظف</Label>
                <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الموظفين" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الموظفين</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salaries Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              رواتب شهر {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : salaries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد رواتب لهذا الشهر. اضغط على "توليد الرواتب" لإنشاء رواتب جميع الموظفين.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>الراتب الأساسي</TableHead>
                    <TableHead>الحسومات</TableHead>
                    <TableHead>المكافآت</TableHead>
                    <TableHead>صافي الراتب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell className="font-medium">{getEmployeeName(salary.employeeId)}</TableCell>
                      <TableCell>{parseFloat(salary.baseSalary as string).toLocaleString()} ر.س.</TableCell>
                      <TableCell className="text-red-600">
                        -{parseFloat(salary.totalDeductions as string).toLocaleString()} ر.س.
                      </TableCell>
                      <TableCell className="text-green-600">
                        +{parseFloat(salary.totalBonuses as string).toLocaleString()} ر.س.
                      </TableCell>
                      <TableCell className="font-bold">
                        {parseFloat(salary.netSalary as string).toLocaleString()} ر.س.
                      </TableCell>
                      <TableCell>{getStatusBadge(salary.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSalary(salary.id);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {salary.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSalary(salary.id);
                                  setIsAdjustmentOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                onClick={() => markAsPaid.mutate({ id: salary.id })}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا الراتب؟")) {
                                deleteSalary.mutate({ id: salary.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Adjustment Dialog */}
        <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة حسم أو مكافأة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>النوع *</Label>
                <Select
                  value={newAdjustment.type}
                  onValueChange={(v: "deduction" | "bonus") => setNewAdjustment({ ...newAdjustment, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deduction">حسم</SelectItem>
                    <SelectItem value="bonus">مكافأة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المبلغ *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newAdjustment.amount}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>السبب *</Label>
                <Input
                  placeholder="سبب الحسم أو المكافأة"
                  value={newAdjustment.reason}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تفاصيل إضافية</Label>
                <Textarea
                  placeholder="تفاصيل إضافية..."
                  value={newAdjustment.description}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">إلغاء</Button>
              </DialogClose>
              <Button onClick={handleAddAdjustment} disabled={createAdjustment.isPending}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الراتب</DialogTitle>
            </DialogHeader>
            {selectedSalary && (
              <div className="space-y-4">
                {(() => {
                  const salary = salaries.find(s => s.id === selectedSalary);
                  if (!salary) return null;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">الموظف</p>
                          <p className="font-medium">{getEmployeeName(salary.employeeId)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الفترة</p>
                          <p className="font-medium">
                            {MONTHS.find(m => m.value === salary.month)?.label} {salary.year}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الراتب الأساسي</p>
                          <p className="font-medium">{parseFloat(salary.baseSalary as string).toLocaleString()} ر.س.</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">صافي الراتب</p>
                          <p className="font-bold text-lg">{parseFloat(salary.netSalary as string).toLocaleString()} ر.س.</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">التعديلات (الحسومات والمكافآت)</h4>
                        {adjustments.length === 0 ? (
                          <p className="text-muted-foreground text-sm">لا توجد تعديلات</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>النوع</TableHead>
                                <TableHead>المبلغ</TableHead>
                                <TableHead>السبب</TableHead>
                                <TableHead>الإجراءات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {adjustments.map((adj) => (
                                <TableRow key={adj.id}>
                                  <TableCell>
                                    {adj.type === "deduction" ? (
                                      <Badge className="bg-red-100 text-red-800">حسم</Badge>
                                    ) : (
                                      <Badge className="bg-green-100 text-green-800">مكافأة</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className={adj.type === "deduction" ? "text-red-600" : "text-green-600"}>
                                    {adj.type === "deduction" ? "-" : "+"}
                                    {parseFloat(adj.amount as string).toLocaleString()} ر.س.
                                  </TableCell>
                                  <TableCell>{adj.reason}</TableCell>
                                  <TableCell>
                                    {salary.status === "pending" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-600"
                                        onClick={() => {
                                          if (confirm("هل أنت متأكد من حذف هذا التعديل؟")) {
                                            deleteAdjustment.mutate({ id: adj.id });
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>

                      {salary.notes && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground">ملاحظات</p>
                          <p>{salary.notes}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">إغلاق</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
