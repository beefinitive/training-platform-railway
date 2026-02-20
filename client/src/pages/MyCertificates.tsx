import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Award, Download, Search, Calendar, User, BookOpen, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MyCertificates() {
  const certsQuery = trpc.certificates.myCertificates.useQuery();
  const [verifyNumber, setVerifyNumber] = useState("");
  const verifyQuery = trpc.certificates.verify.useQuery(
    { certificateNumber: verifyNumber },
    { enabled: verifyNumber.length > 5 }
  );

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8 space-y-8" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Award className="h-7 w-7 text-primary" />
              شهاداتي
            </h1>
            <p className="text-muted-foreground mt-1">جميع الشهادات التي حصلت عليها بعد إتمام الدورات</p>
          </div>
        </div>

        {/* Certificate Verification */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Search className="h-4 w-4" />
              التحقق من شهادة
            </h3>
            <div className="flex gap-3">
              <Input
                placeholder="أدخل رقم الشهادة للتحقق..."
                value={verifyNumber}
                onChange={(e) => setVerifyNumber(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {verifyQuery.data && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">✓ شهادة صالحة</p>
                <p className="text-sm text-green-600 mt-1">
                  {verifyQuery.data.studentName} - {verifyQuery.data.courseName}
                </p>
              </div>
            )}
            {verifyQuery.data === null && verifyNumber.length > 5 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">✗ رقم الشهادة غير صالح</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Certificates */}
        {certsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : certsQuery.data?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Award className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد شهادات بعد</h3>
              <p className="text-muted-foreground">أكمل دورة مسجلة للحصول على شهادة إتمام</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {certsQuery.data?.map((cert: any) => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-l from-primary/10 to-primary/5 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-white">
                      {cert.certificateNumber}
                    </Badge>
                    <Award className="h-8 w-8 text-primary/60" />
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-lg">{cert.courseName}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>{cert.studentName}</span>
                    </div>
                    {cert.instructorName && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>المدرب: {cert.instructorName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>تاريخ الإتمام: {new Date(cert.completionDate).toLocaleDateString("ar-SA")}</span>
                    </div>
                  </div>
                  {cert.certificateUrl && (
                    <Button size="sm" variant="outline" className="w-full mt-2" asChild>
                      <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 ml-2" />
                        تحميل الشهادة
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
