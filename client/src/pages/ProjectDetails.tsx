import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowRight, 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  FileText,
  Calendar,
  ArrowLeft,
  Users,
  UserPlus,
  Percent
} from "lucide-react";

const expenseCategoryLabels: Record<string, string> = {
  salaries: "رواتب",
  materials: "مواد",
  marketing: "تسويق",
  operations: "تشغيل",
  other: "أخرى",
};

export default function ProjectDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");
  
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // Revenue form state
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<any>(null);
  const [revenueForm, setRevenueForm] = useState({
    amount: "",
    description: "",
    revenueDate: new Date().toISOString().split("T")[0],
    category: "",
    notes: "",
  });
  
  // Expense form state
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
    category: "other" as "salaries" | "materials" | "marketing" | "operations" | "other",
    notes: "",
  });

  // Employee form state
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: "",
    salaryPercentage: "100",
    notes: "",
  });

  const utils = trpc.useUtils();
  
  // Queries
  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );
  
  const { data: revenues = [], isLoading: revenuesLoading } = trpc.projects.listRevenues.useQuery(
    { projectId, year: selectedYear, month: selectedMonth },
    { enabled: projectId > 0 }
  );
  
  const { data: expenses = [], isLoading: expensesLoading } = trpc.projects.listExpenses.useQuery(
    { projectId, year: selectedYear, month: selectedMonth },
    { enabled: projectId > 0 }
  );
  
  const { data: financialSummary } = trpc.projects.getFinancialSummary.useQuery(
    { projectId, year: selectedYear, month: selectedMonth },
    { enabled: projectId > 0 }
  );

  // Project employees queries
  const { data: projectEmployees = [], isLoading: employeesLoading } = trpc.projects.listEmployees.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  const { data: availableEmployees = [] } = trpc.projects.getAvailableEmployees.useQuery(
    { projectId },
    { enabled: projectId > 0 && isEmployeeDialogOpen }
  );

  const { data: employeeCosts } = trpc.projects.getEmployeeCosts.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  
  // Calculate yearly stats from monthly data
  const yearlyStats = useMemo(() => {
    if (!financialSummary) return null;
    return {
      totalRevenue: financialSummary.totalRevenue,
      totalExpenses: financialSummary.totalExpenses,
      netProfit: financialSummary.netProfit,
    };
  }, [financialSummary]);

  // Mutations
  const createRevenueMutation = trpc.projects.createRevenue.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الإيراد بنجاح");
      setIsRevenueDialogOpen(false);
      resetRevenueForm();
      utils.projects.listRevenues.invalidate();
      utils.projects.getFinancialSummary.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة الإيراد");
    },
  });

  const updateRevenueMutation = trpc.projects.updateRevenue.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الإيراد بنجاح");
      setIsRevenueDialogOpen(false);
      setEditingRevenue(null);
      resetRevenueForm();
      utils.projects.listRevenues.invalidate();
      utils.projects.getFinancialSummary.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث الإيراد");
    },
  });

  const deleteRevenueMutation = trpc.projects.deleteRevenue.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الإيراد بنجاح");
      utils.projects.listRevenues.invalidate();
      utils.projects.getFinancialSummary.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حذف الإيراد");
    },
  });

  const createExpenseMutation = trpc.projects.createExpense.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المصروف بنجاح");
      setIsExpenseDialogOpen(false);
      resetExpenseForm();
      utils.projects.listExpenses.invalidate();
      utils.projects.getFinancialSummary.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة المصروف");
    },
  });

  const updateExpenseMutation = trpc.projects.updateExpense.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المصروف بنجاح");
      setIsExpenseDialogOpen(false);
      setEditingExpense(null);
      resetExpenseForm();
      utils.projects.listExpenses.invalidate();
      utils.projects.getFinancialSummary.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث المصروف");
    },
  });

  const deleteExpenseMutation = trpc.projects.deleteExpense.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المصروف بنجاح");
      utils.projects.listExpenses.invalidate();
      utils.projects.getFinancialSummary.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حذف المصروف");
    },
  });

  // Employee mutations
  const addEmployeeMutation = trpc.projects.addEmployee.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الموظف للمشروع بنجاح");
      setIsEmployeeDialogOpen(false);
      resetEmployeeForm();
      utils.projects.listEmployees.invalidate();
      utils.projects.getAvailableEmployees.invalidate();
      utils.projects.getEmployeeCosts.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة الموظف");
    },
  });

  const updateEmployeeMutation = trpc.projects.updateEmployee.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات الموظف بنجاح");
      setIsEmployeeDialogOpen(false);
      setEditingEmployee(null);
      resetEmployeeForm();
      utils.projects.listEmployees.invalidate();
      utils.projects.getEmployeeCosts.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث بيانات الموظف");
    },
  });

  const removeEmployeeMutation = trpc.projects.removeEmployee.useMutation({
    onSuccess: () => {
      toast.success("تم إزالة الموظف من المشروع بنجاح");
      utils.projects.listEmployees.invalidate();
      utils.projects.getAvailableEmployees.invalidate();
      utils.projects.getEmployeeCosts.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إزالة الموظف");
    },
  });

  // Form handlers
  const resetRevenueForm = () => {
    setRevenueForm({
      amount: "",
      description: "",
      revenueDate: new Date().toISOString().split("T")[0],
      category: "",
      notes: "",
    });
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      amount: "",
      description: "",
      expenseDate: new Date().toISOString().split("T")[0],
      category: "other",
      notes: "",
    });
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      employeeId: "",
      salaryPercentage: "100",
      notes: "",
    });
  };

  const openEditEmployeeDialog = (emp: any) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      employeeId: emp.employeeId.toString(),
      salaryPercentage: emp.salaryPercentage.toString(),
      notes: emp.notes || "",
    });
    setIsEmployeeDialogOpen(true);
  };

  const handleAddEmployee = () => {
    addEmployeeMutation.mutate({
      projectId,
      employeeId: parseInt(employeeForm.employeeId),
      salaryPercentage: parseFloat(employeeForm.salaryPercentage),
      notes: employeeForm.notes || undefined,
    });
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return;
    updateEmployeeMutation.mutate({
      id: editingEmployee.id,
      salaryPercentage: parseFloat(employeeForm.salaryPercentage),
      notes: employeeForm.notes || undefined,
    });
  };

  const handleRemoveEmployee = (id: number) => {
    if (confirm("هل أنت متأكد من إزالة هذا الموظف من المشروع؟")) {
      removeEmployeeMutation.mutate({ id });
    }
  };

  const openEditRevenueDialog = (revenue: any) => {
    setEditingRevenue(revenue);
    setRevenueForm({
      amount: revenue.amount,
      description: revenue.description,
      revenueDate: typeof revenue.revenueDate === 'string' 
        ? revenue.revenueDate.split("T")[0] 
        : new Date(revenue.revenueDate).toISOString().split("T")[0],
      category: revenue.category || "",
      notes: revenue.notes || "",
    });
    setIsRevenueDialogOpen(true);
  };

  const openEditExpenseDialog = (expense: any) => {
    setEditingExpense(expense);
    setExpenseForm({
      amount: expense.amount,
      description: expense.description,
      expenseDate: typeof expense.expenseDate === 'string' 
        ? expense.expenseDate.split("T")[0] 
        : new Date(expense.expenseDate).toISOString().split("T")[0],
      category: expense.category,
      notes: expense.notes || "",
    });
    setIsExpenseDialogOpen(true);
  };

  const handleCreateRevenue = () => {
    createRevenueMutation.mutate({
      projectId,
      amount: revenueForm.amount,
      description: revenueForm.description,
      revenueDate: revenueForm.revenueDate,
      category: revenueForm.category || undefined,
      notes: revenueForm.notes || undefined,
    });
  };

  const handleUpdateRevenue = () => {
    if (!editingRevenue) return;
    updateRevenueMutation.mutate({
      id: editingRevenue.id,
      amount: revenueForm.amount,
      description: revenueForm.description,
      revenueDate: revenueForm.revenueDate,
      category: revenueForm.category || undefined,
      notes: revenueForm.notes || undefined,
    });
  };

  const handleDeleteRevenue = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الإيراد؟")) {
      deleteRevenueMutation.mutate({ id });
    }
  };

  const handleCreateExpense = () => {
    createExpenseMutation.mutate({
      projectId,
      amount: expenseForm.amount,
      description: expenseForm.description,
      expenseDate: expenseForm.expenseDate,
      category: expenseForm.category,
      notes: expenseForm.notes || undefined,
    });
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) return;
    updateExpenseMutation.mutate({
      id: editingExpense.id,
      amount: expenseForm.amount,
      description: expenseForm.description,
      expenseDate: expenseForm.expenseDate,
      category: expenseForm.category,
      notes: expenseForm.notes || undefined,
    });
  };

  const handleDeleteExpense = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      deleteExpenseMutation.mutate({ id });
    }
  };

  // Generate years array
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

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

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">جاري التحميل...</div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground mb-4">المشروع غير موجود</p>
          <Button onClick={() => setLocation("/projects")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للمشاريع
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalRevenue = financialSummary?.totalRevenue || 0;
  const totalExpenses = financialSummary?.totalExpenses || 0;
  const netProfit = financialSummary?.netProfit || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/projects")}>
              <ArrowLeft className="h-4 w-4 ml-1" />
              رجوع
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {project.name}
              </h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </div>
          <Badge className={project.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {project.status === "active" ? "نشط" : project.status === "completed" ? "مكتمل" : "غير نشط"}
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
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
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                إجمالي الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalRevenue.toLocaleString()} ر.س.
              </div>
              <p className="text-xs text-muted-foreground">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                إجمالي المصروفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalExpenses.toLocaleString()} ر.س.
              </div>
              <p className="text-xs text-muted-foreground">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                صافي الربح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {netProfit.toLocaleString()} ر.س.
              </div>
              <p className="text-xs text-muted-foreground">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Yearly Stats */}
        {yearlyStats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إحصائيات السنة {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {yearlyStats.totalRevenue.toLocaleString()} ر.س.
                  </div>
                  <div className="text-sm text-muted-foreground">إجمالي الإيرادات السنوية</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    {yearlyStats.totalExpenses.toLocaleString()} ر.س.
                  </div>
                  <div className="text-sm text-muted-foreground">إجمالي المصروفات السنوية</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className={`text-xl font-bold ${yearlyStats.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {yearlyStats.netProfit.toLocaleString()} ر.س.
                  </div>
                  <div className="text-sm text-muted-foreground">صافي الربح السنوي</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Revenues, Expenses and Employees */}
        <Tabs defaultValue="revenues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenues">الإيرادات</TabsTrigger>
            <TabsTrigger value="expenses">المصروفات</TabsTrigger>
            <TabsTrigger value="employees">الموظفين</TabsTrigger>
          </TabsList>

          {/* Revenues Tab */}
          <TabsContent value="revenues" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">إيرادات المشروع</h3>
              <Dialog open={isRevenueDialogOpen} onOpenChange={(open) => {
                setIsRevenueDialogOpen(open);
                if (!open) {
                  setEditingRevenue(null);
                  resetRevenueForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={resetRevenueForm}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة إيراد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingRevenue ? "تعديل الإيراد" : "إضافة إيراد جديد"}</DialogTitle>
                    <DialogDescription>
                      {editingRevenue ? "تعديل بيانات الإيراد" : "أدخل بيانات الإيراد الجديد"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="revenue-amount">المبلغ (ر.س.)</Label>
                      <Input
                        id="revenue-amount"
                        type="number"
                        step="0.01"
                        value={revenueForm.amount}
                        onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="revenue-description">الوصف</Label>
                      <Input
                        id="revenue-description"
                        value={revenueForm.description}
                        onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                        placeholder="وصف الإيراد..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="revenue-date">التاريخ</Label>
                      <Input
                        id="revenue-date"
                        type="date"
                        value={revenueForm.revenueDate}
                        onChange={(e) => setRevenueForm({ ...revenueForm, revenueDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="revenue-category">التصنيف (اختياري)</Label>
                      <Input
                        id="revenue-category"
                        value={revenueForm.category}
                        onChange={(e) => setRevenueForm({ ...revenueForm, category: e.target.value })}
                        placeholder="مثال: اشتراكات، تبرعات..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="revenue-notes">ملاحظات (اختياري)</Label>
                      <Textarea
                        id="revenue-notes"
                        value={revenueForm.notes}
                        onChange={(e) => setRevenueForm({ ...revenueForm, notes: e.target.value })}
                        placeholder="ملاحظات إضافية..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRevenueDialogOpen(false)}>إلغاء</Button>
                    <Button 
                      onClick={editingRevenue ? handleUpdateRevenue : handleCreateRevenue}
                      disabled={!revenueForm.amount || !revenueForm.description || createRevenueMutation.isPending || updateRevenueMutation.isPending}
                    >
                      {createRevenueMutation.isPending || updateRevenueMutation.isPending 
                        ? "جاري الحفظ..." 
                        : editingRevenue ? "حفظ التغييرات" : "إضافة"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {revenuesLoading ? (
              <div className="text-center py-10">جاري التحميل...</div>
            ) : revenues.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد إيرادات لهذا الشهر</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوصف</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenues.map((revenue) => (
                      <TableRow key={revenue.id}>
                        <TableCell className="font-medium">{revenue.description}</TableCell>
                        <TableCell>
                          {new Date(revenue.revenueDate).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>{revenue.category || "-"}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {Number(revenue.amount).toLocaleString()} ر.س.
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditRevenueDialog(revenue)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDeleteRevenue(revenue.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">مصروفات المشروع</h3>
              <Dialog open={isExpenseDialogOpen} onOpenChange={(open) => {
                setIsExpenseDialogOpen(open);
                if (!open) {
                  setEditingExpense(null);
                  resetExpenseForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={resetExpenseForm}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مصروف
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? "تعديل المصروف" : "إضافة مصروف جديد"}</DialogTitle>
                    <DialogDescription>
                      {editingExpense ? "تعديل بيانات المصروف" : "أدخل بيانات المصروف الجديد"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="expense-amount">المبلغ (ر.س.)</Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-description">الوصف</Label>
                      <Input
                        id="expense-description"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        placeholder="وصف المصروف..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-date">التاريخ</Label>
                      <Input
                        id="expense-date"
                        type="date"
                        value={expenseForm.expenseDate}
                        onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-category">التصنيف</Label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(value: "salaries" | "materials" | "marketing" | "operations" | "other") => 
                          setExpenseForm({ ...expenseForm, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salaries">رواتب</SelectItem>
                          <SelectItem value="materials">مواد</SelectItem>
                          <SelectItem value="marketing">تسويق</SelectItem>
                          <SelectItem value="operations">تشغيل</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-notes">ملاحظات (اختياري)</Label>
                      <Textarea
                        id="expense-notes"
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                        placeholder="ملاحظات إضافية..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>إلغاء</Button>
                    <Button 
                      onClick={editingExpense ? handleUpdateExpense : handleCreateExpense}
                      disabled={!expenseForm.amount || !expenseForm.description || createExpenseMutation.isPending || updateExpenseMutation.isPending}
                    >
                      {createExpenseMutation.isPending || updateExpenseMutation.isPending 
                        ? "جاري الحفظ..." 
                        : editingExpense ? "حفظ التغييرات" : "إضافة"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {expensesLoading ? (
              <div className="text-center py-10">جاري التحميل...</div>
            ) : expenses.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد مصروفات لهذا الشهر</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوصف</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          {new Date(expense.expenseDate).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {expenseCategoryLabels[expense.category] || expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {Number(expense.amount).toLocaleString()} ر.س.
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditExpenseDialog(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            {/* Employee Costs Summary */}
            {employeeCosts && employeeCosts.employeeCount > 0 && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">إجمالي تكلفة الموظفين الشهرية</span>
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-purple-600">
                        {employeeCosts.totalCost.toLocaleString()} ر.س.
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employeeCosts.employeeCount} موظف
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">موظفو المشروع</h3>
              <Dialog open={isEmployeeDialogOpen} onOpenChange={(open) => {
                setIsEmployeeDialogOpen(open);
                if (!open) {
                  setEditingEmployee(null);
                  resetEmployeeForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={resetEmployeeForm}>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة موظف
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingEmployee ? "تعديل بيانات الموظف" : "إضافة موظف للمشروع"}</DialogTitle>
                    <DialogDescription>
                      {editingEmployee ? "تعديل نسبة الراتب المحسوبة على المشروع" : "اختر الموظف وحدد نسبة الراتب"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!editingEmployee && (
                      <div className="space-y-2">
                        <Label htmlFor="employee-select">الموظف</Label>
                        <Select
                          value={employeeForm.employeeId}
                          onValueChange={(value) => setEmployeeForm({ ...employeeForm, employeeId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableEmployees.map((emp: any) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.name} - {Number(emp.salary || 0).toLocaleString()} ر.س.
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {availableEmployees.length === 0 && (
                          <p className="text-sm text-muted-foreground">لا يوجد موظفين متاحين للإضافة</p>
                        )}
                      </div>
                    )}
                    {editingEmployee && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">{editingEmployee.employee?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          الراتب: {Number(editingEmployee.employee?.salary || 0).toLocaleString()} ر.س.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="salary-percentage">نسبة الراتب (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="salary-percentage"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={employeeForm.salaryPercentage}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, salaryPercentage: e.target.value })}
                          placeholder="100"
                        />
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        النسبة المئوية من راتب الموظف التي ستُحسب على المشروع
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-notes">ملاحظات (اختياري)</Label>
                      <Textarea
                        id="employee-notes"
                        value={employeeForm.notes}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, notes: e.target.value })}
                        placeholder="ملاحظات إضافية..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>إلغاء</Button>
                    <Button 
                      onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                      disabled={(!editingEmployee && !employeeForm.employeeId) || addEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                    >
                      {addEmployeeMutation.isPending || updateEmployeeMutation.isPending 
                        ? "جاري الحفظ..." 
                        : editingEmployee ? "حفظ التغييرات" : "إضافة"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {employeesLoading ? (
              <div className="text-center py-10">جاري التحميل...</div>
            ) : projectEmployees.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا يوجد موظفين معينين لهذا المشروع</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    أضف موظفين لحساب تكلفة الرواتب على المشروع
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الراتب الكامل</TableHead>
                      <TableHead>نسبة الراتب</TableHead>
                      <TableHead>التكلفة الشهرية</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectEmployees.map((emp: any) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">
                          {emp.employee?.name || "غير معروف"}
                        </TableCell>
                        <TableCell>
                          {Number(emp.employee?.salary || 0).toLocaleString()} ر.س.
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50">
                            {Number(emp.salaryPercentage)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-purple-600 font-semibold">
                          {Number(emp.calculatedCost).toLocaleString()} ر.س.
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {emp.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditEmployeeDialog(emp)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleRemoveEmployee(emp.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
