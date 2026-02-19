import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function BulkDeleteUsers() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [confirmStep, setConfirmStep] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.roleId !== 1) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: users, isLoading } = trpc.users.list.useQuery();
  const deleteUsersMutation = trpc.bulkDelete.deleteUsers.useMutation();

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

  const handleDelete = async () => {
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }

    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }

    // Final confirmation - perform delete
    if (selectedUserIds.length === 0) return;

    setLoading(true);
    try {
      await deleteUsersMutation.mutateAsync({
        userIds: selectedUserIds,
      });
      alert(`تم حذف ${selectedUserIds.length} مستخدم بنجاح`);
      setSelectedUserIds([]);
      setSelectAll(false);
      setConfirmStep(0);
    } catch (error) {
      alert(`خطأ: ${error instanceof Error ? error.message : "فشل الحذف"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmStep(0);
  };

  if (!user || user.roleId !== 1) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">حذف المستخدمين بشكل جماعي</h1>
          <p className="text-muted-foreground">
            اختر المستخدمين الذين تريد حذفهم. سيتم حذف جميع البيانات المرتبطة بهم من قاعدة البيانات.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Warning Card */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                تحذير
              </CardTitle>
            </CardHeader>
            <CardContent className="text-red-700">
              <p className="mb-2">هذا الإجراء دائم ولا يمكن التراجع عنه!</p>
              <p>سيتم حذف:</p>
              <ul className="list-disc list-inside mt-2 ml-2">
                <li>حساب المستخدم</li>
                <li>كلمات المرور السابقة</li>
                <li>الصلاحيات المرتبطة</li>
                <li>جميع البيانات المرتبطة بالموظف (إن وجدت)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Users Selection */}
          <Card>
            <CardHeader>
              <CardTitle>المستخدمون</CardTitle>
              <CardDescription>
                اختر المستخدمين للحذف ({selectedUserIds.length} مختار)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : users && users.length > 0 ? (
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      disabled={loading}
                    />
                    <label className="flex-1 cursor-pointer font-medium">
                      اختر الكل ({users.length})
                    </label>
                  </div>

                  {/* User List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                        <Checkbox
                          checked={selectedUserIds.includes(u.id)}
                          onCheckedChange={() => handleSelectUser(u.id)}
                          disabled={loading}
                        />
                        <label className="flex-1 cursor-pointer">
                          <div className="font-medium">{u.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {u.roleId === 1 ? "مسؤول" : "مستخدم"}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مستخدمون
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Steps */}
          {confirmStep > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">تأكيد الحذف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {confirmStep >= 1 && (
                  <div className="p-3 bg-white border border-red-200 rounded">
                    <p className="font-medium text-red-700 mb-2">الخطوة 1: تأكيد الحذف</p>
                    <p className="text-sm text-red-600">
                      هل أنت متأكد من رغبتك في حذف {selectedUserIds.length} مستخدم؟
                    </p>
                  </div>
                )}

                {confirmStep >= 2 && (
                  <div className="p-3 bg-white border border-red-200 rounded">
                    <p className="font-medium text-red-700 mb-2">الخطوة 2: تأكيد نهائي</p>
                    <p className="text-sm text-red-600">
                      هذا الإجراء دائم. اضغط على "حذف نهائي" للمتابعة.
                    </p>
                  </div>
                )}

                {confirmStep >= 3 && (
                  <div className="p-3 bg-white border border-red-200 rounded">
                    <p className="font-medium text-red-700 mb-2">الخطوة 3: تأكيد أخير</p>
                    <p className="text-sm text-red-600">
                      اضغط على "حذف نهائي" مرة أخرى لتأكيد الحذف الكامل.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {confirmStep > 0 && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                إلغاء
              </Button>
            )}
            <Button
              variant={confirmStep === 0 ? "outline" : "destructive"}
              onClick={handleDelete}
              disabled={selectedUserIds.length === 0 || loading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {confirmStep === 0
                ? `حذف (${selectedUserIds.length})`
                : confirmStep === 1
                ? "تأكيد الحذف"
                : confirmStep === 2
                ? "حذف نهائي"
                : "جاري الحذف..."}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
