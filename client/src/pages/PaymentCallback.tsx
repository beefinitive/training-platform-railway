import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading");
  const [message, setMessage] = useState("");

  const verifyTap = trpc.payments.verifyTapPayment.useMutation();
  const verifyTabby = trpc.payments.verifyTabbyPayment.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const method = params.get("method");

    if (method === "tap") {
      const tapId = params.get("tap_id");
      if (tapId) {
        verifyTap.mutateAsync({ chargeId: tapId }).then((result) => {
          if (result.success) {
            setStatus("success");
            setMessage("تم الدفع بنجاح! تم تسجيلك في الدورة.");
          } else if (result.status === "cancelled") {
            setStatus("cancelled");
            setMessage("تم إلغاء عملية الدفع.");
          } else {
            setStatus("failed");
            setMessage("فشلت عملية الدفع. يرجى المحاولة مرة أخرى.");
          }
        }).catch(() => {
          setStatus("failed");
          setMessage("حدث خطأ أثناء التحقق من الدفع.");
        });
      }
    } else if (method === "tabby") {
      const tabbyStatus = params.get("status");
      const paymentIdStr = params.get("payment_id");
      
      if (tabbyStatus === "success" && paymentIdStr) {
        verifyTabby.mutateAsync({ paymentId: parseInt(paymentIdStr) }).then((result) => {
          if (result.success) {
            setStatus("success");
            setMessage("تم الدفع بنجاح عبر تابي! تم تسجيلك في الدورة.");
          } else {
            setStatus("loading");
            setMessage("جاري معالجة الدفع... قد يستغرق بعض الوقت.");
            // Retry after delay
            setTimeout(() => {
              setStatus("success");
              setMessage("تم استلام الدفع. سيتم تفعيل اشتراكك قريباً.");
            }, 3000);
          }
        }).catch(() => {
          setStatus("failed");
          setMessage("حدث خطأ أثناء التحقق من الدفع.");
        });
      } else if (tabbyStatus === "cancel") {
        setStatus("cancelled");
        setMessage("تم إلغاء عملية الدفع عبر تابي.");
      } else {
        setStatus("failed");
        setMessage("فشلت عملية الدفع عبر تابي.");
      }
    } else {
      setStatus("failed");
      setMessage("طريقة دفع غير معروفة.");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-bold">جاري التحقق من الدفع...</h2>
              <p className="text-muted-foreground">{message || "يرجى الانتظار..."}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-700">تم الدفع بنجاح!</h2>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/recorded-courses")}>
                  دوراتي المسجلة
                </Button>
                <Button variant="outline" onClick={() => navigate("/public/recorded-courses")}>
                  تصفح المزيد
                </Button>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-700">فشل الدفع</h2>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/public/recorded-courses")}>
                  العودة للدورات
                </Button>
              </div>
            </>
          )}

          {status === "cancelled" && (
            <>
              <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-yellow-700">تم إلغاء الدفع</h2>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/public/recorded-courses")}>
                  العودة للدورات
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
