import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CreditCard, Calendar, DollarSign, Loader2, Receipt } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "قيد المعالجة",
  completed: "مكتمل",
  failed: "فشل",
  cancelled: "ملغي",
  refunded: "مسترد",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
  refunded: "bg-blue-100 text-blue-700",
};

const methodLabels: Record<string, string> = {
  tap: "بطاقة (Tap)",
  tabby: "تقسيط (Tabby)",
};

export default function MyPayments() {
  const paymentsQuery = trpc.payments.myPayments.useQuery();

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8 space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Receipt className="h-7 w-7 text-primary" />
            مدفوعاتي
          </h1>
          <p className="text-muted-foreground mt-1">سجل جميع عمليات الدفع الخاصة بك</p>
        </div>

        {paymentsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : paymentsQuery.data?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CreditCard className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مدفوعات</h3>
              <p className="text-muted-foreground">لم تقم بأي عمليات دفع بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paymentsQuery.data?.map((payment: any) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-full p-2.5">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{payment.courseName || `دورة #${payment.recordedCourseId}`}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(payment.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                          <span>{methodLabels[payment.paymentMethod] || payment.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {payment.amount} {payment.currency}
                      </div>
                      <Badge className={statusColors[payment.paymentStatus] || "bg-gray-100"}>
                        {statusLabels[payment.paymentStatus] || payment.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
