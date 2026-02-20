import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  PlayCircle, Plus, Search, Eye, Pencil, Trash2, Send, CheckCircle,
  XCircle, Clock, BookOpen, Users, Star, DollarSign, BarChart3,
  GripVertical, Video, FileText, Loader2, AlertCircle, Globe
} from "lucide-react";
import { useState, useMemo } from "react";

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_review: "بانتظار المراجعة",
  changes_requested: "مطلوب تعديلات",
  approved: "معتمدة",
  published: "منشورة",
  unpublished: "غير منشورة",
  rejected: "مرفوضة",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_review: "bg-yellow-100 text-yellow-700",
  changes_requested: "bg-orange-100 text-orange-700",
  approved: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  unpublished: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-700",
};

const levelLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

export default function RecordedCourses() {
  const { user } = useAuth();
  const isAdmin = user?.roleId === 1;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Queries
  const coursesQuery = isAdmin
    ? trpc.recordedCourses.list.useQuery({})
    : trpc.recordedCourses.myCourses.useQuery();
  const instructorsQuery = trpc.instructors.list.useQuery();
  const statsQuery = isAdmin ? trpc.recordedCourses.stats.useQuery() : null;

  // Mutations
  const createMutation = trpc.recordedCourses.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الدورة بنجاح");
      coursesQuery.refetch();
      setShowCreateDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.recordedCourses.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الدورة بنجاح");
      coursesQuery.refetch();
      setShowEditDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.recordedCourses.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الدورة");
      coursesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const submitMutation = trpc.recordedCourses.submitForReview.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الدورة للمراجعة");
      coursesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const reviewMutation = trpc.recordedCourses.reviewCourse.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة المراجعة");
      coursesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const publishMutation = trpc.recordedCourses.togglePublish.useMutation({
    onSuccess: (data) => {
      toast.success(data.status === "published" ? "تم نشر الدورة" : "تم إلغاء نشر الدورة");
      coursesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const courses = coursesQuery.data || [];
  const filteredCourses = useMemo(() => {
    return courses.filter((c: any) => {
      const matchesSearch = !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, searchQuery, statusFilter]);

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: "", instructorId: 0, category: "", level: "all_levels" as any,
    language: "العربية", shortDescription: "", detailedDescription: "",
    price: "0", discountPrice: "", commissionRate: "30",
  });

  const handleCreate = () => {
    if (!createForm.title || !createForm.instructorId) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }
    createMutation.mutate({
      ...createForm,
      discountPrice: createForm.discountPrice || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">الدورات المسجلة</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAdmin ? "إدارة جميع الدورات المسجلة - المراجعة والنشر" : "إدارة دوراتك المسجلة"}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 ml-1" />
            دورة جديدة
          </Button>
        </div>

        {/* Stats (Admin only) */}
        {isAdmin && statsQuery?.data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{statsQuery.data.totalCourses}</div>
                <div className="text-xs text-muted-foreground">إجمالي الدورات</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Globe className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{statsQuery.data.publishedCourses}</div>
                <div className="text-xs text-muted-foreground">منشورة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold">{statsQuery.data.pendingReview}</div>
                <div className="text-xs text-muted-foreground">بانتظار المراجعة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{statsQuery.data.totalEnrollments}</div>
                <div className="text-xs text-muted-foreground">إجمالي المسجلين</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <div className="text-2xl font-bold">{statsQuery.data.totalRevenue.toFixed(0)} ر.س</div>
                <div className="text-xs text-muted-foreground">إجمالي الإيرادات</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن دورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="pending_review">بانتظار المراجعة</SelectItem>
              <SelectItem value="approved">معتمدة</SelectItem>
              <SelectItem value="published">منشورة</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Courses Grid */}
        {coursesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">لا توجد دورات مسجلة</h3>
              <p className="text-muted-foreground text-sm mt-1">ابدأ بإنشاء دورتك الأولى</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course: any) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PlayCircle className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 left-2 ${statusColors[course.status] || ""}`}>
                    {statusLabels[course.status] || course.status}
                  </Badge>
                  {course.isFeatured && (
                    <Badge className="absolute top-2 right-2 bg-amber-100 text-amber-700">
                      <Star className="h-3 w-3 ml-1" /> مميزة
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" />
                      {course.totalLessons || 0} درس
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.totalDuration || 0} دقيقة
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.totalEnrollments || 0}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    {course.discountPrice ? (
                      <>
                        <span className="text-lg font-bold text-primary">{parseFloat(course.discountPrice).toFixed(0)} ر.س</span>
                        <span className="text-sm line-through text-muted-foreground">{parseFloat(course.price).toFixed(0)} ر.س</span>
                      </>
                    ) : parseFloat(course.price) === 0 ? (
                      <span className="text-lg font-bold text-green-600">مجانية</span>
                    ) : (
                      <span className="text-lg font-bold text-primary">{parseFloat(course.price).toFixed(0)} ر.س</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setShowContentDialog(true);
                      }}
                    >
                      <FileText className="h-3.5 w-3.5 ml-1" />
                      المحتوى
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCourse(course);
                        setShowEditDialog(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 ml-1" />
                      تعديل
                    </Button>

                    {/* Submit for review */}
                    {(course.status === "draft" || course.status === "changes_requested") && (
                      <Button
                        size="sm"
                        onClick={() => submitMutation.mutate({ id: course.id })}
                        disabled={submitMutation.isPending}
                      >
                        <Send className="h-3.5 w-3.5 ml-1" />
                        إرسال للمراجعة
                      </Button>
                    )}

                    {/* Admin: Review actions */}
                    {isAdmin && course.status === "pending_review" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => reviewMutation.mutate({ id: course.id, action: "approve" })}
                        >
                          <CheckCircle className="h-3.5 w-3.5 ml-1" />
                          اعتماد
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => reviewMutation.mutate({ id: course.id, action: "reject" })}
                        >
                          <XCircle className="h-3.5 w-3.5 ml-1" />
                          رفض
                        </Button>
                      </>
                    )}

                    {/* Admin: Publish */}
                    {isAdmin && (course.status === "approved" || course.status === "published" || course.status === "unpublished") && (
                      <Button
                        size="sm"
                        variant={course.status === "published" ? "outline" : "default"}
                        onClick={() => publishMutation.mutate({ id: course.id })}
                      >
                        <Globe className="h-3.5 w-3.5 ml-1" />
                        {course.status === "published" ? "إلغاء النشر" : "نشر"}
                      </Button>
                    )}

                    {/* Admin: Delete */}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("هل أنت متأكد من حذف هذه الدورة؟")) {
                            deleteMutation.mutate({ id: course.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Review notes */}
                  {course.reviewNotes && (course.status === "changes_requested" || course.status === "rejected") && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-1 text-orange-700 font-medium mb-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        ملاحظات المراجعة:
                      </div>
                      <p className="text-orange-600">{course.reviewNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء دورة مسجلة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>عنوان الدورة *</Label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="مثال: أساسيات البرمجة بلغة Python"
                  />
                </div>
                <div>
                  <Label>المدرب *</Label>
                  <Select
                    value={createForm.instructorId ? String(createForm.instructorId) : ""}
                    onValueChange={(v) => setCreateForm(p => ({ ...p, instructorId: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدرب" />
                    </SelectTrigger>
                    <SelectContent>
                      {(instructorsQuery.data || []).map((inst: any) => (
                        <SelectItem key={inst.id} value={String(inst.id)}>{inst.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المستوى</Label>
                  <Select
                    value={createForm.level}
                    onValueChange={(v) => setCreateForm(p => ({ ...p, level: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">مبتدئ</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="advanced">متقدم</SelectItem>
                      <SelectItem value="all_levels">جميع المستويات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Input
                    value={createForm.category}
                    onChange={(e) => setCreateForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="مثال: برمجة، تسويق، لغات"
                  />
                </div>
                <div>
                  <Label>اللغة</Label>
                  <Input
                    value={createForm.language}
                    onChange={(e) => setCreateForm(p => ({ ...p, language: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>السعر (ر.س)</Label>
                  <Input
                    type="number"
                    value={createForm.price}
                    onChange={(e) => setCreateForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="0 = مجانية"
                  />
                </div>
                <div>
                  <Label>سعر الخصم (ر.س)</Label>
                  <Input
                    type="number"
                    value={createForm.discountPrice}
                    onChange={(e) => setCreateForm(p => ({ ...p, discountPrice: e.target.value }))}
                    placeholder="اتركه فارغاً إذا لا يوجد خصم"
                  />
                </div>
                {isAdmin && (
                  <div>
                    <Label>نسبة عمولة المنصة (%)</Label>
                    <Input
                      type="number"
                      value={createForm.commissionRate}
                      onChange={(e) => setCreateForm(p => ({ ...p, commissionRate: e.target.value }))}
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <Label>وصف مختصر</Label>
                  <Textarea
                    value={createForm.shortDescription}
                    onChange={(e) => setCreateForm(p => ({ ...p, shortDescription: e.target.value }))}
                    placeholder="وصف مختصر يظهر في بطاقة الدورة"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <Label>وصف تفصيلي</Label>
                  <Textarea
                    value={createForm.detailedDescription}
                    onChange={(e) => setCreateForm(p => ({ ...p, detailedDescription: e.target.value }))}
                    placeholder="وصف تفصيلي للدورة"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Plus className="h-4 w-4 ml-1" />}
                إنشاء الدورة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editingCourse && (
          <EditCourseDialog
            course={editingCourse}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            instructors={instructorsQuery.data || []}
            isAdmin={isAdmin}
            onSave={(data: any) => updateMutation.mutate({ id: editingCourse.id, ...data })}
            isPending={updateMutation.isPending}
          />
        )}

        {/* Content Management Dialog */}
        {selectedCourseId && (
          <CourseContentDialog
            courseId={selectedCourseId}
            open={showContentDialog}
            onOpenChange={(open) => {
              setShowContentDialog(open);
              if (!open) setSelectedCourseId(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Edit Course Dialog Component
function EditCourseDialog({ course, open, onOpenChange, instructors, isAdmin, onSave, isPending }: any) {
  const [form, setForm] = useState({
    title: course.title || "",
    category: course.category || "",
    level: course.level || "all_levels",
    language: course.language || "العربية",
    shortDescription: course.shortDescription || "",
    detailedDescription: course.detailedDescription || "",
    price: course.price || "0",
    discountPrice: course.discountPrice || "",
    commissionRate: course.commissionRate || "30",
    thumbnailUrl: course.thumbnailUrl || "",
    promoVideoUrl: course.promoVideoUrl || "",
    isFeatured: course.isFeatured || false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الدورة: {course.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>عنوان الدورة</Label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>المستوى</Label>
              <Select value={form.level} onValueChange={(v) => setForm(p => ({ ...p, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                  <SelectItem value="all_levels">جميع المستويات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>التصنيف</Label>
              <Input value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} />
            </div>
            <div>
              <Label>السعر (ر.س)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <Label>سعر الخصم (ر.س)</Label>
              <Input type="number" value={form.discountPrice} onChange={(e) => setForm(p => ({ ...p, discountPrice: e.target.value }))} />
            </div>
            {isAdmin && (
              <div>
                <Label>نسبة عمولة المنصة (%)</Label>
                <Input type="number" value={form.commissionRate} onChange={(e) => setForm(p => ({ ...p, commissionRate: e.target.value }))} />
              </div>
            )}
            <div>
              <Label>رابط الصورة المصغرة</Label>
              <Input value={form.thumbnailUrl} onChange={(e) => setForm(p => ({ ...p, thumbnailUrl: e.target.value }))} placeholder="URL" />
            </div>
            <div>
              <Label>رابط الفيديو الترويجي</Label>
              <Input value={form.promoVideoUrl} onChange={(e) => setForm(p => ({ ...p, promoVideoUrl: e.target.value }))} placeholder="URL" />
            </div>
            <div className="col-span-2">
              <Label>وصف مختصر</Label>
              <Textarea value={form.shortDescription} onChange={(e) => setForm(p => ({ ...p, shortDescription: e.target.value }))} rows={2} />
            </div>
            <div className="col-span-2">
              <Label>وصف تفصيلي</Label>
              <Textarea value={form.detailedDescription} onChange={(e) => setForm(p => ({ ...p, detailedDescription: e.target.value }))} rows={4} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={() => onSave(form)} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : null}
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Course Content Management Dialog
function CourseContentDialog({ courseId, open, onOpenChange }: { courseId: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const courseQuery = trpc.recordedCourses.getById.useQuery({ id: courseId });
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState<number | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", videoUrl: "", duration: 0, isFreePreview: false,
    lessonType: "video" as "video" | "quiz" | "text",
    videoSource: "upload" as "upload" | "youtube" | "vimeo",
    textContent: "",
  });

  const createSectionMutation = trpc.recordedCourses.sections.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة القسم");
      courseQuery.refetch();
      setShowAddSection(false);
      setSectionTitle("");
    },
  });

  const deleteSectionMutation = trpc.recordedCourses.sections.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القسم");
      courseQuery.refetch();
    },
  });

  const createLessonMutation = trpc.recordedCourses.lessons.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الدرس");
      courseQuery.refetch();
      setShowAddLesson(null);
      setLessonForm({ title: "", description: "", videoUrl: "", duration: 0, isFreePreview: false, lessonType: "video", videoSource: "upload", textContent: "" });
    },
  });

  const deleteLessonMutation = trpc.recordedCourses.lessons.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الدرس");
      courseQuery.refetch();
    },
  });

  const course = courseQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>محتوى الدورة: {course?.title || "..."}</DialogTitle>
        </DialogHeader>

        {courseQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sections */}
            {course?.sections?.map((section: any, sIdx: number) => (
              <Card key={section.id}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      القسم {sIdx + 1}: {section.title}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAddLesson(section.id)}
                      >
                        <Plus className="h-3.5 w-3.5 ml-1" />
                        درس
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("حذف هذا القسم وجميع دروسه؟")) {
                            deleteSectionMutation.mutate({ id: section.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  {section.lessons?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">لا توجد دروس في هذا القسم</p>
                  ) : (
                    <div className="space-y-1">
                      {section.lessons?.map((lesson: any, lIdx: number) => (
                        <div key={lesson.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-6">{lIdx + 1}</span>
                            {lesson.lessonType === "quiz" ? (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            ) : lesson.lessonType === "text" ? (
                              <FileText className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Video className="h-4 w-4 text-primary" />
                            )}
                            <span className="text-sm font-medium">{lesson.title}</span>
                            {lesson.lessonType === "quiz" && <Badge variant="outline" className="text-xs bg-amber-50">اختبار</Badge>}
                            {lesson.lessonType === "text" && <Badge variant="outline" className="text-xs bg-blue-50">نصي</Badge>}
                            {lesson.videoSource === "youtube" && <Badge variant="outline" className="text-xs bg-red-50">YouTube</Badge>}
                            {lesson.videoSource === "vimeo" && <Badge variant="outline" className="text-xs bg-cyan-50">Vimeo</Badge>}
                            {lesson.isFreePreview && (
                              <Badge variant="outline" className="text-xs">معاينة مجانية</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {lesson.lessonType === "quiz" ? "اختبار" : lesson.lessonType === "text" ? "محتوى نصي" : lesson.duration ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : "--:--"}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive h-7 w-7 p-0"
                              onClick={() => {
                                if (confirm("حذف هذا الدرس؟")) {
                                  deleteLessonMutation.mutate({ id: lesson.id, courseId });
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Lesson Form */}
                  {showAddLesson === section.id && (
                    <div className="mt-3 p-3 border rounded-lg space-y-3 bg-muted/30">
                      <Input
                        placeholder="عنوان الدرس"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm(p => ({ ...p, title: e.target.value }))}
                      />

                      {/* Lesson Type Selector */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={lessonForm.lessonType === "video" ? "default" : "outline"}
                          onClick={() => setLessonForm(p => ({ ...p, lessonType: "video" }))}
                          className="flex items-center gap-1"
                        >
                          <Video className="h-3.5 w-3.5" /> فيديو
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={lessonForm.lessonType === "quiz" ? "default" : "outline"}
                          onClick={() => setLessonForm(p => ({ ...p, lessonType: "quiz" }))}
                          className="flex items-center gap-1"
                        >
                          <AlertCircle className="h-3.5 w-3.5" /> اختبار
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={lessonForm.lessonType === "text" ? "default" : "outline"}
                          onClick={() => setLessonForm(p => ({ ...p, lessonType: "text" }))}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" /> محتوى نصي
                        </Button>
                      </div>

                      {/* Video-specific fields */}
                      {lessonForm.lessonType === "video" && (
                        <>
                          {/* Video Source Selector */}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={lessonForm.videoSource === "upload" ? "default" : "outline"}
                              onClick={() => setLessonForm(p => ({ ...p, videoSource: "upload" }))}
                              className="text-xs"
                            >
                              رفع من الجهاز
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={lessonForm.videoSource === "youtube" ? "default" : "outline"}
                              onClick={() => setLessonForm(p => ({ ...p, videoSource: "youtube" }))}
                              className="text-xs"
                            >
                              YouTube
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={lessonForm.videoSource === "vimeo" ? "default" : "outline"}
                              onClick={() => setLessonForm(p => ({ ...p, videoSource: "vimeo" }))}
                              className="text-xs"
                            >
                              Vimeo
                            </Button>
                          </div>

                          {lessonForm.videoSource === "upload" ? (
                            <Input
                              placeholder="رابط الفيديو (بعد الرفع)"
                              value={lessonForm.videoUrl}
                              onChange={(e) => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))}
                            />
                          ) : lessonForm.videoSource === "youtube" ? (
                            <Input
                              placeholder="رابط YouTube (مثال: https://www.youtube.com/watch?v=xxxxx)"
                              value={lessonForm.videoUrl}
                              onChange={(e) => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))}
                            />
                          ) : (
                            <Input
                              placeholder="رابط Vimeo (مثال: https://vimeo.com/123456789)"
                              value={lessonForm.videoUrl}
                              onChange={(e) => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))}
                            />
                          )}

                          <Input
                            type="number"
                            placeholder="المدة (بالثواني)"
                            value={lessonForm.duration || ""}
                            onChange={(e) => setLessonForm(p => ({ ...p, duration: parseInt(e.target.value) || 0 }))}
                            className="w-40"
                          />
                        </>
                      )}

                      {/* Text content field */}
                      {lessonForm.lessonType === "text" && (
                        <Textarea
                          placeholder="اكتب المحتوى النصي هنا (يدعم HTML)"
                          value={lessonForm.textContent}
                          onChange={(e) => setLessonForm(p => ({ ...p, textContent: e.target.value }))}
                          rows={6}
                        />
                      )}

                      {/* Quiz note */}
                      {lessonForm.lessonType === "quiz" && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                          <AlertCircle className="h-4 w-4 inline ml-1" />
                          سيتم إنشاء الاختبار بعد إضافة الدرس. يمكنك إضافة الأسئلة لاحقاً من صفحة إدارة الدورة.
                        </div>
                      )}

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={lessonForm.isFreePreview}
                          onChange={(e) => setLessonForm(p => ({ ...p, isFreePreview: e.target.checked }))}
                        />
                        معاينة مجانية
                      </label>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!lessonForm.title) { toast.error("عنوان الدرس مطلوب"); return; }
                            createLessonMutation.mutate({
                              sectionId: section.id,
                              courseId,
                              title: lessonForm.title,
                              description: lessonForm.description,
                              lessonType: lessonForm.lessonType,
                              videoUrl: lessonForm.lessonType === "video" ? lessonForm.videoUrl : undefined,
                              videoSource: lessonForm.lessonType === "video" ? lessonForm.videoSource : undefined,
                              duration: lessonForm.lessonType === "video" ? lessonForm.duration : undefined,
                              textContent: lessonForm.lessonType === "text" ? lessonForm.textContent : undefined,
                              isFreePreview: lessonForm.isFreePreview,
                              sortOrder: (section.lessons?.length || 0),
                            });
                          }}
                          disabled={createLessonMutation.isPending}
                        >
                          إضافة الدرس
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddLesson(null)}>إلغاء</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Add Section */}
            {showAddSection ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Input
                    placeholder="عنوان القسم الجديد"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!sectionTitle) { toast.error("عنوان القسم مطلوب"); return; }
                        createSectionMutation.mutate({
                          courseId,
                          title: sectionTitle,
                          sortOrder: course?.sections?.length || 0,
                        });
                      }}
                      disabled={createSectionMutation.isPending}
                    >
                      إضافة القسم
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddSection(false)}>إلغاء</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowAddSection(true)}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة قسم جديد
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
