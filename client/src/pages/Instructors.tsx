import { useState, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, User, Mail, Phone, Pencil, Trash2, Upload, Users, Search, X } from "lucide-react";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

export default function Instructors() {
  const { hasPermission } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    photoUrl: "",
    bio: "",
  });

  const utils = trpc.useUtils();
  const { data: instructors, isLoading } = trpc.instructors.list.useQuery();
  const { data: stats } = trpc.instructors.stats.useQuery();

  const createMutation = trpc.instructors.create.useMutation({
    onSuccess: () => {
      utils.instructors.list.invalidate();
      utils.instructors.stats.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("تم إضافة المدرب بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const updateMutation = trpc.instructors.update.useMutation({
    onSuccess: () => {
      utils.instructors.list.invalidate();
      setIsEditDialogOpen(false);
      resetForm();
      toast.success("تم تحديث بيانات المدرب بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const deleteMutation = trpc.instructors.delete.useMutation({
    onSuccess: () => {
      utils.instructors.list.invalidate();
      utils.instructors.stats.invalidate();
      setDeleteDialogOpen(false);
      setSelectedInstructor(null);
      toast.success("تم حذف المدرب بنجاح");
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      photoUrl: "",
      bio: "",
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الصورة");
      setUploading(false);
    }
  };

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم المدرب");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedInstructor) return;
    updateMutation.mutate({
      id: selectedInstructor.id,
      ...formData,
    });
  };

  const openEditDialog = (instructor: any) => {
    setSelectedInstructor(instructor);
    setFormData({
      name: instructor.name || "",
      email: instructor.email || "",
      phone: instructor.phone || "",
      photoUrl: instructor.photoUrl || "",
      bio: instructor.bio || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (instructor: any) => {
    setSelectedInstructor(instructor);
    setDeleteDialogOpen(true);
  };

  // Filter instructors based on search
  const filteredInstructors = useMemo(() => {
    if (!instructors) return [];
    
    const activeInstructors = instructors.filter((i: any) => i.status === "active");
    
    if (!searchQuery) return activeInstructors;
    
    const searchLower = searchQuery.toLowerCase();
    return activeInstructors.filter((instructor: any) => 
      instructor.name.toLowerCase().includes(searchLower) ||
      (instructor.email && instructor.email.toLowerCase().includes(searchLower)) ||
      (instructor.phone && instructor.phone.includes(searchQuery)) ||
      (instructor.bio && instructor.bio.toLowerCase().includes(searchLower))
    );
  }, [instructors, searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif">المدربون</h1>
            <p className="text-muted-foreground mt-1">إدارة بيانات المدربين</p>
          </div>
          {hasPermission(PERMISSIONS.INSTRUCTORS_CREATE) && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة مدرب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة مدرب جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="صورة المدرب" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="ml-2 h-4 w-4" />
                    {uploading ? "جاري الرفع..." : "رفع صورة"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">اسم المدرب *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم المدرب"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم التواصل</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">نبذة عن المدرب</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="نبذة مختصرة عن المدرب وخبراته..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAdd} disabled={createMutation.isPending} className="flex-1">
                    {createMutation.isPending ? "جاري الإضافة..." : "إضافة المدرب"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المدربين</p>
                  <p className="text-2xl font-bold">{stats?.totalInstructors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مدربون لديهم دورات</p>
                  <p className="text-2xl font-bold">{stats?.instructorsWithCourses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Section */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث باسم المدرب أو البريد أو رقم التواصل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              {/* Clear Search Button */}
              {searchQuery && (
                <Button variant="outline" onClick={clearSearch} className="gap-2">
                  <X className="h-4 w-4" />
                  مسح البحث
                </Button>
              )}
            </div>
            
            {/* Results count */}
            {instructors && (
              <div className="mt-3 text-sm text-muted-foreground">
                عرض {filteredInstructors.length} من {instructors.filter((i: any) => i.status === "active").length} مدرب
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructors Grid */}
        {filteredInstructors && filteredInstructors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstructors.map((instructor: any) => (
              <Card key={instructor.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {instructor.photoUrl ? (
                        <img src={instructor.photoUrl} alt={instructor.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{instructor.name}</h3>
                      {instructor.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Mail className="h-4 w-4" />
                          <span className="truncate" dir="ltr">{instructor.email}</span>
                        </div>
                      )}
                      {instructor.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{instructor.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {instructor.bio && (
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{instructor.bio}</p>
                  )}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {hasPermission(PERMISSIONS.INSTRUCTORS_EDIT) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(instructor)}
                      >
                        <Pencil className="ml-2 h-4 w-4" />
                        تعديل
                      </Button>
                    )}
                    {hasPermission(PERMISSIONS.INSTRUCTORS_DELETE) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(instructor)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا يوجد مدربون</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة المدربين لتتمكن من ربطهم بالدورات</p>
              <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة مدرب جديد
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل بيانات المدرب</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="صورة المدرب" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="edit-photo-input"
                  onChange={handlePhotoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('edit-photo-input')?.click()}
                  disabled={uploading}
                >
                  <Upload className="ml-2 h-4 w-4" />
                  {uploading ? "جاري الرفع..." : "تغيير الصورة"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم المدرب *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">رقم التواصل</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bio">نبذة عن المدرب</Label>
                <Textarea
                  id="edit-bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleEdit} disabled={updateMutation.isPending} className="flex-1">
                  {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد من حذف هذا المدرب؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم إلغاء تفعيل المدرب "{selectedInstructor?.name}" ولن يظهر في قائمة المدربين.
                لن يتم حذف الدورات المرتبطة به.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedInstructor && deleteMutation.mutate({ id: selectedInstructor.id })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف المدرب
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
