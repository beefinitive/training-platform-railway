import { useState, useEffect, useMemo } from "react";
import DailyStatsReview from "./DailyStatsReview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, Lock, Unlock, Shield, Search, Plus, Loader2, Users, ClipboardCheck, KeyRound, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function UserManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"users" | "permissions" | "stats-review">("users");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [confirmStep, setConfirmStep] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<number | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: 3, // Default to user role
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<number | null>(null);
  const [passwordChangeUserName, setPasswordChangeUserName] = useState("");
  const [adminNewPw, setAdminNewPw] = useState("");
  const [adminConfirmPw, setAdminConfirmPw] = useState("");
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [showAdminConfirmPw, setShowAdminConfirmPw] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.roleId !== 1) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Queries
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();
  const { data: roles } = trpc.roles.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();
  const permissionsQuery = trpc.userPermissions.listPermissions.useQuery();
  const userPermissionsQuery = trpc.userPermissions.getUserPermissions.useQuery(
    { userId: selectedUserForPermissions! },
    { enabled: !!selectedUserForPermissions }
  );

  // Mutations
  const deleteUsersMutation = trpc.bulkDelete.deleteUsers.useMutation();
  const activateUserMutation = trpc.userActivation.activateUser.useMutation();
  const deactivateUserMutation = trpc.userActivation.deactivateUser.useMutation();
  const updateUserRoleMutation = trpc.users.updateRole.useMutation();
  const linkEmployeeMutation = trpc.users.linkEmployee.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم ربط المستخدم بالموظف بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });
  const grantPermissionMutation = trpc.userPermissions.grantPermission.useMutation({
    onSuccess: () => {
      if (selectedUserForPermissions) {
        userPermissionsQuery.refetch();
      }
    },
  });
  const removePermissionMutation = trpc.userPermissions.removePermission.useMutation({
    onSuccess: () => {
      if (selectedUserForPermissions) {
        userPermissionsQuery.refetch();
      }
    },
  });
  const adminChangePasswordMutation = trpc.passwords.adminChangePassword.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      setAdminNewPw("");
      setAdminConfirmPw("");
      setShowPasswordDialog(false);
      setPasswordChangeUserId(null);
    },
    onError: (error) => {
      toast.error("خطأ: " + error.message);
    },
  });

  const createUserMutation = trpc.userPermissions.createUserWithPermissions.useMutation({
    onSuccess: () => {
      setNewUserData({ name: "", email: "", password: "", roleId: 3 });
      setSelectedPermissionIds(new Set());
      setShowAddUserDialog(false);
      refetch();
      toast.success("تم إنشاء المستخدم بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إنشاء المستخدم: " + error.message);
    },
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    if (!permissionsQuery.data) return {};
    const grouped: Record<string, typeof permissionsQuery.data> = {};
    permissionsQuery.data.forEach(perm => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });
    return grouped;
  }, [permissionsQuery.data]);

  // Get user's permission IDs
  const userPermissionIds = useMemo(() => {
    if (!userPermissionsQuery.data) return new Set<number>();
    return new Set(userPermissionsQuery.data.map(p => p.permissionId));
  }, [userPermissionsQuery.data]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUserIds([]);
      setSelectAll(false);
    } else {
      if (users) {
        setSelectedUserIds(users.map(u => u.id));
        setSelectAll(true);
      }
    }
  };

  const handleSelectUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
      setSelectAll(false);
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleActivateUser = async (userId: number) => {
    try {
      await activateUserMutation.mutateAsync({ userId });
      toast.success("تم تفعيل المستخدم بنجاح");
      refetch();
    } catch (error) {
      toast.error(`خطأ: ${error instanceof Error ? error.message : "فشل التفعيل"}`);
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    try {
      await deactivateUserMutation.mutateAsync({ userId });
      toast.success("تم تعطيل المستخدم بنجاح");
      refetch();
    } catch (error) {
      toast.error(`خطأ: ${error instanceof Error ? error.message : "فشل التعطيل"}`);
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      await updateUserRoleMutation.mutateAsync({ userId, roleId });
      toast.success("تم تغيير الدور بنجاح");
      refetch();
    } catch (error) {
      toast.error(`خطأ: ${error instanceof Error ? error.message : "فشل تغيير الدور"}`);
    }
  };

  const handleDelete = async () => {
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }

    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }

    if (selectedUserIds.length === 0) return;

    setLoading(true);
    try {
      await deleteUsersMutation.mutateAsync({
        userIds: selectedUserIds,
      });
      toast.success(`تم حذف ${selectedUserIds.length} مستخدم بنجاح`);
      setSelectedUserIds([]);
      setSelectAll(false);
      setConfirmStep(0);
      refetch();
    } catch (error) {
      toast.error(`خطأ: ${error instanceof Error ? error.message : "فشل الحذف"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmStep(0);
  };

  const handlePermissionToggle = (permissionId: number, hasPermission: boolean) => {
    if (!selectedUserForPermissions) return;

    if (hasPermission) {
      removePermissionMutation.mutate({ userId: selectedUserForPermissions, permissionId });
    } else {
      grantPermissionMutation.mutate({ userId: selectedUserForPermissions, permissionId });
    }
  };

  const handleAddUser = () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    createUserMutation.mutate({
      name: newUserData.name,
      email: newUserData.email,
      password: newUserData.password,
      permissionIds: Array.from(selectedPermissionIds),
    });
  };

  const handlePermissionToggleForNewUser = (permissionId: number) => {
    const newSet = new Set(selectedPermissionIds);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissionIds(newSet);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">مفعل</Badge>;
      case "inactive":
        return <Badge className="bg-red-600">معطل</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">قيد الانتظار</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleName = (roleId: number | null | undefined) => {
    const role = roles?.find(r => r.id === roleId);
    return role?.displayName || "غير محدد";
  };

  const selectedUserData = users?.find(u => u.id === selectedUserForPermissions);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين والصلاحيات</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">إدارة المستخدمين وتوزيع الصلاحيات والأدوار</p>
          </div>
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المستخدم واختر الدور والصلاحيات
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Data */}
                <div className="space-y-4">
                  <h3 className="font-semibold">البيانات الشخصية</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">الاسم</Label>
                      <Input
                        id="name"
                        placeholder="أدخل اسم المستخدم"
                        value={newUserData.name}
                        onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="أدخل البريد الإلكتروني"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="أدخل كلمة المرور"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">الدور</Label>
                      <Select
                        value={newUserData.roleId.toString()}
                        onValueChange={(value) => setNewUserData({ ...newUserData, roleId: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles?.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Permissions Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold">الصلاحيات الإضافية</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                      <div key={module} className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">{module}</h4>
                        <div className="grid grid-cols-2 gap-2 pr-4">
                          {perms.map(perm => (
                            <div key={perm.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`new-perm-${perm.id}`}
                                checked={selectedPermissionIds.has(perm.id)}
                                onCheckedChange={() => handlePermissionToggleForNewUser(perm.id)}
                              />
                              <Label htmlFor={`new-perm-${perm.id}`} className="cursor-pointer text-sm">
                                {perm.displayName}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddUser} disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      "إنشاء المستخدم"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "permissions" | "stats-review")}>
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              قائمة المستخدمين
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="h-4 w-4" />
              إدارة الصلاحيات
            </TabsTrigger>
            <TabsTrigger value="stats-review" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              مراجعة الإحصائيات
            </TabsTrigger>
          </TabsList>

          {/* Users List Tab */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>قائمة المستخدمين</CardTitle>
                <CardDescription>إدارة المستخدمين وتفعيلهم وتعطيلهم وتغيير أدوارهم</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث عن مستخدم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-gray-500">جاري التحميل...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Select All */}
                    <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        id="select-all"
                      />
                      <label htmlFor="select-all" className="font-medium cursor-pointer">
                        تحديد الكل ({selectedUserIds.length} محدد)
                      </label>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="text-right py-3 px-4">تحديد</th>
                            <th className="text-right py-3 px-4">البريد الإلكتروني</th>
                            <th className="text-right py-3 px-4">الاسم</th>
                            <th className="text-right py-3 px-4">الدور</th>
                            <th className="text-right py-3 px-4">الموظف المرتبط</th>
                            <th className="text-right py-3 px-4">الحالة</th>
                            <th className="text-right py-3 px-4">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers?.map((u) => (
                            <tr key={u.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-4">
                                <Checkbox
                                  checked={selectedUserIds.includes(u.id)}
                                  onCheckedChange={() => handleSelectUser(u.id)}
                                />
                              </td>
                              <td className="py-3 px-4">{u.email}</td>
                              <td className="py-3 px-4">{u.name}</td>
                              <td className="py-3 px-4">
                                <Select
                                  value={u.roleId?.toString() || ""}
                                  onValueChange={(value) => handleRoleChange(u.id, parseInt(value))}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="اختر الدور" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roles?.map((role) => (
                                      <SelectItem key={role.id} value={role.id.toString()}>
                                        {role.displayName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 px-4">
                                <Select
                                  value={(u as any).employeeId?.toString() || "none"}
                                  onValueChange={(value) => {
                                    const employeeId = value === "none" ? null : parseInt(value);
                                    linkEmployeeMutation.mutate({ userId: u.id, employeeId });
                                  }}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue placeholder="اختر موظف" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">بدون ربط</SelectItem>
                                    {employees?.map((emp) => (
                                      <SelectItem key={emp.id} value={emp.id.toString()}>
                                        {emp.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  {(u.status === "pending" || u.status === "inactive") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleActivateUser(u.id)}
                                      className="text-green-600 hover:text-green-700"
                                      title="تفعيل"
                                    >
                                      <Unlock className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {u.status === "active" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeactivateUser(u.id)}
                                      className="text-red-600 hover:text-red-700"
                                      title="تعطيل"
                                    >
                                      <Lock className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUserForPermissions(u.id);
                                      setActiveTab("permissions");
                                    }}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="إدارة الصلاحيات"
                                  >
                                    <Shield className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setPasswordChangeUserId(u.id);
                                      setPasswordChangeUserName(u.name || u.email);
                                      setAdminNewPw("");
                                      setAdminConfirmPw("");
                                      setShowAdminPw(false);
                                      setShowAdminConfirmPw(false);
                                      setShowPasswordDialog(true);
                                    }}
                                    className="text-amber-600 hover:text-amber-700"
                                    title="تغيير كلمة المرور"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Delete Button */}
                    {selectedUserIds.length > 0 && (
                      <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-900 dark:text-red-100">
                              حذف {selectedUserIds.length} مستخدم
                            </p>
                            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                              سيتم حذف جميع البيانات المرتبطة بهم
                            </p>
                            {confirmStep === 0 && (
                              <Button
                                onClick={handleDelete}
                                variant="destructive"
                                className="mt-3"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                حذف المستخدمين المحددين
                              </Button>
                            )}
                            {confirmStep === 1 && (
                              <div className="mt-3 space-y-2">
                                <p className="text-sm font-medium">هل أنت متأكد؟</p>
                                <div className="flex gap-2">
                                  <Button onClick={handleDelete} variant="destructive" size="sm">
                                    نعم، حذف
                                  </Button>
                                  <Button onClick={handleCancel} variant="outline" size="sm">
                                    إلغاء
                                  </Button>
                                </div>
                              </div>
                            )}
                            {confirmStep === 2 && (
                              <div className="mt-3 space-y-2">
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                  هذا الإجراء لا يمكن التراجع عنه!
                                </p>
                                <div className="flex gap-2">
                                  <Button onClick={handleDelete} variant="destructive" size="sm" disabled={loading}>
                                    {loading ? "جاري الحذف..." : "نعم، احذف نهائياً"}
                                  </Button>
                                  <Button onClick={handleCancel} variant="outline" size="sm">
                                    إلغاء
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Users List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>المستخدمون</CardTitle>
                    <CardDescription>اختر مستخدماً لإدارة صلاحياته</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="ابحث عن مستخدم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">لا توجد مستخدمين</p>
                      ) : (
                        filteredUsers.map(u => (
                          <button
                            key={u.id}
                            onClick={() => setSelectedUserForPermissions(u.id)}
                            className={`w-full text-right p-3 rounded-lg border-2 transition-colors ${
                              selectedUserForPermissions === u.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <div className="font-medium text-sm">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getRoleName(u.roleId)}
                              </Badge>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Permissions Management */}
              <div className="lg:col-span-2">
                {selectedUserForPermissions ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>صلاحيات المستخدم: {selectedUserData?.name}</CardTitle>
                      <CardDescription>إدارة صلاحيات المستخدم المختار</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userPermissionsQuery.isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(groupedPermissions).map(([module, perms]) => (
                            <div key={module} className="space-y-3">
                              <h3 className="font-semibold text-lg">{module}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {perms.map(perm => {
                                  const hasPermission = userPermissionIds.has(perm.id);
                                  return (
                                    <div key={perm.id} className="flex items-center gap-2">
                                      <Checkbox
                                        id={`perm-${perm.id}`}
                                        checked={hasPermission}
                                        onCheckedChange={() =>
                                          handlePermissionToggle(perm.id, hasPermission)
                                        }
                                        disabled={
                                          grantPermissionMutation.isPending ||
                                          removePermissionMutation.isPending
                                        }
                                      />
                                      <Label
                                        htmlFor={`perm-${perm.id}`}
                                        className="cursor-pointer flex-1"
                                      >
                                        {perm.displayName}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Shield className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">اختر مستخدماً لعرض وإدارة صلاحياته</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Stats Review Tab */}
          <TabsContent value="stats-review" className="mt-6">
            <DailyStatsReview embedded={true} />
          </TabsContent>
        </Tabs>
      </div>
      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
              تغيير كلمة المرور
            </DialogTitle>
            <DialogDescription>
              تغيير كلمة مرور المستخدم: <strong>{passwordChangeUserName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-new-pw">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="dialog-new-pw"
                  type={showAdminPw ? "text" : "password"}
                  placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                  value={adminNewPw}
                  onChange={(e) => setAdminNewPw(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPw(!showAdminPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showAdminPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-confirm-pw">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="dialog-confirm-pw"
                  type={showAdminConfirmPw ? "text" : "password"}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  value={adminConfirmPw}
                  onChange={(e) => setAdminConfirmPw(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminConfirmPw(!showAdminConfirmPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showAdminConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {adminConfirmPw && adminNewPw !== adminConfirmPw && (
                <p className="text-sm text-red-500">كلمات المرور غير متطابقة</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (!passwordChangeUserId) return;
                if (!adminNewPw || !adminConfirmPw) {
                  toast.error("يرجى ملء جميع الحقول");
                  return;
                }
                if (adminNewPw !== adminConfirmPw) {
                  toast.error("كلمات المرور غير متطابقة");
                  return;
                }
                if (adminNewPw.length < 6) {
                  toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                  return;
                }
                adminChangePasswordMutation.mutate({
                  userId: passwordChangeUserId,
                  newPassword: adminNewPw,
                  sendEmail: false,
                });
              }}
              disabled={adminChangePasswordMutation.isPending || !adminNewPw || !adminConfirmPw}
            >
              {adminChangePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                "تحديث كلمة المرور"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
