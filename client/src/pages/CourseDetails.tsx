import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowRight, Plus, Pencil, Trash2, DollarSign, Users, Receipt, 
  TrendingUp, TrendingDown, Calendar, User 
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation, useParams } from "wouter";

type ExpenseCategory = "certificates" | "instructor" | "marketing" | "tax" | "other";

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  certificates: "الشهادات",
  instructor: "المدرب",
  marketing: "التسويق",
  tax: "الضريبة",
  other: "أخرى",
};

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export default function CourseDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const courseId = parseInt(params.id || "0");

  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<number | null>(null);
  const [editingExpense, setEditingExpense] = useState<number | null>(null);
  const [editingEnrollment, setEditingEnrollment] = useState<number | null>(null);

  const [feeForm, setFeeForm] = useState({ name: "", amount: "", description: "" });
  const [expenseForm, setExpenseForm] = useState({ 
    category: "other" as ExpenseCategory, 
    amount: "", 
    description: "", 
    expenseDate: new Date().toISOString().split('T')[0] 
  });
  const [enrollForm, setEnrollForm] = useState({
    feeId: "",
    traineeCount: "1",
    paidAmount: "",
    enrollmentDate: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: course, isLoading: courseLoading } = trpc.courses.getById.useQuery({ id: courseId });
  const { data: fees, isLoading: feesLoading } = trpc.courseFees.list.useQuery({ courseId });
  const { data: expenses, isLoading: expensesLoading } = trpc.expenses.listByCourse.useQuery({ courseId });
  const { data: enrollments, isLoading: enrollmentsLoading } = trpc.enrollments.listByCourse.useQuery({ courseId });
  const { data: statistics, isLoading: statsLoading } = trpc.courses.getStatistics.useQuery({ courseId });

  // Fee mutations
  const createFeeMutation = trpc.courseFees.create.useMutation({
    onSuccess: () => {
      utils.courseFees.list.invalidate({ courseId });
      toast.success("تم إضافة الرسوم بنجاح");
      setFeeForm({ name: "", amount: "", description: "" });
      setFeeDialogOpen(false);
    },
  });

  const updateFeeMutation = trpc.courseFees.update.useMutation({
    onSuccess: () => {
      utils.courseFees.list.invalidate({ courseId });
      toast.success("تم تحديث الرسوم بنجاح");
      setEditingFee(null);
      setFeeForm({ name: "", amount: "", description: "" });
      setFeeDialogOpen(false);
    },
  });

  const deleteFeeMutation = trpc.courseFees.delete.useMutation({
    onSuccess: () => {
      utils.courseFees.list.invalidate({ courseId });
      toast.success("تم حذف الرسوم بنجاح");
    },
  });

  // Expense mutations
  const createExpenseMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      utils.expenses.listByCourse.invalidate({ courseId });
      utils.courses.getStatistics.invalidate({ courseId });
      toast.success("تم إضافة المصروف بنجاح");
      setExpenseForm({ category: "other", amount: "", description: "", expenseDate: new Date().toISOString().split('T')[0] });
      setExpenseDialogOpen(false);
    },
  });

  const updateExpenseMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      utils.expenses.listByCourse.invalidate({ courseId });
      utils.courses.getStatistics.invalidate({ courseId });
      toast.success("تم تحديث المصروف بنجاح");
      setEditingExpense(null);
      setExpenseForm({ category: "other", amount: "", description: "", expenseDate: new Date().toISOString().split('T')[0] });
      setExpenseDialogOpen(false);
    },
  });

  const deleteExpenseMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.listByCourse.invalidate({ courseId });
      utils.courses.getStatistics.invalidate({ courseId });
      toast.success("تم حذف المصروف بنجاح");
    },
  });

  // Enrollment mutations (statistical)
  const createEnrollmentMutation = trpc.enrollments.create.useMutation({
    onSuccess: () => {
      utils.enrollments.listByCourse.invalidate({ courseId });
      utils.courses.getStatistics.invalidate({ courseId });
      toast.success("تم إضافة التسجيل بنجاح");
      setEnrollForm({
        feeId: "",
        traineeCount: "1",
        paidAmount: "",
        enrollmentDate: new Date().toISOString().split('T')[0],
        notes: "",
      });
      setEnrollDialogOpen(false);
    },
  });

  const updateEnrollmentMutation = trpc.enrollments.update.useMutation({
    onSuccess: () => {
      utils.enrollments.listByCourse.invalidate({ courseId });
      utils.courses.getStatistics.invalidate({ courseId });
      toast.success("تم تحديث التسجيل بنجاح");
      setEditingEnrollment(null);
      setEnrollForm({
        feeId: "",
        traineeCount: "1",
        paidAmount: "",
        enrollmentDate: new Date().toISOString().split('T')[0],
        notes: "",
      });
      setEnrollDialogOpen(false);
    },
  });

  const deleteEnrollmentMutation = trpc.enrollments.delete.useMutation({
    onSuccess: () => {
      utils.enrollments.listByCourse.invalidate({ courseId });
      utils.courses.getStatistics.invalidate({ courseId });
      toast.success("تم حذف التسجيل بنجاح");
    },
  });

  const handleFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.name || !feeForm.amount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (editingFee) {
      updateFeeMutation.mutate({ id: editingFee, ...feeForm });
    } else {
      createFeeMutation.mutate({ courseId, ...feeForm });
    }
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.expenseDate) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense, ...expenseForm });
    } else {
      createExpenseMutation.mutate({ courseId, ...expenseForm });
    }
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.traineeCount || !enrollForm.paidAmount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (editingEnrollment) {
      updateEnrollmentMutation.mutate({
        id: editingEnrollment,
        traineeCount: parseInt(enrollForm.traineeCount),
        paidAmount: enrollForm.paidAmount,
        enrollmentDate: enrollForm.enrollmentDate,
        notes: enrollForm.notes,
      });
    } else {
      if (!enrollForm.feeId) {
        toast.error("يرجى اختيار نوع الرسوم");
        return;
      }
      createEnrollmentMutation.mutate({
        courseId,
        feeId: parseInt(enrollForm.feeId),
        traineeCount: parseInt(enrollForm.traineeCount),
        paidAmount: enrollForm.paidAmount,
        enrollmentDate: enrollForm.enrollmentDate,
        notes: enrollForm.notes,
      });
    }
  };

  const handleEditEnrollment = (enrollment: { id: number; traineeCount: number; paidAmount: string; enrollmentDate: Date | string; notes: string | null }, feeId: number) => {
    setEditingEnrollment(enrollment.id);
    setEnrollForm({
      feeId: feeId.toString(),
      traineeCount: enrollment.traineeCount.toString(),
      paidAmount: enrollment.paidAmount,
      enrollmentDate: new Date(enrollment.enrollmentDate).toISOString().split('T')[0],
      notes: enrollment.notes || "",
    });
    setEnrollDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (courseLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">الدورة غير موجودة</h2>
          <Button onClick={() => setLocation("/courses")}>العودة للدورات</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/courses")}>
            <ArrowRight className="h-4 w-4 ml-1" />
            العودة
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                {course.name}
              </h1>
              {course.courseCode && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {course.courseCode}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {course.instructorName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(course.startDate)} - {formatDate(course.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                المسجلين
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{statistics?.totalEnrollments || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(statistics?.totalRevenue || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                المصروفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-destructive">
                  {formatCurrency(statistics?.totalExpenses || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                صافي الربح
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className={`text-3xl font-bold ${(statistics?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(statistics?.netProfit || 0)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="fees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="fees">رسوم الدورة</TabsTrigger>
            <TabsTrigger value="enrollments">إحصائيات التسجيل</TabsTrigger>
            <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          </TabsList>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">رسوم الاشتراك</h3>
              <Dialog open={feeDialogOpen} onOpenChange={(open) => {
                setFeeDialogOpen(open);
                if (!open) {
                  setEditingFee(null);
                  setFeeForm({ name: "", amount: "", description: "" });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    إضافة رسوم
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingFee ? "تعديل الرسوم" : "إضافة رسوم جديدة"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFeeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم الرسوم *</Label>
                      <Input
                        value={feeForm.name}
                        onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                        placeholder="مثال: السعر الأساسي، خصم الطلاب"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المبلغ (ريال) *</Label>
                      <Input
                        type="number"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الوصف</Label>
                      <Textarea
                        value={feeForm.description}
                        onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                        placeholder="وصف اختياري"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">إلغاء</Button>
                      </DialogClose>
                      <Button type="submit">حفظ</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {feesLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : fees && fees.length > 0 ? (
              <div className="space-y-2">
                {fees.map((fee) => (
                  <Card key={fee.id} className="border-border/50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-medium">{fee.name}</h4>
                        {fee.description && (
                          <p className="text-sm text-muted-foreground">{fee.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold">{formatCurrency(fee.amount)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingFee(fee.id);
                            setFeeForm({
                              name: fee.name,
                              amount: fee.amount,
                              description: fee.description || "",
                            });
                            setFeeDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteFeeMutation.mutate({ id: fee.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-8">
                  <p className="text-muted-foreground mb-4">لم يتم إضافة رسوم بعد</p>
                  <Button size="sm" onClick={() => setFeeDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة رسوم
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Enrollments Tab (Statistical) */}
          <TabsContent value="enrollments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">إحصائيات التسجيل</h3>
              <Dialog open={enrollDialogOpen} onOpenChange={(open) => {
                  setEnrollDialogOpen(open);
                  if (!open) {
                    setEditingEnrollment(null);
                    setEnrollForm({
                      feeId: "",
                      traineeCount: "1",
                      paidAmount: "",
                      enrollmentDate: new Date().toISOString().split('T')[0],
                      notes: "",
                    });
                  }
                }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1" disabled={!fees || fees.length === 0}>
                    <Plus className="h-4 w-4" />
                    إضافة تسجيل
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingEnrollment ? "تعديل إحصائية التسجيل" : "إضافة إحصائية تسجيل جديدة"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEnrollSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>نوع الرسوم {!editingEnrollment && "*"}</Label>
                      <Select
                        value={enrollForm.feeId}
                        onValueChange={(v) => {
                          const selectedFee = fees?.find(f => f.id.toString() === v);
                          setEnrollForm({ 
                            ...enrollForm, 
                            feeId: v,
                            paidAmount: selectedFee?.amount || ""
                          });
                        }}
                        disabled={!!editingEnrollment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الرسوم" />
                        </SelectTrigger>
                        <SelectContent>
                          {fees?.map((fee) => (
                            <SelectItem key={fee.id} value={fee.id.toString()}>
                              {fee.name} - {formatCurrency(fee.amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {editingEnrollment && (
                        <p className="text-xs text-muted-foreground">لا يمكن تغيير نوع الرسوم عند التعديل</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>عدد المتدربين *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={enrollForm.traineeCount}
                        onChange={(e) => setEnrollForm({ ...enrollForm, traineeCount: e.target.value })}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المبلغ المدفوع لكل متدرب *</Label>
                      <Input
                        type="number"
                        value={enrollForm.paidAmount}
                        onChange={(e) => setEnrollForm({ ...enrollForm, paidAmount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ التسجيل</Label>
                      <Input
                        type="date"
                        value={enrollForm.enrollmentDate}
                        onChange={(e) => setEnrollForm({ ...enrollForm, enrollmentDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Textarea
                        value={enrollForm.notes}
                        onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                        placeholder="ملاحظات اختيارية"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">إلغاء</Button>
                      </DialogClose>
                      <Button type="submit">{editingEnrollment ? "حفظ التعديلات" : "إضافة"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {enrollmentsLoading ? (
              <Skeleton className="h-48" />
            ) : enrollments && enrollments.length > 0 ? (
              <Card className="border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نوع الرسوم</TableHead>
                      <TableHead>عدد المتدربين</TableHead>
                      <TableHead>المبلغ لكل متدرب</TableHead>
                      <TableHead>إجمالي الإيراد</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((item) => (
                      <TableRow key={item.enrollment.id}>
                        <TableCell className="font-medium">{item.fee.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.enrollment.traineeCount} متدرب</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(item.enrollment.paidAmount)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(item.enrollment.traineeCount * parseFloat(item.enrollment.paidAmount))}
                        </TableCell>
                        <TableCell>{formatDate(item.enrollment.enrollmentDate)}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[150px] truncate">
                          {item.enrollment.notes || "-"}
                        </TableCell>
                        <TableCell className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEnrollment(item.enrollment, item.fee.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteEnrollmentMutation.mutate({ id: item.enrollment.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {!fees || fees.length === 0 
                      ? "يجب إضافة رسوم أولاً قبل إضافة إحصائيات التسجيل" 
                      : "لم يتم إضافة أي تسجيلات بعد"}
                  </p>
                  {fees && fees.length > 0 && (
                    <Button size="sm" onClick={() => setEnrollDialogOpen(true)}>
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة تسجيل
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">المصروفات</h3>
              <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
                setExpenseDialogOpen(open);
                if (!open) {
                  setEditingExpense(null);
                  setExpenseForm({ category: "other", amount: "", description: "", expenseDate: new Date().toISOString().split('T')[0] });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    إضافة مصروف
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? "تعديل المصروف" : "إضافة مصروف جديد"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>الفئة *</Label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(v: ExpenseCategory) => setExpenseForm({ ...expenseForm, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(expenseCategoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>المبلغ (ريال) *</Label>
                      <Input
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>التاريخ *</Label>
                      <Input
                        type="date"
                        value={expenseForm.expenseDate}
                        onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الوصف</Label>
                      <Textarea
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">إلغاء</Button>
                      </DialogClose>
                      <Button type="submit">حفظ</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {expensesLoading ? (
              <Skeleton className="h-48" />
            ) : expenses && expenses.length > 0 ? (
              <Card className="border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفئة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {expenseCategoryLabels[expense.category as ExpenseCategory]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-destructive">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{expense.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingExpense(expense.id);
                                setExpenseForm({
                                  category: expense.category as ExpenseCategory,
                                  amount: expense.amount,
                                  description: expense.description || "",
                                  expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
                                });
                                setExpenseDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => deleteExpenseMutation.mutate({ id: expense.id })}
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
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-8">
                  <p className="text-muted-foreground mb-4">لم يتم إضافة مصروفات بعد</p>
                  <Button size="sm" onClick={() => setExpenseDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة مصروف
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
