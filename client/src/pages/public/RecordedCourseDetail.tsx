import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import {
  PlayCircle, Clock, Users, Star, Video, BookOpen, ChevronDown, ChevronUp,
  CheckCircle, Lock, GraduationCap, User, Globe, Award, Loader2, ShoppingCart,
  CreditCard, CalendarClock, FileQuestion, FileText
} from "lucide-react";
import { useState, useMemo } from "react";

const levelLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

const lessonTypeIcons: Record<string, any> = {
  video: Video,
  quiz: FileQuestion,
  text: FileText,
};

export default function PublicRecordedCourseDetail() {
  const [, params] = useRoute("/public/recorded-courses/:slug");
  const slug = params?.slug || "";
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const courseQuery = trpc.recordedCourses.public.getBySlug.useQuery({ slug });
  const course = courseQuery.data;

  // Reviews
  const reviewsQuery = trpc.reviews.getCourseReviews.useQuery(
    { courseId: course?.id || 0 },
    { enabled: !!course?.id }
  );

  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const createTapPayment = trpc.payments.createTapPayment.useMutation();
  const createTabbyPayment = trpc.payments.createTabbyPayment.useMutation();
  const addReview = trpc.reviews.addReview.useMutation();

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const totalLessons = useMemo(() => {
    if (!course?.sections) return 0;
    return course.sections.reduce((sum: number, s: any) => sum + (s.lessons?.length || 0), 0);
  }, [course]);

  const totalDuration = useMemo(() => {
    if (!course?.sections) return 0;
    return course.sections.reduce((sum: number, s: any) => {
      return sum + (s.lessons || []).reduce((ls: number, l: any) => ls + (l.duration || 0), 0);
    }, 0);
  }, [course]);

  const handlePayWithTap = async () => {
    if (!user) {
      toast.info("يرجى تسجيل الدخول أولاً");
      return;
    }
    setPaymentLoading("tap");
    try {
      const result = await createTapPayment.mutateAsync({
        recordedCourseId: course!.id,
      });
      if (result.redirectUrl) {
        toast.info("جاري تحويلك لصفحة الدفع...");
        window.open(result.redirectUrl, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إنشاء عملية الدفع");
    } finally {
      setPaymentLoading(null);
    }
  };

  const handlePayWithTabby = async () => {
    if (!user) {
      toast.info("يرجى تسجيل الدخول أولاً");
      return;
    }
    setPaymentLoading("tabby");
    try {
      const result = await createTabbyPayment.mutateAsync({
        recordedCourseId: course!.id,
      });
      if (result.checkoutUrl) {
        toast.info("جاري تحويلك لصفحة تابي للتقسيط...");
        window.open(result.checkoutUrl, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "خدمة التقسيط غير متاحة حالياً");
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleFreeEnroll = () => {
    if (!user) {
      toast.info("يرجى تسجيل الدخول أولاً للتسجيل في الدورة");
      return;
    }
    toast.success("تم التسجيل بنجاح! يمكنك الآن مشاهدة الدورة");
    setLocation(`/recorded-courses/view/${course?.id}`);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.info("يرجى تسجيل الدخول أولاً");
      return;
    }
    try {
      await addReview.mutateAsync({
        recordedCourseId: course!.id,
        rating: reviewRating,
        reviewText: reviewText || undefined,
      });
      toast.success("تم إضافة تقييمك بنجاح!");
      setReviewText("");
      reviewsQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إضافة التقييم");
    }
  };

  if (courseQuery.isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </PublicLayout>
    );
  }

  if (!course) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold">الدورة غير موجودة</h2>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const price = parseFloat(course.price || "0");
  const discountPrice = course.discountPrice ? parseFloat(course.discountPrice) : null;
  const hasDiscount = discountPrice !== null && discountPrice < price;
  const finalPrice = hasDiscount ? discountPrice! : price;
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice!) / price) * 100) : 0;

  return (
    <PublicLayout>
      <div dir="rtl">
        {/* Hero */}
        <section className="bg-gradient-to-br from-charcoal via-charcoal/95 to-charcoal/90 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {course.category && (
                    <Badge className="bg-gold/20 text-gold border-gold/30">{course.category}</Badge>
                  )}
                  {course.level && (
                    <Badge variant="outline" className="text-white/70 border-white/20">
                      {levelLabels[course.level] || course.level}
                    </Badge>
                  )}
                  {course.isFeatured && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      <Star className="h-3 w-3 ml-1" /> مميزة
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                  {course.title}
                </h1>

                {course.shortDescription && (
                  <p className="text-lg text-white/70">{course.shortDescription}</p>
                )}

                <div className="flex items-center gap-4 flex-wrap text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    {totalLessons} درس
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.floor(totalDuration / 60)} ساعة {totalDuration % 60} دقيقة
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.totalEnrollments || 0} مسجل
                  </span>
                  {reviewsQuery.data?.average && parseFloat(String(reviewsQuery.data.average)) > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" />
                      {parseFloat(String(reviewsQuery.data.average)).toFixed(1)}
                      <span className="text-white/40">({reviewsQuery.data.count})</span>
                    </span>
                  )}
                </div>

                {course.instructor?.name && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-white/50">المدرب</p>
                      <p className="font-medium">{course.instructor?.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail + Price Card */}
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden shadow-2xl">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-charcoal/50 flex items-center justify-center">
                      <PlayCircle className="h-16 w-16 text-white/20" />
                    </div>
                  )}
                </div>

                <Card className="bg-white/10 backdrop-blur-sm border-white/10 text-white">
                  <CardContent className="p-6 space-y-4">
                    {/* Price */}
                    <div className="text-center">
                      {price === 0 ? (
                        <div className="text-3xl font-bold text-green-400">مجانية</div>
                      ) : hasDiscount ? (
                        <div>
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl font-bold text-gold">{discountPrice!.toFixed(0)} ر.س</span>
                            <span className="text-lg line-through text-white/40">{price.toFixed(0)} ر.س</span>
                          </div>
                          <Badge className="bg-red-500/20 text-red-300 mt-2">خصم {discountPercent}%</Badge>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold text-gold">{price.toFixed(0)} ر.س</div>
                      )}
                    </div>

                    {/* Payment Options */}
                    {price === 0 ? (
                      <Button
                        className="w-full bg-gold hover:bg-gold-dark text-charcoal font-bold py-6 text-lg"
                        onClick={handleFreeEnroll}
                      >
                        <ShoppingCart className="h-5 w-5 ml-2" />
                        سجل مجاناً
                      </Button>
                    ) : !showPaymentOptions ? (
                      <Button
                        className="w-full bg-gold hover:bg-gold-dark text-charcoal font-bold py-6 text-lg"
                        onClick={() => {
                          if (!user) {
                            toast.info("يرجى تسجيل الدخول أولاً");
                            return;
                          }
                          setShowPaymentOptions(true);
                        }}
                      >
                        <ShoppingCart className="h-5 w-5 ml-2" />
                        سجل الآن
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-center text-sm text-white/70 mb-2">اختر طريقة الدفع:</p>
                        
                        {/* Tap - Direct Payment */}
                        <Button
                          className="w-full bg-[#2ace7f] hover:bg-[#25b870] text-white font-bold py-5"
                          onClick={handlePayWithTap}
                          disabled={paymentLoading !== null}
                        >
                          {paymentLoading === "tap" ? (
                            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                          ) : (
                            <CreditCard className="h-5 w-5 ml-2" />
                          )}
                          دفع مباشر (بطاقة / Apple Pay / mada)
                        </Button>

                        {/* Tabby - Installments */}
                        {finalPrice >= 1 && (
                          <Button
                            className="w-full bg-[#3bffc1] hover:bg-[#2ee8ad] text-[#1a1a2e] font-bold py-5"
                            onClick={handlePayWithTabby}
                            disabled={paymentLoading !== null}
                          >
                            {paymentLoading === "tabby" ? (
                              <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                            ) : (
                              <CalendarClock className="h-5 w-5 ml-2" />
                            )}
                            تقسيط بدون فوائد (Tabby)
                          </Button>
                        )}

                        <button
                          className="w-full text-center text-xs text-white/50 hover:text-white/70 underline"
                          onClick={() => setShowPaymentOptions(false)}
                        >
                          رجوع
                        </button>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>وصول مدى الحياة</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>شهادة إتمام</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>{totalLessons} درس مسجل</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 bg-cream/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                {course.detailedDescription && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-gold" />
                        وصف الدورة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none text-charcoal/80 whitespace-pre-wrap">
                        {course.detailedDescription}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* What You'll Learn */}
                {course.whatYouLearn && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        ماذا ستتعلم
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(() => {
                          try {
                            return (JSON.parse(course.whatYouLearn || '[]') as string[]).map((item: string, i: number) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{item}</span>
                              </div>
                            ));
                          } catch { return null; }
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Course Content / Sections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-gold" />
                        محتوى الدورة
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {course.sections?.length || 0} أقسام · {totalLessons} درس · {Math.floor(totalDuration / 60)} ساعة
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {course.sections?.map((section: any, sIdx: number) => (
                        <div key={section.id || sIdx}>
                          <button
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                            onClick={() => toggleSection(sIdx)}
                          >
                            <div className="text-right">
                              <span className="font-medium">القسم {sIdx + 1}: {section.title}</span>
                              <span className="block text-xs text-muted-foreground mt-0.5">
                                {section.lessons?.length || 0} دروس
                              </span>
                            </div>
                            {expandedSections.has(sIdx) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>

                          {expandedSections.has(sIdx) && (
                            <div className="bg-muted/20 border-t">
                              {section.lessons?.map((lesson: any, lIdx: number) => {
                                const LessonIcon = lessonTypeIcons[lesson.lessonType || "video"] || Video;
                                return (
                                  <div
                                    key={lesson.id || lIdx}
                                    className="flex items-center gap-3 px-6 py-3 border-b last:border-0"
                                  >
                                    <div className="flex-shrink-0">
                                      {lesson.isFreePreview ? (
                                        <PlayCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                      <LessonIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm">{lesson.title}</span>
                                      {lesson.lessonType === "quiz" && (
                                        <Badge variant="outline" className="text-[10px]">اختبار</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {lesson.isFreePreview && (
                                        <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                                          معاينة مجانية
                                        </Badge>
                                      )}
                                      {lesson.lessonType !== "quiz" && (
                                        <span className="text-xs text-muted-foreground">
                                          {lesson.duration ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : "--:--"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements */}
                {course.requirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle>المتطلبات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(() => {
                          try {
                            return (JSON.parse(course.requirements || '[]') as string[]).map((req: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-gold mt-1">•</span>
                                <span>{req}</span>
                              </li>
                            ));
                          } catch { return null; }
                        })()}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-gold" />
                        التقييمات والمراجعات
                      </span>
                      {reviewsQuery.data?.count ? (
                        <span className="text-sm font-normal text-muted-foreground">
                          {reviewsQuery.data.count} تقييم
                        </span>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Average Rating */}
                    {reviewsQuery.data?.average && parseFloat(String(reviewsQuery.data.average)) > 0 && (
                      <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gold">
                            {parseFloat(String(reviewsQuery.data.average)).toFixed(1)}
                          </div>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${s <= Math.round(parseFloat(String(reviewsQuery.data?.average || "0"))) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{reviewsQuery.data.count} تقييم</p>
                        </div>
                      </div>
                    )}

                    {/* Add Review Form */}
                    {user && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-sm">أضف تقييمك</h4>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button
                              key={s}
                              onMouseEnter={() => setHoverRating(s)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setReviewRating(s)}
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  s <= (hoverRating || reviewRating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-sm text-muted-foreground mr-2">{reviewRating}/5</span>
                        </div>
                        <Textarea
                          placeholder="اكتب تقييمك هنا (اختياري)..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          rows={3}
                        />
                        <Button
                          size="sm"
                          onClick={handleSubmitReview}
                          disabled={addReview.isPending}
                        >
                          {addReview.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                          إرسال التقييم
                        </Button>
                      </div>
                    )}

                    {/* Reviews List */}
                    {reviewsQuery.data?.reviews?.length ? (
                      <div className="space-y-4">
                        {reviewsQuery.data.reviews.map((review: any) => (
                          <div key={review.id} className="border-b pb-4 last:border-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{(review as any).userName || "مستخدم"}</p>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <Star
                                        key={s}
                                        className={`h-3 w-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString("ar-SA")}
                              </span>
                            </div>
                            {review.reviewText && (
                              <p className="text-sm text-muted-foreground mt-2 mr-10">{review.reviewText}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        لا توجد تقييمات بعد. كن أول من يقيم هذه الدورة!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Instructor Card */}
                {course.instructor?.name && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">المدرب</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                          <p className="font-semibold">{course.instructor?.name}</p>
                          {course.instructor?.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{course.instructor?.bio}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {course.category && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">التصنيف</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline">{course.category}</Badge>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Methods Info */}
                {price > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">طرق الدفع المتاحة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        <span>بطاقة ائتمان / مدى / Apple Pay</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-teal-600" />
                        <span>تقسيط بدون فوائد عبر Tabby</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
