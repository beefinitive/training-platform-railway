import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Lock, History, Eye, EyeOff, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function PasswordManagement() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

  // Form states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");

  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminSendEmail, setAdminSendEmail] = useState(false);

  // Queries
  const { data: users } = trpc.userPermissions.listUsers.useQuery();
  const parsedUserId = selectedUserId ? parseInt(selectedUserId) : 0;
  const { data: passwordHistory } = trpc.passwords.getHistory.useQuery(
    { userId: parsedUserId, limit: 10 },
    { enabled: parsedUserId > 0 }
  );
  const { data: auditLog } = trpc.passwords.getAudit.useQuery(
    { userId: parsedUserId },
    { enabled: parsedUserId > 0 }
  );

  // Mutations
  const changePasswordMutation = trpc.passwords.changePassword.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setReason("");
    },
    onError: (error) => {
      toast.error("خطأ: " + error.message);
    },
  });

  const adminChangeMutation = trpc.passwords.adminChangePassword.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      setAdminNewPassword("");
      setAdminConfirmPassword("");
      setAdminSendEmail(false);
    },
    onError: (error) => {
      toast.error("خطأ: " + error.message);
    },
  });

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword || !oldPassword) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    changePasswordMutation.mutate({
      userId: parsedUserId || 0,
      oldPassword,
      newPassword,
      reason: reason || undefined,
    });
  };

  const handleAdminChange = () => {
    if (!parsedUserId) {
      toast.error("يرجى اختيار مستخدم أولاً");
      return;
    }
    if (!adminNewPassword || !adminConfirmPassword) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }
    if (adminNewPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    adminChangeMutation.mutate({
      userId: parsedUserId,
      newPassword: adminNewPassword,
      sendEmail: adminSendEmail,
    });
  };

  const selectedUserName = users?.find((u: any) => u.id === parsedUserId)?.name || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة كلمات المرور</h1>
        <p className="text-muted-foreground mt-2">تغيير وإدارة كلمات مرور المستخدمين</p>
      </div>

      <Tabs defaultValue="change" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="change" className="gap-2">
            <KeyRound className="h-4 w-4" />
            تغيير كلمة المرور
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            تغيير من الإدارة
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            السجل
          </TabsTrigger>
        </TabsList>

        {/* Change Own Password Tab */}
        <TabsContent value="change" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة المرور الخاصة بك</CardTitle>
              <CardDescription>قم بتغيير كلمة المرور الحالية إلى كلمة جديدة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="own-old-password">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    id="own-old-password"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور الحالية"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="own-new-password">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="own-new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="own-confirm-password">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="own-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-500">كلمات المرور غير متطابقة</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="own-reason">السبب (اختياري)</Label>
                <Input
                  id="own-reason"
                  type="text"
                  placeholder="مثال: تحديث أمني"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || !oldPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  "تحديث كلمة المرور"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Change Tab */}
        <TabsContent value="admin" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة مرور المستخدم</CardTitle>
              <CardDescription>اختر مستخدماً وقم بتغيير كلمة مروره بدون الحاجة لكلمة المرور الحالية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>اختر المستخدم</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={(val) => {
                    setSelectedUserId(val);
                    setAdminNewPassword("");
                    setAdminConfirmPassword("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- اختر مستخدماً --" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {parsedUserId > 0 && (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex gap-2">
                    <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      ستقوم بتغيير كلمة مرور <strong>{selectedUserName}</strong> بدون التحقق من كلمة المرور الحالية
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-new-pw">كلمة المرور الجديدة</Label>
                    <div className="relative">
                      <Input
                        id="admin-new-pw"
                        type={showAdminNewPassword ? "text" : "password"}
                        placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                      >
                        {showAdminNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-confirm-pw">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="admin-confirm-pw"
                        type={showAdminConfirmPassword ? "text" : "password"}
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                      >
                        {showAdminConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {adminConfirmPassword && adminNewPassword !== adminConfirmPassword && (
                      <p className="text-sm text-red-500">كلمات المرور غير متطابقة</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                    <input
                      type="checkbox"
                      id="admin-send-email"
                      checked={adminSendEmail}
                      onChange={(e) => setAdminSendEmail(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="admin-send-email" className="text-sm text-amber-900 dark:text-amber-200 cursor-pointer">
                      إرسال بريد إلكتروني للمستخدم بكلمة المرور الجديدة (اختياري)
                    </label>
                  </div>

                  <Button
                    onClick={handleAdminChange}
                    disabled={adminChangeMutation.isPending || !adminNewPassword || !adminConfirmPassword}
                    className="w-full"
                  >
                    {adminChangeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        جاري التحديث...
                      </>
                    ) : (
                      "تحديث كلمة المرور"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل كلمات المرور</CardTitle>
              <CardDescription>عرض سجل التغييرات والتدقيق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>اختر المستخدم</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- اختر مستخدماً --" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {parsedUserId > 0 && (
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
