import React, { useState, useMemo, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Users, Plus, Edit, Trash2, Target, Gift, Clock, 
  FileText, UserCheck, UserX, Briefcase, Phone, Mail, UserPlus
} from "lucide-react";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";


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

// نقل EmployeeForm خارج الـ component الرئيسي لتجنب إعادة الإنشاء
interface EmployeeFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    specialization: string;
    hireDate: string;
    salary: string;
    workType: string;
    status: string;
    roleId?: number;
    employeeCode?: string; // رمز الموظف للربط مع WPForms
  };
  onFormDataChange: (data: any) => void;
  onSubmit: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
  roles?: Array<{ id: number; name: string }>;
}

const EmployeeForm = ({ formData, onFormDataChange, onSubmit, isEdit = false, isLoading = false }: EmployeeFormProps) => {
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, name: e.target.value });
  }, [formData, onFormDataChange]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, email: e.target.value });
  }, [formData, onFormDataChange]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, phone: e.target.value });
  }, [formData, onFormDataChange]);

  const handleSpecializationChange = useCallback((value: string) => {
    onFormDataChange({ ...formData, specialization: value });
  }, [formData, onFormDataChange]);

  const handleHireDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, hireDate: e.target.value });
  }, [formData, onFormDataChange]);

  const handleSalaryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, salary: e.target.value });
  }, [formData, onFormDataChange]);

  const handleWorkTypeChange = useCallback((value: string) => {
    onFormDataChange({ ...formData, workType: value });
  }, [formData, onFormDataChange]);

  const handleStatusChange = useCallback((value: string) => {
    onFormDataChange({ ...formData, status: value });
  }, [formData, onFormDataChange]);

  const handleRoleChange = useCallback((value: string) => {
    onFormDataChange({ ...formData, roleId: parseInt(value) });
  }, [formData, onFormDataChange]);

  const handleEmployeeCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, employeeCode: e.target.value });
  }, [formData, onFormDataChange]);

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">اسم الموظف *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={handleNameChange}
            placeholder="أدخل اسم الموظف"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialization">التخصص *</Label>
          <Select
            value={formData.specialization}
            onValueChange={handleSpecializationChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer_service">خدمة عملاء</SelectItem>
              <SelectItem value="marketing">تسويق</SelectItem>
              <SelectItem value="executive_manager">مدير تنفيذي</SelectItem>
              <SelectItem value="developer">مبرمج</SelectItem>
              <SelectItem value="support">دعم</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="text"
            value={formData.email}
            onChange={handleEmailChange}
            placeholder="example@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">رقم الجوال</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="05xxxxxxxx"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hireDate">تاريخ التعيين</Label>
          <Input
            id="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={handleHireDateChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary">الراتب</Label>
          <Input
            id="salary"
            value={formData.salary}
            onChange={handleSalaryChange}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workType">نوع العمل</Label>
          <Select
            value={formData.workType}
            onValueChange={handleWorkTypeChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">عن بعد</SelectItem>
              <SelectItem value="onsite">حضوري</SelectItem>
              <SelectItem value="hybrid">مختلط</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employeeCode">رمز الموظف (WPForms)</Label>
          <Input
            id="employeeCode"
            value={formData.employeeCode || ''}
            onChange={handleEmployeeCodeChange}
            placeholder="رمز فريد للربط مع النماذج"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">هذا الرمز يستخدم لربط الموظف بنماذج WPForms</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">الحالة</Label>
          <Select
            value={formData.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
              <SelectItem value="on_leave">في إجازة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">الدور الوظيفي</Label>
          <Select
            value={formData.roleId?.toString() || ""}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الدور" />
            </SelectTrigger>
            <SelectContent>
              {/* Default roles */}
              <SelectItem value="1">موظف عادي</SelectItem>
              <SelectItem value="2">مسؤول</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>      <DialogFooter className="mt-4">
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

export default function Employees() {
  const { hasPermission } = usePermissions();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [filterSpecialization, setFilterSpecialization] = useState<string>("");
  const [showLoginCredentials, setShowLoginCredentials] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<{ email: string; password: string } | null>(null);
  
  // Bulk delete state
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState<number>(0);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "customer_service" as const,
    hireDate: new Date().toISOString().split('T')[0],
    salary: "",
    workType: "remote" as const,
    status: "active" as const,
    employeeCode: "", // رمز الموظف للربط مع WPForms
  });

  const utils = trpc.useUtils();
  const { data: employees = [], isLoading } = trpc.employees.list.useQuery(
    filterSpecialization && filterSpecialization !== "all" ? { specialization: filterSpecialization } : undefined
  );
  const { data: stats } = trpc.employees.stats.useQuery();

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الموظف بنجاح");
      utils.employees.list.invalidate();
      utils.employees.stats.invalidate();
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة الموظف");
    },
  });

  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات الموظف بنجاح");
      utils.employees.list.invalidate();
      setIsEditOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث البيانات");
    },
  });

  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الموظف بنجاح");
      utils.employees.list.invalidate();
      utils.employees.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف الموظف");
    },
  });

  const createAccountMutation = trpc.employees.createWithUser.useMutation({
    onSuccess: (data) => {
      toast.success("تم إنشاء حساب الموظف بنجاح");
      setLoginCredentials({
        email: data.employee.email || "لم يتم تحديث بريد",
        password: data.tempPassword,
      });
      setShowLoginCredentials(true);
      utils.employees.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء الحساب");
    },
  });

  const bulkDeleteMutation = trpc.bulkDelete.deleteEmployees.useMutation({
    onSuccess: () => {
      toast.success(`تم حذف ${selectedEmployeeIds.length} موظف بنجاح`);
      utils.employees.list.invalidate();
      utils.employees.stats.invalidate();
      setSelectedEmployeeIds([]);
      setSelectAll(false);
      setConfirmDeleteStep(0);
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء الحذف");
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialization: "customer_service",
      hireDate: new Date().toISOString().split('T')[0],
      salary: "",
      workType: "remote",
      status: "active",
      employeeCode: "",
    });
  }, []);

  const handleFormDataChange = useCallback((newData: any) => {
    setFormData(newData);
  }, []);

  const handleCreate = useCallback(() => {
    if (!formData.name) {
      toast.error("يرجى إدخال اسم الموظف");
      return;
    }
    createMutation.mutate(formData);
  }, [formData, createMutation]);

  const handleUpdate = useCallback(() => {
    if (!selectedEmployee) return;
    updateMutation.mutate({
      id: selectedEmployee.id,
      ...formData,
    });
  }, [selectedEmployee, formData, updateMutation]);

  const handleDelete = useCallback((id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
      deleteMutation.mutate({ id });
    }
  }, [deleteMutation]);

  // Bulk delete handlers
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedEmployeeIds([]);
      setSelectAll(false);
    } else {
      if (employees) {
        setSelectedEmployeeIds(employees.map((e: any) => e.id));
        setSelectAll(true);
      }
    }
  }, [selectAll, employees]);

  const handleSelectEmployee = useCallback((employeeId: number) => {
    if (selectedEmployeeIds.includes(employeeId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== employeeId));
      setSelectAll(false);
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, employeeId]);
    }
  }, [selectedEmployeeIds]);

  const handleBulkDelete = useCallback(async () => {
    if (confirmDeleteStep === 0) {
      setConfirmDeleteStep(1);
      return;
    }
    if (confirmDeleteStep === 1) {
      setConfirmDeleteStep(2);
      return;
    }
    if (selectedEmployeeIds.length === 0) return;
    setBulkDeleteLoading(true);
    try {
      await bulkDeleteMutation.mutateAsync({ employeeIds: selectedEmployeeIds });
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [confirmDeleteStep, selectedEmployeeIds, bulkDeleteMutation]);

  const handleCancelBulkDelete = useCallback(() => {
    setConfirmDeleteStep(0);
  }, []);

  const handleCreateAccount = useCallback((employee: any) => {
    if (!employee.email) {
      toast.error("يجب تحديث بريد الموظف أولا");
      return;
    }
    createAccountMutation.mutate({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      specialization: employee.specialization,
      hireDate: new Date(employee.hireDate),
      salary: employee.salary,
      workType: employee.workType,
      status: employee.status,
    });
  }, [createAccountMutation]);

  const handleSendLoginCredentials = useCallback(async (employee: any) => {
    const tempPassword = `Temp${Math.random().toString(36).substring(2, 10)}`;
    setLoginCredentials({
      email: employee.email || 'لم يتم تحديث بريد',
      password: tempPassword,
    });
    setShowLoginCredentials(true);
    toast.success('تم إنشاء كلمة مرور مؤقتة');
  }, []);

  const handleCopyCredentials = useCallback(() => {
    if (loginCredentials) {
      const text = `البريد الإلكتروني: ${loginCredentials.email}\nكلمة المرور: ${loginCredentials.password}`;
      navigator.clipboard.writeText(text);
      toast.success('تم نسخ البيانات');
    }
  }, [loginCredentials]);

  const openEditDialog = useCallback((employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      specialization: employee.specialization,
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : "",
      salary: employee.salary || "",
      workType: employee.workType || "remote",
      status: employee.status || "active",
      employeeCode: employee.employeeCode || "",
    });
    setIsEditOpen(true);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">إدارة الموظفين</h1>
            <p className="text-muted-foreground">إدارة بيانات الموظفين والمستهدفات والمكافآت</p>
          </div>
          {hasPermission(PERMISSIONS.EMPLOYEES_CREATE) && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة موظف
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
              </DialogHeader>
              <EmployeeForm 
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onSubmit={handleCreate}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">خدمة عملاء</CardTitle>
              <Phone className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.bySpecialization?.customer_service || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تسويق</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.bySpecialization?.marketing || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مبرمجين</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.bySpecialization?.developer || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نشط</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats?.bySpecialization?.active || stats?.total || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-4 items-center">
          <Label>تصفية حسب التخصص:</Label>
          <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التخصصات</SelectItem>
              <SelectItem value="customer_service">خدمة عملاء</SelectItem>
              <SelectItem value="marketing">تسويق</SelectItem>
              <SelectItem value="executive_manager">مدير تنفيذي</SelectItem>
              <SelectItem value="developer">مبرمج</SelectItem>
              <SelectItem value="support">دعم</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الموظفين</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لم يتم إضافة موظفين. قم بإضافة موظف جديد</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {hasPermission(PERMISSIONS.EMPLOYEES_DELETE) && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>الاسم</TableHead>
                      <TableHead>التخصص</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الراتب</TableHead>
                      <TableHead>نوع العمل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee: any) => (
                      <TableRow key={employee.id}>
                        {hasPermission(PERMISSIONS.EMPLOYEES_DELETE) && (
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployeeIds.includes(employee.id)}
                              onCheckedChange={() => handleSelectEmployee(employee.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          <a 
                            href={`/employees/${employee.id}`}
                            className="text-primary hover:underline cursor-pointer"
                          >
                            {employee.name}
                          </a>
                        </TableCell>
                        <TableCell>{specializationLabels[employee.specialization] || employee.specialization}</TableCell>
                        <TableCell>{employee.email || "-"}</TableCell>
                        <TableCell>ر.س {employee.salary ? parseFloat(employee.salary).toLocaleString('ar') : "0"}</TableCell>
                        <TableCell>{workTypeLabels[employee.workType] || employee.workType}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[employee.status]}>
                            {statusLabels[employee.status] || employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {hasPermission(PERMISSIONS.EMPLOYEES_EDIT) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateAccount(employee)}
                              title="إنشاء حساب"
                              disabled={createAccountMutation.isPending}
                            >
                              <UserPlus className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendLoginCredentials(employee)}
                              title="عرض بيانات الدخول"
                            >
                              <Mail className="h-4 w-4 text-blue-600" />
                            </Button>
                            {hasPermission(PERMISSIONS.EMPLOYEES_DELETE) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(employee.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Bulk Delete Section */}
            {hasPermission(PERMISSIONS.EMPLOYEES_DELETE) && selectedEmployeeIds.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 dark:text-red-100">
                      حذف {selectedEmployeeIds.length} موظف
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      سيتم حذف جميع البيانات المرتبطة بهم (المستهدفات، المكافآت، الرواتب)
                    </p>
                    {confirmDeleteStep === 0 && (
                      <Button
                        onClick={handleBulkDelete}
                        variant="destructive"
                        className="mt-3"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        حذف الموظفين المحددين
                      </Button>
                    )}
                    {confirmDeleteStep === 1 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">هل أنت متأكد؟</p>
                        <div className="flex gap-2">
                          <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                            نعم، حذف
                          </Button>
                          <Button onClick={handleCancelBulkDelete} variant="outline" size="sm">
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    )}
                    {confirmDeleteStep === 2 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          هذا الإجراء لا يمكن التراجع عنه!
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={handleBulkDelete} variant="destructive" size="sm" disabled={bulkDeleteLoading}>
                            {bulkDeleteLoading ? "جاري الحذف..." : "نعم، احذف نهائياً"}
                          </Button>
                          <Button onClick={handleCancelBulkDelete} variant="outline" size="sm">
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل بيانات الموظف</DialogTitle>
            </DialogHeader>
            <EmployeeForm 
              formData={formData}
              onFormDataChange={handleFormDataChange}
              onSubmit={handleUpdate}
              isEdit={true}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog لعرض بيانات الدخول */}
        <Dialog open={showLoginCredentials} onOpenChange={setShowLoginCredentials}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>بيانات الدخول</DialogTitle>
            </DialogHeader>
            {loginCredentials && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <div className="flex gap-2">
                    <Input value={loginCredentials.email} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(loginCredentials.email);
                        toast.success('تم نسخ البريد');
                      }}
                    >
                      نسخ
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور المؤقتة</Label>
                  <div className="flex gap-2">
                    <Input value={loginCredentials.password} readOnly type="password" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(loginCredentials.password);
                        toast.success('تم نسخ كلمة المرور');
                      }}
                    >
                      نسخ
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCopyCredentials}
                >
                  نسخ البيانات كاملة
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLoginCredentials(false)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
