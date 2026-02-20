import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/PublicLayout";
import {
  GraduationCap, Users, Award, Monitor, MapPin, PlayCircle,
  ArrowLeft, Star, CheckCircle, TrendingUp, Sparkles, Target, Megaphone, BookOpen
} from "lucide-react";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/116757463/jYciXWqZdcDVlMSj.png";

const stats = [
  { icon: GraduationCap, value: "+50", label: "دورة تدريبية", color: "text-gold" },
  { icon: Users, value: "+1000", label: "متدرب ومتدربة", color: "text-gold" },
  { icon: Award, value: "+20", label: "مدرب معتمد", color: "text-gold" },
  { icon: Star, value: "4.9", label: "تقييم المتدربين", color: "text-gold" },
];

const courseTypes = [
  {
    icon: Monitor,
    title: "دورات أونلاين مباشرة",
    description: "تفاعل مباشر مع المدرب عبر الإنترنت في بيئة تعليمية تفاعلية",
    color: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-200",
  },
  {
    icon: MapPin,
    title: "دورات حضورية",
    description: "تجربة تعليمية متكاملة في قاعات مجهزة بأحدث التقنيات",
    color: "bg-emerald-50 text-emerald-600",
    borderColor: "border-emerald-200",
  },
  {
    icon: PlayCircle,
    title: "دورات مسجلة",
    description: "تعلّم في أي وقت يناسبك مع محتوى مسجل عالي الجودة",
    color: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-200",
  },
];

const servicesList = [
  {
    icon: Megaphone,
    title: "خدمات تسويقية",
    description: "استراتيجيات تسويقية متكاملة لتعزيز حضورك الرقمي وزيادة مبيعاتك",
  },
  {
    icon: Target,
    title: "استشارات تدريبية",
    description: "تصميم برامج تدريبية مخصصة تلبي احتياجات مؤسستك",
  },
  {
    icon: BookOpen,
    title: "تطوير المحتوى",
    description: "إنتاج محتوى تعليمي وتدريبي احترافي بأعلى المعايير",
  },
  {
    icon: TrendingUp,
    title: "تطوير الأعمال",
    description: "حلول متكاملة لتطوير أعمالك وتحقيق أهدافك الاستراتيجية",
  },
];

const testimonials = [
  {
    name: "أحمد العمري",
    role: "مدير تسويق",
    text: "دورة تدريب المدربين غيّرت مسيرتي المهنية. المحتوى عملي ومفيد جداً.",
    rating: 5,
  },
  {
    name: "سارة الحربي",
    role: "رائدة أعمال",
    text: "الخدمات التسويقية ساعدتنا في مضاعفة مبيعاتنا خلال 3 أشهر فقط.",
    rating: 5,
  },
  {
    name: "خالد المالكي",
    role: "مدرب معتمد",
    text: "بيئة تعليمية احترافية ودعم مستمر من فريق بيفينيتيف.",
    rating: 5,
  },
];

