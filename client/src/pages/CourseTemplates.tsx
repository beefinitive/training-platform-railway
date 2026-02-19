import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, FileText, Search, X, Calendar, User } from "lucide-react";
import { toast } from "sonner";

export default function CourseTemplates() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formInstructorId, setFormInstructorId] = useState<string>("");
  const [formDescription, setFormDescription] = useState("");
  const [formDefaultFees, setFormDefaultFees] = useState("");

  const { data: templates, refetch: refetchTemplates } = trpc.templates.listWithCourseCount.useQuery();
  const { data: instructors } = trpc.instructors.list.useQuery();

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة القالب بنجاح");
      refetchTemplates();
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة القالب"),
  });

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث القالب بنجاح");
      refetchTemplates();
      resetForm();
      setEditingTemplate(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث القالب"),
  });

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القالب بنجاح");
      refetchTemplates();
    },
    onError: () => toast.error("حدث خطأ أثناء حذف القالب"),
  });

  const resetForm = () => {
    setFormName("");
    setFormInstructorId("");
    setFormDescription("");
    setFormDefaultFees("");
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("يرجى إدخال اسم القالب");
      return;
    }

    const data = {
      name: formName.trim(),
      instructorId: formInstructorId ? parseInt(formInstructorId) : undefined,
      description: formDescription.trim() || undefined,
      defaultFees: formDefaultFees.trim() || undefined,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormInstructorId(template.instructorId?.toString() || "");
    setFormDescription(template.description || "");
    setFormDefaultFees(template.defaultFees || "");
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا القالب؟ لن يؤثر ذلك على الدورات المرتبطة به.")) {
      deleteMutation.mutate({ id });
    }
  };

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    
    return templates.filter((template: any) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
      );
    });
  }, [templates, searchQuery]);

  const getInstructorName = (instructorId: number | null) => {
    if (!instructorId || !instructors) return "-";
    const instructor = instructors.find((i: any) => i.id === instructorId);
    return instructor?.name || "-";
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ar-SA");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">قوالب الدورات</h1>
            <p className="text-muted-foreground">إدارة قوالب الدورات التدريبية</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة قالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة قالب جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>اسم القالب *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: دورة التصوير بالجوال"
                  />
                </div>
                <div className="space-y-2">
                  <Label>المدرب الافتراضي</Label>
  <Select value={formInstructorId || "none"} onValueChange={(val) => setFormInstructorId(val === "none" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدرب (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مدرب</SelectItem>
                      {instructors?.map((instructor: any) => (
                        <SelectItem key={instructor.id} value={instructor.id.toString()}>
                          {instructor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="وصف مختصر للدورة..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الرسوم الافتراضية</Label>
                  <Input
                    value={formDefaultFees}
                    onChange={(e) => setFormDefaultFees(e.target.value)}
                    placeholder="مثال: 500"
                    type="number"
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "جاري الإضافة..." : "إضافة القالب"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في القوالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  <X className="ml-2 h-4 w-4" />
                  مسح البحث
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                عدد النتائج: {filteredTemplates.length}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              قائمة القوالب ({filteredTemplates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم القالب</TableHead>
                  <TableHead className="text-right">المدرب الافتراضي</TableHead>
                  <TableHead className="text-right">الرسوم الافتراضية</TableHead>
                  <TableHead className="text-center">عدد الدورات</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "لا توجد نتائج مطابقة" : "لا توجد قوالب حالياً"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template: any) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {getInstructorName(template.instructorId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.defaultFees ? (() => {
                          try {
                            const fees = JSON.parse(template.defaultFees);
                            if (Array.isArray(fees) && fees.length > 0) {
                              return `${fees[0].amount} ر.س.`;
                            }
                            return `${template.defaultFees} ر.س.`;
                          } catch {
                            return `${template.defaultFees} ر.س.`;
                          }
                        })() : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {template.courseCount || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(template.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          template.isActive 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {template.isActive ? "فعال" : "غير فعال"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل القالب</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>اسم القالب *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: دورة التصوير بالجوال"
                />
              </div>
              <div className="space-y-2">
                <Label>المدرب الافتراضي</Label>
<Select value={formInstructorId || "none"} onValueChange={(val) => setFormInstructorId(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدرب (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مدرب</SelectItem>
                    {instructors?.map((instructor: any) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        {instructor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="وصف مختصر للدورة..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>الرسوم الافتراضية</Label>
                <Input
                  value={formDefaultFees}
                  onChange={(e) => setFormDefaultFees(e.target.value)}
                  placeholder="مثال: 500"
                  type="number"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "جاري التحديث..." : "تحديث القالب"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
