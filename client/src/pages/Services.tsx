import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShoppingBag, DollarSign, Package, Save, FileText, Search, X } from "lucide-react";

export default function Services() {
  const { hasPermission } = usePermissions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "1",
    saleDate: new Date().toISOString().split('T')[0],
    notes: "",
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const { data: services, refetch } = trpc.services.list.useQuery();
  const { data: statistics } = trpc.services.getStatistics.useQuery();
  const { data: templates, refetch: refetchTemplates } = trpc.serviceTemplates.list.useQuery();
  
  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الخدمة بنجاح");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء إضافة الخدمة");
      console.error(error);
    },
  });

  const updateMutation = trpc.services.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الخدمة بنجاح");
      setIsEditOpen(false);
      setEditingService(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء تحديث الخدمة");
      console.error(error);
    },
  });

  const deleteMutation = trpc.services.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الخدمة بنجاح");
      setDeleteId(null);
      refetch();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف الخدمة");
      console.error(error);
    },
  });

  const createTemplateMutation = trpc.serviceTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ القالب بنجاح");
      setIsSaveTemplateOpen(false);
      setTemplateName("");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حفظ القالب");
      console.error(error);
    },
  });

  const deleteTemplateMutation = trpc.serviceTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القالب بنجاح");
      setDeleteTemplateId(null);
      refetchTemplates();
    },
    onError: (error) => {
      toast.error("حدث خطأ أثناء حذف القالب");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      quantity: "1",
      saleDate: new Date().toISOString().split('T')[0],
      notes: "",
    });
    setSelectedTemplateId("");
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId && templateId !== "none") {
      const template = templates?.find(t => t.id === parseInt(templateId));
      if (template) {
        setFormData({
          ...formData,
          name: template.serviceName,
          price: template.price,
        });
      }
    }
  };

  const handleSaveAsTemplate = () => {
    if (!templateName || !formData.name || !formData.price) {
      toast.error("يرجى ملء اسم القالب واسم الخدمة والسعر");
      return;
    }
    createTemplateMutation.mutate({
      name: templateName,
      serviceName: formData.name,
      price: formData.price,
      description: formData.notes || undefined,
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.price) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate({
      name: formData.name,
      price: formData.price,
      quantity: parseInt(formData.quantity),
      saleDate: formData.saleDate,
      notes: formData.notes || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingService) return;
    updateMutation.mutate({
      id: editingService.id,
      name: formData.name,
      price: formData.price,
      quantity: parseInt(formData.quantity),
      saleDate: formData.saleDate,
      notes: formData.notes || undefined,
    });
  };

  const openEditDialog = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      quantity: String(service.quantity),
      saleDate: new Date(service.saleDate).toISOString().split('T')[0],
      notes: service.notes || "",
    });
    setIsEditOpen(true);
  };

  const calculateTotal = () => {
    const price = parseFloat(formData.price) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    return (price * quantity).toFixed(2);
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num) + ' ر.س.';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Arabic months
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // Get available years from services
  const availableYears = useMemo(() => {
    if (!services) return [];
    const years = new Set<number>();
    services.forEach((service) => {
      const year = new Date(service.saleDate).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [services]);

  // Filter services based on search and date filters
  const filteredServices = useMemo(() => {
    if (!services) return [];
    
    return services.filter((service) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchLower) ||
        (service.notes && service.notes.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
      
      // Date filter
      if (selectedYear || selectedMonth) {
        const saleDate = new Date(service.saleDate);
        const serviceYear = saleDate.getFullYear();
        const serviceMonth = saleDate.getMonth() + 1;
        
        if (selectedYear && selectedMonth) {
          return serviceYear === selectedYear && serviceMonth === selectedMonth;
        } else if (selectedYear) {
          return serviceYear === selectedYear;
        } else if (selectedMonth) {
          return serviceMonth === selectedMonth;
        }
      }
      
      return true;
    });
  }, [services, searchQuery, selectedYear, selectedMonth]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-serif">بيع الخدمات</h1>
            <p className="text-muted-foreground mt-1">إدارة وتتبع مبيعات الخدمات</p>
          </div>
          {hasPermission(PERMISSIONS.SERVICES_CREATE) && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة خدمة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right font-serif">إضافة خدمة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Template Selection */}
                {templates && templates.length > 0 && (
                  <div className="space-y-2">
                    <Label>اختر من قالب محفوظ</Label>
                    <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قالب (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون قالب</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={String(template.id)}>
                            {template.name} - {template.serviceName} ({formatCurrency(template.price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>اسم الخدمة *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الخدمة"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>السعر (ر.س.) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الكمية *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ البيع *</Label>
                  <Input
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية (اختياري)"
                    rows={3}
                  />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">الإجمالي:</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreate} 
                    className="flex-1"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "جاري الإضافة..." : "إضافة الخدمة"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsSaveTemplateOpen(true)}
                    disabled={!formData.name || !formData.price}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    حفظ كقالب
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الخدمات
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalServices || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الإيرادات
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(statistics?.totalRevenue || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الكميات
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalQuantity || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Section */}
        {templates && templates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <FileText className="h-5 w-5" />
                قوالب الخدمات المحفوظة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div 
                    key={template.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.serviceName}</p>
                        <p className="text-primary font-medium mt-1">{formatCurrency(template.price)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTemplateId(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Section */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث باسم الخدمة..."
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
            {services && (
              <div className="mt-3 text-sm text-muted-foreground">
                عرض {filteredServices.length} من {services.length} خدمة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services List */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">قائمة الخدمات المباعة</CardTitle>
          </CardHeader>
          <CardContent>
            {!filteredServices || filteredServices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد خدمات مسجلة حتى الآن</p>
                <p className="text-sm">اضغط على "إضافة خدمة جديدة" للبدء</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">اسم الخدمة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">السعر</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الكمية</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجمالي</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">التاريخ</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            {service.notes && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {service.notes}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(service.price)}</td>
                        <td className="py-3 px-4">{service.quantity}</td>
                        <td className="py-3 px-4 font-medium text-primary">
                          {formatCurrency(service.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(service.saleDate)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {hasPermission(PERMISSIONS.SERVICES_EDIT) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(service)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission(PERMISSIONS.SERVICES_DELETE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(service.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-serif">تعديل الخدمة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>اسم الخدمة *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم الخدمة"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>السعر (ر.س.) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الكمية *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>تاريخ البيع *</Label>
                <Input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية (اختياري)"
                  rows={3}
                />
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">الإجمالي:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
              <Button 
                onClick={handleUpdate} 
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save Template Dialog */}
        <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
          <DialogContent className="sm:max-w-[400px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-serif">حفظ كقالب</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>اسم القالب *</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="مثال: خدمة استشارية"
                />
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">سيتم حفظ:</p>
                <p className="font-medium">{formData.name || "—"}</p>
                <p className="text-primary">{formData.price ? formatCurrency(formData.price) : "—"}</p>
              </div>
              <Button 
                onClick={handleSaveAsTemplate} 
                className="w-full"
                disabled={createTemplateMutation.isPending}
              >
                {createTemplateMutation.isPending ? "جاري الحفظ..." : "حفظ القالب"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Service Confirmation */}
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Template Confirmation */}
        <AlertDialog open={deleteTemplateId !== null} onOpenChange={() => setDeleteTemplateId(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-right">تأكيد حذف القالب</AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTemplateId && deleteTemplateMutation.mutate({ id: deleteTemplateId })}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
