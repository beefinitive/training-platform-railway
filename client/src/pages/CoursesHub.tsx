import { useState, useEffect, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Calendar, User, Settings, FileText, Save, Users, DollarSign, X, Search, BookOpen, Mail, Phone, Upload } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { useAuth } from "@/_core/hooks/useAuth";

// ============= Types =============
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

const initialCourseFormData: CourseFormData = {
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

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

// ============= Main Component =============
export default function CoursesHub() {
  const { hasPermission, isAdmin } = usePermissions();
  const { user } = useAuth();
  const isOwner = isAdmin;
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("courses");

  // ============= Courses State =============
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<number | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(initialCourseFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [useCustomInstructor, setUseCustomInstructor] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateFees, setTemplateFees] = useState<FeeItem[]>([]);
  const [newFee, setNewFee] = useState<FeeItem>({ name: "", amount: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // ============= Templates State =============
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [templateFormName, setTemplateFormName] = useState("");
  const [templateFormInstructorId, setTemplateFormInstructorId] = useState<string>("");
  const [templateFormDescription, setTemplateFormDescription] = useState("");
  const [templateFormDefaultFees, setTemplateFormDefaultFees] = useState("");

  // ============= Instructors State =============
  const [isAddInstructorDialogOpen, setIsAddInstructorDialogOpen] = useState(false);
  const [isEditInstructorDialogOpen, setIsEditInstructorDialogOpen] = useState(false);
  const [deleteInstructorDialogOpen, setDeleteInstructorDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [instructorSearchQuery, setInstructorSearchQuery] = useState("");
  const [instructorFormData, setInstructorFormData] = useState({
    name: "",
    email: "",
    phone: "",
    photoUrl: "",
    bio: "",
  });

  // ============= Data Queries =============
  const utils = trpc.useUtils();
  const { data: courses, isLoading: coursesLoading } = trpc.courses.list.useQuery();
  const { data: instructors, isLoading: instructorsLoading } = trpc.instructors.list.useQuery();
  const { data: templates } = trpc.templates.list.useQuery();
  const { data: templatesWithCount } = trpc.templates.listWithCourseCount.useQuery();
  const { data: instructorStats } = trpc.instructors.stats.useQuery();

  // ============= Courses Mutations =============
  const createCourseMutation = trpc.courses.create.useMutation({
    onSuccess: (data) => {
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
      resetCourseForm();
    },
    onError: () => toast.error("حدث خطأ أثناء إنشاء الدورة"),
  });

  const createFeeMutation = trpc.courseFees.create.useMutation({
    onError: () => toast.error("حدث خطأ أثناء إضافة الرسوم"),
  });

  const updateCourseMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      toast.success("تم تحديث الدورة بنجاح");
      resetCourseForm();
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الدورة"),
  });

  const deleteCourseMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      toast.success("تم حذف الدورة بنجاح");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("حدث خطأ أثناء حذف الدورة"),
  });

  const createTemplateMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      utils.templates.listWithCourseCount.invalidate();
      toast.success("تم حفظ القالب بنجاح");
      setIsTemplateDialogOpen(false);
      setTemplateName("");
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ القالب"),
  });

  // ============= Templates Mutations =============
  const createTemplateDirectMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة القالب بنجاح");
      utils.templates.list.invalidate();
      utils.templates.listWithCourseCount.invalidate();
      resetTemplateForm();
      setIsAddTemplateDialogOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة القالب"),
  });

  const updateTemplateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث القالب بنجاح");
      utils.templates.list.invalidate();
      utils.templates.listWithCourseCount.invalidate();
      resetTemplateForm();
      setEditingTemplate(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث القالب"),
  });

  const deleteTemplateMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القالب بنجاح");
      utils.templates.list.invalidate();
      utils.templates.listWithCourseCount.invalidate();
    },
    onError: () => toast.error("حدث خطأ أثناء حذف القالب"),
  });

  // ============= Instructors Mutations =============
  const createInstructorMutation = trpc.instructors.create.useMutation({
    onSuccess: () => {
      utils.instructors.list.invalidate();
      utils.instructors.stats.invalidate();
      setIsAddInstructorDialogOpen(false);
      resetInstructorForm();
      toast.success("تم إضافة المدرب بنجاح");
    },
    onError: (error) => toast.error("حدث خطأ: " + error.message),
  });

  const updateInstructorMutation = trpc.instructors.update.useMutation({
    onSuccess: () => {
      utils.instructors.list.invalidate();
      setIsEditInstructorDialogOpen(false);
      resetInstructorForm();
      toast.success("تم تحديث بيانات المدرب بنجاح");
    },
    onError: (error) => toast.error("حدث خطأ: " + error.message),
  });

  const deleteInstructorMutation = trpc.instructors.delete.useMutation({
    onSuccess: () => {
      utils.instructors.list.invalidate();
      utils.instructors.stats.invalidate();
      setDeleteInstructorDialogOpen(false);
      setSelectedInstructor(null);
      toast.success("تم حذف المدرب بنجاح");
    },
    onError: (error) => toast.error("حدث خطأ: " + error.message),
  });

  // ============= Effects =============
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

  // ============= Courses Handlers =============
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

  const resetCourseForm = () => {
    setFormData(initialCourseFormData);
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

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.instructorName || !formData.startDate || !formData.endDate) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse, ...formData, instructorId: formData.instructorId || undefined });
    } else {
      createCourseMutation.mutate({ ...formData, instructorId: formData.instructorId || undefined, templateId: selectedTemplateId || undefined });
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

  const handleEditCourse = (course: NonNullable<typeof courses>[0]) => {
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

  // ============= Templates Handlers =============
  const resetTemplateForm = () => {
    setTemplateFormName("");
    setTemplateFormInstructorId("");
    setTemplateFormDescription("");
    setTemplateFormDefaultFees("");
  };

  const handleTemplateSubmit = () => {
    if (!templateFormName.trim()) {
      toast.error("يرجى إدخال اسم القالب");
      return;
    }

    const data = {
      name: templateFormName.trim(),
      instructorId: templateFormInstructorId ? parseInt(templateFormInstructorId) : undefined,
      description: templateFormDescription.trim() || undefined,
      defaultFees: templateFormDefaultFees.trim() || undefined,
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createTemplateDirectMutation.mutate(data);
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateFormName(template.name);
    setTemplateFormInstructorId(template.instructorId?.toString() || "");
    setTemplateFormDescription(template.description || "");
    setTemplateFormDefaultFees(template.defaultFees || "");
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا القالب؟ لن يؤثر ذلك على الدورات المرتبطة به.")) {
      deleteTemplateMutation.mutate({ id });
    }
  };

  // ============= Instructors Handlers =============
  const resetInstructorForm = () => {
    setInstructorFormData({
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
        setInstructorFormData({ ...instructorFormData, photoUrl: reader.result as string });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الصورة");
      setUploading(false);
    }
  };

  const handleAddInstructor = () => {
    if (!instructorFormData.name.trim()) {
      toast.error("يرجى إدخال اسم المدرب");
      return;
    }
    createInstructorMutation.mutate(instructorFormData);
  };

  const handleEditInstructor = () => {
    if (!selectedInstructor) return;
    updateInstructorMutation.mutate({
      id: selectedInstructor.id,
      ...instructorFormData,
    });
  };

  const openEditInstructorDialog = (instructor: any) => {
    setSelectedInstructor(instructor);
    setInstructorFormData({
      name: instructor.name || "",
      email: instructor.email || "",
      phone: instructor.phone || "",
      photoUrl: instructor.photoUrl || "",
      bio: instructor.bio || "",
    });
    setIsEditInstructorDialogOpen(true);
  };

  const openDeleteInstructorDialog = (instructor: any) => {
    setSelectedInstructor(instructor);
    setDeleteInstructorDialogOpen(true);
  };

  // ============= Computed Values =============
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const activeInstructors = instructors?.filter((i: any) => i.status === "active") || [];

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

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    
    return courses.filter((course) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        course.name.toLowerCase().includes(searchLower) ||
        course.instructorName.toLowerCase().includes(searchLower) ||
        (course.courseCode && course.courseCode.toLowerCase().includes(searchLower)) ||
        (course.description && course.description.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
      
      if (selectedYear || selectedMonth) {
        const startDate = new Date(course.startDate);
        const endDate = new Date(course.endDate);
        
        if (selectedYear && selectedMonth) {
          const filterStart = new Date(selectedYear, selectedMonth - 1, 1);
          const filterEnd = new Date(selectedYear, selectedMonth, 0);
          return startDate <= filterEnd && endDate >= filterStart;
        } else if (selectedYear) {
          const yearStart = new Date(selectedYear, 0, 1);
          const yearEnd = new Date(selectedYear, 11, 31);
          return startDate <= yearEnd && endDate >= yearStart;
        }
      }
      
      return true;
    });
  }, [courses, searchQuery, selectedYear, selectedMonth]);

  const filteredTemplates = useMemo(() => {
    if (!templatesWithCount) return [];
    
    return templatesWithCount.filter((template: any) => {
      if (!templateSearchQuery) return true;
      const query = templateSearchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
      );
    });
  }, [templatesWithCount, templateSearchQuery]);

  const filteredInstructors = useMemo(() => {
    if (!instructors) return [];
    
    const active = instructors.filter((i: any) => i.status === "active");
    
    if (!instructorSearchQuery) return active;
    
    const searchLower = instructorSearchQuery.toLowerCase();
    return active.filter((instructor: any) => 
      instructor.name.toLowerCase().includes(searchLower) ||
      (instructor.email && instructor.email.toLowerCase().includes(searchLower)) ||
      (instructor.phone && instructor.phone.includes(instructorSearchQuery)) ||
      (instructor.bio && instructor.bio.toLowerCase().includes(searchLower))
    );
  }, [instructors, instructorSearchQuery]);

  const getInstructorName = (instructorId: number | null) => {
    if (!instructorId || !instructors) return "-";
    const instructor = instructors.find((i: any) => i.id === instructorId);
    return instructor?.name || "-";
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-px w-8 bg-border"></div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            إدارة الدورات
          </h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              الدورات
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              القوالب
            </TabsTrigger>
            <TabsTrigger value="instructors" className="gap-2">
              <Users className="h-4 w-4" />
              المدربون
            </TabsTrigger>
          </TabsList>

          {/* ============= Courses Tab ============= */}
          <TabsContent value="courses" className="space-y-6">
            {/* Add Course Button */}
            <div className="flex justify-end">
              {hasPermission(PERMISSIONS.COURSES_CREATE) && (
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetCourseForm();
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
                    <form onSubmit={handleCourseSubmit} className="space-y-4">
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

                      {/* Default Fees Section */}
                      {!editingCourse && (
                        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                          <Label className="flex items-center gap-2 text-base font-medium">
                            <DollarSign className="h-4 w-4" />
                            رسوم الدورة الافتراضية
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            يمكنك إضافة رسوم افتراضية سيتم إنشاؤها تلقائياً مع الدورة
                          </p>
                          
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
                          <Button type="submit" disabled={createCourseMutation.isPending || updateCourseMutation.isPending}>
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
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث باسم الدورة أو المدرب أو الرمز..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  
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
                  
                  {(searchQuery || selectedYear || selectedMonth) && (
                    <Button variant="outline" onClick={clearFilters} className="gap-2">
                      <X className="h-4 w-4" />
                      مسح الفلاتر
                    </Button>
                  )}
                </div>
                
                {courses && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    عرض {filteredCourses.length} من {courses.length} دورة
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Courses List */}
            {coursesLoading ? (
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
                        {(hasPermission(PERMISSIONS.COURSES_EDIT) || isOwner) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {(hasPermission(PERMISSIONS.COURSES_DELETE) || isOwner) && (
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
                    onClick={() => deleteConfirmId && deleteCourseMutation.mutate({ id: deleteConfirmId })}
                    disabled={deleteCourseMutation.isPending}
                  >
                    حذف
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ============= Templates Tab ============= */}
          <TabsContent value="templates" className="space-y-6">
            {/* Add Template Button */}
            <div className="flex justify-end">
              <Dialog open={isAddTemplateDialogOpen} onOpenChange={setIsAddTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetTemplateForm(); setIsAddTemplateDialogOpen(true); }}>
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
                        value={templateFormName}
                        onChange={(e) => setTemplateFormName(e.target.value)}
                        placeholder="مثال: دورة التصوير بالجوال"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المدرب الافتراضي</Label>
                      <Select value={templateFormInstructorId || "none"} onValueChange={(val) => setTemplateFormInstructorId(val === "none" ? "" : val)}>
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
                        value={templateFormDescription}
                        onChange={(e) => setTemplateFormDescription(e.target.value)}
                        placeholder="وصف مختصر للدورة..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الرسوم الافتراضية</Label>
                      <Input
                        value={templateFormDefaultFees}
                        onChange={(e) => setTemplateFormDefaultFees(e.target.value)}
                        placeholder="مثال: 500"
                        type="number"
                      />
                    </div>
                    <Button onClick={handleTemplateSubmit} className="w-full" disabled={createTemplateDirectMutation.isPending}>
                      {createTemplateDirectMutation.isPending ? "جاري الإضافة..." : "إضافة القالب"}
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
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  {templateSearchQuery && (
                    <Button variant="outline" onClick={() => setTemplateSearchQuery("")}>
                      <X className="ml-2 h-4 w-4" />
                      مسح البحث
                    </Button>
                  )}
                </div>
                {templateSearchQuery && (
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
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {templateSearchQuery ? "لا توجد نتائج مطابقة" : "لا توجد قوالب حالياً"}
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
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteTemplate(template.id)}
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

            {/* Edit Template Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>تعديل القالب</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>اسم القالب *</Label>
                    <Input
                      value={templateFormName}
                      onChange={(e) => setTemplateFormName(e.target.value)}
                      placeholder="مثال: دورة التصوير بالجوال"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المدرب الافتراضي</Label>
                    <Select value={templateFormInstructorId || "none"} onValueChange={(val) => setTemplateFormInstructorId(val === "none" ? "" : val)}>
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
                      value={templateFormDescription}
                      onChange={(e) => setTemplateFormDescription(e.target.value)}
                      placeholder="وصف مختصر للدورة..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الرسوم الافتراضية</Label>
                    <Input
                      value={templateFormDefaultFees}
                      onChange={(e) => setTemplateFormDefaultFees(e.target.value)}
                      placeholder="مثال: 500"
                      type="number"
                    />
                  </div>
                  <Button onClick={handleTemplateSubmit} className="w-full" disabled={updateTemplateMutation.isPending}>
                    {updateTemplateMutation.isPending ? "جاري التحديث..." : "تحديث القالب"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ============= Instructors Tab ============= */}
          <TabsContent value="instructors" className="space-y-6">
            {/* Add Instructor Button */}
            <div className="flex justify-end">
              {hasPermission(PERMISSIONS.INSTRUCTORS_CREATE) && (
                <Dialog open={isAddInstructorDialogOpen} onOpenChange={setIsAddInstructorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetInstructorForm(); setIsAddInstructorDialogOpen(true); }}>
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
                          {instructorFormData.photoUrl ? (
                            <img src={instructorFormData.photoUrl} alt="صورة المدرب" className="w-full h-full object-cover" />
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
                          value={instructorFormData.name}
                          onChange={(e) => setInstructorFormData({ ...instructorFormData, name: e.target.value })}
                          placeholder="أدخل اسم المدرب"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input
                          id="email"
                          type="email"
                          value={instructorFormData.email}
                          onChange={(e) => setInstructorFormData({ ...instructorFormData, email: e.target.value })}
                          placeholder="example@email.com"
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">رقم التواصل</Label>
                        <Input
                          id="phone"
                          value={instructorFormData.phone}
                          onChange={(e) => setInstructorFormData({ ...instructorFormData, phone: e.target.value })}
                          placeholder="05xxxxxxxx"
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">نبذة عن المدرب</Label>
                        <Textarea
                          id="bio"
                          value={instructorFormData.bio}
                          onChange={(e) => setInstructorFormData({ ...instructorFormData, bio: e.target.value })}
                          placeholder="نبذة مختصرة عن المدرب وخبراته..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleAddInstructor} disabled={createInstructorMutation.isPending} className="flex-1">
                          {createInstructorMutation.isPending ? "جاري الإضافة..." : "إضافة المدرب"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsAddInstructorDialogOpen(false)}>
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
                      <p className="text-2xl font-bold">{instructorStats?.totalInstructors || 0}</p>
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
                      <p className="text-2xl font-bold">{instructorStats?.instructorsWithCourses || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search Section */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث باسم المدرب أو البريد أو رقم التواصل..."
                      value={instructorSearchQuery}
                      onChange={(e) => setInstructorSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  
                  {instructorSearchQuery && (
                    <Button variant="outline" onClick={() => setInstructorSearchQuery("")} className="gap-2">
                      <X className="h-4 w-4" />
                      مسح البحث
                    </Button>
                  )}
                </div>
                
                {instructors && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    عرض {filteredInstructors.length} من {instructors.filter((i: any) => i.status === "active").length} مدرب
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructors Grid */}
            {instructorsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredInstructors && filteredInstructors.length > 0 ? (
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
                            onClick={() => openEditInstructorDialog(instructor)}
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
                            onClick={() => openDeleteInstructorDialog(instructor)}
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
                  <Button onClick={() => { resetInstructorForm(); setIsAddInstructorDialogOpen(true); }}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة مدرب جديد
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Edit Instructor Dialog */}
            <Dialog open={isEditInstructorDialogOpen} onOpenChange={setIsEditInstructorDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>تعديل بيانات المدرب</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                      {instructorFormData.photoUrl ? (
                        <img src={instructorFormData.photoUrl} alt="صورة المدرب" className="w-full h-full object-cover" />
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
                      value={instructorFormData.name}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={instructorFormData.email}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, email: e.target.value })}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">رقم التواصل</Label>
                    <Input
                      id="edit-phone"
                      value={instructorFormData.phone}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, phone: e.target.value })}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-bio">نبذة عن المدرب</Label>
                    <Textarea
                      id="edit-bio"
                      value={instructorFormData.bio}
                      onChange={(e) => setInstructorFormData({ ...instructorFormData, bio: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleEditInstructor} disabled={updateInstructorMutation.isPending} className="flex-1">
                      {updateInstructorMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditInstructorDialogOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Instructor Confirmation */}
            <AlertDialog open={deleteInstructorDialogOpen} onOpenChange={setDeleteInstructorDialogOpen}>
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
                    onClick={() => selectedInstructor && deleteInstructorMutation.mutate({ id: selectedInstructor.id })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    حذف المدرب
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
