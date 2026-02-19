import { useState, useCallback, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Users, Plus, Edit, Trash2, Target, Gift, Clock, 
  FileText, UserCheck, UserX, Briefcase, Phone, Mail, UserPlus,
  Wallet, TrendingDown, TrendingUp, DollarSign, RefreshCw, Eye, CheckCircle, Pencil, Award, X, Check
} from "lucide-react";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

// ===== Constants =====
const specializationLabels: Record<string, string> = {
  customer_service: "خدمة عملاء",
  marketing: "تسويق",
  executive_manager: "مدير تنفيذي",
  developer: "مبرمج",
  support: "دعم",
};

const workTypeLabels: Record<string, string> = {
  remote: "عن بعد",
  onsite: "حضوري",
  hybrid: "مختلط",
};

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  on_leave: "في إجازة",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  on_leave: "bg-yellow-100 text-yellow-800",
};

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

// أنواع مستهدفات خدمة العملاء
const customerServiceTargetTypes = [
  "targeted_customers",
  "confirmed_customers",
  "registered_customers",
  "services_sold",
  "retargeting",
];

const targetTypeLabels: Record<string, string> = {
  targeted_customers: "العملاء المستهدفين",
  confirmed_customers: "العملاء المؤكدين",
  registered_customers: "العملاء المسجلين في النموذج",
  services_sold: "الخدمات المباعة",
  retargeting: "إعادة الاستهداف",
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

const targetStatusLabels: Record<string, string> = {
  in_progress: "قيد التنفيذ",
  achieved: "تم تحقيقه",
  not_achieved: "لم يتحقق",
};

const targetStatusColors: Record<string, string> = {
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

// ===== Employee Form Component =====
interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  nationalId: string; // رقم الهوية
  profileImage: string; // رابط صورة الموظف
  specialization: string;
  hireDate: string;
  salary: string;
  workType: string;
  status: string;
  roleId?: number;
}

interface EmployeeFormProps {
  formData: EmployeeFormData;
  onFormDataChange: (data: EmployeeFormData) => void;
  onSubmit: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
}

const EmployeeForm = ({ formData, onFormDataChange, onSubmit, isEdit = false, isLoading = false }: EmployeeFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>الاسم *</Label>
          <Input
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            placeholder="اسم الموظف"
          />
        </div>
        <div className="space-y-2">
          <Label>البريد الإلكتروني *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>رقم الهاتف</Label>
          <Input
            value={formData.phone}
            onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
            placeholder="05xxxxxxxx"
          />
        </div>
        <div className="space-y-2">
          <Label>التخصص *</Label>
          <Select
            value={formData.specialization}
            onValueChange={(v) => onFormDataChange({ ...formData, specialization: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(specializationLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>تاريخ التعيين</Label>
          <Input
            type="date"
            value={formData.hireDate}
            onChange={(e) => onFormDataChange({ ...formData, hireDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>الراتب الأساسي</Label>
          <Input
            type="number"
            value={formData.salary}
            onChange={(e) => onFormDataChange({ ...formData, salary: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>نوع العمل</Label>
          <Select
            value={formData.workType}
            onValueChange={(v) => onFormDataChange({ ...formData, workType: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(workTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>الحالة</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => onFormDataChange({ ...formData, status: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>رقم الهوية</Label>
          <Input
            value={formData.nationalId}
            onChange={(e) => onFormDataChange({ ...formData, nationalId: e.target.value })}
            placeholder="رقم الهوية الوطنية"
          />
        </div>
        <div className="space-y-2">
          <Label>صورة الموظف</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // رفع الصورة إلى S3
                  const formDataUpload = new FormData();
                  formDataUpload.append('file', file);
                  try {
                    const response = await fetch('/api/upload', {
                      method: 'POST',
                      body: formDataUpload,
                    });
                    const result = await response.json();
                    if (result.url) {
                      onFormDataChange({ ...formData, profileImage: result.url });
                    }
                  } catch (error) {
                    console.error('خطأ في رفع الصورة:', error);
                  }
                }
              }}
              className="flex-1"
            />
          </div>
          {formData.profileImage && (
            <div className="mt-2">
              <img 
                src={formData.profileImage} 
                alt="صورة الموظف" 
                className="w-20 h-20 rounded-full object-cover border"
              />
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline">إلغاء</Button>
        </DialogClose>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isEdit ? "تحديث" : "إضافة"}
        </Button>
      </DialogFooter>
    </div>
  );
};

// ===== Main Component =====
export default function EmployeeManagement() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("employees");
  
  // ===== Employees Tab State =====
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [filterSpecialization, setFilterSpecialization] = useState<string>("all");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState<number>(0);
  
  // Link to user state
  const [isLinkUserOpen, setIsLinkUserOpen] = useState(false);
  const [linkEmployeeId, setLinkEmployeeId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Create user account state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createUserEmployeeId, setCreateUserEmployeeId] = useState<number | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("3"); // Default to customer_service role
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    profileImage: "",
    specialization: "customer_service",
    hireDate: new Date().toISOString().split('T')[0],
    salary: "",
    workType: "remote",
    status: "active",
  });

  // ===== Salaries Tab State =====
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("all");
  const [isCreateSalaryOpen, setIsCreateSalaryOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
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

  // ===== Targets Tab State =====
  const [targetEmployeeFilter, setTargetEmployeeFilter] = useState<string>("all");
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const [isEditTargetOpen, setIsEditTargetOpen] = useState(false);
  const [isResetStatsOpen, setIsResetStatsOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [resetStatsOptions, setResetStatsOptions] = useState({
    employeeId: "",
    resetDailyStats: true,
    resetCurrentValues: true,
  });
  const [targetForm, setTargetForm] = useState({
    employeeId: "",
    targetType: "targeted_customers",
    targetValue: "",
    currentValue: "",
    baseValue: "", // القيمة الأساسية المضافة من الأدمن
    period: "monthly",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    rewardAmount: "",
    description: "",
  });

  const utils = trpc.useUtils();

  // ===== Queries =====
  const { data: employees = [], isLoading: employeesLoading } = trpc.employees.list.useQuery(
    filterSpecialization && filterSpecialization !== "all" ? { specialization: filterSpecialization } : undefined
  );
  const { data: stats } = trpc.employees.stats.useQuery();
  const { data: users = [] } = trpc.users.list.useQuery();
  const { data: roles = [] } = trpc.roles.list.useQuery();
  
  const { data: salaries = [], isLoading: salariesLoading } = trpc.salaries.list.useQuery({
    year: selectedYear,
    month: selectedMonth,
    employeeId: filterEmployeeId !== "all" ? parseInt(filterEmployeeId) : undefined,
  });

  const { data: targets = [], isLoading: targetsLoading } = trpc.employeeTargets.list.useQuery(
    targetEmployeeFilter !== "all" ? { employeeId: parseInt(targetEmployeeFilter) } : undefined
  );
  const { data: rewards = [] } = trpc.employeeRewards.list.useQuery();

  // ===== Employee Mutations =====
  const createEmployeeMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الموظف بنجاح");
      utils.employees.list.invalidate();
      utils.employees.stats.invalidate();
      setIsAddOpen(false);
      resetEmployeeForm();
    },
    onError: (error) => toast.error(error.message || "حدث خطأ أثناء إضافة الموظف"),
  });

  const updateEmployeeMutation = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات الموظف بنجاح");
      utils.employees.list.invalidate();
      setIsEditOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => toast.error(error.message || "حدث خطأ أثناء تحديث البيانات"),
  });

  const deleteEmployeeMutation = trpc.employees.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الموظف بنجاح");
      utils.employees.list.invalidate();
      utils.employees.stats.invalidate();
    },
    onError: (error) => toast.error(error.message || "حدث خطأ أثناء حذف الموظف"),
  });

  // Bulk delete employees one by one
  const handleBulkDeleteEmployees = async () => {
    for (const id of selectedEmployeeIds) {
      await deleteEmployeeMutation.mutateAsync({ id });
    }
    setSelectedEmployeeIds([]);
    setSelectAll(false);
    setConfirmDeleteStep(0);
  };

  // Link user to employee mutation
  const linkUserMutation = trpc.users.linkEmployee.useMutation({
    onSuccess: () => {
      toast.success("تم ربط المستخدم بالموظف بنجاح");
      utils.users.list.invalidate();
      utils.employees.list.invalidate();
      setIsLinkUserOpen(false);
      setLinkEmployeeId(null);
      setSelectedUserId("");
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ أثناء الربط"),
  });

  // Note: Create user functionality - show toast for now
  const handleCreateUserForEmployee = () => {
    toast.info("هذه الميزة قيد التطوير - يرجى ربط الموظف بمستخدم موجود");
    setIsCreateUserOpen(false);
  };

  // ===== Salary Mutations =====
  const createSalaryMutation = trpc.salaries.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء سجل الراتب بنجاح");
      utils.salaries.list.invalidate();
      setIsCreateSalaryOpen(false);
      setNewSalary({ employeeId: "", baseSalary: "", notes: "" });
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ"),
  });

  const addAdjustmentMutation = trpc.salaryAdjustments.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التعديل بنجاح");
      utils.salaries.list.invalidate();
      setIsAdjustmentOpen(false);
      setNewAdjustment({ type: "deduction", amount: "", reason: "", description: "" });
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ"),
  });

  const markAsPaidMutation = trpc.salaries.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الدفع");
      utils.salaries.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "حدث خطأ"),
  });

  // ===== Target Mutations =====
  const createTargetMutation = trpc.employeeTargets.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المستهدف بنجاح");
      utils.employeeTargets.list.invalidate();
      setIsAddTargetOpen(false);
      resetTargetForm();
    },
    onError: (error) => toast.error(error.message || "حدث خطأ"),
  });

  const updateTargetMutation = trpc.employeeTargets.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المستهدف بنجاح");
      utils.employeeTargets.list.invalidate();
      setIsEditTargetOpen(false);
      setSelectedTarget(null);
    },
    onError: (error) => toast.error(error.message || "حدث خطأ"),
  });

  const deleteTargetMutation = trpc.employeeTargets.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستهدف بنجاح");
      utils.employeeTargets.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "حدث خطأ"),
  });

  const approveRewardMutation = trpc.employeeRewards.approve.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد المكافأة");
      utils.employeeRewards.list.invalidate();
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ"),
  });

  const rejectRewardMutation = trpc.employeeRewards.reject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض المكافأة");
      utils.employeeRewards.list.invalidate();
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ"),
  });

  const markRewardAsPaidMutation = trpc.employeeRewards.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("تم تحديد المكافأة كمدفوعة");
      utils.employeeRewards.list.invalidate();
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ"),
  });

  const resetStatsMutation = trpc.employeeTargets.resetStats.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "تم إعادة تهيئة الإحصائيات بنجاح");
      utils.employeeTargets.list.invalidate();
      utils.dailyStats.list.invalidate();
      setIsResetStatsOpen(false);
    },
    onError: (error: any) => toast.error(error.message || "حدث خطأ"),
  });

  // ===== Helper Functions =====
  const resetEmployeeForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      nationalId: "",
      profileImage: "",
      specialization: "customer_service",
      hireDate: new Date().toISOString().split('T')[0],
      salary: "",
      workType: "remote",
      status: "active",
    });
  };

  const resetTargetForm = () => {
    setTargetForm({
      employeeId: "",
      targetType: "targeted_customers",
      targetValue: "",
      currentValue: "",
      baseValue: "",
      period: "monthly",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      rewardAmount: "",
      description: "",
    });
  };

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      nationalId: employee.nationalId || "",
      profileImage: employee.profileImage || "",
      specialization: employee.specialization,
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : "",
      salary: employee.salary?.toString() || "",
      workType: employee.workType || "remote",
      status: employee.status || "active",
    });
    setIsEditOpen(true);
  };

  const handleSubmitEmployee = () => {
    if (!formData.name || !formData.email || !formData.specialization) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createEmployeeMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      specialization: formData.specialization as any,
      hireDate: formData.hireDate || new Date().toISOString().split('T')[0],
      salary: formData.salary || undefined,
      workType: formData.workType as any,
      status: formData.status as any,
    });
  };

  const handleUpdateEmployee = () => {
    if (!selectedEmployee) return;
    updateEmployeeMutation.mutate({
      id: selectedEmployee.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      nationalId: formData.nationalId || undefined,
      profileImage: formData.profileImage || undefined,
      specialization: formData.specialization as any,
      hireDate: formData.hireDate || new Date().toISOString().split('T')[0],
      salary: formData.salary || undefined,
      workType: formData.workType as any,
      status: formData.status as any,
    });
  };

  const handleSelectEmployee = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds([...selectedEmployeeIds, id]);
    } else {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(eid => eid !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedEmployeeIds(employees.map((e: any) => e.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (confirmDeleteStep < 2) {
      setConfirmDeleteStep(confirmDeleteStep + 1);
      return;
    }
    handleBulkDeleteEmployees();
  };

  const handleLinkUser = () => {
    if (!linkEmployeeId || !selectedUserId) {
      toast.error("يرجى اختيار المستخدم");
      return;
    }
    linkUserMutation.mutate({
      userId: parseInt(selectedUserId),
      employeeId: linkEmployeeId,
    });
  };

  const handleCreateUserSubmit = () => {
    toast.info("هذه الميزة قيد التطوير - يرجى ربط الموظف بمستخدم موجود");
    setIsCreateUserOpen(false);
  };

  // Get linked user for employee
  const getLinkedUser = (employeeId: number) => {
    return users.find((u: any) => u.employeeId === employeeId);
  };

  // ===== Render =====
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
          <p className="text-muted-foreground mt-2">إدارة شاملة للموظفين والرواتب والمستهدفات</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <div className="text-sm text-muted-foreground">إجمالي الموظفين</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserCheck className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold">{employees.filter((e: any) => e.status === 'active').length}</div>
              <div className="text-sm text-muted-foreground">نشط</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Wallet className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{employees.filter((e: any) => e.status === 'active').reduce((sum: number, e: any) => sum + (parseFloat(e.salary) || 0), 0).toLocaleString()} ر.س.</div>
              <div className="text-sm text-muted-foreground">إجمالي الرواتب الشهرية</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{targets.filter((t: any) => t.status === 'achieved').length}</div>
              <div className="text-sm text-muted-foreground">مستهدفات محققة</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              الموظفين
            </TabsTrigger>
            <TabsTrigger value="salaries" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              الرواتب
            </TabsTrigger>
            <TabsTrigger value="targets" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              المستهدفات والمكافآت
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              تقارير الأداء
            </TabsTrigger>
          </TabsList>

          {/* ===== Employees Tab ===== */}
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>قائمة الموظفين</CardTitle>
                  <CardDescription>إدارة بيانات الموظفين وربطهم بالمستخدمين</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="فلترة حسب التخصص" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {Object.entries(specializationLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة موظف
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>إضافة موظف جديد</DialogTitle>
                      </DialogHeader>
                      <EmployeeForm
                        formData={formData}
                        onFormDataChange={setFormData}
                        onSubmit={handleSubmitEmployee}
                        isLoading={createEmployeeMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bulk Delete Controls */}
                {selectedEmployeeIds.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center justify-between">
                    <span className="text-red-800">
                      تم تحديد {selectedEmployeeIds.length} موظف
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedEmployeeIds([]);
                        setSelectAll(false);
                        setConfirmDeleteStep(0);
                      }}>
                        إلغاء التحديد
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleBulkDelete}
                        disabled={deleteEmployeeMutation.isPending}
                      >
                        {confirmDeleteStep === 0 && "حذف المحدد"}
                        {confirmDeleteStep === 1 && "تأكيد الحذف؟"}
                        {confirmDeleteStep === 2 && "نعم، احذف نهائياً"}
                      </Button>
                    </div>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                      </TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد</TableHead>
                      <TableHead>التخصص</TableHead>
                      <TableHead>نوع العمل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المستخدم المرتبط</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeesLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">جاري التحميل...</TableCell>
                      </TableRow>
                    ) : employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          لا يوجد موظفين
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee: any) => {
                        const linkedUser = getLinkedUser(employee.id);
                        return (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedEmployeeIds.includes(employee.id)}
                                onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{employee.name}</TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>{specializationLabels[employee.specialization] || employee.specialization}</TableCell>
                            <TableCell>{workTypeLabels[employee.workType] || employee.workType}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[employee.status] || ""}>
                                {statusLabels[employee.status] || employee.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {linkedUser ? (
                                <Badge variant="outline" className="bg-green-50">
                                  <UserCheck className="h-3 w-3 ml-1" />
                                  {linkedUser.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">غير مرتبط</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditEmployee(employee)}
                                  title="تعديل"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {!linkedUser && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setLinkEmployeeId(employee.id);
                                        setIsLinkUserOpen(true);
                                      }}
                                      title="ربط بمستخدم"
                                    >
                                      <UserPlus className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setCreateUserEmployeeId(employee.id);
                                        setIsCreateUserOpen(true);
                                      }}
                                      title="إنشاء حساب"
                                    >
                                      <Mail className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteEmployeeMutation.mutate({ id: employee.id })}
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Employee Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>تعديل بيانات الموظف</DialogTitle>
                </DialogHeader>
                <EmployeeForm
                  formData={formData}
                  onFormDataChange={setFormData}
                  onSubmit={handleUpdateEmployee}
                  isEdit
                  isLoading={updateEmployeeMutation.isPending}
                />
              </DialogContent>
            </Dialog>

            {/* Link User Dialog */}
            <Dialog open={isLinkUserOpen} onOpenChange={setIsLinkUserOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ربط الموظف بمستخدم</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>اختر المستخدم</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مستخدم" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter((u: any) => !u.employeeId).map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} - {user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button onClick={handleLinkUser} disabled={linkUserMutation.isPending}>
                      ربط
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء حساب مستخدم للموظف</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {createUserEmployeeId && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">
                        {employees.find((e: any) => e.id === createUserEmployeeId)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {employees.find((e: any) => e.id === createUserEmployeeId)?.email}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>كلمة المرور *</Label>
                    <Input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الدور</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button onClick={handleCreateUserSubmit}>
                      إنشاء الحساب
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ===== Salaries Tab ===== */}
          <TabsContent value="salaries" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>سجل الرواتب</CardTitle>
                  <CardDescription>إدارة رواتب الموظفين والخصومات والمكافآت</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isCreateSalaryOpen} onOpenChange={setIsCreateSalaryOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 ml-2" />
                        إنشاء راتب
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إنشاء سجل راتب</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>الموظف</Label>
                          <Select value={newSalary.employeeId} onValueChange={(v) => setNewSalary({ ...newSalary, employeeId: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الموظف" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp: any) => (
                                <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>الراتب الأساسي</Label>
                          <Input
                            type="number"
                            value={newSalary.baseSalary}
                            onChange={(e) => setNewSalary({ ...newSalary, baseSalary: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ملاحظات</Label>
                          <Textarea
                            value={newSalary.notes}
                            onChange={(e) => setNewSalary({ ...newSalary, notes: e.target.value })}
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">إلغاء</Button>
                          </DialogClose>
                          <Button onClick={() => {
                            if (!newSalary.employeeId) {
                              toast.error("يرجى اختيار الموظف");
                              return;
                            }
                            createSalaryMutation.mutate({
                              employeeId: parseInt(newSalary.employeeId),
                              year: selectedYear,
                              month: selectedMonth,
                              baseSalary: newSalary.baseSalary || "0",
                              notes: newSalary.notes || undefined,
                            });
                          }}>
                            إنشاء
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>المكافآت</TableHead>
                      <TableHead>الخصومات</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salariesLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">جاري التحميل...</TableCell>
                      </TableRow>
                    ) : salaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          لا توجد سجلات رواتب لهذا الشهر
                        </TableCell>
                      </TableRow>
                    ) : (
                      salaries.map((salary: any) => (
                        <TableRow key={salary.id}>
                          <TableCell className="font-medium">{salary.employeeName}</TableCell>
                          <TableCell>{salary.baseSalary?.toLocaleString()} ر.س.</TableCell>
                          <TableCell className="text-green-600">+{salary.totalBonuses?.toLocaleString() || 0} ر.س.</TableCell>
                          <TableCell className="text-red-600">-{salary.totalDeductions?.toLocaleString() || 0} ر.س.</TableCell>
                          <TableCell className="font-bold">{salary.netSalary?.toLocaleString()} ر.س.</TableCell>
                          <TableCell>
                            <Badge className={salary.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {salary.isPaid ? "مدفوع" : "غير مدفوع"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSalary(salary.id);
                                  setIsAdjustmentOpen(true);
                                }}
                                title="إضافة تعديل"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              {!salary.isPaid && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsPaidMutation.mutate({ id: salary.id })}
                                  title="تحديد كمدفوع"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Add Adjustment Dialog */}
            <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة تعديل على الراتب</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>النوع</Label>
                    <Select value={newAdjustment.type} onValueChange={(v: any) => setNewAdjustment({ ...newAdjustment, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">مكافأة</SelectItem>
                        <SelectItem value="deduction">خصم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>المبلغ</Label>
                    <Input
                      type="number"
                      value={newAdjustment.amount}
                      onChange={(e) => setNewAdjustment({ ...newAdjustment, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السبب</Label>
                    <Input
                      value={newAdjustment.reason}
                      onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button onClick={() => {
                      if (!selectedSalary || !newAdjustment.amount) {
                        toast.error("يرجى ملء جميع الحقول");
                        return;
                      }
                      const salary = salaries.find((s: any) => s.id === selectedSalary);
                      if (!salary) return;
                      addAdjustmentMutation.mutate({
                        salaryId: selectedSalary,
                        employeeId: salary.employeeId,
                        type: newAdjustment.type,
                        amount: newAdjustment.amount,
                        reason: newAdjustment.reason,
                        description: newAdjustment.description || undefined,
                      });
                    }}>
                      إضافة
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ===== Targets Tab ===== */}
          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>المستهدفات والمكافآت</CardTitle>
                  <CardDescription>إدارة مستهدفات الموظفين ومكافآتهم</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={targetEmployeeFilter} onValueChange={setTargetEmployeeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="فلترة حسب الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isResetStatsOpen} onOpenChange={setIsResetStatsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        <RefreshCw className="h-4 w-4 ml-2" />
                        إعادة تهيئة
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إعادة تهيئة الإحصائيات</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 text-sm">
                            <strong>تحذير:</strong> سيتم حذف جميع الإحصائيات اليومية وإعادة القيم المتحققة للقيمة الأساسية. هذا الإجراء لا يمكن التراجع عنه.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>الموظف (اختياري)</Label>
                          <Select 
                            value={resetStatsOptions.employeeId} 
                            onValueChange={(v) => setResetStatsOptions({ ...resetStatsOptions, employeeId: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="جميع الموظفين" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الموظفين</SelectItem>
                              {employees.map((emp: any) => (
                                <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="resetDailyStats"
                            checked={resetStatsOptions.resetDailyStats}
                            onCheckedChange={(checked) => setResetStatsOptions({ ...resetStatsOptions, resetDailyStats: checked as boolean })}
                          />
                          <Label htmlFor="resetDailyStats">حذف الإحصائيات اليومية</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="resetCurrentValues"
                            checked={resetStatsOptions.resetCurrentValues}
                            onCheckedChange={(checked) => setResetStatsOptions({ ...resetStatsOptions, resetCurrentValues: checked as boolean })}
                          />
                          <Label htmlFor="resetCurrentValues">إعادة القيم المتحققة للقيمة الأساسية</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetStatsOpen(false)}>
                          إلغاء
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            resetStatsMutation.mutate({
                              employeeId: resetStatsOptions.employeeId && resetStatsOptions.employeeId !== "all" ? parseInt(resetStatsOptions.employeeId) : undefined,
                              resetDailyStats: resetStatsOptions.resetDailyStats,
                              resetCurrentValues: resetStatsOptions.resetCurrentValues,
                            });
                          }}
                          disabled={resetStatsMutation.isPending}
                        >
                          {resetStatsMutation.isPending ? (
                            <><RefreshCw className="h-4 w-4 ml-2 animate-spin" /> جاري...</>
                          ) : (
                            <>إعادة تهيئة</>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddTargetOpen} onOpenChange={setIsAddTargetOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة مستهدف
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>إضافة مستهدف جديد</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>الموظف *</Label>
                          <Select value={targetForm.employeeId} onValueChange={(v) => setTargetForm({ ...targetForm, employeeId: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الموظف" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp: any) => (
                                <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>نوع المستهدف *</Label>
                          <Select value={targetForm.targetType} onValueChange={(v) => setTargetForm({ ...targetForm, targetType: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">مستهدفات خدمة العملاء</div>
                              {customerServiceTargetTypes.map((key) => (
                                <SelectItem key={key} value={key}>{targetTypeLabels[key]}</SelectItem>
                              ))}
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">مستهدفات أخرى</div>
                              {Object.entries(targetTypeLabels)
                                .filter(([key]) => !customerServiceTargetTypes.includes(key))
                                .map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
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
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>مبلغ المكافأة</Label>
                            <Input
                              type="number"
                              value={targetForm.rewardAmount}
                              onChange={(e) => setTargetForm({ ...targetForm, rewardAmount: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>الفترة</Label>
                            <Select value={targetForm.period} onValueChange={(v) => setTargetForm({ ...targetForm, period: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(periodLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>تاريخ البداية</Label>
                            <Input
                              type="date"
                              value={targetForm.startDate}
                              onChange={(e) => setTargetForm({ ...targetForm, startDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">إلغاء</Button>
                          </DialogClose>
                          <Button onClick={() => {
                            if (!targetForm.employeeId || !targetForm.targetValue) {
                              toast.error("يرجى ملء جميع الحقول المطلوبة");
                              return;
                            }
                            createTargetMutation.mutate({
                              employeeId: parseInt(targetForm.employeeId),
                              targetType: targetForm.targetType as any,
                              targetValue: targetForm.targetValue,
                              period: targetForm.period as any,
                              year: new Date(targetForm.startDate).getFullYear(),
                              month: new Date(targetForm.startDate).getMonth() + 1,
                              rewardAmount: targetForm.rewardAmount || undefined,
                            });
                          }}>
                            إضافة
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>نوع المستهدف</TableHead>
                      <TableHead>المستهدف</TableHead>
                      <TableHead>الأساسي</TableHead>
                      <TableHead>الحالي</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead>الفترة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المكافأة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targetsLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">جاري التحميل...</TableCell>
                      </TableRow>
                    ) : targets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          لا توجد مستهدفات
                        </TableCell>
                      </TableRow>
                    ) : (
                      targets.map((target: any) => {
                        const progress = target.targetValue > 0 
                          ? Math.min(100, Math.round((target.currentValue / target.targetValue) * 100)) 
                          : 0;
                        return (
                          <TableRow key={target.id}>
                            <TableCell className="font-medium">{target.employeeName}</TableCell>
                            <TableCell>{targetTypeLabels[target.targetType] || target.targetType}</TableCell>
                            <TableCell>{target.targetValue}</TableCell>
                            <TableCell className="text-muted-foreground">{target.baseValue || 0}</TableCell>
                            <TableCell>{target.currentValue || 0}</TableCell>
                            <TableCell className="w-32">
                              <div className="flex items-center gap-2">
                                <Progress value={progress} className="h-2" />
                                <span className="text-xs">{progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{periodLabels[target.period] || target.period}</TableCell>
                            <TableCell>
                              <Badge className={targetStatusColors[target.status] || ""}>
                                {targetStatusLabels[target.status] || target.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{target.rewardAmount ? `${target.rewardAmount} ر.س.` : "-"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedTarget(target);
                                    setTargetForm({
                                      employeeId: target.employeeId.toString(),
                                      targetType: target.targetType,
                                      targetValue: target.targetValue.toString(),
                                      currentValue: target.currentValue?.toString() || "0",
                                      baseValue: target.baseValue?.toString() || "0",
                                      period: target.period,
                                      startDate: target.startDate ? new Date(target.startDate).toISOString().split('T')[0] : "",
                                      endDate: target.endDate ? new Date(target.endDate).toISOString().split('T')[0] : "",
                                      rewardAmount: target.rewardAmount?.toString() || "",
                                      description: target.description || "",
                                    });
                                    setIsEditTargetOpen(true);
                                  }}
                                  title="تعديل"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteTargetMutation.mutate({ id: target.id })}
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Rewards Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  المكافآت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>المستهدف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد مكافآت
                        </TableCell>
                      </TableRow>
                    ) : (
                      rewards.map((reward: any) => (
                        <TableRow key={reward.id}>
                          <TableCell className="font-medium">{reward.employeeName}</TableCell>
                          <TableCell>{targetTypeLabels[reward.targetType] || reward.targetType}</TableCell>
                          <TableCell>{reward.amount} ر.س.</TableCell>
                          <TableCell>
                            <Badge className={rewardStatusColors[reward.status] || ""}>
                              {rewardStatusLabels[reward.status] || reward.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reward.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => approveRewardMutation.mutate({ id: reward.id })}
                                  title="اعتماد"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => rejectRewardMutation.mutate({ id: reward.id })}
                                  title="رفض"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            )}
                            {reward.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markRewardAsPaidMutation.mutate({ id: reward.id })}
                                title="تحديد كمدفوع"
                              >
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Target Dialog */}
            <Dialog open={isEditTargetOpen} onOpenChange={setIsEditTargetOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>تعديل المستهدف</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>القيمة المستهدفة</Label>
                      <Input
                        type="number"
                        value={targetForm.targetValue}
                        onChange={(e) => setTargetForm({ ...targetForm, targetValue: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>القيمة الأساسية (من الأدمن)</Label>
                      <Input
                        type="number"
                        value={targetForm.baseValue}
                        onChange={(e) => setTargetForm({ ...targetForm, baseValue: e.target.value })}
                        placeholder="القيمة الأساسية قبل الإحصائيات اليومية"
                      />
                      <p className="text-xs text-muted-foreground">
                        القيمة المتحققة = القيمة الأساسية + مجموع الإحصائيات اليومية
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>القيمة المتحققة (للعرض فقط)</Label>
                      <Input
                        type="number"
                        value={targetForm.currentValue}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        تحسب تلقائياً من الإحصائيات اليومية
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>مبلغ المكافأة</Label>
                      <Input
                        type="number"
                        value={targetForm.rewardAmount}
                        onChange={(e) => setTargetForm({ ...targetForm, rewardAmount: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button onClick={() => {
                      if (!selectedTarget) return;
                      updateTargetMutation.mutate({
                        id: selectedTarget.id,
                        targetValue: targetForm.targetValue,
                        baseValue: targetForm.baseValue,
                        rewardAmount: targetForm.rewardAmount || undefined,
                      });
                    }}>
                      تحديث
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ===== Performance Reports Tab ===== */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      تقارير أداء الموظفين
                    </CardTitle>
                    <CardDescription>ملخص أداء الموظفين ونسب إنجاز المستهدفات</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={targetEmployeeFilter} onValueChange={setTargetEmployeeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="فلترة حسب الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* ملخص الأداء العام */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-blue-700">
                        {targets.length}
                      </div>
                      <div className="text-sm text-blue-600">إجمالي المستهدفات</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-green-700">
                        {targets.filter((t: any) => t.status === 'achieved').length}
                      </div>
                      <div className="text-sm text-green-600">مستهدفات محققة</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-yellow-700">
                        {targets.filter((t: any) => t.status === 'in_progress').length}
                      </div>
                      <div className="text-sm text-yellow-600">قيد التنفيذ</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-purple-700">
                        {(() => {
                          const totalTargetValue = targets.reduce((sum: number, t: any) => sum + parseFloat(t.targetValue || 0), 0);
                          const totalCurrentValue = targets.reduce((sum: number, t: any) => sum + parseFloat(t.currentValue || 0), 0);
                          return totalTargetValue > 0 
                            ? Math.min(100, Math.round((totalCurrentValue / totalTargetValue) * 100))
                            : 0;
                        })()}%
                      </div>
                      <div className="text-sm text-purple-600">نسبة الإنجاز العامة</div>
                    </CardContent>
                  </Card>
                </div>

                {/* جدول أداء الموظفين */}
                <h3 className="text-lg font-semibold mb-4">أداء الموظفين حسب المستهدفات</h3>
                <div className="space-y-4">
                  {employees.map((emp: any) => {
                    const empTargets = targets.filter((t: any) => t.employeeId === emp.id);
                    const achievedCount = empTargets.filter((t: any) => t.status === 'achieved').length;
                    const totalCount = empTargets.length;
                    
                    // حساب إجمالي القيم المتحققة والمستهدفة
                    const totalTarget = empTargets.reduce((sum: number, t: any) => sum + parseFloat(t.targetValue || 0), 0);
                    const totalCurrent = empTargets.reduce((sum: number, t: any) => sum + parseFloat(t.currentValue || 0), 0);
                    const totalBase = empTargets.reduce((sum: number, t: any) => sum + parseFloat(t.baseValue || 0), 0);
                    // نسبة الإنجاز بناءً على القيم الفعلية (المتحققة/المستهدفة)
                    const achievementRate = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;
                    const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;
                    
                    if (targetEmployeeFilter !== 'all' && emp.id.toString() !== targetEmployeeFilter) {
                      return null;
                    }
                    
                    return (
                      <Card key={emp.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{emp.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {specializationLabels[emp.specialization] || emp.specialization}
                                </p>
                              </div>
                            </div>
                            <div className="text-left">
                              <Badge className={achievementRate >= 80 ? 'bg-green-100 text-green-800' : achievementRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                {achievementRate}% إنجاز
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <div className="text-lg font-bold">{totalCount}</div>
                              <div className="text-xs text-muted-foreground">إجمالي المستهدفات</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="text-lg font-bold text-green-700">{achievedCount}</div>
                              <div className="text-xs text-green-600">محققة</div>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-lg font-bold text-blue-700">{totalBase.toFixed(0)}</div>
                              <div className="text-xs text-blue-600">القيمة الأساسية</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <div className="text-lg font-bold text-purple-700">{totalCurrent.toFixed(0)}</div>
                              <div className="text-xs text-purple-600">القيمة المتحققة</div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>التقدم العام</span>
                              <span>{overallProgress}%</span>
                            </div>
                            <Progress value={overallProgress} className="h-2" />
                          </div>
                          
                          {/* تفاصيل المستهدفات */}
                          {empTargets.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="text-sm font-medium mb-2">تفاصيل المستهدفات:</h5>
                              <div className="space-y-2">
                                {empTargets.map((target: any) => {
                                  const progress = target.targetValue > 0 
                                    ? Math.min(100, Math.round((target.currentValue / target.targetValue) * 100)) 
                                    : 0;
                                  return (
                                    <div key={target.id} className="flex items-center gap-2 text-sm">
                                      <span className="w-32 truncate">{targetTypeLabels[target.targetType] || target.targetType}</span>
                                      <Progress value={progress} className="h-1.5 flex-1" />
                                      <span className="w-20 text-left text-muted-foreground">
                                        {target.currentValue || 0}/{target.targetValue}
                                      </span>
                                      <Badge className={`text-xs ${targetStatusColors[target.status] || ''}`}>
                                        {targetStatusLabels[target.status] || target.status}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
