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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Handshake, Building2, User, Search, X, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Partnerships() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<any>(null);
  const [filterType, setFilterType] = useState<"all" | "entity" | "individual">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"entity" | "individual">("entity");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  const { data: partnerships, refetch } = trpc.partnerships.list.useQuery(
    filterType === "all" ? undefined : { type: filterType }
  );
  const { data: stats } = trpc.partnerships.stats.useQuery();
  
  const createMutation = trpc.partnerships.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الشراكة بنجاح");
      refetch();
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة الشراكة"),
  });

  const updateMutation = trpc.partnerships.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الشراكة بنجاح");
      refetch();
      resetForm();
      setEditingPartnership(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الشراكة"),
  });

  const deleteMutation = trpc.partnerships.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الشراكة بنجاح");
      refetch();
    },
    onError: () => toast.error("حدث خطأ أثناء حذف الشراكة"),
  });

  const resetForm = () => {
    setFormName("");
    setFormType("entity");
    setFormContactPerson("");
    setFormPhone("");
    setFormEmail("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormStatus("active");
  };

  const handleSubmit = () => {
    if (!formName || !formDate) {
      toast.error("يرجى إدخال اسم الشريك وتاريخ الشراكة");
      return;
    }

    if (editingPartnership) {
      updateMutation.mutate({
        id: editingPartnership.id,
        name: formName,
        type: formType,
        contactPerson: formContactPerson || undefined,
        phone: formPhone || undefined,
        email: formEmail || undefined,
        partnershipDate: formDate,
        description: formDescription || undefined,
        status: formStatus,
      });
    } else {
      createMutation.mutate({
        name: formName,
        type: formType,
        contactPerson: formContactPerson || undefined,
        phone: formPhone || undefined,
        email: formEmail || undefined,
        partnershipDate: formDate,
        description: formDescription || undefined,
        status: formStatus,
      });
    }
  };

  const handleEdit = (partnership: any) => {
    setEditingPartnership(partnership);
    setFormName(partnership.name);
    setFormType(partnership.type);
    setFormContactPerson(partnership.contactPerson || "");
    setFormPhone(partnership.phone || "");
    setFormEmail(partnership.email || "");
    setFormDate(partnership.partnershipDate);
    setFormDescription(partnership.description || "");
    setFormStatus(partnership.status);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الشراكة؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredPartnerships = useMemo(() => {
    if (!partnerships) return [];
    if (!searchQuery) return partnerships;
    
    const query = searchQuery.toLowerCase();
    return partnerships.filter((p: any) =>
      p.name.toLowerCase().includes(query) ||
      p.contactPerson?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.phone?.includes(query)
    );
  }, [partnerships, searchQuery]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
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
            <h1 className="text-2xl font-bold">الشراكات</h1>
            <p className="text-muted-foreground">إدارة الشراكات مع الجهات والأفراد</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingPartnership(null); }}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة شراكة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة شراكة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>اسم الشريك *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="اسم الجهة أو الفرد"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع الشراكة</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as "entity" | "individual")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entity">جهة</SelectItem>
                      <SelectItem value="individual">فرد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الشخص المسؤول</Label>
                  <Input
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="اسم الشخص المسؤول"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الشراكة *</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={formStatus} onValueChange={(v) => setFormStatus(v as "active" | "inactive")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">فعالة</SelectItem>
                      <SelectItem value="inactive">غير فعالة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>وصف الشراكة</Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="تفاصيل الشراكة..."
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "جاري الإضافة..." : "إضافة الشراكة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingPartnership} onOpenChange={(open) => !open && setEditingPartnership(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل الشراكة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>اسم الشريك *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>نوع الشراكة</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as "entity" | "individual")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entity">جهة</SelectItem>
                    <SelectItem value="individual">فرد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الشخص المسؤول</Label>
                <Input
                  value={formContactPerson}
                  onChange={(e) => setFormContactPerson(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>تاريخ الشراكة *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as "active" | "inactive")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعالة</SelectItem>
                    <SelectItem value="inactive">غير فعالة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>وصف الشراكة</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "جاري التحديث..." : "تحديث الشراكة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الشراكات</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شراكات الجهات</p>
                  <p className="text-2xl font-bold">{stats?.entities || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شراكات الأفراد</p>
                  <p className="text-2xl font-bold">{stats?.individuals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شراكات فعالة</p>
                  <p className="text-2xl font-bold">{stats?.active || 0}</p>
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
                  placeholder="بحث بالاسم، الشخص المسؤول، البريد، أو الهاتف..."
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
              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نوع الشراكة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="entity">جهات</SelectItem>
                  <SelectItem value="individual">أفراد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Partnerships Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الشراكات ({filteredPartnerships.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPartnerships.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشريك</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الشخص المسؤول</TableHead>
                      <TableHead>التواصل</TableHead>
                      <TableHead>تاريخ الشراكة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="w-24">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartnerships.map((partnership: any) => (
                      <TableRow key={partnership.id}>
                        <TableCell className="font-medium">{partnership.name}</TableCell>
                        <TableCell>
                          <Badge variant={partnership.type === "entity" ? "default" : "secondary"}>
                            {partnership.type === "entity" ? "جهة" : "فرد"}
                          </Badge>
                        </TableCell>
                        <TableCell>{partnership.contactPerson || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {partnership.phone && (
                              <a href={`tel:${partnership.phone}`} className="text-muted-foreground hover:text-primary">
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                            {partnership.email && (
                              <a href={`mailto:${partnership.email}`} className="text-muted-foreground hover:text-primary">
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            {!partnership.phone && !partnership.email && "-"}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(partnership.partnershipDate)}</TableCell>
                        <TableCell>
                          <Badge variant={partnership.status === "active" ? "default" : "outline"} className={partnership.status === "active" ? "bg-green-100 text-green-700" : ""}>
                            {partnership.status === "active" ? "فعالة" : "غير فعالة"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(partnership)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(partnership.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد شراكات</h3>
                <p className="text-muted-foreground mb-4">ابدأ بإضافة شراكات جديدة مع الجهات والأفراد</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة شراكة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
