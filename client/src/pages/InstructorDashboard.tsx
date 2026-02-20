import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  BookOpen, Users, DollarSign, TrendingUp, Eye, Star, Clock,
  PlayCircle, ArrowUpRight, Loader2, Wallet, BarChart3
} from "lucide-react";

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const myCoursesQuery = trpc.recordedCourses.myCourses.useQuery();
  const earningsQuery = trpc.recordedCourses.earnings.myEarnings.useQuery();

  const courses = myCoursesQuery.data || [];
  const earnings = earningsQuery.data;

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c: any) => c.status === "published").length;
  const totalViews = courses.reduce((sum: number, c: any) => sum + (c.totalViews || 0), 0);
  const totalEnrollments = courses.reduce((sum: number, c: any) => sum + (c.totalEnrollments || 0), 0);
  const avgRating = courses.reduce((sum: number, c: any) => sum + parseFloat(c.averageRating || "0"), 0) / (totalCourses || 1);

  const isLoading = myCoursesQuery.isLoading || earningsQuery.isLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">لوحة تحكم المدرب</h1>
            <p className="text-muted-foreground text-sm mt-1">
              مرحباً {user?.name || "المدرب"} - إليك ملخص أداء دوراتك
            </p>
          </div>
          <Button onClick={() => setLocation("/recorded-courses")}>
            <PlayCircle className="h-4 w-4 ml-1" />
            إدارة الدورات
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{totalCourses}</div>
              <div className="text-xs text-muted-foreground">إجمالي الدورات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <PlayCircle className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{publishedCourses}</div>
              <div className="text-xs text-muted-foreground">منشورة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{totalEnrollments}</div>
              <div className="text-xs text-muted-foreground">إجمالي المسجلين</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{totalViews}</div>
              <div className="text-xs text-muted-foreground">إجمالي المشاهدات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-5 w-5 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">متوسط التقييم</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-emerald-600" />
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {(earnings?.summary?.totalEarnings || 0).toFixed(0)} ر.س
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">إجمالي الأرباح</div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                أرباح معلقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(earnings?.summary?.pendingEarnings || 0).toFixed(0)} ر.س
              </div>
              <p className="text-xs text-muted-foreground mt-1">بانتظار التحويل</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                أرباح محولة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(earnings?.summary?.paidEarnings || 0).toFixed(0)} ر.س
              </div>
              <p className="text-xs text-muted-foreground mt-1">تم تحويلها</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                عدد المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {earnings?.summary?.totalEnrollments || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">عملية بيع</p>
            </CardContent>
          </Card>
        </div>

        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              دوراتي
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PlayCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لم تقم بإضافة أي دورة بعد</p>
                <Button className="mt-4" onClick={() => setLocation("/recorded-courses")}>
                  إضافة دورة جديدة
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course: any) => (
                  <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="w-20 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PlayCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{course.totalLessons || 0} درس</span>
                        <span>{course.totalEnrollments || 0} مسجل</span>
                        <span>{course.totalViews || 0} مشاهدة</span>
                      </div>
                    </div>
                    <Badge className={
                      course.status === "published" ? "bg-green-100 text-green-700" :
                      course.status === "pending_review" ? "bg-yellow-100 text-yellow-700" :
                      course.status === "draft" ? "bg-gray-100 text-gray-700" :
                      "bg-blue-100 text-blue-700"
                    }>
                      {course.status === "published" ? "منشورة" :
                       course.status === "pending_review" ? "بانتظار المراجعة" :
                       course.status === "draft" ? "مسودة" :
                       course.status === "approved" ? "معتمدة" :
                       course.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLocation(`/recorded-courses/view/${course.id}`)}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Earnings */}
        {earnings?.earnings && earnings.earnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                آخر الأرباح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {earnings.earnings.slice(0, 10).map((earning: any) => (
                  <div key={earning.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="text-sm font-medium">عملية بيع #{earning.id}</span>
                      <span className="text-xs text-muted-foreground mr-2">
                        {new Date(earning.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600">
                        +{parseFloat(earning.instructorAmount || "0").toFixed(0)} ر.س
                      </span>
                      <Badge variant="outline" className={
                        earning.status === "paid" ? "text-green-600" :
                        earning.status === "pending" ? "text-yellow-600" : ""
                      }>
                        {earning.status === "paid" ? "محول" : "معلق"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
