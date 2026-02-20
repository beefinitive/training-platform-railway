import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Target, TrendingUp, Users, DollarSign, Handshake, Lightbulb, Award, Star, Globe, Pencil, Trash2, Calendar, BarChart3, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const TARGET_TYPES = {
  direct_courses: { label: "الدورات التدريبية المباشرة", icon: Target, color: "text-blue-600" },
  new_courses: { label: "الدورات الجديدة (قوالب فريدة)", icon: Target, color: "text-teal-600" },
  recorded_courses: { label: "الدورات المسجلة", icon: Target, color: "text-indigo-600" },
  customers: { label: "أعداد العملاء", icon: Users, color: "text-green-600" },
  annual_profit: { label: "الربح السنوي", icon: DollarSign, color: "text-emerald-600", isCurrency: true },
  entity_partnerships: { label: "الشراكات مع الجهات", icon: Handshake, color: "text-purple-600" },
  individual_partnerships: { label: "الشراكات مع الأفراد", icon: Handshake, color: "text-violet-600" },
  innovative_ideas: { label: "الأفكار النوعية", icon: Lightbulb, color: "text-yellow-600" },
  service_quality: { label: "جودة تقديم الخدمة", icon: Award, color: "text-orange-600", isPercentage: true },
  customer_satisfaction: { label: "رضا العملاء", icon: Star, color: "text-pink-600", isPercentage: true },
  website_quality: { label: "جودة الموقع وتجربة العميل", icon: Globe, color: "text-cyan-600", isPercentage: true },
} as const;

type TargetType = keyof typeof TARGET_TYPES;

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const QUARTERS = ["الربع الأول", "الربع الثاني", "الربع الثالث", "الربع الرابع"];

