import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  PlayCircle, Search, Clock, Users, Star, BookOpen, Video, Loader2, GraduationCap
} from "lucide-react";
import { useState, useMemo } from "react";

const levelLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

export default function PublicRecordedCourses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const coursesQuery = trpc.recordedCourses.public.listPublished.useQuery();
  const courses = coursesQuery.data || [];

  const categories = useMemo(() => {
    const cats = new Set(courses.map((c: any) => c.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c: any) => {
      const matchesSearch = !searchQuery || 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
      const matchesLevel = levelFilter === "all" || c.level === levelFilter;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, searchQuery, categoryFilter, levelFilter]);

  return (
    <PublicLayout>
      <div dir="rtl">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-charcoal via-charcoal/95 to-charcoal/90 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-4 py-2 rounded-full text-sm mb-6">
              <PlayCircle className="h-4 w-4" />
              تعلّم في أي وقت ومن أي مكان
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-serif)" }}>
              الدورات المسجلة
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              اكتشف مجموعة متنوعة من الدورات التدريبية المسجلة من أفضل المدربين، تعلّم بالسرعة التي تناسبك
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white border-b py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن دورة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التصنيفات</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="المستوى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="py-12 bg-cream/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {coursesQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold text-charcoal">لا توجد دورات متاحة حالياً</h3>
                <p className="text-muted-foreground mt-2">سيتم إضافة دورات جديدة قريباً</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-charcoal">
                    {filteredCourses.length} دورة متاحة
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCourses.map((course: any) => (
                    <Link key={course.id} href={`/public/recorded-courses/${course.slug}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                        {/* Thumbnail */}
                        <div className="relative h-48 bg-gradient-to-br from-charcoal/10 to-charcoal/5 overflow-hidden">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <PlayCircle className="h-16 w-16 text-charcoal/20" />
                            </div>
                          )}
                          {course.isFeatured && (
                            <Badge className="absolute top-3 right-3 bg-gold text-charcoal">
                              <Star className="h-3 w-3 ml-1" /> مميزة
                            </Badge>
                          )}
                          {course.level && (
                            <Badge variant="outline" className="absolute top-3 left-3 bg-white/90 text-charcoal text-xs">
                              {levelLabels[course.level] || course.level}
                            </Badge>
                          )}
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          {course.category && (
                            <span className="text-xs text-gold-dark font-medium">{course.category}</span>
                          )}
                          <h3 className="font-bold text-charcoal line-clamp-2 leading-snug">
                            {course.title}
                          </h3>
                          {course.shortDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{course.shortDescription}</p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              {course.totalLessons || 0} درس
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {course.totalDuration || 0} دقيقة
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.totalEnrollments || 0}
                            </span>
                          </div>

                          {/* Rating */}
                          {parseFloat(course.averageRating || "0") > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium">{parseFloat(course.averageRating).toFixed(1)}</span>
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex items-center gap-2 pt-2 border-t">
                            {course.discountPrice ? (
                              <>
                                <span className="text-lg font-bold text-gold-dark">
                                  {parseFloat(course.discountPrice).toFixed(0)} ر.س
                                </span>
                                <span className="text-sm line-through text-muted-foreground">
                                  {parseFloat(course.price).toFixed(0)} ر.س
                                </span>
                              </>
                            ) : parseFloat(course.price) === 0 ? (
                              <span className="text-lg font-bold text-green-600">مجانية</span>
                            ) : (
                              <span className="text-lg font-bold text-gold-dark">
                                {parseFloat(course.price).toFixed(0)} ر.س
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
