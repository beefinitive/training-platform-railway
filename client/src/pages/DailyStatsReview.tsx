import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  ClipboardCheck, Clock, CheckCircle2, XCircle, 
  Loader2, Search, Filter, Users, Calendar,
  Eye, ThumbsUp, ThumbsDown, CheckCheck, Pencil
} from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مؤكدة",
  rejected: "مرفوضة",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

interface DailyStatsReviewProps {
  embedded?: boolean;
}

export default function DailyStatsReview({ embedded = false }: DailyStatsReviewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewingStat, setReviewingStat] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false);
  const [bulkReviewNotes, setBulkReviewNotes] = useState("");
  
  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStat, setEditingStat] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    confirmedCustomers: 0,
    registeredCustomers: 0,
    targetedCustomers: 0,
    servicesSold: 0,
    salesAmount: 0,
    courseId: 0,
    courseFee: 0,
    notes: "",
  });

  // Queries
  const { data: stats = [], isLoading, refetch } = trpc.dailyStats.listForReview.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as "pending" | "approved" | "rejected",
    month: selectedMonth,
    year: selectedYear,
    employeeId: employeeFilter === "all" ? undefined : parseInt(employeeFilter),
  });

  const { data: reviewStats, refetch: refetchReviewStats } = trpc.dailyStats.reviewStats.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: courses = [] } = trpc.courses.list.useQuery();

  // Mutations
  const updateMutation = trpc.dailyStats.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الإحصائية بنجاح");
      setShowEditDialog(false);
      refetch();
      refetchReviewStats();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });
  const approveMutation = trpc.dailyStats.approve.useMutation({
    onSuccess: () => {
      toast.success("تم تأكيد الإحصائية بنجاح");
      setShowReviewDialog(false);
      setReviewNotes("");
      refetch();
      refetchReviewStats();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const rejectMutation = trpc.dailyStats.reject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض الإحصائية");
      setShowReviewDialog(false);
      setReviewNotes("");
      refetch();
      refetchReviewStats();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const bulkApproveMutation = trpc.dailyStats.bulkApprove.useMutation({
    onSuccess: () => {
      toast.success(`تم تأكيد ${selectedIds.length} إحصائية بنجاح`);
      setShowBulkApproveDialog(false);
      setBulkReviewNotes("");
      setSelectedIds([]);
      refetch();
      refetchReviewStats();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  // Unapprove mutation - إلغاء الموافقة
  const unapproveMutation = trpc.dailyStats.unapprove.useMutation({
    onSuccess: () => {
      toast.success("تم إلغاء الموافقة بنجاح");
      setShowReviewDialog(false);
      setReviewNotes("");
      refetch();
      refetchReviewStats();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  // Filter stats by search query
  const filteredStats = useMemo(() => {
    if (!searchQuery) return stats;
    const query = searchQuery.toLowerCase();
    return stats.filter(stat => 
      stat.employeeName?.toLowerCase().includes(query) ||
      stat.employeeEmail?.toLowerCase().includes(query)
    );
  }, [stats, searchQuery]);

  // Get pending stats for bulk selection
  const pendingStats = useMemo(() => {
    return filteredStats.filter(stat => stat.status === "pending");
  }, [filteredStats]);

  // Years list
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const handleReview = (stat: any, action: "approve" | "reject") => {
    setReviewingStat(stat);
    setReviewAction(action);
    setReviewNotes("");
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (!reviewingStat) return;

    if (reviewAction === "approve") {
      approveMutation.mutate({
        id: reviewingStat.id,
        reviewNotes: reviewNotes || undefined,
      });
    } else {
      if (!reviewNotes.trim()) {
        toast.error("يجب إدخال سبب الرفض");
        return;
      }
      rejectMutation.mutate({
        id: reviewingStat.id,
        reviewNotes: reviewNotes,
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingStats.map(stat => stat.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      toast.error("يرجى اختيار إحصائيات للتأكيد");
      return;
    }
    setShowBulkApproveDialog(true);
  };

  // إلغاء الموافقة على الإحصائية
  const handleUnapprove = (stat: any) => {
    if (confirm(`هل أنت متأكد من إلغاء الموافقة على إحصائية ${stat.employeeName}\n\nسيتم حذف الإيراد المرتبط من الدورة وتحديث المستهدفات`)) {
      unapproveMutation.mutate({
        id: stat.id,
        reviewNotes: "تم إلغاء الموافقة بواسطة المشرف",
      });
    }
  };

  const handleSubmitBulkApprove = () => {
    bulkApproveMutation.mutate({
      ids: selectedIds,
      reviewNotes: bulkReviewNotes || undefined,
    });
  };

  const handleEdit = (stat: any) => {
    setEditingStat(stat);
    setEditForm({
      confirmedCustomers: stat.confirmedCustomers || 0,
      registeredCustomers: stat.registeredCustomers || 0,
      targetedCustomers: stat.targetedCustomers || 0,
      servicesSold: stat.servicesSold || 0,
      salesAmount: parseFloat(stat.salesAmount || '0'),
      courseId: stat.courseId || 0,
      courseFee: parseFloat(stat.courseFee || '0'),
      notes: stat.notes || "",
    });
    setShowEditDialog(true);
  };

  const handleSubmitEdit = () => {
    if (!editingStat) return;
    
    updateMutation.mutate({
      id: editingStat.id,
      confirmedCustomers: editForm.confirmedCustomers,
      registeredCustomers: editForm.registeredCustomers,
      targetedCustomers: editForm.targetedCustomers,
      servicesSold: editForm.servicesSold,
      salesAmount: editForm.salesAmount,
      courseId: editForm.courseId || undefined,
      courseFee: editForm.courseFee || undefined,
      notes: editForm.notes || undefined,
    });
  };

  // Get course fees for selected course
  const { data: courseFees = [] } = trpc.courseFees.list.useQuery(
    { courseId: editForm.courseId },
    { enabled: editForm.courseId > 0 }
  );

  const content = (
    <>
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-primary" />
              مراجعة الإحصائيات اليومية
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              مراجعة وتأكيد الإحصائيات اليومية للموظفين
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">إجمالي الإحصائيات</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{reviewStats?.total || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">قيد المراجعة</p>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{reviewStats?.pending || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">مؤكدة</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{reviewStats?.approved || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">مرفوضة</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{reviewStats?.rejected || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="mb-2 block">البحث</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث بالاسم أو البريد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="w-40">
                <Label className="mb-2 block">الشهر</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="الشهر" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                <Label className="mb-2 block">السنة</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Label className="mb-2 block">الحالة</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="approved">مؤكدة</SelectItem>
                    <SelectItem value="rejected">مرفوضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Label className="mb-2 block">الموظف</Label>
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الموظفين" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الموظفين</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {pendingStats.length > 0 && (
          <div className="flex items-center gap-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <Checkbox
              checked={selectedIds.length === pendingStats.length && pendingStats.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              {selectedIds.length > 0 
                ? `تم اختيار ${selectedIds.length} إحصائية`
                : "اختر الكل للتأكيد الجماعي"
              }
            </span>
            {selectedIds.length > 0 && (
              <Button 
                size="sm" 
                onClick={handleBulkApprove}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                تأكيد المحدد ({selectedIds.length})
              </Button>
            )}
          </div>
        )}

        {/* Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات اليومية</CardTitle>
            <CardDescription>
              {monthNames[selectedMonth - 1]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredStats.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">لا توجد إحصائيات</h3>
                <p className="text-sm text-gray-500 mt-1">
                  لا توجد إحصائيات للمراجعة في هذه الفترة
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-center py-3 px-2 w-10">
                        <Checkbox
                          checked={selectedIds.length === pendingStats.length && pendingStats.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-right py-3 px-4">الموظف</th>
                      <th className="text-right py-3 px-4">التاريخ</th>
                      <th className="text-right py-3 px-4">الدورة</th>
                      <th className="text-center py-3 px-4">المؤكدين</th>
                      <th className="text-center py-3 px-4">الإيراد المتوقع</th>
                      <th className="text-center py-3 px-4">المسجلين</th>
                      <th className="text-center py-3 px-4">المستهدفين</th>
                      <th className="text-center py-3 px-4">الخدمات</th>
                      <th className="text-center py-3 px-4">المبيعات</th>
                      <th className="text-center py-3 px-4">الحالة</th>
                      <th className="text-center py-3 px-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStats.map((stat) => (
                      <tr key={stat.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-2 text-center">
                          {stat.status === "pending" && (
                            <Checkbox
                              checked={selectedIds.includes(stat.id)}
                              onCheckedChange={(checked) => handleSelectOne(stat.id, checked as boolean)}
                            />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{stat.employeeName}</p>
                            <p className="text-xs text-gray-500">{stat.employeeEmail}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(stat.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          {stat.courseName ? (
                            <div>
                              <p className="font-medium text-sm">{stat.courseName}</p>
                              <p className="text-xs text-gray-500">رسوم: {parseFloat(stat.courseFee || '0').toLocaleString('en-US')} ر.س</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">غير محدد</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                            {stat.confirmedCustomers}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {stat.calculatedRevenue && parseFloat(stat.calculatedRevenue) > 0 ? (
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded font-medium">
                              {parseFloat(stat.calculatedRevenue).toLocaleString('en-US')} ر.س
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                            {stat.registeredCustomers}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded">
                            {stat.targetedCustomers}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded">
                            {stat.servicesSold}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 px-2 py-1 rounded">
                            {parseFloat(stat.salesAmount || '0').toLocaleString('en-US')} ر.س
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={statusColors[stat.status]}>
                            {statusLabels[stat.status]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {stat.status === "pending" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleEdit(stat)}
                                  title="تعديل"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleReview(stat, "approve")}
                                  title="تأكيد"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleReview(stat, "reject")}
                                  title="رفض"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleEdit(stat)}
                                  title="تعديل"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {stat.status === "approved" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    onClick={() => handleUnapprove(stat)}
                                    title="إلغاء الموافقة"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReview(stat, "approve")}
                                  title="عرض التفاصيل"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </>
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
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === "approve" ? (
                <>
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  تأكيد الإحصائية
                </>
              ) : (
                <>
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  رفض الإحصائية
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {reviewingStat && (
                <span>
                  إحصائية {reviewingStat.employeeName} - {new Date(reviewingStat.date).toLocaleDateString("en-US")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {reviewingStat && (
            <div className="space-y-4 py-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{reviewingStat.confirmedCustomers}</p>
                  <p className="text-xs text-gray-500">المؤكدين</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{reviewingStat.registeredCustomers}</p>
                  <p className="text-xs text-gray-500">المسجلين</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{reviewingStat.targetedCustomers}</p>
                  <p className="text-xs text-gray-500">المستهدفين</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{reviewingStat.servicesSold}</p>
                  <p className="text-xs text-gray-500">الخدمات</p>
                </div>
                <div className="text-center col-span-2">
                  <p className="text-2xl font-bold text-pink-600">{parseFloat(reviewingStat.salesAmount || '0').toLocaleString('en-US')} ر.س</p>
                  <p className="text-xs text-gray-500">مبلغ المبيعات</p>
                </div>
              </div>

              {reviewingStat.notes && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">ملاحظات الموظف:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{reviewingStat.notes}</p>
                </div>
              )}

              {reviewingStat.status !== "pending" && reviewingStat.reviewNotes && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">ملاحظات المراجعة:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{reviewingStat.reviewNotes}</p>
                </div>
              )}

              {reviewingStat.status === "pending" && (
                <div className="space-y-2">
                  <Label htmlFor="reviewNotes">
                    {reviewAction === "reject" ? "سبب الرفض (مطلوب)" : "ملاحظات (اختياري)"}
                  </Label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={reviewAction === "reject" ? "أدخل سبب الرفض..." : "أضف ملاحظات..."}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              إغلاق
            </Button>
            {reviewingStat?.status === "pending" && (
              <Button 
                onClick={handleSubmitReview}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {(approveMutation.isPending || rejectMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : null}
                {reviewAction === "approve" ? "تأكيد" : "رفض"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              تعديل الإحصائية
            </DialogTitle>
            <DialogDescription>
              {editingStat && (
                <span>
                  إحصائية {editingStat.employeeName} - {new Date(editingStat.date).toLocaleDateString("en-US")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Course Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الدورة</Label>
                <Select 
                  value={editForm.courseId?.toString() || ""} 
                  onValueChange={(v) => setEditForm(prev => ({ ...prev, courseId: parseInt(v), courseFee: 0 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدورة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">بدون دورة</SelectItem>
                    {courses.filter(c => c.status === 'active').map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>الرسوم</Label>
                <Select 
                  value={editForm.courseFee?.toString() || ""} 
                  onValueChange={(v) => setEditForm(prev => ({ ...prev, courseFee: parseFloat(v) }))}
                  disabled={!editForm.courseId || editForm.courseId === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الرسوم" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseFees.map((fee) => (
                      <SelectItem key={fee.id} value={fee.amount}>
                        {fee.name} - {parseFloat(fee.amount).toLocaleString('en-US')} ر.س
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عدد المؤكدين</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.confirmedCustomers}
                  onChange={(e) => setEditForm(prev => ({ ...prev, confirmedCustomers: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>عدد المسجلين</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.registeredCustomers}
                  onChange={(e) => setEditForm(prev => ({ ...prev, registeredCustomers: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>عدد المستهدفين</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.targetedCustomers}
                  onChange={(e) => setEditForm(prev => ({ ...prev, targetedCustomers: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الخدمات المباعة</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.servicesSold}
                  onChange={(e) => setEditForm(prev => ({ ...prev, servicesSold: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Calculated Revenue */}
            {editForm.courseId > 0 && editForm.courseFee > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  الإيراد المتوقع: <span className="font-bold">{(editForm.confirmedCustomers * editForm.courseFee).toLocaleString('en-US')} ر.س</span>
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أضف ملاحظات..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={showBulkApproveDialog} onOpenChange={setShowBulkApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-green-600" />
              تأكيد جماعي
            </DialogTitle>
            <DialogDescription>
              سيتم تأكيد {selectedIds.length} إحصائية
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkReviewNotes">ملاحظات (اختياري)</Label>
              <Textarea
                id="bulkReviewNotes"
                value={bulkReviewNotes}
                onChange={(e) => setBulkReviewNotes(e.target.value)}
                placeholder="أضف ملاحظات للجميع..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkApproveDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmitBulkApprove}
              disabled={bulkApproveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkApproveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              تأكيد الكل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
}
