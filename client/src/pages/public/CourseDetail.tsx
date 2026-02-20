import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  GraduationCap, Calendar, Clock, Users, MapPin, Monitor, PlayCircle,
  ArrowRight, CheckCircle, User, Mail, Phone, Building2, FileText, Send, Loader2,
  Pencil, ExternalLink
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const typeIcons: Record<string, typeof Monitor> = {
  online_live: Monitor,
  onsite: MapPin,
  recorded: PlayCircle,
};

const typeLabels: Record<string, string> = {
  online_live: "أونلاين مباشر",
  onsite: "حضوري",
  recorded: "مسجل",
};

const typeColors: Record<string, string> = {
  online_live: "bg-blue-100 text-blue-700",
  onsite: "bg-emerald-100 text-emerald-700",
  recorded: "bg-purple-100 text-purple-700",
};

export default function CourseDetail() {
  const params = useParams<{ id: string }>();
  const courseId = parseInt(params.id || "0");
  const { user } = useAuth();
  
  const { data: course, isLoading } = trpc.publicCourses.getById.useQuery({ id: courseId });
  const registerMutation = trpc.publicCourses.register.useMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    organization: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // Check if user is admin (roleId = 1)
  const isAdmin = user?.roleId === 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    try {
      await registerMutation.mutateAsync({
        courseId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city || undefined,
        organization: formData.organization || undefined,
        notes: formData.notes || undefined,
        source: "website",
      });
      setSubmitted(true);
      toast.success("تم التسجيل بنجاح! سنتواصل معك قريباً");
    } catch (error) {
      toast.error("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى");
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </PublicLayout>
    );
  }

  if (!course) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <GraduationCap className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <h2 className="text-2xl font-bold">الدورة غير موجودة</h2>
            <Link href="/public/courses">
              <Button variant="outline">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للدورات
              </Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const TypeIcon = typeIcons[course.courseType] || Monitor;
  const typeLabel = typeLabels[course.courseType] || "أونلاين";
  const typeColor = typeColors[course.courseType] || "bg-gray-100 text-gray-700";

  const highlights = (() => {
    if (!course.highlights) return [];
    try {
      const parsed = JSON.parse(course.highlights);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      // highlights is plain text (one per line), not JSON
      return course.highlights.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
  })();

  // Use public pricing (separate from internal fees)
  const publicPrice = course.publicPrice ? parseFloat(course.publicPrice) : null;
  const publicDiscountPrice = course.publicDiscountPrice ? parseFloat(course.publicDiscountPrice) : null;
  const hasDiscount = publicPrice && publicDiscountPrice && publicDiscountPrice < publicPrice;
  const displayPrice = publicDiscountPrice || publicPrice;
  const discountPercent = hasDiscount ? Math.round((1 - publicDiscountPrice / publicPrice) * 100) : 0;

  return (
    <PublicLayout>
      {/* Admin Edit Button - floating */}
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-50">
          <Link href={`/courses/${courseId}`}>
            <Button
              className="bg-gold text-charcoal hover:bg-gold-dark shadow-xl shadow-gold/30 gap-2 font-bold rounded-full px-5 py-3 h-auto"
            >
              <Pencil className="h-4 w-4" />
              تعديل الدورة
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-bl from-charcoal via-charcoal-light to-charcoal py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/public/courses" className="inline-flex items-center gap-2 text-gold/70 hover:text-gold mb-6 transition-colors">
            <ArrowRight className="h-4 w-4" />
            العودة للدورات
          </Link>
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <Badge className={`${typeColor} border-0 font-medium text-sm px-3 py-1`}>
                <TypeIcon className="h-4 w-4 ml-1" />
                {typeLabel}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {course.name}
              </h1>
              {course.shortDescription && (
                <p className="text-white/70 text-lg leading-relaxed">
                  {course.shortDescription}
                </p>
              )}
              <div className="flex flex-wrap gap-6 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gold" />
                  <span>المدرب: <span className="text-white font-medium">{course.instructorName}</span></span>
                </div>
                {course.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gold" />
                    <span>يبدأ: <span className="text-white font-medium">{new Date(course.startDate).toLocaleDateString('ar-SA')}</span></span>
                  </div>
                )}
                {course.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gold" />
                    <span>ينتهي: <span className="text-white font-medium">{new Date(course.endDate).toLocaleDateString('ar-SA')}</span></span>
                  </div>
                )}
                {course.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gold" />
                    <span className="text-white font-medium">{course.location}</span>
                  </div>
                )}
                {course.maxSeats && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gold" />
                    <span>المقاعد المتبقية: <span className="text-white font-medium">{course.maxSeats - (course.currentSeats || 0)}</span></span>
                  </div>
                )}
              </div>
            </div>
            {/* Course Image */}
            <div className="hidden lg:block">
              {(course.thumbnailUrl || course.imageUrl) ? (
                <img src={(course.thumbnailUrl || course.imageUrl) ?? undefined} alt={course.name} className="w-full h-80 object-cover rounded-2xl shadow-2xl" />
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-gold/10 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/20">
                  <GraduationCap className="h-24 w-24 text-gold/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Course Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {course.detailedDescription && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">عن الدورة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                      {course.detailedDescription}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">ماذا ستتعلم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {highlights.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                          <span className="text-foreground/80">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Target Audience */}
              {course.targetAudience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">الفئة المستهدفة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                      {course.targetAudience}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Instructor */}
              {course.instructorName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5 text-gold" />
                      المدرب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-5">
                      {course.instructorPhoto ? (
                        <img src={course.instructorPhoto} alt={course.instructorName} className="w-24 h-24 rounded-full object-cover border-2 border-gold/30 shadow-md shrink-0" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center shrink-0 border-2 border-gold/20">
                          <User className="h-12 w-12 text-gold/60" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <h3 className="font-bold text-xl text-foreground">{course.instructorName}</h3>
                        {course.instructorBio ? (
                          <p className="text-muted-foreground leading-relaxed">{course.instructorBio}</p>
                        ) : (
                          <p className="text-muted-foreground text-sm">مدرب معتمد في بيفنتف للاستشارات</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Public Pricing Card */}
              {displayPrice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">السعر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gold/5 border border-gold/20 rounded-xl p-6 text-center relative overflow-hidden">
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          خصم {discountPercent}%
                        </div>
                      )}
                      {hasDiscount && (
                        <div className="text-lg text-muted-foreground line-through mb-1">{publicPrice.toLocaleString()} ر.س</div>
                      )}
                      <div className="text-3xl font-black text-gold">
                        {displayPrice.toLocaleString()} <span className="text-base font-normal">ر.س</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Registration Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="border-gold/20 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-gold/10 to-gold/5 border-b border-gold/10">
                    <CardTitle className="text-xl text-center">
                      {submitted ? "تم التسجيل بنجاح!" : "سجّل الآن"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {submitted ? (
                      <div className="text-center space-y-4 py-8">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">شكراً لتسجيلك!</h3>
                        <p className="text-muted-foreground text-sm">
                          تم استلام طلب التسجيل بنجاح. سيتواصل معك فريقنا قريباً لتأكيد التسجيل وتزويدك بالتفاصيل.
                        </p>
                        <Button
                          onClick={() => setSubmitted(false)}
                          variant="outline"
                          className="mt-4"
                        >
                          تسجيل شخص آخر
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Price Display in Form */}
                        {displayPrice && (
                          <div className="text-center py-3 bg-gold/5 rounded-lg border border-gold/10 mb-4">
                            <div className="text-sm text-muted-foreground">سعر الدورة</div>
                            {hasDiscount && (
                              <div className="text-sm text-muted-foreground line-through mt-1">{publicPrice.toLocaleString()} ر.س</div>
                            )}
                            <div className="text-3xl font-black text-gold mt-1">
                              {displayPrice.toLocaleString()} <span className="text-sm font-normal">ر.س</span>
                            </div>
                            {hasDiscount && (
                              <Badge className="bg-red-500 text-white mt-1 text-xs">
                                خصم {discountPercent}%
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gold" />
                            الاسم الكامل <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="أدخل اسمك الكامل"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gold" />
                            البريد الإلكتروني <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="example@email.com"
                            dir="ltr"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gold" />
                            رقم الهاتف <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+966 5XX XXX XXXX"
                            dir="ltr"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gold" />
                            المدينة
                          </Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="المدينة"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="organization" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gold" />
                            جهة العمل
                          </Label>
                          <Input
                            id="organization"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            placeholder="اسم جهة العمل (اختياري)"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes" className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gold" />
                            ملاحظات
                          </Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="أي ملاحظات أو استفسارات (اختياري)"
                            rows={3}
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gold text-charcoal hover:bg-gold-dark hover:text-white font-bold py-6 text-base shadow-lg shadow-gold/20"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin ml-2" />
                              جاري التسجيل...
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5 ml-2" />
                              تسجيل في الدورة
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
