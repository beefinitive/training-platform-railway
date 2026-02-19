import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSearch, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function EmployeeProfile() {
  const params = useParams<{ id: string }>();
  const searchParams = new URLSearchParams(useSearch());
  // دعم كلا الطريقتين: /employees/:id أو /employees?id=X
  const employeeId = parseInt(params.id || searchParams.get("id") || "0");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    email: "",
    phone: "",
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get available roles
  const { data: roles = [] } = trpc.system.listRoles.useQuery();

  // Get employee profile
  const { data: profile, isLoading: profileLoading } = trpc.employees.profile.useQuery(
    employeeId > 0 ? { employeeId } : { employeeId: 0 },
    { enabled: employeeId > 0 }
  );

  // Get employee targets with progress
  const { data: targets, isLoading: targetsLoading } = trpc.employees.targetsWithProgress.useQuery(
    employeeId > 0 ? { employeeId, month: selectedMonth, year: selectedYear } : { employeeId: 0 },
    { enabled: employeeId > 0 }
  );

  // Get attendance records
  const { data: attendance, isLoading: attendanceLoading } = trpc.employees.attendance.useQuery(
    employeeId > 0 ? { employeeId, month: selectedMonth, year: selectedYear } : { employeeId: 0 },
    { enabled: employeeId > 0 }
  );

  // Get salary records
  const { data: salaries, isLoading: salariesLoading } = trpc.employees.salaryRecords.useQuery(
    employeeId > 0 ? { employeeId, year: selectedYear } : { employeeId: 0 },
    { enabled: employeeId > 0 }
  );

  // Update profile mutation
  const updateProfileMutation = trpc.employees.updateProfile.useMutation({
    onSuccess: () => {
      alert("تم تحديث البيانات بنجاح");
      setIsEditing(false);
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  // Update role mutation
  const updateRoleMutation = trpc.employees.updateRole.useMutation({
    onSuccess: () => {
      alert("تم تحديث الدور بنجاح");
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const handleEditClick = useCallback(() => {
    if (profile) {
      setEditData({
        email: profile.email || "",
        phone: profile.phone || "",
      });
      setIsEditing(true);
    }
  }, [profile]);

  const handleSaveProfile = useCallback(async () => {
    if (employeeId <= 0) return;

    try {
      await updateProfileMutation.mutateAsync({
        employeeId,
        email: editData.email,
        phone: editData.phone,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }, [employeeId, editData, updateProfileMutation]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (employeeId <= 0 || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      if (!file.type.startsWith("image/")) {
        alert("الرجاء اختيار ملف صورة");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        return;
      }
      const buffer = await file.arrayBuffer();
      const ext = file.name.split(".").pop() || "jpg";
      const fileKey = `employees/${employeeId}/profile-${Date.now()}.${ext}`;
      const response = await fetch("/api/trpc/employees.uploadProfileImage?batch=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          0: { json: { employeeId, fileKey, fileData: Array.from(new Uint8Array(buffer)), mimeType: file.type } }
        })
      });
      if (!response.ok) throw new Error("فشل رفع الصورة");
      const result = await response.json();
      if (result[0]?.result?.data?.json?.url) {
        await updateProfileMutation.mutateAsync({ employeeId, profileImage: result[0].result.data.json.url });
        alert("تم رفع الصورة بنجاح");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("خطأ في رفع الصورة");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [employeeId, updateProfileMutation]);

  if (profileLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  if (!profile) {
    return <div className="p-6">لم يتم العثور على بيانات الموظف</div>;
  }

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
    <div className="space-y-6 p-6">
      {/* Header with profile image and basic info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-white">{profile.name.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => fileInputRef.current?.click()}>
                  <span className="text-white text-sm">تغيير الصورة</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
                size="sm"
              >
                {uploading ? "جاري الرفع..." : "رفع صورة"}
              </Button>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <p className="text-gray-600">
                  {profile.specialization === "customer_service" && "خدمة عملاء"}
                  {profile.specialization === "marketing" && "تسويق"}
                  {profile.specialization === "executive_manager" && "مدير تنفيذي"}
                  {profile.specialization === "developer" && "مبرمج"}
                  {profile.specialization === "support" && "داعم"}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">الراتب الأساسي</p>
                  <p className="text-xl font-bold text-blue-600">{profile.salary} ر.س</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">تاريخ التعيين</p>
                  <p className="text-lg font-semibold">
                    {profile.hireDate ? format(new Date(profile.hireDate), "dd/MM/yyyy", { locale: ar }) : "-"}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">نوع العمل</p>
                  <p className="text-lg font-semibold">
                    {profile.workType === "remote" && "عن بعد"}
                    {profile.workType === "onsite" && "حضوري"}
                    {profile.workType === "hybrid" && "مختلط"}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <Button onClick={handleEditClick} variant="outline">
                  تعديل البيانات الشخصية
                </Button>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <Label>رقم الجوال</Label>
                  <Input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>الدور الوظيفي</Label>
                  <select
                    value={selectedRole || ""}
                    onChange={(e) => setSelectedRole(parseInt(e.target.value) || null)}
                    className="border rounded px-3 py-2 w-full"
                  >
                    <option value="">اختر الدور</option>
                    {roles.map((role: any) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ البيانات"}
                </Button>
                {selectedRole && (
                  <Button onClick={() => {
                    if (employeeId > 0 && selectedRole) {
                      updateRoleMutation.mutate({ employeeId, roleId: selectedRole });
                    }
                  }} disabled={updateRoleMutation.isPending}>
                    {updateRoleMutation.isPending ? "جاري التحديث..." : "تحديث الدور"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="targets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="targets">المستهدفات</TabsTrigger>
          <TabsTrigger value="attendance">الحضور والانصراف</TabsTrigger>
          <TabsTrigger value="salary">الراتب</TabsTrigger>
        </TabsList>

        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-4">
          <div className="flex gap-4">
            <div>
              <Label>الشهر</Label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border rounded px-3 py-2"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>السنة</Label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border rounded px-3 py-2"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {targetsLoading ? (
            <div>جاري التحميل...</div>
          ) : targets && targets.length > 0 ? (
            <div className="space-y-4">
              {targets.map((target) => (
                <Card key={target.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{target.customName || target.targetType}</h3>
                        <span className="text-sm font-bold text-blue-600">{target.achieved} / {target.targetValue}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(target.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">{Math.round(target.percentage)}% من المستهدف</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد مستهدفات</div>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex gap-4">
            <div>
              <Label>الشهر</Label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border rounded px-3 py-2"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {attendanceLoading ? (
            <div>جاري التحميل...</div>
          ) : attendance && attendance.length > 0 ? (
            <div className="space-y-2">
              {attendance.map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        {format(new Date(record.date), "EEEE dd/MM/yyyy", { locale: ar })}
                      </span>
                      <div className="text-sm">
                        <span className="text-green-600">
                          الدخول: {record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "-"}
                        </span>
                        <span className="mx-4 text-gray-400">|</span>
                        <span className="text-red-600">
                          الخروج: {record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "-"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد سجلات حضور</div>
          )}
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary" className="space-y-4">
          <div>
            <Label>السنة</Label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {salariesLoading ? (
            <div>جاري التحميل...</div>
          ) : salaries && salaries.length > 0 ? (
            <div className="space-y-4">
              {salaries.map((salary) => (
                <Card key={salary.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {months.find((m) => m.value === salary.month)?.label} {salary.year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-gray-600">الراتب الأساسي</p>
                        <p className="text-lg font-bold text-blue-600">{salary.baseSalary} ر.س</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <p className="text-sm text-gray-600">الحسومات</p>
                        <p className="text-lg font-bold text-red-600">{salary.totalDeductions} ر.س</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-sm text-gray-600">المكافآت</p>
                        <p className="text-lg font-bold text-green-600">{salary.totalBonuses} ر.س</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-sm text-gray-600">الصافي</p>
                        <p className="text-lg font-bold text-purple-600">{salary.netSalary} ر.س</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="font-semibold">الحالة:</span>
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${
                        salary.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {salary.status === 'paid' ? 'مدفوع' : 'معلق'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد سجلات رواتب</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
