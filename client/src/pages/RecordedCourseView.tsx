import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRoute } from "wouter";
import {
  PlayCircle, CheckCircle, Clock, Video, Lock, ChevronDown, ChevronUp, Loader2,
  FileText, HelpCircle, AlertCircle, ArrowLeft, ArrowRight
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Helper to extract YouTube embed URL
function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// Helper to extract Vimeo embed URL
function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/)(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export default function RecordedCourseView() {
  const [, params] = useRoute("/recorded-courses/view/:id");
  const courseId = parseInt(params?.id || "0");
  const { user } = useAuth();


  const courseQuery = trpc.recordedCourses.getById.useQuery({ id: courseId });
  const course = courseQuery.data;

  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number | string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const submitQuizMutation = trpc.recordedCourses.quizzes.submitAttempt.useMutation();

  const toggleSection = (id: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentLesson = useMemo(() => {
    if (!course?.sections || !currentLessonId) return null;
    for (const section of course.sections) {
      const lesson = section.lessons?.find((l: any) => l.id === currentLessonId);
      if (lesson) return lesson;
    }
    return null;
  }, [course, currentLessonId]);

  // Get quiz for current lesson
  const quizQuery = trpc.recordedCourses.quizzes.getWithQuestions.useQuery(
    { quizId: currentLesson?.quizId || 0 },
    { enabled: !!currentLesson?.quizId && currentLesson?.lessonType === "quiz" }
  );

  // All lessons flat list for navigation
  const allLessons = useMemo(() => {
    if (!course?.sections) return [];
    return course.sections.flatMap((s: any) => s.lessons || []);
  }, [course]);

  const currentLessonIndex = allLessons.findIndex((l: any) => l.id === currentLessonId);

  const goToNextLesson = useCallback(() => {
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonId(allLessons[currentLessonIndex + 1].id);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
    }
  }, [currentLessonIndex, allLessons]);

  const goToPrevLesson = useCallback(() => {
    if (currentLessonIndex > 0) {
      setCurrentLessonId(allLessons[currentLessonIndex - 1].id);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
    }
  }, [currentLessonIndex, allLessons]);

  const handleQuizSubmit = async () => {
    if (!currentLesson?.quizId || !quizQuery.data) return;
    try {
      const answers = quizQuery.data.questions.map((q: any) => {
        const ans = quizAnswers[q.id];
        return {
          questionId: q.id,
          selectedAnswerId: typeof ans === "number" ? ans as number : undefined,
          shortAnswer: typeof ans === "string" ? ans as string : undefined,
        };
      });
      const result = await submitQuizMutation.mutateAsync({
        quizId: currentLesson.quizId,
        enrollmentId: 0, // Will be set from context
        answers,
      });
      setQuizResult(result);
      setQuizSubmitted(true);
      if (result.isPassed) {
        toast.success(`مبروك! نجحت في الاختبار - النتيجة: ${result.score}%`);
      } else {
        toast.error(`لم تجتز الاختبار - النتيجة: ${result.score}%`);
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تسليم الاختبار");
    }
  };

  // Render video based on source
  const renderVideoPlayer = (lesson: any) => {
    if (!lesson.videoUrl) return null;
    const source = lesson.videoSource || "upload";
    
    if (source === "youtube") {
      const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
      if (!embedUrl) return <p className="text-white/60">رابط YouTube غير صالح</p>;
      return (
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );
    }
    
    if (source === "vimeo") {
      const embedUrl = getVimeoEmbedUrl(lesson.videoUrl);
      if (!embedUrl) return <p className="text-white/60">رابط Vimeo غير صالح</p>;
      return (
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
          />
        </div>
      );
    }
    
    // Upload (S3 or direct video URL)
    return (
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <video
          src={lesson.videoUrl}
          className="absolute inset-0 w-full h-full"
          controls
          controlsList="nodownload"
        />
      </div>
    );
  };

  // Render quiz content
  const renderQuizContent = () => {
    if (!quizQuery.data) return <Loader2 className="h-8 w-8 animate-spin mx-auto" />;
    const quiz = quizQuery.data;
    
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6" dir="rtl">
        <div className="text-center mb-6">
          <HelpCircle className="h-12 w-12 mx-auto text-primary mb-2" />
          <h2 className="text-2xl font-bold">{quiz.title}</h2>
          {quiz.description && <p className="text-muted-foreground mt-1">{quiz.description}</p>}
          <div className="flex justify-center gap-4 mt-3 text-sm text-muted-foreground">
            <span>نسبة النجاح: {quiz.passingScore}%</span>
            {quiz.timeLimit && <span>الوقت: {quiz.timeLimit} دقيقة</span>}
            <span>{quiz.questions.length} سؤال</span>
          </div>
        </div>

        {quizSubmitted && quizResult ? (
          <Card className={quizResult.isPassed ? "border-green-500" : "border-red-500"}>
            <CardContent className="p-6 text-center">
              <div className={`text-4xl font-bold mb-2 ${quizResult.isPassed ? "text-green-600" : "text-red-600"}`}>
                {quizResult.score}%
              </div>
              <p className="text-lg mb-2">{quizResult.isPassed ? "مبروك! نجحت في الاختبار ✓" : "لم تجتز الاختبار ✗"}</p>
              <p className="text-sm text-muted-foreground">
                حصلت على {quizResult.totalPoints} من {quizResult.maxPoints} نقطة
              </p>
              <Progress value={quizResult.score} className="mt-4" />
              <div className="flex gap-3 justify-center mt-6">
                {!quizResult.isPassed && (
                  <Button onClick={() => { setQuizSubmitted(false); setQuizResult(null); setQuizAnswers({}); }}>
                    إعادة المحاولة
                  </Button>
                )}
                {currentLessonIndex < allLessons.length - 1 && (
                  <Button variant="outline" onClick={goToNextLesson}>
                    الدرس التالي <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {quiz.questions.map((q: any, qIdx: number) => (
              <Card key={q.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {qIdx + 1}
                    </span>
                    <div>
                      <p className="font-medium">{q.questionText}</p>
                      <span className="text-xs text-muted-foreground">{q.points} نقطة</span>
                    </div>
                  </div>

                  {q.questionType === "multiple_choice" && (
                    <RadioGroup
                      value={String(quizAnswers[q.id] || "")}
                      onValueChange={(val) => setQuizAnswers(prev => ({ ...prev, [q.id]: parseInt(val) }))}
                      className="space-y-2 mr-10"
                    >
                      {q.answers.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={String(a.id)} id={`q${q.id}-a${a.id}`} />
                          <Label htmlFor={`q${q.id}-a${a.id}`} className="flex-1 cursor-pointer">{a.answerText}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {q.questionType === "true_false" && (
                    <RadioGroup
                      value={String(quizAnswers[q.id] || "")}
                      onValueChange={(val) => setQuizAnswers(prev => ({ ...prev, [q.id]: parseInt(val) }))}
                      className="space-y-2 mr-10"
                    >
                      {q.answers.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={String(a.id)} id={`q${q.id}-a${a.id}`} />
                          <Label htmlFor={`q${q.id}-a${a.id}`} className="flex-1 cursor-pointer">{a.answerText}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {q.questionType === "short_answer" && (
                    <Input
                      placeholder="اكتب إجابتك هنا..."
                      value={String(quizAnswers[q.id] || "")}
                      onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="mr-10"
                    />
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleQuizSubmit}
                disabled={submitQuizMutation.isPending || Object.keys(quizAnswers).length < quiz.questions.length}
              >
                {submitQuizMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                تسليم الاختبار
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render text content
  const renderTextContent = (lesson: any) => {
    return (
      <div className="max-w-3xl mx-auto p-6" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">{lesson.title}</h2>
        </div>
        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.textContent || lesson.description || "" }}
        />
      </div>
    );
  };

  // Get lesson type icon
  const getLessonIcon = (lesson: any) => {
    switch (lesson.lessonType) {
      case "quiz": return <HelpCircle className="h-4 w-4 text-amber-500" />;
      case "text": return <FileText className="h-4 w-4 text-blue-500" />;
      default: return <Video className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (courseQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <p className="text-muted-foreground">الدورة غير موجودة</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]" dir="rtl">
        {/* Main Content Area */}
        <div className="flex-1 bg-black flex flex-col overflow-y-auto">
          {currentLesson ? (
            <>
              {currentLesson.lessonType === "quiz" ? (
                <div className="flex-1 bg-background">{renderQuizContent()}</div>
              ) : currentLesson.lessonType === "text" ? (
                <div className="flex-1 bg-background">{renderTextContent(currentLesson)}</div>
              ) : currentLesson.videoUrl ? (
                renderVideoPlayer(currentLesson)
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  <div className="text-center text-white/60">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">لا يوجد محتوى لهذا الدرس بعد</p>
                  </div>
                </div>
              )}
              {/* Lesson info & navigation */}
              <div className="p-4 bg-background border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {getLessonIcon(currentLesson)}
                      <h2 className="text-lg font-semibold">{currentLesson.title}</h2>
                    </div>
                    {currentLesson.description && currentLesson.lessonType !== "text" && (
                      <p className="text-sm text-muted-foreground mt-1">{currentLesson.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={goToPrevLesson} disabled={currentLessonIndex <= 0}>
                      <ArrowRight className="h-4 w-4 ml-1" /> السابق
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextLesson} disabled={currentLessonIndex >= allLessons.length - 1}>
                      التالي <ArrowLeft className="h-4 w-4 mr-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <div className="text-center text-white/60">
                <PlayCircle className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg">اختر درساً لبدء المشاهدة</p>
              </div>
            </div>
          )}
        </div>

        {/* Course Content Sidebar */}
        <div className="w-full lg:w-96 border-r bg-background overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">{course.title}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                {course.totalLessons || 0} درس
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {course.totalDuration || 0} دقيقة
              </span>
            </div>
          </div>

          {/* Sections */}
          <div className="divide-y">
            {course.sections?.map((section: any, sIdx: number) => (
              <div key={section.id}>
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="text-right">
                    <span className="text-sm font-medium">القسم {sIdx + 1}: {section.title}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {section.lessons?.length || 0} دروس
                    </span>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedSections.has(section.id) && (
                  <div className="bg-muted/20">
                    {section.lessons?.map((lesson: any, lIdx: number) => (
                      <button
                        key={lesson.id}
                        className={`w-full flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors text-right ${
                          currentLessonId === lesson.id ? "bg-primary/10 border-r-2 border-primary" : ""
                        }`}
                        onClick={() => {
                          setCurrentLessonId(lesson.id);
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setQuizResult(null);
                        }}
                      >
                        <div className="flex-shrink-0">
                          {currentLessonId === lesson.id ? (
                            <PlayCircle className="h-4 w-4 text-primary" />
                          ) : (
                            getLessonIcon(lesson)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm block truncate">{lesson.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {lesson.lessonType === "quiz" ? "اختبار" : 
                             lesson.lessonType === "text" ? "محتوى نصي" :
                             lesson.duration ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : "--:--"}
                          </span>
                        </div>
                        {lesson.isFreePreview && (
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">مجانية</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