export default function StrategicTargets() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("yearly");
  
  // Form state
  const [formType, setFormType] = useState<TargetType>("direct_courses");
  const [formCustomName, setFormCustomName] = useState("");
  const [formBaseline, setFormBaseline] = useState("");
  const [formTargetValue, setFormTargetValue] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const { data: targets, refetch: refetchTargets } = trpc.strategicTargets.list.useQuery({ year: selectedYear });
  const { data: actuals } = trpc.strategicTargets.getActuals.useQuery({ year: selectedYear });
  const { data: allYearsData, refetch: refetchAllYears } = trpc.strategicTargets.listAllYears.useQuery();
  
  // Get period-specific actuals
  const { data: monthlyActuals } = trpc.strategicTargets.getActualsByPeriod.useQuery({
    year: selectedYear,
    periodType: 'monthly',
    periodValue: selectedMonth,
  });
  
  const { data: quarterlyActuals } = trpc.strategicTargets.getActualsByPeriod.useQuery({
    year: selectedYear,
    periodType: 'quarterly',
    periodValue: selectedQuarter,
  });
  
  const createMutation = trpc.strategicTargets.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المستهدف بنجاح");
      refetchTargets();
      refetchAllYears();
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة المستهدف"),
  });

  const updateMutation = trpc.strategicTargets.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المستهدف بنجاح");
      refetchTargets();
      refetchAllYears();
      resetForm();
      setEditingTarget(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث المستهدف"),
  });

  const deleteMutation = trpc.strategicTargets.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستهدف بنجاح");
      refetchTargets();
      refetchAllYears();
    },
    onError: () => toast.error("حدث خطأ أثناء حذف المستهدف"),
  });

  const resetForm = () => {
    setFormType("direct_courses");
    setFormCustomName("");
    setFormBaseline("");
    setFormTargetValue("");
    setFormDescription("");
  };

  const handleSubmit = () => {
    if (!formTargetValue) {
      toast.error("يرجى إدخال القيمة المستهدفة");
      return;
    }

    if (editingTarget) {
      updateMutation.mutate({
        id: editingTarget.id,
        type: formType,
        customName: formCustomName || undefined,
        baseline: formBaseline || undefined,
        targetValue: formTargetValue,
        year: selectedYear,
        description: formDescription || undefined,
      });
    } else {
      createMutation.mutate({
        type: formType,
        customName: formCustomName || undefined,
        baseline: formBaseline || undefined,
        targetValue: formTargetValue,
        year: selectedYear,
        description: formDescription || undefined,
      });
    }
  };

  const handleEdit = (target: any) => {
    setEditingTarget(target);
    setFormType(target.type);
    setFormCustomName(target.customName || "");
    setFormBaseline(target.baseline || "");
    setFormTargetValue(target.targetValue);
    setFormDescription(target.description || "");
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المستهدف؟")) {
      deleteMutation.mutate({ id });
    }
  };

  // Calculate progress for yearly view
  const yearlyProgress = useMemo(() => {
    if (!targets || !actuals) return {};
    
    const progress: Record<string, { target: number; actual: number; baseline: number; percentage: number; netProgress: number }> = {};
    
    targets.forEach((t: any) => {
      const targetValue = parseFloat(t.targetValue);
      const baseline = parseFloat(t.baseline || "0");
      const actualValue = actuals[t.type as TargetType] || 0;
      const netProgress = actualValue - baseline;
      const percentage = targetValue > 0 ? Math.min((netProgress / targetValue) * 100, 100) : 0;
      
      progress[t.type] = {
        target: targetValue,
        actual: actualValue,
        baseline,
        netProgress: Math.max(0, netProgress),
        percentage: Math.max(0, percentage),
      };
    });
    
    return progress;
  }, [targets, actuals]);

  // Calculate progress for monthly view (target divided by 12)
  // خط الأساس يمثل القيمة الموجودة في بداية السنة، لذا نطرحه كاملاً من القيمة الفعلية
  const monthlyProgress = useMemo(() => {
    if (!targets || !monthlyActuals) return {};
    
    const progress: Record<string, { target: number; actual: number; baseline: number; percentage: number; netProgress: number; yearlyTarget: number }> = {};
    
    targets.forEach((t: any) => {
      const yearlyTarget = parseFloat(t.targetValue);
      const monthlyTarget = yearlyTarget / 12; // تقسيم المستهدف السنوي على 12
      const yearlyBaseline = parseFloat(t.baseline || "0");
      const actualValue = monthlyActuals[t.type as TargetType] || 0;
      // طرح خط الأساس السنوي كاملاً من القيمة الفعلية (لأن خط الأساس يمثل القيم الموجودة مسبقاً)
      const netProgress = Math.max(0, actualValue - yearlyBaseline);
      const percentage = monthlyTarget > 0 ? Math.min((netProgress / monthlyTarget) * 100, 100) : 0;
      
      progress[t.type] = {
        target: monthlyTarget,
        actual: actualValue,
        baseline: yearlyBaseline,
        netProgress,
        percentage: Math.max(0, percentage),
        yearlyTarget,
      };
    });
    
    return progress;
  }, [targets, monthlyActuals]);

  // Calculate progress for quarterly view (target divided by 4)
  // خط الأساس يمثل القيمة الموجودة في بداية السنة، لذا نطرحه كاملاً من القيمة الفعلية
  const quarterlyProgress = useMemo(() => {
    if (!targets || !quarterlyActuals) return {};
    
    const progress: Record<string, { target: number; actual: number; baseline: number; percentage: number; netProgress: number; yearlyTarget: number }> = {};
    
    targets.forEach((t: any) => {
      const yearlyTarget = parseFloat(t.targetValue);
      const quarterlyTarget = yearlyTarget / 4; // تقسيم المستهدف السنوي على 4
      const yearlyBaseline = parseFloat(t.baseline || "0");
      const actualValue = quarterlyActuals[t.type as TargetType] || 0;
      // طرح خط الأساس السنوي كاملاً من القيمة الفعلية (لأن خط الأساس يمثل القيم الموجودة مسبقاً)
      const netProgress = Math.max(0, actualValue - yearlyBaseline);
      const percentage = quarterlyTarget > 0 ? Math.min((netProgress / quarterlyTarget) * 100, 100) : 0;
      
      progress[t.type] = {
        target: quarterlyTarget,
        actual: actualValue,
        baseline: yearlyBaseline,
        netProgress,
        percentage: Math.max(0, percentage),
        yearlyTarget,
      };
    });
    
    return progress;
  }, [targets, quarterlyActuals]);

  const formatValue = (value: number, type: TargetType) => {
    const config = TARGET_TYPES[type];
    if ('isCurrency' in config && config.isCurrency) {
      return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} ر.س`;
    }
    if ('isPercentage' in config && config.isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  };

  const getTargetLabel = (target: any) => {
    if (target.customName) return target.customName;
    const config = TARGET_TYPES[target.type as TargetType];
    return config?.label || target.type;
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const renderTargetForm = (isEdit: boolean) => (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>نوع المستهدف</Label>
        <Select value={formType} onValueChange={(v) => setFormType(v as TargetType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TARGET_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>الاسم المخصص (اختياري)</Label>
        <Input
          value={formCustomName}
          onChange={(e) => setFormCustomName(e.target.value)}
          placeholder="اترك فارغاً لاستخدام الاسم الافتراضي"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>خط الأساس</Label>
          <Input
            type="number"
            value={formBaseline}
            onChange={(e) => setFormBaseline(e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">القيمة الابتدائية في بداية السنة</p>
        </div>
        <div className="space-y-2">
          <Label>القيمة المستهدفة السنوية *</Label>
          <Input
            type="number"
            value={formTargetValue}
            onChange={(e) => setFormTargetValue(e.target.value)}
            placeholder={(TARGET_TYPES[formType] as any)?.isCurrency ? "مثال: 100000" : "مثال: 50"}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Textarea
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="أي ملاحظات إضافية..."
        />
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={isEdit ? updateMutation.isPending : createMutation.isPending}>
        {isEdit 
          ? (updateMutation.isPending ? "جاري التحديث..." : "تحديث المستهدف")
          : (createMutation.isPending ? "جاري الإضافة..." : "إضافة المستهدف")
        }
      </Button>
    </div>
  );

  const renderTargetCard = (target: any, progress: any, periodLabel: string) => {
    const config = TARGET_TYPES[target.type as TargetType];
    const Icon = config?.icon || Target;
    
    return (
      <Card key={target.id} className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-muted ${config?.color || "text-gray-600"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{getTargetLabel(target)}</CardTitle>
            </div>
            {(activeTab === "yearly" || activeTab === "monthly" || activeTab === "quarterly") && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(target)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(target.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Show yearly target info for monthly/quarterly views */}
            {(activeTab === "monthly" || activeTab === "quarterly") && progress?.yearlyTarget && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                المستهدف السنوي: {formatValue(progress.yearlyTarget, target.type)}
                {activeTab === "monthly" && " ÷ 12"}
                {activeTab === "quarterly" && " ÷ 4"}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">المحقق ({periodLabel})</p>
                <p className="text-lg font-bold text-primary">
                  {formatValue(progress?.netProgress || 0, target.type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المستهدف ({periodLabel})</p>
                <p className="text-sm font-semibold">
                  {formatValue(progress?.target || 0, target.type)}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>نسبة الإنجاز</span>
                <span className={progress?.percentage >= 100 ? "text-green-600 font-bold" : progress?.percentage >= 50 ? "text-yellow-600" : "text-red-600"}>
                  {(progress?.percentage || 0).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={progress?.percentage || 0} 
                className={`h-2 ${progress?.percentage >= 100 ? "[&>div]:bg-green-600" : progress?.percentage >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"}`}
              />
            </div>
            {target.description && (
              <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                {target.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSummaryCard = (progressData: Record<string, any>, periodLabel: string) => {
    const values = Object.values(progressData);
    const achieved = values.filter((p: any) => p.percentage >= 100).length;
    const inProgress = values.filter((p: any) => p.percentage > 0 && p.percentage < 100).length;
    const notStarted = values.filter((p: any) => p.percentage === 0).length;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ملخص الأداء - {periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">إجمالي المستهدفات</p>
              <p className="text-2xl font-bold">{values.length}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">مستهدفات محققة</p>
              <p className="text-2xl font-bold text-green-600">{achieved}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
              <p className="text-2xl font-bold text-yellow-600">{inProgress}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-muted-foreground">لم تبدأ</p>
              <p className="text-2xl font-bold text-red-600">{notStarted}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">المستهدفات الاستراتيجية</h1>
            <p className="text-muted-foreground">متابعة وإدارة المستهدفات السنوية والشهرية والربعية للشركة</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingTarget(null); }}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مستهدف
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة مستهدف جديد لعام {selectedYear}</DialogTitle>
              </DialogHeader>
              {renderTargetForm(false)}
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="yearly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              سنوي
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              ربعي
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              شهري
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              كل السنوات
            </TabsTrigger>
          </TabsList>

          {/* Yearly View */}
          <TabsContent value="yearly" className="space-y-6">
            {/* Year Selector */}
            <div className="flex items-center gap-3">
              <Label>السنة:</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-32">
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

            {/* Edit Dialog */}
            <Dialog open={!!editingTarget} onOpenChange={(open) => !open && setEditingTarget(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>تعديل المستهدف</DialogTitle>
                </DialogHeader>
                {renderTargetForm(true)}
              </DialogContent>
            </Dialog>

            {/* Targets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {targets?.map((target: any) => renderTargetCard(target, yearlyProgress[target.type], "سنوي"))}
            </div>

            {/* Empty State */}
            {(!targets || targets.length === 0) && (
              <Card className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مستهدفات لعام {selectedYear}</h3>
                <p className="text-muted-foreground mb-4">ابدأ بإضافة المستهدفات الاستراتيجية للشركة</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مستهدف
                </Button>
              </Card>
            )}

            {/* Summary Card */}
            {targets && targets.length > 0 && renderSummaryCard(yearlyProgress, `عام ${selectedYear}`)}
          </TabsContent>

          {/* Quarterly View */}
          <TabsContent value="quarterly" className="space-y-6">
            {/* Year and Quarter Selector */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label>السنة:</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-32">
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
              <div className="flex items-center gap-2">
                <Label>الربع:</Label>
                <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((quarter, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {quarter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>ملاحظة:</strong> المستهدف الربعي = المستهدف السنوي ÷ 4
              </p>
            </div>

            {/* Targets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {targets?.map((target: any) => renderTargetCard(target, quarterlyProgress[target.type], QUARTERS[selectedQuarter - 1]))}
            </div>

            {/* Empty State */}
            {(!targets || targets.length === 0) && (
              <Card className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مستهدفات لعام {selectedYear}</h3>
                <p className="text-muted-foreground mb-4">أضف مستهدفات سنوية أولاً ليتم تقسيمها تلقائياً</p>
              </Card>
            )}

            {/* Summary Card */}
            {targets && targets.length > 0 && renderSummaryCard(quarterlyProgress, `${QUARTERS[selectedQuarter - 1]} ${selectedYear}`)}
          </TabsContent>

          {/* Monthly View */}
          <TabsContent value="monthly" className="space-y-6">
            {/* Year and Month Selector */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label>السنة:</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-32">
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
              <div className="flex items-center gap-2">
                <Label>الشهر:</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>ملاحظة:</strong> المستهدف الشهري = المستهدف السنوي ÷ 12
              </p>
            </div>

            {/* Targets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {targets?.map((target: any) => renderTargetCard(target, monthlyProgress[target.type], MONTHS[selectedMonth - 1]))}
            </div>

            {/* Empty State */}
            {(!targets || targets.length === 0) && (
              <Card className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مستهدفات لعام {selectedYear}</h3>
                <p className="text-muted-foreground mb-4">أضف مستهدفات سنوية أولاً ليتم تقسيمها تلقائياً</p>
              </Card>
            )}

            {/* Summary Card */}
            {targets && targets.length > 0 && renderSummaryCard(monthlyProgress, `${MONTHS[selectedMonth - 1]} ${selectedYear}`)}
          </TabsContent>

          {/* All Years View */}
          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  إجمالي المستهدفات على مستوى كل السنوات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allYearsData && allYearsData.length > 0 ? (
                  <div className="space-y-8">
                    {allYearsData.map((yearData: any) => (
                      <div key={yearData.year} className="space-y-4">
                        <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          سنة {yearData.year}
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">المستهدف</TableHead>
                              <TableHead className="text-center">خط الأساس</TableHead>
                              <TableHead className="text-center">المستهدف السنوي</TableHead>
                              <TableHead className="text-center">المحقق</TableHead>
                              <TableHead className="text-center">نسبة الإنجاز</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {yearData.targets.map((target: any) => {
                              const baseline = parseFloat(target.baseline || "0");
                              const targetValue = parseFloat(target.targetValue);
                              const actual = target.actual || 0;
                              const netProgress = Math.max(0, actual - baseline);
                              const percentage = targetValue > 0 ? Math.min((netProgress / targetValue) * 100, 100) : 0;
                              const config = TARGET_TYPES[target.type as TargetType];
                              
                              return (
                                <TableRow key={target.id}>
                                  <TableCell className="font-medium">
                                    {target.customName || config?.label || target.type}
                                  </TableCell>
                                  <TableCell className="text-center text-gray-500">
                                    {formatValue(baseline, target.type)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {formatValue(targetValue, target.type)}
                                  </TableCell>
                                  <TableCell className="text-center font-bold text-primary">
                                    {formatValue(netProgress, target.type)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center gap-2 justify-center">
                                      <Progress value={percentage} className="w-20 h-2" />
                                      <span className={percentage >= 100 ? "text-green-600 font-bold" : ""}>
                                        {percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا توجد مستهدفات مسجلة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
