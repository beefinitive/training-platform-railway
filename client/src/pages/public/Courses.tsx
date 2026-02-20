import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import {
  GraduationCap, Calendar, Clock, Users, MapPin, Monitor, PlayCircle,
  ArrowLeft, Search, Filter
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const typeIcons: Record<string, typeof Monitor> = {
  online_live: Monitor,
  onsite: MapPin,
  recorded: PlayCircle,
};

const typeColors: Record<string, string> = {
  online_live: "bg-blue-100 text-blue-700 border-blue-200",
  onsite: "bg-emerald-100 text-emerald-700 border-emerald-200",
  recorded: "bg-purple-100 text-purple-700 border-purple-200",
};

const typeLabels: Record<string, string> = {
  online_live: "أونلاين مباشر",
  onsite: "حضوري",
  recorded: "مسجل",
};

export default function Courses() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: courses, isLoading } = trpc.publicCourses.list.useQuery();

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c: any) => {
      const matchSearch = !search || c.name.includes(search) || (c.description && c.description.includes(search));
      const matchType = typeFilter === "all" || c.courseType === typeFilter;
      return matchSearch && matchType;
    });
  }, [courses, search, typeFilter]);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-bl from-charcoal via-charcoal-light to-charcoal py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-black text-white">
            الدورات <span className="text-gold">التدريبية</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            اكتشف مجموعة واسعة من الدورات التدريبية المصممة لتطوير مهاراتك المهنية والشخصية
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-background border-b border-border/50 sticky top-20 z-30 backdrop-blur-md bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن دورة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="نوع الدورة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="online_live">أونلاين مباشر</SelectItem>
                <SelectItem value="onsite">حضوري</SelectItem>
                <SelectItem value="recorded">مسجل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="h-48 bg-muted rounded-t-lg"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <GraduationCap className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <h3 className="text-xl font-bold text-foreground">لا توجد دورات متاحة حالياً</h3>
              <p className="text-muted-foreground">سيتم إضافة دورات جديدة قريباً</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course: any) => {
                const TypeIcon = typeIcons[course.courseType] || Monitor;
                const typeColor = typeColors[course.courseType] || "bg-gray-100 text-gray-700";
                const typeLabel = typeLabels[course.courseType] || "أونلاين";
                return (
                  <Link key={course.id} href={`/public/courses/${course.id}`}>
                    <Card className="group border-border/50 hover:border-gold/30 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full">
                      <CardContent className="p-0">
                        {/* Course Image/Header */}
                        <div className="h-48 bg-gradient-to-br from-charcoal to-charcoal-light relative overflow-hidden">
                          {(course.thumbnailUrl || course.imageUrl) ? (
                            <img src={course.thumbnailUrl || course.imageUrl} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <GraduationCap className="h-16 w-16 text-gold/30" />
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            <Badge className={`${typeColor} border font-medium`}>
                              <TypeIcon className="h-3 w-3 ml-1" />
                              {typeLabel}
                            </Badge>
                          </div>
                          {course.price && (
                            <div className="absolute bottom-4 left-4 bg-gold text-charcoal font-bold px-3 py-1.5 rounded-lg shadow-lg">
                              {course.originalPrice && course.price !== course.originalPrice && parseFloat(course.originalPrice) > parseFloat(course.price) ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs line-through opacity-70">{parseFloat(course.originalPrice).toLocaleString()} ر.س</span>
                                  <span className="text-sm">{parseFloat(course.price).toLocaleString()} ر.س</span>
                                </div>
                              ) : (
                                <span className="text-sm">{parseFloat(course.price).toLocaleString()} ر.س</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Course Info */}
                        <div className="p-6 space-y-4">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-gold transition-colors line-clamp-2">
                            {course.name}
                          </h3>
                          {(course.shortDescription || course.description) && (
                            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                              {course.shortDescription || course.description}
                            </p>
                          )}
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">المدرب:</span> {course.instructorName}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border/50">
                            {course.startDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{new Date(course.startDate).toLocaleDateString('ar-SA')}</span>
                              </div>
                            )}
                            {course.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{course.duration}</span>
                              </div>
                            )}
                          </div>
                          <Button className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold transition-all duration-300">
                            عرض التفاصيل
                            <ArrowLeft className="h-4 w-4 mr-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
