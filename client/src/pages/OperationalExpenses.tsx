import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Wallet, Building2, Droplets, Zap, Landmark, MoreHorizontal, Users, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const categoryLabels: Record<string, string> = {
  salaries: "الرواتب والأجور",
  electricity: "الكهرباء",
  water: "المياه",
  rent: "الإيجار",
  government: "المصروفات الحكومية",
  other: "أخرى",
};

const categoryIcons: Record<string, React.ReactNode> = {
  salaries: <Wallet className="h-5 w-5" />,
  electricity: <Zap className="h-5 w-5" />,
  water: <Droplets className="h-5 w-5" />,
  rent: <Building2 className="h-5 w-5" />,
  government: <Landmark className="h-5 w-5" />,
  other: <MoreHorizontal className="h-5 w-5" />,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type ExpenseCategory = "salaries" | "electricity" | "water" | "rent" | "government" | "other";

interface ExpenseFormData {
  category: ExpenseCategory;
  amount: string;
  description: string;
}

export default function OperationalExpenses() {
  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: "salaries",
    amount: "",
    description: "",
  });
  const [isEmployeeSalaryDialogOpen, setIsEmployeeSalaryDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  const utils = trpc.useUtils();

  // Fetch employees list
  const { data: employees } = trpc.employees.list.useQuery();

  const { data: monthlyExpenses, isLoading } = trpc.operationalExpenses.getMonthly.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const createMutation = trpc.operationalExpenses.create.useMutation({
    onSuccess: () => {
      utils.operationalExpenses.getMonthly.invalidate();
      utils.operationalExpenses.list.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("تم إضافة المصروف بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة المصروف");
    },
  });

  const updateMutation = trpc.operationalExpenses.update.useMutation({
    onSuccess: () => {
      utils.operationalExpenses.getMonthly.invalidate();
      utils.operationalExpenses.list.invalidate();
      setEditingExpense(null);
      resetForm();
      toast.success("تم تحديث المصروف بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث المصروف");
    },
  });

  const deleteMutation = trpc.operationalExpenses.delete.useMutation({
    onSuccess: () => {
      utils.operationalExpenses.getMonthly.invalidate();
      utils.operationalExpenses.list.invalidate();
      toast.success("تم حذف المصروف بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف المصروف");
    },
  });

  const addSalariesMutation = trpc.operationalExpenses.addEmployeeSalaries.useMutation({
    onSuccess: (data) => {
      utils.operationalExpenses.getMonthly.invalidate();
      utils.operationalExpenses.list.invalidate();
      setIsEmployeeSalaryDialogOpen(false);
      setSelectedEmployees([]);
      toast.success(`تم إضافة رواتب ${data.count} موظف بنجاح`);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة الرواتب");
    },
  });

  const handleAddEmployeeSalaries = () => {
    if (selectedEmployees.length === 0) return;
    addSalariesMutation.mutate({
      employeeIds: selectedEmployees,
      month: selectedMonth,
      year: selectedYear,
    });
  };

  const years = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [currentDate]);

  const resetForm = () => {
    setFormData({
      category: "salaries",
      amount: "",
      description: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (editingExpense) {
      updateMutation.mutate({
        id: editingExpense.id,
        category: formData.category,
        amount: formData.amount,
        description: formData.description || undefined,
      });
    } else {
      createMutation.mutate({
        category: formData.category,
        amount: formData.amount,
        month: selectedMonth,
        year: selectedYear,
        description: formData.description || undefined,
      });
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      description: expense.description || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      deleteMutation.mutate({ id });
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
              المصروفات التشغيلية
            </h1>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          <p className="text-muted-foreground text-center">
            إدارة المصروفات التشغيلية الشهرية
          </p>
        </div>

        {/* Month/Year Selector and Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

          <div className="flex items-center gap-2">
            <Dialog open={isEmployeeSalaryDialogOpen} onOpenChange={setIsEmployeeSalaryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setSelectedEmployees([])}>
                  <Users className="h-4 w-4 ml-2" />
                  إضافة رواتب الموظفين
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>إضافة رواتب الموظفين كمصاريف</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    اختر الموظفين لإضافة رواتبهم كمصاريف لشهر {arabicMonths[selectedMonth - 1]} {selectedYear}
                  </p>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {employees?.map((employee: any) => (
                      <div 
                        key={employee.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedEmployees.includes(employee.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedEmployees(prev => 
                            prev.includes(employee.id)
                              ? prev.filter(id => id !== employee.id)
                              : [...prev, employee.id]
                          );
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={selectedEmployees.includes(employee.id)}
                            onCheckedChange={() => {}}
                          />
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.position || 'موظف'}</p>
                          </div>
                        </div>
                        <span className="font-bold text-destructive">
                          {formatCurrency(parseFloat(employee.salary || '0'))}
                        </span>
                      </div>
                    ))}
                  </div>
                  {selectedEmployees.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">إجمالي الرواتب المختارة:</span>
                        <span className="font-bold text-destructive text-lg">
                          {formatCurrency(
                            employees
                              ?.filter((e: any) => selectedEmployees.includes(e.id))
                              .reduce((sum: number, e: any) => sum + parseFloat(e.salary || '0'), 0) || 0
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedEmployees.length} موظف مختار
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsEmployeeSalaryDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    onClick={handleAddEmployeeSalaries}
                    disabled={selectedEmployees.length === 0 || addSalariesMutation.isPending}
                  >
                    {addSalariesMutation.isPending ? "جاري الإضافة..." : `إضافة رواتب ${selectedEmployees.length} موظف`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingExpense(null); }}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مصروف
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة مصروف تشغيلي جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({ ...formData, category: v as ExpenseCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {categoryIcons[key]}
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ (ريال)</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  سيتم إضافة المصروف لشهر {arabicMonths[selectedMonth - 1]} {selectedYear}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const amount = monthlyExpenses?.byCategory?.[key] || 0;
            const total = monthlyExpenses?.total || 1;
            const percentage = total > 0 ? (amount / total) * 100 : 0;
            
            return (
              <Card key={key} className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                  </CardTitle>
                  <div className="text-muted-foreground">
                    {categoryIcons[key]}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-destructive">
                        {formatCurrency(amount)}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-destructive/60 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Total Card */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6 text-destructive" />
                <span className="text-lg font-semibold">إجمالي المصروفات التشغيلية</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <span className="text-3xl font-bold text-destructive">
                  {formatCurrency(monthlyExpenses?.total || 0)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {arabicMonths[selectedMonth - 1]} {selectedYear}
            </p>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : monthlyExpenses?.expenses?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد مصروفات مسجلة لهذا الشهر</p>
                <p className="text-sm mt-1">اضغط على "إضافة مصروف" لإضافة مصروف جديد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyExpenses?.expenses?.map((expense: any) => (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                        {categoryIcons[expense.category]}
                      </div>
                      <div>
                        <p className="font-medium">{categoryLabels[expense.category]}</p>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-destructive text-lg">
                        {formatCurrency(parseFloat(expense.amount))}
                      </span>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>تعديل المصروف</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>الفئة</Label>
                                <Select 
                                  value={formData.category} 
                                  onValueChange={(v) => setFormData({ ...formData, category: v as ExpenseCategory })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر الفئة" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                          {categoryIcons[key]}
                                          <span>{label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>المبلغ (ريال)</Label>
                                <Input
                                  type="number"
                                  value={formData.amount}
                                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                  placeholder="0.00"
                                  dir="ltr"
                                  className="text-left"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>ملاحظات (اختياري)</Label>
                                <Textarea
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  placeholder="أي ملاحظات إضافية..."
                                  rows={3}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-3">
                              <Button variant="outline" onClick={() => setEditingExpense(null)}>
                                إلغاء
                              </Button>
                              <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