export default function Landing() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-charcoal via-charcoal-light to-charcoal min-h-[85vh] flex items-center">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/3 rounded-full blur-3xl"></div>
        </div>
        
        {/* Hexagonal pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 17.5V42.5L30 55L5 42.5V17.5L30 5Z' fill='none' stroke='%23EAB308' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-right">
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-gold text-sm font-medium">نبني مستقبلك المهني</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                طوّر مهاراتك مع
                <span className="block text-gold mt-2">بيفينيتيف للاستشارات</span>
              </h1>
              
              <p className="text-lg text-white/70 max-w-lg leading-relaxed">
                نقدم دورات تدريبية احترافية مباشرة وأونلاين ومسجلة، بالإضافة إلى خدمات تسويقية وتدريبية متنوعة لتطوير الأفراد والمؤسسات.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/public/courses">
                  <Button size="lg" className="bg-gold text-charcoal hover:bg-gold-light font-bold text-base px-8 py-6 shadow-xl shadow-gold/20 transition-all duration-300 hover:scale-105">
                    تصفح الدورات
                    <ArrowLeft className="h-5 w-5 mr-2" />
                  </Button>
                </Link>
                <Link href="/public/services">
                  <Button size="lg" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 font-bold text-base px-8 py-6 transition-all duration-300">
                    خدماتنا
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-gold/20 to-gold/5 rounded-3xl rotate-6 absolute -top-4 -right-4"></div>
                <div className="relative w-80 h-80 bg-gradient-to-br from-charcoal-light to-charcoal rounded-3xl border border-gold/20 flex items-center justify-center overflow-hidden">
                  <img src={LOGO_URL} alt="Beefinitive" className="w-60 h-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <Card key={i} className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-3xl font-black text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Course Types Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-gold font-bold text-sm tracking-wider">أنواع الدورات</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              اختر الطريقة التي تناسبك
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              نوفر لك خيارات متعددة للتعلم حسب ظروفك واحتياجاتك
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {courseTypes.map((type, i) => (
              <Card key={i} className={`border-2 ${type.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group`}>
                <CardContent className="p-8 text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl ${type.color} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <type.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{type.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/public/courses">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 shadow-lg shadow-primary/20">
                عرض جميع الدورات
                <ArrowLeft className="h-5 w-5 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gradient-to-b from-accent/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-gold font-bold text-sm tracking-wider">خدماتنا</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              حلول متكاملة لنجاحك
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              نقدم مجموعة متنوعة من الخدمات التسويقية والتدريبية المصممة لتلبية احتياجاتك
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesList.map((service, i) => (
              <Card key={i} className="border-border/50 hover:border-gold/30 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-charcoal transition-all duration-300">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/public/services">
              <Button size="lg" variant="outline" className="border-gold/30 text-gold-dark hover:bg-gold/10 font-bold px-8">
                تصفح جميع الخدمات
                <ArrowLeft className="h-5 w-5 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <span className="text-gold font-bold text-sm tracking-wider">لماذا بيفينيتيف؟</span>
                <h2 className="text-3xl md:text-4xl font-black text-foreground mt-3">
                  شريكك في رحلة التطوير المهني
                </h2>
              </div>

              <div className="space-y-5">
                {[
                  "مدربون معتمدون وذوو خبرة عالية",
                  "محتوى تدريبي محدّث ومواكب لأحدث التطورات",
                  "شهادات معتمدة بعد إتمام الدورات",
                  "دعم مستمر ومتابعة بعد التدريب",
                  "أسعار تنافسية وخيارات دفع مرنة",
                  "تقنيات تعليمية حديثة وبيئة تفاعلية",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-gold" />
                    </div>
                    <span className="text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/public/about">
                <Button size="lg" className="bg-charcoal text-white hover:bg-charcoal-light font-bold px-8 mt-4">
                  اعرف المزيد عنا
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Button>
              </Link>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -top-8 -right-8 w-full h-full bg-gold/10 rounded-3xl"></div>
              <div className="relative bg-gradient-to-br from-charcoal to-charcoal-light rounded-3xl p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-gold/20 rounded-full flex items-center justify-center mx-auto">
                  <Award className="h-12 w-12 text-gold" />
                </div>
                <h3 className="text-2xl font-bold text-white">+5 سنوات خبرة</h3>
                <p className="text-white/70">في مجال التدريب والاستشارات</p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-2xl font-black text-gold">98%</div>
                    <div className="text-xs text-white/60 mt-1">نسبة رضا المتدربين</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-2xl font-black text-gold">+50</div>
                    <div className="text-xs text-white/60 mt-1">شراكة ناجحة</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-gold font-bold text-sm tracking-wider">آراء عملائنا</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              ماذا يقولون عنا
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-foreground/80 leading-relaxed italic">"{t.text}"</p>
                  <div className="pt-2 border-t border-border/50">
                    <div className="font-bold text-foreground">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-charcoal via-charcoal-light to-charcoal relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-black text-white">
            ابدأ رحلتك التعليمية اليوم
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            انضم إلى آلاف المتدربين الذين طوّروا مهاراتهم مع بيفينيتيف
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/public/courses">
              <Button size="lg" className="bg-gold text-charcoal hover:bg-gold-light font-bold text-base px-10 py-6 shadow-xl shadow-gold/20">
                سجّل الآن
              </Button>
            </Link>
            <Link href="/public/contact">
              <Button size="lg" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 font-bold text-base px-10 py-6">
                تواصل معنا
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
