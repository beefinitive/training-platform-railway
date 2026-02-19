import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Plus } from "lucide-react";

export default function PermissionsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());

  // Queries
  const usersQuery = trpc.userPermissions.listUsers.useQuery();
  const permissionsQuery = trpc.userPermissions.listPermissions.useQuery();
  const userPermissionsQuery = trpc.userPermissions.getUserPermissions.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  // Mutations
  const grantPermissionMutation = trpc.userPermissions.grantPermission.useMutation({
    onSuccess: () => {
      if (selectedUserId) {
        userPermissionsQuery.refetch();
      }
    },
  });

  const removePermissionMutation = trpc.userPermissions.removePermission.useMutation({
    onSuccess: () => {
      if (selectedUserId) {
        userPermissionsQuery.refetch();
      }
    },
  });

  const setPermissionsMutation = trpc.userPermissions.setPermissions.useMutation({
    onSuccess: () => {
      if (selectedUserId) {
        userPermissionsQuery.refetch();
      }
    },
  });

  const createUserMutation = trpc.userPermissions.createUserWithPermissions.useMutation({
    onSuccess: () => {
      setNewUserData({ name: "", email: "", password: "" });
      setSelectedPermissionIds(new Set());
      setShowAddUserDialog(false);
      usersQuery.refetch();
    },
    onError: (error) => {
      alert("حدث خطأ أثناء إنشاء المستخدم: " + error.message);
    },
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!usersQuery.data) return [];
    return usersQuery.data.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usersQuery.data, searchTerm]);

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

  const handlePermissionToggle = (permissionId: number, hasPermission: boolean) => {
    if (!selectedUserId) return;

    if (hasPermission) {
      removePermissionMutation.mutate({ userId: selectedUserId, permissionId });
    } else {
      grantPermissionMutation.mutate({ userId: selectedUserId, permissionId });
    }
  };

  const handleAddUser = () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      alert("يرجى ملء جميع الحقول");
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة الصلاحيات</h1>
            <p className="text-gray-600 mt-2">منح وسحب الصلاحيات للمستخدمين</p>
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
                  أدخل بيانات المستخدم واختر الصلاحيات
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Data */}
                <div className="space-y-4">
                  <h3 className="font-semibold">البيانات الشخصية</h3>
                  <div className="space-y-3">
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
                  </div>
                </div>

                {/* Permissions Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold">الصلاحيات</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                      <div key={module} className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">{module}</h4>
                        <div className="space-y-2 pr-4">
                          {perms.map(perm => (
                            <div key={perm.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`new-perm-${perm.id}`}
                                checked={selectedPermissionIds.has(perm.id)}
                                onCheckedChange={() => handlePermissionToggleForNewUser(perm.id)}
                              />
                              <Label htmlFor={`new-perm-${perm.id}`} className="cursor-pointer">
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
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث عن مستخدم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {usersQuery.isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">لا توجد مستخدمين</p>
                  ) : (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full text-right p-3 rounded-lg border-2 transition-colors ${
                          selectedUserId === user.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions Management */}
          <div className="lg:col-span-2">
            {selectedUserId ? (
              <Card>
                <CardHeader>
                  <CardTitle>صلاحيات المستخدم</CardTitle>
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
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-gray-500">اختر مستخدماً لعرض صلاحياته</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
