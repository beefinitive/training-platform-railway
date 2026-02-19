import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Lightbulb, Search, X, Pencil, Trash2, Clock, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "معتمدة", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  implemented: { label: "منفذة", color: "bg-green-100 text-green-700", icon: Sparkles },
  rejected: { label: "مرفوضة", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function InnovativeIdeas() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "implemented" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSubmittedBy, setFormSubmittedBy] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formStatus, setFormStatus] = useState<"pending" | "approved" | "implemented" | "rejected">("pending");
  const [formImplementationDate, setFormImplementationDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { data: ideas, refetch } = trpc.innovativeIdeas.list.useQuery(
    filterStatus === "all" ? undefined : { status: filterStatus }
  );
  const { data: stats } = trpc.innovativeIdeas.stats.useQuery();
  
  const createMutation = trpc.innovativeIdeas.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الفكرة بنجاح");
      refetch();
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة الفكرة"),
  });

  const updateMutation = trpc.innovativeIdeas.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الفكرة بنجاح");
      refetch();
      resetForm();
      setEditingIdea(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الفكرة"),
  });

  const deleteMutation = trpc.innovativeIdeas.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الفكرة بنجاح");
      refetch();
    },
    onError: () => toast.error("حدث خطأ أثناء حذف الفكرة"),
  });

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("");
    setFormSubmittedBy("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormStatus("pending");
    setFormImplementationDate("");
    setFormNotes("");
  };

  const handleSubmit = () => {
    if (!formTitle || !formDate) {
      toast.error("يرجى إدخال عنوان الفكرة وتاريخ التقديم");
      return;
    }

    if (editingIdea) {
      updateMutation.mutate({
        id: editingIdea.id,
        title: formTitle,
        description: formDescription || undefined,
        category: formCategory || undefined,
        submittedBy: formSubmittedBy || undefined,
        submissionDate: formDate,
        status: formStatus,
        implementationDate: formImplementationDate || undefined,
        notes: formNotes || undefined,
      });
    } else {
      createMutation.mutate({
        title: formTitle,
        description: formDescription || undefined,
        category: formCategory || undefined,
        submittedBy: formSubmittedBy || undefined,
        submissionDate: formDate,
        status: formStatus,
        implementationDate: formImplementationDate || undefined,
        notes: formNotes || undefined,
      });
    }
  };

  const handleEdit = (idea: any) => {
    setEditingIdea(idea);
    setFormTitle(idea.title);
    setFormDescription(idea.description || "");
    setFormCategory(idea.category || "");
    setFormSubmittedBy(idea.submittedBy || "");
    setFormDate(idea.submissionDate);
    setFormStatus(idea.status);
    setFormImplementationDate(idea.implementationDate || "");
    setFormNotes(idea.notes || "");
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الفكرة؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredIdeas = useMemo(() => {
    if (!ideas) return [];
    if (!searchQuery) return ideas;
    
    const query = searchQuery.toLowerCase();
    return ideas.filter((idea: any) =>
      idea.title.toLowerCase().includes(query) ||
      idea.description?.toLowerCase().includes(query) ||
      idea.category?.toLowerCase().includes(query) ||
      idea.submittedBy?.toLowerCase().includes(query)
    );
  }, [ideas, searchQuery]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">الأفكار النوعية</h1>
            <p className="text-muted-foreground">إدارة ومتابعة الأفكار الإبداعية والمبتكرة</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingIdea(null); }}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة فكرة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة فكرة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>عنوان الفكرة *</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="عنوان موجز للفكرة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف الفكرة</Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="وصف تفصيلي للفكرة..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>التصنيف</Label>
                    <Input
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="مثال: تسويق، تقنية"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مقدم الفكرة</Label>
                    <Input
                      value={formSubmittedBy}
                      onChange={(e) => setFormSubmittedBy(e.target.value)}
                      placeholder="اسم مقدم الفكرة"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ التقديم *</Label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={formStatus} onValueChange={(v) => setFormStatus(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">قيد المراجعة</SelectItem>
                        <SelectItem value="approved">معتمدة</SelectItem>
                        <SelectItem value="implemented">منفذة</SelectItem>
                        <SelectItem value="rejected">مرفوضة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(formStatus === "implemented") && (
                  <div className="space-y-2">
                    <Label>تاريخ التنفيذ</Label>
                    <Input
                      type="date"
                      value={formImplementationDate}
                      onChange={(e) => setFormImplementationDate(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "جاري الإضافة..." : "إضافة الفكرة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingIdea} onOpenChange={(open) => !open && setEditingIdea(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل الفكرة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>عنوان الفكرة *</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>وصف الفكرة</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Input
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>مقدم الفكرة</Label>
                  <Input
                    value={formSubmittedBy}
                    onChange={(e) => setFormSubmittedBy(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ التقديم *</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={formStatus} onValueChange={(v) => setFormStatus(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">قيد المراجعة</SelectItem>
                      <SelectItem value="approved">معتمدة</SelectItem>
                      <SelectItem value="implemented">منفذة</SelectItem>
                      <SelectItem value="rejected">مرفوضة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(formStatus === "implemented") && (
                <div className="space-y-2">
                  <Label>تاريخ التنفيذ</Label>
                  <Input
                    type="date"
                    value={formImplementationDate}
                    onChange={(e) => setFormImplementationDate(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "جاري التحديث..." : "تحديث الفكرة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الأفكار</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">معتمدة</p>
                  <p className="text-2xl font-bold">{stats?.approved || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">منفذة</p>
                  <p className="text-2xl font-bold">{stats?.implemented || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مرفوضة</p>
                  <p className="text-2xl font-bold">{stats?.rejected || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالعنوان، الوصف، التصنيف، أو مقدم الفكرة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="approved">معتمدة</SelectItem>
                  <SelectItem value="implemented">منفذة</SelectItem>
                  <SelectItem value="rejected">مرفوضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea: any) => {
            const statusConfig = STATUS_CONFIG[idea.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig?.icon || Clock;
            
            return (
              <Card key={idea.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2">{idea.title}</CardTitle>
                      {idea.category && (
                        <Badge variant="outline" className="mt-2">
                          {idea.category}
                        </Badge>
                      )}
                    </div>
                    <Badge className={statusConfig?.color || ""}>
                      <StatusIcon className="h-3 w-3 ml-1" />
                      {statusConfig?.label || idea.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {idea.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {idea.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                      <div>
                        {idea.submittedBy && <span>مقدم من: {idea.submittedBy}</span>}
                      </div>
                      <span>{formatDate(idea.submissionDate)}</span>
                    </div>
                    {idea.status === "implemented" && idea.implementationDate && (
                      <div className="text-xs text-green-600">
                        تم التنفيذ: {formatDate(idea.implementationDate)}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1 pt-2 border-t">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(idea)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(idea.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredIdeas.length === 0 && (
          <Card className="p-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد أفكار</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإضافة أفكار إبداعية ومبتكرة</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة فكرة
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
