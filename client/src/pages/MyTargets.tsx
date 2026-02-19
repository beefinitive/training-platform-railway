import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Target, TrendingUp, Award, DollarSign, Calendar, 
  CheckCircle2, Clock, AlertCircle, Trophy, Loader2,
  Plus, Edit2, Trash2, ClipboardList, Save, BarChart3
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";

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
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  achieved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  not_achieved: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const rewardStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  approved: "معتمد",
  paid: "مدفوع",
  rejected: "مرفوض",
};

// حالات مراجعة الإحصائيات اليومية
const dailyStatReviewLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مؤكدة",
  rejected: "مرفوضة",
};

const dailyStatReviewColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const rewardStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function MyTargets() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("daily-stats");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDailyStatsDialog, setShowDailyStatsDialog] = useState(false);
  const [editingStatId, setEditingStatId] = useState<number | null>(null);
  
  // نموذج الإحصائيات اليومية
  const [dailyStatsForm, setDailyStatsForm] = useState({
    courseId: null as number | null,
    courseFee: 0,
    confirmedCustomers: 0,
    registeredCustomers: 0,
    targetedCustomers: 0,
    servicesSold: 0,
    salesAmount: 0,
    notes: "",
  });

  // الحصول على الموظف المرتبط بالمستخدم الحالي
  const linkedEmployeeId = (user as any)?.employeeId;
  
  // جلب قائمة الدورات النشطة
  const { data: courses = [] } = trpc.courses.list.useQuery();
  
  // جلب رسوم الدورة المختارة
  const { data: selectedCourseFees = [] } = trpc.courseFees.list.useQuery(
    { courseId: dailyStatsForm.courseId! },
    { enabled: !!dailyStatsForm.courseId }
  );
  
  // جلب قائمة الموظفين دائماً للبحث بالبريد الإلكتروني
  const { data: employees = [], isLoading: employeesLoading } = trpc.employees.list.useQuery();
  
  // الحصول على بيانات الموظف المرتبط بالـ ID
  const { data: linkedEmployee, isLoading: linkedEmployeeLoading } = trpc.employees.getById.useQuery(
    { id: linkedEmployeeId! },
    { enabled: !!linkedEmployeeId }
  );
  
  // حالة التحميل
  const employeeLoading = employeesLoading || (!!linkedEmployeeId && linkedEmployeeLoading);
  
  const currentEmployee = useMemo(() => {
    // أولوية للموظف المرتبط مباشرة بالـ ID
    if (linkedEmployeeId && linkedEmployee) return linkedEmployee;
    
    // إذا كان هناك employeeId ولكن لم يتم تحميله بعد، ابحث في القائمة
    if (linkedEmployeeId && employees.length) {
      const found = employees.find(emp => emp.id === linkedEmployeeId);
      if (found) return found;
    }
    
    // في حالة عدم وجود ربط، البحث بالبريد الإلكتروني
    if (!linkedEmployeeId && user?.email && employees.length) {
      return employees.find(emp => emp.email?.toLowerCase() === user.email?.toLowerCase());
    }
    
    return null;
  }, [linkedEmployee, linkedEmployeeId, user, employees]);

  // الحصول على مستهدفات الموظف الحالي فقط
  const { data: targets = [], isLoading: targetsLoading } = trpc.employeeTargets.list.useQuery({
    employeeId: currentEmployee?.id,
    year: selectedYear,
    month: selectedMonth,
  }, {
    enabled: !!currentEmployee?.id,
  });

  // الحصول على مكافآت الموظف الحالي
  const { data: allRewards = [], isLoading: rewardsLoading } = trpc.employeeRewards.list.useQuery();
  
  // الحصول على الإحصائيات اليومية للموظف الحالي
  const { data: dailyStats = [], isLoading: dailyStatsLoading, refetch: refetchDailyStats } = trpc.dailyStats.list.useQuery({
    employeeId: currentEmployee?.id,
    month: selectedMonth,
    year: selectedYear,
  }, {
    enabled: !!currentEmployee?.id,
  });

  // الحصول على إجمالي الإحصائيات الشهرية
  const { data: monthlyTotal, refetch: refetchMonthlyTotal } = trpc.dailyStats.monthlyTotal.useQuery({
    employeeId: currentEmployee?.id || 0,
    month: selectedMonth,
    year: selectedYear,
  }, {
    enabled: !!currentEmployee?.id,
  });

  // الحصول على إحصائية اليوم المحدد
  const { data: todayStat, refetch: refetchTodayStat } = trpc.dailyStats.getByDate.useQuery({
    employeeId: currentEmployee?.id || 0,
    date: selectedDate,
  }, {
    enabled: !!currentEmployee?.id,
  });

  const myRewards = useMemo(() => {
    if (!currentEmployee?.id) return [];
    return allRewards.filter(r => r.employeeId === currentEmployee.id);
  }, [allRewards, currentEmployee]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const totalTargets = targets.length;
    const achievedTargets = targets.filter(t => t.status === "achieved").length;
    const inProgressTargets = targets.filter(t => t.status === "in_progress").length;
    const totalRewards = myRewards.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const paidRewards = myRewards.filter(r => r.status === "paid").reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    
    const overallProgress = totalTargets > 0 
      ? targets.reduce((sum, t) => {
          const tVal = Number(t.targetValue) || 0;
          const cVal = Number(t.currentValue) || 0;
          const progress = tVal > 0 ? Math.min((cVal / tVal) * 100, 100) : 0;
          return sum + progress;
        }, 0) / totalTargets
      : 0;

    return {
      totalTargets,
      achievedTargets,
      inProgressTargets,
      totalRewards,
      paidRewards,
      overallProgress,
    };
  }, [targets, myRewards]);

  // بيانات الرسوم البيانية للمستهدفات
  const targetChartData = useMemo(() => {
    return targets.map(t => {
      const targetVal = Number(t.targetValue) || 0;
      const currentVal = Number(t.currentValue) || 0;
      const progress = targetVal > 0 ? Math.min((currentVal / targetVal) * 100, 100) : 0;
      return {
        name: t.customName || targetTypeLabels[t.targetType] || t.targetType,
        المستهدف: targetVal,
        المحقق: currentVal,
        نسبة_الإنجاز: progress,
      };
    });
  }, [targets]);

  // بيانات الرسم الدائري لنسب الإنجاز
  const progressPieData = useMemo(() => {
    if (targets.length === 0) return [];
    return targets.map(t => {
      const targetVal = Number(t.targetValue) || 0;
      const currentVal = Number(t.currentValue) || 0;
      const progress = targetVal > 0 ? Math.min((currentVal / targetVal) * 100, 100) : 0;
      return {
        name: t.customName || targetTypeLabels[t.targetType] || t.targetType,
        value: progress,
        fill: progress >= 100 ? '#22c55e' : progress >= 50 ? '#f59e0b' : '#3b82f6',
      };
    });
  }, [targets]);

  // ألوان الرسم البياني
  const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // قائمة السنوات
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  // Mutations
  const utils = trpc.useUtils();
  
  const createDailyStatMutation = trpc.dailyStats.create.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ الإحصائيات بنجاح");
      setShowDailyStatsDialog(false);
      resetForm();
      refetchDailyStats();
      refetchMonthlyTotal();
      refetchTodayStat();
      utils.employeeTargets.list.invalidate();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const updateDailyStatMutation = trpc.dailyStats.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الإحصائيات بنجاح");
      setShowDailyStatsDialog(false);
      setEditingStatId(null);
      resetForm();
      refetchDailyStats();
      refetchMonthlyTotal();
      refetchTodayStat();
      utils.employeeTargets.list.invalidate();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const deleteDailyStatMutation = trpc.dailyStats.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الإحصائية بنجاح");
      refetchDailyStats();
      refetchMonthlyTotal();
      utils.employeeTargets.list.invalidate();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const resetForm = () => {
    setDailyStatsForm({
      courseId: null,
      courseFee: 0,
      confirmedCustomers: 0,
      registeredCustomers: 0,
      targetedCustomers: 0,
      servicesSold: 0,
      salesAmount: 0,
      notes: "",
    });
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenDailyStatsDialog = (stat?: any) => {
    if (stat) {
      setEditingStatId(stat.id);
      setSelectedDate(new Date(stat.date).toISOString().split('T')[0]);
      setDailyStatsForm({
        courseId: stat.courseId || null,
        courseFee: parseFloat(stat.courseFee) || 0,
        confirmedCustomers: stat.confirmedCustomers || 0,
        registeredCustomers: stat.registeredCustomers || 0,
        targetedCustomers: stat.targetedCustomers || 0,
        servicesSold: stat.servicesSold || 0,
        salesAmount: parseFloat(stat.salesAmount) || 0,
        notes: stat.notes || "",
      });
    } else {
      setEditingStatId(null);
      resetForm();
    }
    setShowDailyStatsDialog(true);
  };

  const handleSaveDailyStat = () => {
    if (!currentEmployee?.id) return;

    const formData = {
      confirmedCustomers: dailyStatsForm.confirmedCustomers,
      registeredCustomers: dailyStatsForm.registeredCustomers,
      targetedCustomers: dailyStatsForm.targetedCustomers,
      servicesSold: dailyStatsForm.servicesSold,
      salesAmount: dailyStatsForm.salesAmount,
      notes: dailyStatsForm.notes,
      courseId: dailyStatsForm.courseId || undefined,
      courseFee: dailyStatsForm.courseFee || undefined,
    };

    if (editingStatId) {
      updateDailyStatMutation.mutate({
        id: editingStatId,
        ...formData,
      });
    } else {
      createDailyStatMutation.mutate({
        employeeId: currentEmployee.id,
        date: selectedDate,
        ...formData,
      });
    }
  };

  const handleDeleteDailyStat = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الإحصائية؟")) {
      deleteDailyStatMutation.mutate({ id });
    }
  };

  if (employeeLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold mb-2">جاري تحميل بياناتك...</h2>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentEmployee) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">لم يتم ربط حسابك بموظف</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            يرجى التواصل مع مسؤول النظام لربط حسابك ببيانات الموظف الخاصة بك.
            <br />
            <span className="text-sm">يمكن للمسؤول ربط حسابك من صفحة "إدارة المستخدمين"</span>
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              مستهدفاتي
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              مرحباً {currentEmployee.name}، تابع مستهدفاتك ومكافآتك
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex gap-3">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الشهر" />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28">
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">إجمالي المستهدفات</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.totalTargets}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">المستهدفات المحققة</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.achievedTargets}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">نسبة الإنجاز</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-1">{stats.overallProgress.toFixed(0)}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">المكافآت المستحقة</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">{stats.paidRewards.toLocaleString()} ر.س</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="daily-stats" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              الإحصائيات اليومية
            </TabsTrigger>
            <TabsTrigger value="targets" className="gap-2">
              <Target className="h-4 w-4" />
              المستهدفات
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Award className="h-4 w-4" />
              المكافآت
            </TabsTrigger>
          </TabsList>

          {/* Daily Stats Tab */}
          <TabsContent value="daily-stats" className="mt-6">
            <div className="space-y-6">
              {/* Monthly Summary */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        ملخص الشهر - {monthNames[selectedMonth - 1]} {selectedYear}
                      </CardTitle>
                      <CardDescription>إجمالي الإحصائيات اليومية للشهر الحالي</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDailyStatsDialog()} className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة إحصائية يومية
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {monthlyTotal?.confirmedCustomers || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">العملاء المؤكدين</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {monthlyTotal?.registeredCustomers || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">العملاء المسجلين</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {monthlyTotal?.targetedCustomers || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">العملاء المستهدفين</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {monthlyTotal?.servicesSold || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">الخدمات المباعة</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center col-span-2">
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {parseFloat(String(monthlyTotal?.totalRevenue || 0)).toLocaleString('ar-SA')} <span className="text-lg">ر.س</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">الإيرادات المحصّلة (مبلغ المبيعات)</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    إجمالي أيام العمل: {monthlyTotal?.totalDays || 0} يوم
                  </p>
                </CardContent>
              </Card>

              {/* Daily Stats List */}
              <Card>
                <CardHeader>
                  <CardTitle>سجل الإحصائيات اليومية</CardTitle>
                  <CardDescription>جميع الإحصائيات المسجلة خلال الشهر</CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyStatsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : dailyStats.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">لا توجد إحصائيات مسجلة لهذا الشهر</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => handleOpenDailyStatsDialog()}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة أول إحصائية
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="text-right py-3 px-4">التاريخ</th>
                            <th className="text-center py-3 px-4">المؤكدين</th>
                            <th className="text-center py-3 px-4">المسجلين</th>
                            <th className="text-center py-3 px-4">المستهدفين</th>
                            <th className="text-center py-3 px-4">الخدمات</th>
                            <th className="text-center py-3 px-4">الحالة</th>
                            <th className="text-right py-3 px-4">ملاحظات</th>
                            <th className="text-center py-3 px-4">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyStats.map((stat) => (
                            <tr key={stat.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-4 font-medium">
                                {new Date(stat.date).toLocaleDateString("ar-SA", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                                  {stat.confirmedCustomers}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                                  {stat.registeredCustomers}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded">
                                  {stat.targetedCustomers}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded">
                                  {stat.servicesSold}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge className={dailyStatReviewColors[stat.status || 'pending']}>
                                  {dailyStatReviewLabels[stat.status || 'pending']}
                                </Badge>
                                {stat.status === 'rejected' && stat.reviewNotes && (
                                  <p className="text-xs text-red-500 mt-1" title={stat.reviewNotes}>
                                    {stat.reviewNotes.length > 20 ? stat.reviewNotes.substring(0, 20) + '...' : stat.reviewNotes}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-4 max-w-[200px] truncate">
                                {stat.notes || "-"}
                              </td>
                              <td className="py-3 px-4">
                                {stat.status === 'approved' ? (
                                  <span className="text-sm text-gray-400">مؤكدة</span>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleOpenDailyStatsDialog(stat)}
                                      title="تعديل"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-500 hover:text-red-700"
                                      onClick={() => handleDeleteDailyStat(stat.id)}
                                      title="حذف"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Targets Tab */}
          <TabsContent value="targets" className="mt-6">
            {targetsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : targets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">لا توجد مستهدفات</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    لم يتم تعيين مستهدفات لك في {monthNames[selectedMonth - 1]} {selectedYear}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* قسم الرسوم البيانية */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    الرسوم البيانية للمستهدفات
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* رسم بياني شريطي - المستهدف مقابل المحقق */}
                  <Card className="border-2 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        مقارنة المستهدف بالمحقق
                      </CardTitle>
                      <CardDescription>مقارنة بين القيم المستهدفة والقيم المحققة لكل مستهدف</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <BarChart data={targetChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="المستهدف" fill="#94a3b8" name="المستهدف" />
                            <Bar dataKey="المحقق" fill="#3b82f6" name="المحقق" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* رسم دائري - نسب الإنجاز */}
                  <Card className="border-2 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        نسب الإنجاز
                      </CardTitle>
                      <CardDescription>نسبة إنجاز كل مستهدف (أخضر: 100%+، برتقالي: 50%+، أزرق: أقل من 50%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={progressPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, value }) => `${value.toFixed(0)}%`}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {progressPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'نسبة الإنجاز']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </div>

                {/* بطاقات المستهدفات */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {targets.map((target) => {
                  const targetVal = Number(target.targetValue) || 0;
                  const currentVal = Number(target.currentValue) || 0;
                  const progress = targetVal > 0 
                    ? Math.min((currentVal / targetVal) * 100, 100) 
                    : 0;
                  
                  return (
                    <Card key={target.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {target.customName || targetTypeLabels[target.targetType] || target.targetType}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {periodLabels[target.period] || target.period}
                            </CardDescription>
                          </div>
                          <Badge className={statusColors[target.status]}>
                            {statusLabels[target.status]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Progress */}
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">التقدم</span>
                              <span className="font-medium">{progress.toFixed(0)}%</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                          </div>

                          {/* Values */}
                          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-primary">
                                {target.targetType === 'sales_amount' 
                                  ? `${parseFloat(target.currentValue || '0').toLocaleString('ar-SA')} ر.س`
                                  : target.currentValue
                                }
                              </p>
                              <p className="text-xs text-gray-500">المحقق</p>
                            </div>
                            <div className="text-gray-400">/</div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                {target.targetType === 'sales_amount' 
                                  ? `${parseFloat(target.targetValue || '0').toLocaleString('ar-SA')} ر.س`
                                  : target.targetValue
                                }
                              </p>
                              <p className="text-xs text-gray-500">المستهدف</p>
                            </div>
                          </div>

                          {/* Reward */}
                          {target.rewardAmount && Number(target.rewardAmount) > 0 && (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                              <DollarSign className="h-4 w-4" />
                              <span>مكافأة: {Number(target.rewardAmount).toLocaleString()} ر.س</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </>
            )}
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="mt-6">
            {rewardsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myRewards.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Award className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">لا توجد مكافآت</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    لم تحصل على مكافآت بعد. حقق مستهدفاتك للحصول على المكافآت!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>سجل المكافآت</CardTitle>
                  <CardDescription>جميع المكافآت التي حصلت عليها</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-right py-3 px-4">السبب</th>
                          <th className="text-right py-3 px-4">المبلغ</th>
                          <th className="text-right py-3 px-4">التاريخ</th>
                          <th className="text-right py-3 px-4">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myRewards.map((reward) => (
                          <tr key={reward.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">{reward.reason || "مكافأة أداء"}</td>
                            <td className="py-3 px-4 font-medium">{reward.amount?.toLocaleString()} ر.س</td>
                            <td className="py-3 px-4">
                              {reward.createdAt ? new Date(reward.createdAt).toLocaleDateString("ar-SA") : "-"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={rewardStatusColors[reward.status]}>
                                {rewardStatusLabels[reward.status]}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Daily Stats Dialog */}
      <Dialog open={showDailyStatsDialog} onOpenChange={setShowDailyStatsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {editingStatId ? "تعديل الإحصائية اليومية" : "إضافة إحصائية يومية"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* اختيار الدورة */}
            <div className="space-y-2">
              <Label htmlFor="course">الدورة التدريبية</Label>
              <Select
                value={dailyStatsForm.courseId?.toString() || ""}
                onValueChange={(value) => {
                  if (value === "none" || !value) {
                    setDailyStatsForm(prev => ({
                      ...prev,
                      courseId: null,
                      courseFee: 0,
                    }));
                  } else {
                    setDailyStatsForm(prev => ({
                      ...prev,
                      courseId: parseInt(value),
                      courseFee: 0, // سيتم تحديثه عند جلب الرسوم
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدورة (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون دورة</SelectItem>
                  {courses.filter(c => c.status === 'active').map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dailyStatsForm.courseId && selectedCourseFees.length > 0 && (
                <div className="space-y-2">
                  <Label>رسوم الدورة</Label>
                  <Select
                    value={dailyStatsForm.courseFee.toString()}
                    onValueChange={(value) => {
                      setDailyStatsForm(prev => ({
                        ...prev,
                        courseFee: parseFloat(value) || 0,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الرسوم" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCourseFees.map((fee) => (
                        <SelectItem key={fee.id} value={fee.amount}>
                          {fee.name} - {fee.amount} ر.س
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {dailyStatsForm.courseId && dailyStatsForm.courseFee > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  رسوم الدورة: {dailyStatsForm.courseFee} ر.س | 
                  الإيراد المتوقع: {(dailyStatsForm.courseFee * dailyStatsForm.confirmedCustomers).toLocaleString()} ر.س
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!!editingStatId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confirmedCustomers">
                  {dailyStatsForm.courseId ? 'المؤكدين للتسجيل' : 'العملاء المؤكدين'}
                </Label>
                <Input
                  id="confirmedCustomers"
                  type="number"
                  min="0"
                  value={dailyStatsForm.confirmedCustomers}
                  onChange={(e) => setDailyStatsForm(prev => ({
                    ...prev,
                    confirmedCustomers: parseInt(e.target.value) || 0,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registeredCustomers">العملاء المسجلين</Label>
                <Input
                  id="registeredCustomers"
                  type="number"
                  min="0"
                  value={dailyStatsForm.registeredCustomers}
                  onChange={(e) => setDailyStatsForm(prev => ({
                    ...prev,
                    registeredCustomers: parseInt(e.target.value) || 0,
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetedCustomers">العملاء المستهدفين</Label>
                <Input
                  id="targetedCustomers"
                  type="number"
                  min="0"
                  value={dailyStatsForm.targetedCustomers}
                  onChange={(e) => setDailyStatsForm(prev => ({
                    ...prev,
                    targetedCustomers: parseInt(e.target.value) || 0,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servicesSold">الخدمات المباعة</Label>
                <Input
                  id="servicesSold"
                  type="number"
                  min="0"
                  value={dailyStatsForm.servicesSold}
                  onChange={(e) => setDailyStatsForm(prev => ({
                    ...prev,
                    servicesSold: parseInt(e.target.value) || 0,
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesAmount">مبلغ المبيعات (ر.س)</Label>
              <Input
                id="salesAmount"
                type="number"
                min="0"
                step="0.01"
                value={dailyStatsForm.salesAmount}
                onChange={(e) => setDailyStatsForm(prev => ({
                  ...prev,
                  salesAmount: parseFloat(e.target.value) || 0,
                }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={dailyStatsForm.notes}
                onChange={(e) => setDailyStatsForm(prev => ({
                  ...prev,
                  notes: e.target.value,
                }))}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDailyStatsDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveDailyStat}
              disabled={createDailyStatMutation.isPending || updateDailyStatMutation.isPending}
              className="gap-2"
            >
              {(createDailyStatMutation.isPending || updateDailyStatMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
