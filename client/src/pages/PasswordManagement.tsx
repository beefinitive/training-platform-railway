import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Lock, History, Eye, EyeOff } from "lucide-react";

export default function PasswordManagement() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form states
  const [changePasswordForm, setChangePasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    reason: "",
  });

  const [adminChangeForm, setAdminChangeForm] = useState({
    newPassword: "",
    confirmPassword: "",
    sendEmail: false,
  });

  // Queries
  const { data: users } = trpc.userPermissions.listUsers.useQuery();
  const { data: passwordHistory } = trpc.passwords.getHistory.useQuery(
    selectedUserId ? { userId: selectedUserId, limit: 10 } : { userId: 0, limit: 10 },
    { enabled: !!selectedUserId }
  );
  const { data: auditLog } = trpc.passwords.getAudit.useQuery(
    selectedUserId ? { userId: selectedUserId } : { userId: 0 },
    { enabled: !!selectedUserId }
  );
  const { data: canChange } = trpc.passwords.canChangeOwnPassword.useQuery(
    selectedUserId ? { userId: selectedUserId } : { userId: 0 },
    { enabled: !!selectedUserId }
  );

  // Mutations
  const changePasswordMutation = trpc.passwords.changePassword.useMutation({
    onSuccess: () => {
      alert("تم تغيير كلمة المرور بنجاح");
      setChangePasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "", reason: "" });
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const adminChangeMutation = trpc.passwords.adminChangePassword.useMutation({
    onSuccess: () => {
      alert("تم تغيير كلمة المرور بنجاح");
      setAdminChangeForm({ newPassword: "", confirmPassword: "", sendEmail: false });
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const handleChangePassword = () => {
    if (!selectedUserId) return;
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      alert("كلمات المرور غير متطابقة");
      return;
    }

    changePasswordMutation.mutate({
      userId: selectedUserId,
      oldPassword: changePasswordForm.oldPassword,
      newPassword: changePasswordForm.newPassword,
      reason: changePasswordForm.reason || undefined,
    });
  };

  const handleAdminChange = () => {
    if (!selectedUserId) return;
    if (adminChangeForm.newPassword !== adminChangeForm.confirmPassword) {
      alert("كلمات المرور غير متطابقة");
      return;
    }

    adminChangeMutation.mutate({
      userId: selectedUserId,
      newPassword: adminChangeForm.newPassword,
      sendEmail: adminChangeForm.sendEmail,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة كلمات المرور</h1>
        <p className="text-muted-foreground mt-2">تغيير وإدارة كلمات مرور المستخدمين</p>
      </div>

      <Tabs defaultValue="change" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="change">تغيير كلمة المرور</TabsTrigger>
          <TabsTrigger value="admin">تغيير من الإدارة</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
        </TabsList>

        {/* Change Password Tab */}
        <TabsContent value="change" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة المرور الخاصة بك</CardTitle>
              <CardDescription>قم بتغيير كلمة المرور الحالية إلى كلمة جديدة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    id="old-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور الحالية"
                    value={changePasswordForm.oldPassword}
                    onChange={(e) =>
                      setChangePasswordForm({ ...changePasswordForm, oldPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة"
                  value={changePasswordForm.newPassword}
                  onChange={(e) =>
                    setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) =>
                    setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">السبب (اختياري)</Label>
                <Input
                  id="reason"
                  type="text"
                  placeholder="مثال: تحديث أمني"
                  value={changePasswordForm.reason}
                  onChange={(e) =>
                    setChangePasswordForm({ ...changePasswordForm, reason: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                className="w-full"
              >
                {changePasswordMutation.isPending ? "جاري التحديث..." : "تحديث كلمة المرور"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Change Tab */}
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة مرور المستخدم</CardTitle>
              <CardDescription>اختر مستخدماً وقم بتغيير كلمة مروره</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">اختر المستخدم</Label>
                <select
                  id="user-select"
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">-- اختر مستخدماً --</option>
                  {users?.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserId && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-2">
                    <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                    <p className="text-sm text-blue-800">
                      ستقوم بتغيير كلمة مرور المستخدم بدون التحقق من كلمة المرور الحالية
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-new-password">كلمة المرور الجديدة</Label>
                    <Input
                      id="admin-new-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="أدخل كلمة المرور الجديدة"
                      value={adminChangeForm.newPassword}
                      onChange={(e) =>
                        setAdminChangeForm({ ...adminChangeForm, newPassword: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-confirm-password">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="admin-confirm-password"
                        type={showConfirm ? "text" : "password"}
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        value={adminChangeForm.confirmPassword}
                        onChange={(e) =>
                          setAdminChangeForm({ ...adminChangeForm, confirmPassword: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>


                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <input
                      type="checkbox"
                      id="send-email"
                      checked={adminChangeForm.sendEmail}
                      onChange={(e) =>
                        setAdminChangeForm({ ...adminChangeForm, sendEmail: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="send-email" className="text-sm text-amber-900 cursor-pointer">
                      إرسال بريد إلكتروني للمستخدم بكلمة المرور الجديدة (اختياري)
                    </label>
                  </div>
                  <Button
                    onClick={handleAdminChange}
                    disabled={adminChangeMutation.isPending}
                    className="w-full"
                  >
                    {adminChangeMutation.isPending ? "جاري التحديث..." : "تحديث كلمة المرور"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل كلمات المرور</CardTitle>
              <CardDescription>عرض سجل التغييرات والتدقيق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="history-user-select">اختر المستخدم</Label>
                <select
                  id="history-user-select"
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">-- اختر مستخدماً --</option>
                  {users?.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserId && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <History size={18} />
                      سجل التغييرات الأخيرة
                    </h3>
                    {passwordHistory && passwordHistory.length > 0 ? (
                      <div className="space-y-2">
                        {passwordHistory.map((entry, idx) => (
                          <div key={idx} className="border rounded-md p-3 bg-muted/50">
                            <p className="text-sm text-muted-foreground">
                              {new Date(entry.changedAt).toLocaleString("ar-SA")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">لا توجد تغييرات سابقة</p>
                    )}
                  </div>

                  <div className="space-y-3 mt-6 pt-6 border-t">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Lock size={18} />
                      سجل التدقيق
                    </h3>
                    {auditLog && auditLog.length > 0 ? (
                      <div className="space-y-2">
                        {auditLog.map((entry, idx) => (
                          <div key={idx} className="border rounded-md p-3 bg-muted/50">
                            <p className="text-sm font-medium">{entry.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(entry.changedAt).toLocaleString("ar-SA")}
                            </p>
                            {entry.changedByName && (
                              <p className="text-xs text-muted-foreground">
                                بواسطة: {entry.changedByName}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">لا توجد تغييرات</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
