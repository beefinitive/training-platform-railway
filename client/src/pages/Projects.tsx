import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, FolderKanban, Settings, Trash2, Eye, EyeOff, ArrowRight, Package, FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    includeInReports: false,
    status: "active" as "active" | "inactive" | "completed",
  });

  const utils = trpc.useUtils();
  const { data: projects = [], isLoading } = trpc.projects.list.useQuery({ includeInactive: true });
  const { data: allServices = [] } = trpc.services.list.useQuery();
  const { data: projectServices = [] } = trpc.projects.getServices.useQuery(
    { projectId: selectedProject?.id },
    { enabled: !!selectedProject?.id && isServicesOpen }
  );
  const { data: projectStats } = trpc.projects.getStats.useQuery(
    { projectId: selectedProject?.id },
    { enabled: !!selectedProject?.id }
  );

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المشروع بنجاح");
      setIsCreateOpen(false);
      resetForm();
      utils.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء المشروع");
    },
  });

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المشروع بنجاح");
      setIsEditOpen(false);
      utils.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث المشروع");
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المشروع بنجاح");
      utils.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف المشروع");
    },
  });

  const toggleReportsMutation = trpc.projects.toggleInReports.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.includeInReports ? "تم تضمين المشروع في التقارير" : "تم استبعاد المشروع من التقارير");
      utils.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ");
    },
  });

  const assignServiceMutation = trpc.projects.assignService.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث ربط الخدمة بنجاح");
      utils.projects.getServices.invalidate();
      utils.projects.getStats.invalidate();
      utils.services.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      includeInReports: false,
      status: "active",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedProject) return;
    updateMutation.mutate({
      id: selectedProject.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المشروع؟ سيتم إلغاء ربط جميع الخدمات المرتبطة به.")) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (project: any) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      includeInReports: project.includeInReports,
      status: project.status,
    });
    setIsEditOpen(true);
  };

  const openServicesDialog = (project: any) => {
    setSelectedProject(project);
    setIsServicesOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">غير نشط</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">مكتمل</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get services not assigned to any project
  const unassignedServices = allServices.filter(s => !s.projectId);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderKanban className="h-6 w-6" />
              إدارة المشاريع
            </h1>
            <p className="text-muted-foreground">
              إنشاء وإدارة المشاريع المنفصلة مع إمكانية تضمينها أو استبعادها من التقارير الرئيسية
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء مشروع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء مشروع جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المشروع الجديد
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المشروع</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: شموخ القرآن"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف المشروع..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeInReports">تضمين في التقارير الرئيسية</Label>
                  <Switch
                    id="includeInReports"
                    checked={formData.includeInReports}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeInReports: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "completed") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
                <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
                  {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-10">جاري التحميل...</div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد مشاريع حتى الآن</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء مشروع جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.description || "لا يوجد وصف"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Include in Reports Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {project.includeInReports ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        {project.includeInReports ? "مضمن في التقارير" : "مستبعد من التقارير"}
                      </span>
                    </div>
                    <Switch
                      checked={project.includeInReports}
                      onCheckedChange={(checked) => 
                        toggleReportsMutation.mutate({ id: project.id, includeInReports: checked })
                      }
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/projects/${project.id}`)}
                    >
                      <FileText className="h-4 w-4 ml-1" />
                      التفاصيل والتقارير
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openServicesDialog(project)}
                    >
                      <Package className="h-4 w-4 ml-1" />
                      الخدمات
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(project)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل المشروع</DialogTitle>
              <DialogDescription>
                تعديل بيانات المشروع
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم المشروع</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-includeInReports">تضمين في التقارير الرئيسية</Label>
                <Switch
                  id="edit-includeInReports"
                  checked={formData.includeInReports}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeInReports: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "completed") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
              <Button onClick={handleUpdate} disabled={!formData.name || updateMutation.isPending}>
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Services Dialog */}
        <Dialog open={isServicesOpen} onOpenChange={setIsServicesOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>خدمات المشروع: {selectedProject?.name}</DialogTitle>
              <DialogDescription>
                إدارة الخدمات المرتبطة بهذا المشروع
              </DialogDescription>
            </DialogHeader>
            
            {/* Project Stats */}
            {projectStats && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {projectStats.totalRevenue.toLocaleString()} ر.س.
                    </div>
                    <div className="text-sm text-muted-foreground">إجمالي الإيرادات</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {projectStats.serviceCount}
                    </div>
                    <div className="text-sm text-muted-foreground">عدد الخدمات</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Project Services */}
            <div className="space-y-4">
              <h4 className="font-semibold">الخدمات المرتبطة بالمشروع</h4>
              {projectServices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">لا توجد خدمات مرتبطة بهذا المشروع</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الخدمة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{new Date(service.saleDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{Number(service.totalAmount).toLocaleString()} ر.س.</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => assignServiceMutation.mutate({ serviceId: service.id, projectId: null })}
                          >
                            إلغاء الربط
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Unassigned Services */}
            <div className="space-y-4 mt-6">
              <h4 className="font-semibold">الخدمات غير المرتبطة (متاحة للإضافة)</h4>
              {unassignedServices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">جميع الخدمات مرتبطة بمشاريع</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الخدمة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedServices.slice(0, 10).map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{new Date(service.saleDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{Number(service.totalAmount).toLocaleString()} ر.س.</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => assignServiceMutation.mutate({ serviceId: service.id, projectId: selectedProject?.id })}
                          >
                            <ArrowRight className="h-4 w-4 ml-1" />
                            إضافة للمشروع
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {unassignedServices.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  يتم عرض أول 10 خدمات فقط. يوجد {unassignedServices.length - 10} خدمة إضافية.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsServicesOpen(false)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
