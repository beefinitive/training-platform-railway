import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Calendar, User, Settings, FileText, Save, Users, DollarSign, X, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

type CourseStatus = "active" | "completed" | "cancelled";

interface FeeItem {
  name: string;
  amount: string;
  description: string;
}

interface CourseFormData {
  name: string;
  instructorId: number | null;
  instructorName: string;
  startDate: string;
  endDate: string;
  description: string;
  status: CourseStatus;
}

const initialFormData: CourseFormData = {
  name: "",
  instructorId: null,
  instructorName: "",
  startDate: "",
  endDate: "",
  description: "",
  status: "active",
};

const statusLabels: Record<CourseStatus, string> = {
  active: "نشطة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const statusColors: Record<CourseStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function Courses() {
  const { hasPermission } = usePermissions();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<number | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [useCustomInstructor, setUseCustomInstructor] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Template fees state
  const [templateFees, setTemplateFees] = useState<FeeItem[]>([]);
  const [newFee, setNewFee] = useState<FeeItem>({ name: "", amount: "", description: "" });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const { data: instructors } = trpc.instructors.list.useQuery();
  const { data: templates } = trpc.templates.list.useQuery();

  const createMutation = trpc.courses.create.useMutation({
    onSuccess: (data) => {
      // If we have template fees, create them for the new course
      if (templateFees.length > 0 && data.id) {
        templateFees.forEach(fee => {
          createFeeMutation.mutate({
            courseId: data.id,
            name: fee.name,
            amount: fee.amount,
            description: fee.description,
          });
        });
      }
      utils.courses.list.invalidate();
      toast.success("تم إنشاء الدورة بنجاح");
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء الدورة");
    },
  });

  const createFeeMutation = trpc.courseFees.create.useMutation({
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة الرسوم");
    },
  });

  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      toast.success("تم تحديث الدورة بنجاح");
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الدورة");
    },
  });

  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      toast.success("تم حذف الدورة بنجاح");
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الدورة");
    },
  });

  const createTemplateMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success("تم حفظ القالب بنجاح");
      setIsTemplateDialogOpen(false);
      setTemplateName("");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حفظ القالب");
    },
  });

  // Load template data when selected
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find((t: any) => t.id === selectedTemplateId);
      if (template) {
        const instructor = instructors?.find((i: any) => i.id === template.instructorId);
        setFormData({
          ...formData,
          name: template.name,
          instructorId: template.instructorId || null,
          instructorName: instructor?.name || "",
          description: template.description || "",
        });
        setUseCustomInstructor(!template.instructorId);
        
        // Load default fees from template
        if (template.defaultFees) {
          try {
            const fees = JSON.parse(template.defaultFees);
            setTemplateFees(fees);
          } catch (e) {
            setTemplateFees([]);
          }
        } else {
          setTemplateFees([]);
        }
      }
    }
  }, [selectedTemplateId, templates, instructors]);

  // Update instructor name when selecting from list
  const handleInstructorSelect = (instructorId: string) => {
    if (instructorId === "custom") {
      setUseCustomInstructor(true);
      setFormData({ ...formData, instructorId: null, instructorName: "" });
    } else {
      const instructor = instructors?.find((i: any) => i.id === parseInt(instructorId));
      if (instructor) {
        setUseCustomInstructor(false);
        setFormData({ 
          ...formData, 
          instructorId: instructor.id, 
          instructorName: instructor.name 
        });
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCourse(null);
    setIsDialogOpen(false);
    setUseCustomInstructor(false);
    setSelectedTemplateId(null);
    setTemplateFees([]);
    setNewFee({ name: "", amount: "", description: "" });
  };

  const handleAddFee = () => {
    if (!newFee.name || !newFee.amount) {
      toast.error("يرجى إدخال اسم الرسوم والمبلغ");
      return;
    }
    setTemplateFees([...templateFees, newFee]);
    setNewFee({ name: "", amount: "", description: "" });
  };

  const handleRemoveFee = (index: number) => {
    setTemplateFees(templateFees.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.instructorName || !formData.startDate || !formData.endDate) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse, ...formData, instructorId: formData.instructorId || undefined });
    } else {
      createMutation.mutate({ ...formData, instructorId: formData.instructorId || undefined, templateId: selectedTemplateId || undefined });
    }
  };

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) {
      toast.error("يرجى إدخال اسم القالب");
      return;
    }
    createTemplateMutation.mutate({
      name: templateName,
      instructorId: formData.instructorId || undefined,
      description: formData.description,
      defaultFees: templateFees.length > 0 ? JSON.stringify(templateFees) : undefined,
    });
  };

  const handleEdit = (course: NonNullable<typeof courses>[0]) => {
    setFormData({
      name: course.name,
      instructorId: (course as any).instructorId || null,
      instructorName: course.instructorName,
      startDate: new Date(course.startDate).toISOString().split('T')[0],
      endDate: new Date(course.endDate).toISOString().split('T')[0],
      description: course.description || "",
      status: course.status as CourseStatus,
    });
    setUseCustomInstructor(!(course as any).instructorId);
    setEditingCourse(course.id);
    setIsDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const activeInstructors = instructors?.filter((i: any) => i.status === "active") || [];

  // Arabic months
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // Get available years from courses
  const availableYears = useMemo(() => {
    if (!courses) return [];
    const years = new Set<number>();
    courses.forEach((course) => {
      const startYear = new Date(course.startDate).getFullYear();
      const endYear = new Date(course.endDate).getFullYear();
      years.add(startYear);
      years.add(endYear);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [courses]);

  // Filter courses based on search and date filters
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    
    return courses.filter((course) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        course.name.toLowerCase().includes(searchLower) ||
        course.instructorName.toLowerCase().includes(searchLower) ||
        (course.courseCode && course.courseCode.toLowerCase().includes(searchLower)) ||
        (course.description && course.description.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
      
      // Date filter
      if (selectedYear || selectedMonth) {
        const startDate = new Date(course.startDate);
        const endDate = new Date(course.endDate);
        
        if (selectedYear && selectedMonth) {
          // Check if the course overlaps with the selected month
          const filterStart = new Date(selectedYear, selectedMonth - 1, 1);
          const filterEnd = new Date(selectedYear, selectedMonth, 0);
          return startDate <= filterEnd && endDate >= filterStart;
        } else if (selectedYear) {
          // Check if the course overlaps with the selected year
          const yearStart = new Date(selectedYear, 0, 1);
          const yearEnd = new Date(selectedYear, 11, 31);
          return startDate <= yearEnd && endDate >= yearStart;
        }
      }
      
      return true;
    });
  }, [courses, searchQuery, selectedYear, selectedMonth]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-border"></div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              الدورات التدريبية
            </h1>
          </div>
          {hasPermission(PERMISSIONS.COURSES_CREATE) && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة دورة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'var(--font-serif)' }}>
                  {editingCourse ? "تعديل الدورة" : "إضافة دورة جديدة"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Template Selection */}
                {!editingCourse && templates && templates.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      استخدام قالب جاهز
                    </Label>
                    <Select
                      value={selectedTemplateId?.toString() || ""}
                      onValueChange={(val) => setSelectedTemplateId(val ? parseInt(val) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قالب (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template: any) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">اسم الدورة *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الدورة"
                  />
                </div>

                {/* Instructor Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    المدرب *
                  </Label>
                  <Select
                    value={useCustomInstructor ? "custom" : (formData.instructorId?.toString() || "")}
                    onValueChange={handleInstructorSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدرب" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeInstructors.map((instructor: any) => (
                        <SelectItem key={instructor.id} value={instructor.id.toString()}>
                          <div className="flex items-center gap-2">
                            {instructor.photoUrl ? (
                              <img src={instructor.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                            {instructor.name}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Plus className="w-5 h-5 text-muted-foreground" />
                          إدخال اسم مدرب جديد
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {useCustomInstructor && (
                    <Input
                      value={formData.instructorName}
                      onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                      placeholder="أدخل اسم المدرب"
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">تاريخ البدء *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">تاريخ الانتهاء *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: CourseStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشطة</SelectItem>
                      <SelectItem value="completed">مكتملة</SelectItem>
                      <SelectItem value="cancelled">ملغاة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="أدخل وصف الدورة (اختياري)"
                    rows={3}
                  />
                </div>

                {/* Default Fees Section - Only for new courses */}
                {!editingCourse && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <DollarSign className="h-4 w-4" />
                      رسوم الدورة الافتراضية
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      يمكنك إضافة رسوم افتراضية سيتم إنشاؤها تلقائياً مع الدورة
                    </p>
                    
                    {/* Existing fees */}
                    {templateFees.length > 0 && (
                      <div className="space-y-2">
                        {templateFees.map((fee, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                            <div className="flex-1">
                              <span className="font-medium">{fee.name}</span>
                              <span className="text-muted-foreground mx-2">-</span>
                              <span className="text-green-600 font-medium">{fee.amount} ر.س.</span>
                              {fee.description && (
                                <span className="text-muted-foreground text-sm mr-2">({fee.description})</span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFee(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new fee */}
                    <div className="grid grid-cols-12 gap-2">
                      <Input
                        placeholder="اسم الرسوم"
                        value={newFee.name}
                        onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                        className="col-span-4"
                      />
                      <Input
                        type="number"
                        placeholder="المبلغ"
                        value={newFee.amount}
                        onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                        className="col-span-3"
                      />
                      <Input
                        placeholder="الوصف (اختياري)"
                        value={newFee.description}
                        onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                        className="col-span-3"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddFee}
                        className="col-span-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {!editingCourse && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTemplateDialogOpen(true)}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      حفظ كقالب
                    </Button>
                  )}
                  <div className="flex gap-2 flex-1 justify-end">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        إلغاء
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingCourse ? "تحديث" : "إنشاء"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Save as Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>حفظ كقالب</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                سيتم حفظ إعدادات الدورة (المدرب والوصف والرسوم الافتراضية) كقالب يمكن استخدامه لإنشاء دورات جديدة بسرعة.
              </p>
              <div className="space-y-2">
                <Label htmlFor="templateName">اسم القالب *</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="مثال: دورة التسويق الرقمي"
                />
              </div>
              {templateFees.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">الرسوم المضمنة في القالب:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {templateFees.map((fee, index) => (
                      <li key={index}>• {fee.name}: {fee.amount} ر.س.</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveAsTemplate} disabled={createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending ? "جاري الحفظ..." : "حفظ القالب"}
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>

        {/* Search and Filter Section */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث باسم الدورة أو المدرب أو الرمز..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              {/* Year Filter */}
              <Select
                value={selectedYear?.toString() || "all"}
                onValueChange={(val) => setSelectedYear(val === "all" ? null : parseInt(val))}
              >
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل السنوات</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Month Filter */}
              <Select
                value={selectedMonth?.toString() || "all"}
                onValueChange={(val) => setSelectedMonth(val === "all" ? null : parseInt(val))}
              >
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الشهور</SelectItem>
                  {arabicMonths.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Clear Filters Button */}
              {(searchQuery || selectedYear || selectedMonth) && (
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
            
            {/* Results count */}
            {courses && (
              <div className="mt-3 text-sm text-muted-foreground">
                عرض {filteredCourses.length} من {courses.length} دورة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses && filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card 
                key={course.id} 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setLocation(`/courses/${course.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      {course.courseCode && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {course.courseCode}
                        </span>
                      )}
                      <CardTitle className="text-lg leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                        {course.name}
                      </CardTitle>
                    </div>
                    <Badge className={`${statusColors[course.status as CourseStatus]} border text-xs`}>
                      {statusLabels[course.status as CourseStatus]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{course.instructorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(course.startDate)} - {formatDate(course.endDate)}</span>
                  </div>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setLocation(`/courses/${course.id}`)}
                    >
                      <Settings className="h-3 w-3" />
                      إدارة
                    </Button>
                    {hasPermission(PERMISSIONS.COURSES_EDIT) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(course)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    {hasPermission(PERMISSIONS.COURSES_DELETE) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(course.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                لا توجد دورات بعد
              </h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإضافة أول دورة تدريبية
              </p>
              {hasPermission(PERMISSIONS.COURSES_CREATE) && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة دورة جديدة
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              هل أنت متأكد من حذف هذه الدورة؟ سيتم حذف جميع البيانات المرتبطة بها.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && deleteMutation.mutate({ id: deleteConfirmId })}
                disabled={deleteMutation.isPending}
              >
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
