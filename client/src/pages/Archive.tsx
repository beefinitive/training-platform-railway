import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Archive, RotateCcw, Trash2, Calendar, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ArchivePage() {
  const utils = trpc.useUtils();
  const { data: archivedCourses, isLoading } = trpc.archive.list.useQuery();
  
  const [restoreConfirmId, setRestoreConfirmId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const restoreMutation = trpc.archive.restore.useMutation({
    onSuccess: () => {
      utils.archive.list.invalidate();
      utils.courses.list.invalidate();
      toast.success("تم استعادة الدورة بنجاح");
      setRestoreConfirmId(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء استعادة الدورة");
    },
  });

  const permanentDeleteMutation = trpc.archive.permanentDelete.useMutation({
    onSuccess: () => {
      utils.archive.list.invalidate();
      toast.success("تم حذف الدورة نهائياً");
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الدورة");
    },
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const courseToRestore = archivedCourses?.find(c => c.id === restoreConfirmId);
  const courseToDelete = archivedCourses?.find(c => c.id === deleteConfirmId);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Archive className="h-8 w-8 text-muted-foreground" />
            <h1 className="text-4xl font-bold text-foreground font-serif">أرشيف الدورات</h1>
          </div>
          <p className="text-muted-foreground">الدورات المحذوفة - يمكنك استعادتها أو حذفها نهائياً</p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : archivedCourses && archivedCourses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archivedCourses.map((course) => (
              <Card key={course.id} className="border-dashed border-muted-foreground/30 bg-muted/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      {course.courseCode && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded mb-2 inline-block">
                          {course.courseCode}
                        </span>
                      )}
                      <CardTitle className="text-lg font-serif text-foreground/70">
                        {course.name}
                      </CardTitle>
                    </div>
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                      محذوفة
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{course.instructorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(course.startDate)} - {formatDate(course.endDate)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => setRestoreConfirmId(course.id)}
                    >
                      <RotateCcw className="h-4 w-4 ml-1" />
                      استعادة
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirmId(course.id)}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف نهائي
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                لا توجد دورات في الأرشيف
              </h3>
              <p className="text-sm text-muted-foreground">
                الدورات المحذوفة ستظهر هنا
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreConfirmId !== null} onOpenChange={() => setRestoreConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">استعادة الدورة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من استعادة دورة "{courseToRestore?.name}"؟
              <br />
              سيتم إعادة الدورة إلى قائمة الدورات النشطة.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestoreConfirmId(null)}>
              إلغاء
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => restoreConfirmId && restoreMutation.mutate({ id: restoreConfirmId })}
              disabled={restoreMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 ml-1" />
              استعادة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              حذف نهائي
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">
                هل أنت متأكد من حذف دورة "{courseToDelete?.name}" نهائياً؟
              </span>
              <span className="block text-destructive font-medium">
                تحذير: سيتم حذف جميع البيانات المرتبطة بالدورة (الرسوم، المصروفات، التسجيلات) ولا يمكن التراجع عن هذا الإجراء!
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && permanentDeleteMutation.mutate({ id: deleteConfirmId })}
              disabled={permanentDeleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 ml-1" />
              حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
