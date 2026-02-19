import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Target, Plus, Edit, Trash2, Gift, Check, X, 
  TrendingUp, Award, DollarSign, Clock, Pencil
} from "lucide-react";

// أنواع مستهدفات خدمة العملاء (الأساسية)
const customerServiceTargetTypes = [
  "targeted_customers",
  "confirmed_customers",
  "registered_customers",
  "services_sold",
  "retargeting",
];

const targetTypeLabels: Record<string, string> = {
  // مستهدفات خدمة العملاء
  targeted_customers: "العملاء المستهدفين",
  confirmed_customers: "العملاء المؤكدين",
  registered_customers: "العملاء المسجلين في النموذج",
  services_sold: "الخدمات المباعة",
  retargeting: "إعادة الاستهداف",
  // مستهدفات أخرى
  daily_calls: "المكالمات اليومية",
  campaigns: "الحملات",
  leads_generated: "العملاء المحتملين",
  conversion_rate: "معدل التحويل",
  features_completed: "المهام المنجزة",
  bugs_fixed: "الأخطاء المصلحة",
  sales_amount: "مبلغ المبيعات",
  customer_satisfaction: "رضا العملاء",
  attendance_hours: "ساعات الحضور",
  contacted_old_customers: "العملاء القدامى المتواصل معهم",
  other: "أخرى",
};

const periodLabels: Record<string, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
  quarterly: "ربع سنوي",
  yearly: "سنوي",
};

const statusLabels: Record<string, string> = {
  in_progress: "قيد التنفيذ",
  achieved: "تم تحقيقه",
  not_achieved: "لم يتحقق",
};

const statusColors: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-800",
  achieved: "bg-green-100 text-green-800",
  not_achieved: "bg-red-100 text-red-800",
};

const rewardStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  approved: "معتمد",
  paid: "مدفوع",
  rejected: "مرفوض",
};

const rewardStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// مكون تعديل المستهدف
function EditTargetDialog({ 
  target, 
  onUpdate, 
  isPending 
}: { 
  target: any; 
  onUpdate: (data: { id: number; currentValue?: string; targetValue?: string; status?: "in_progress" | "achieved" | "not_achieved" }) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(target.currentValue || "0");
  const [targetValue, setTargetValue] = useState(target.targetValue || "0");
  const [status, setStatus] = useState(target.status || "in_progress");

  const handleSave = () => {
    onUpdate({
      id: target.id,
      currentValue,
      targetValue,
      status,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="تعديل"
          className="text-blue-500 hover:text-blue-700"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل المستهدف</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>القيمة الحالية (المحقق)</Label>
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>القيمة المستهدفة</Label>
            <Input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label>الحالة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="achieved">تم تحقيقه</SelectItem>
                <SelectItem value="not_achieved">لم يتحقق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeeTargets() {
  const [activeTab, setActiveTab] = useState("targets");
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();
  
  // Form state for targets
  const [targetForm, setTargetForm] = useState({
    employeeId: 0,
    targetType: "confirmed_customers" as const,
    customName: "",
    targetValue: "",
    currentValue: "0",
    period: "monthly" as const,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    rewardAmount: "",
  });

  const utils = trpc.useUtils();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: targets = [], isLoading: targetsLoading } = trpc.employeeTargets.list.useQuery({
    employeeId: selectedEmployeeId,
    year: selectedYear,
    month: selectedMonth,
  });
  const { data: rewards = [], isLoading: rewardsLoading } = trpc.employeeRewards.list.useQuery();
  const { data: rewardsStats } = trpc.employeeRewards.stats.useQuery();

  const createTargetMutation = trpc.employeeTargets.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المستهدف بنجاح");
      utils.employeeTargets.list.invalidate();
      setIsAddTargetOpen(false);
      resetTargetForm();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة المستهدف");
    },
  });

  const updateTargetMutation = trpc.employeeTargets.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المستهدف بنجاح");
      utils.employeeTargets.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث المستهدف");
    },
  });

  const deleteTargetMutation = trpc.employeeTargets.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستهدف بنجاح");
      utils.employeeTargets.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف المستهدف");
    },
  });

  const approveRewardMutation = trpc.employeeRewards.approve.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد المكافأة بنجاح");
      utils.employeeRewards.list.invalidate();
      utils.employeeRewards.stats.invalidate();
    },
  });

  const markPaidMutation = trpc.employeeRewards.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدفع بنجاح");
      utils.employeeRewards.list.invalidate();
      utils.employeeRewards.stats.invalidate();
    },
  });

  const rejectRewardMutation = trpc.employeeRewards.reject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض المكافأة");
      utils.employeeRewards.list.invalidate();
      utils.employeeRewards.stats.invalidate();
    },
  });

  const resetTargetForm = () => {
    setTargetForm({
      employeeId: 0,
      targetType: "confirmed_customers",
      customName: "",
      targetValue: "",
      currentValue: "0",
      period: "monthly",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      rewardAmount: "",
    });
  };

  const handleCreateTarget = () => {
    if (!targetForm.employeeId || !targetForm.targetValue) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createTargetMutation.mutate(targetForm);
  };

  const getProgressPercentage = (current: string, target: string) => {
    const currentVal = parseFloat(current) || 0;
    const targetVal = parseFloat(target) || 1;
    return Math.min(100, Math.round((currentVal / targetVal) * 100));
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">المستهدفات والمكافآت</h1>
            <p className="text-muted-foreground">إدارة مستهدفات الموظفين ومكافآتهم</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المكافآت</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewardsStats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{rewardsStats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معتمدة</CardTitle>
              <Check className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{rewardsStats?.approved || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المدفوع</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(rewardsStats?.totalAmount || 0).toLocaleString()} ر.س.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="targets">
              <Target className="ml-2 h-4 w-4" />
              المستهدفات
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Gift className="ml-2 h-4 w-4" />
              المكافآت
            </TabsTrigger>
          </TabsList>

          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-4">
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
              <Dialog open={isAddTargetOpen} onOpenChange={setIsAddTargetOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetTargetForm}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة مستهدف
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>إضافة مستهدف جديد</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>الموظف *</Label>
                      <Select
                        value={targetForm.employeeId.toString()}
                        onValueChange={(v) => setTargetForm({ ...targetForm, employeeId: parseInt(v) })}
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
                      <Label>نوع المستهدف *</Label>
                      <Select
                        value={targetForm.targetType}
                        onValueChange={(v: any) => setTargetForm({ ...targetForm, targetType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* مستهدفات خدمة العملاء */}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">مستهدفات خدمة العملاء</div>
                          {customerServiceTargetTypes.map((key) => (
                            <SelectItem key={key} value={key}>
                              {targetTypeLabels[key]}
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">مستهدفات أخرى</div>
                          {Object.entries(targetTypeLabels)
                            .filter(([key]) => !customerServiceTargetTypes.includes(key))
                            .map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>القيمة المستهدفة *</Label>
                        <Input
                          type="number"
                          value={targetForm.targetValue}
                          onChange={(e) => setTargetForm({ ...targetForm, targetValue: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>مبلغ المكافأة</Label>
                        <Input
                          type="number"
                          value={targetForm.rewardAmount}
                          onChange={(e) => setTargetForm({ ...targetForm, rewardAmount: e.target.value })}
                          placeholder="500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>الشهر</Label>
                        <Select
                          value={targetForm.month.toString()}
                          onValueChange={(v) => setTargetForm({ ...targetForm, month: parseInt(v) })}
                        >
                          <SelectTrigger>
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
                      <div className="space-y-2">
                        <Label>السنة</Label>
                        <Select
                          value={targetForm.year.toString()}
                          onValueChange={(v) => setTargetForm({ ...targetForm, year: parseInt(v) })}
                        >
                          <SelectTrigger>
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
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button onClick={handleCreateTarget} disabled={createTargetMutation.isPending}>
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Targets List */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة المستهدفات</CardTitle>
                <CardDescription>
                  {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {targetsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                ) : targets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مستهدفات لهذه الفترة
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الموظف</TableHead>
                        <TableHead className="text-right">نوع المستهدف</TableHead>
                        <TableHead className="text-right">التقدم</TableHead>
                        <TableHead className="text-right">المكافأة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {targets.map((target: any) => {
                        const progress = getProgressPercentage(target.currentValue, target.targetValue);
                        return (
                          <TableRow key={target.id}>
                            <TableCell className="font-medium">
                              {getEmployeeName(target.employeeId)}
                            </TableCell>
                            <TableCell>
                              {targetTypeLabels[target.targetType] || target.customName || target.targetType}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{target.currentValue || 0}</span>
                                  <span>{target.targetValue}</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <div className="text-xs text-muted-foreground text-center">
                                  {progress}%
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {target.rewardAmount
                                ? `${parseFloat(target.rewardAmount).toLocaleString()} ر.س.`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[target.status] || ""}>
                                {statusLabels[target.status] || target.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <EditTargetDialog
                                  target={target}
                                  onUpdate={(data) => updateTargetMutation.mutate(data)}
                                  isPending={updateTargetMutation.isPending}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا المستهدف؟")) {
                                      deleteTargetMutation.mutate({ id: target.id });
                                    }
                                  }}
                                  title="حذف"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>قائمة المكافآت</CardTitle>
                <CardDescription>إدارة مكافآت الموظفين</CardDescription>
              </CardHeader>
              <CardContent>
                {rewardsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                ) : rewards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مكافآت بعد
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الموظف</TableHead>
                        <TableHead className="text-right">السبب</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rewards.map((reward: any) => (
                        <TableRow key={reward.id}>
                          <TableCell className="font-medium">
                            {getEmployeeName(reward.employeeId)}
                          </TableCell>
                          <TableCell>{reward.reason}</TableCell>
                          <TableCell className="font-bold text-green-600">
                            {parseFloat(reward.amount).toLocaleString()} ر.س.
                          </TableCell>
                          <TableCell>
                            <Badge className={rewardStatusColors[reward.status] || ""}>
                              {rewardStatusLabels[reward.status] || reward.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(reward.createdAt).toLocaleDateString("ar-SA")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {reward.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => approveRewardMutation.mutate({ id: reward.id })}
                                    title="اعتماد"
                                    className="text-green-500 hover:text-green-700"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => rejectRewardMutation.mutate({ id: reward.id })}
                                    title="رفض"
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {reward.status === "approved" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markPaidMutation.mutate({ id: reward.id })}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <DollarSign className="h-4 w-4 ml-1" />
                                  تسجيل الدفع
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
