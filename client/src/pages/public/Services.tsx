import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ShoppingBag, Megaphone, GraduationCap, Palette, Briefcase, Star,
  CheckCircle, ArrowLeft, User, Mail, Phone, Building2, FileText, Send, Loader2
} from "lucide-react";
import { useState } from "react";

const categoryIcons: Record<string, typeof Megaphone> = {
  marketing: Megaphone,
  training: GraduationCap,
  consulting: Briefcase,
  design: Palette,
  other: ShoppingBag,
};

const categoryLabels: Record<string, string> = {
  marketing: "تسويق",
  training: "تدريب",
  consulting: "استشارات",
  design: "تصميم",
  other: "أخرى",
};

const categoryColors: Record<string, string> = {
  marketing: "bg-pink-100 text-pink-700",
  training: "bg-blue-100 text-blue-700",
  consulting: "bg-emerald-100 text-emerald-700",
  design: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-700",
};

export default function PublicServicesPage() {
  const { data: services, isLoading } = trpc.publicServices.list.useQuery();
  const orderMutation = trpc.publicServices.order.useMutation();
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    organization: "",
    requirements: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !formData.fullName || !formData.email || !formData.phone) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    try {
      await orderMutation.mutateAsync({
        serviceId: selectedService.id,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        organization: formData.organization || undefined,
        requirements: formData.requirements || undefined,
      });
      setSubmitted(true);
      toast.success("تم إرسال طلبك بنجاح!");
    } catch (error) {
      toast.error("حدث خطأ. يرجى المحاولة مرة أخرى");
    }
  };

  const resetForm = () => {
    setFormData({ fullName: "", email: "", phone: "", organization: "", requirements: "" });
    setSubmitted(false);
    setSelectedService(null);
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-bl from-charcoal via-charcoal-light to-charcoal py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-black text-white">
            خدماتنا <span className="text-gold">المتميزة</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            نقدم مجموعة متنوعة من الخدمات التسويقية والتدريبية المصممة لتلبية احتياجاتك وتحقيق أهدافك
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-12 w-12 bg-muted rounded-xl"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !services || services.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <h3 className="text-xl font-bold text-foreground">لا توجد خدمات متاحة حالياً</h3>
              <p className="text-muted-foreground">سيتم إضافة خدمات جديدة قريباً</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service: any) => {
                const CategoryIcon = categoryIcons[service.category] || ShoppingBag;
                const categoryLabel = categoryLabels[service.category] || "أخرى";
                const categoryColor = categoryColors[service.category] || "bg-gray-100 text-gray-700";
                const features = service.features ? JSON.parse(service.features) : [];

                return (
                  <Card key={service.id} className="group border-border/50 hover:border-gold/30 hover:shadow-xl transition-all duration-300 flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-charcoal transition-all duration-300">
                          <CategoryIcon className="h-7 w-7" />
                        </div>
                        <Badge className={`${categoryColor} border-0 font-medium`}>
                          {categoryLabel}
                        </Badge>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-gold transition-colors">
                        {service.name}
                      </h3>
                      {service.shortDescription && (
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                          {service.shortDescription}
                        </p>
                      )}

                      {/* Features */}
                      {features.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {features.slice(0, 4).map((feature: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-gold shrink-0" />
                              <span className="text-foreground/70">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Price & CTA */}
                      <div className="mt-auto pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            {service.originalPrice && parseFloat(service.originalPrice) > parseFloat(service.price) && (
                              <div className="text-sm text-muted-foreground line-through">
                                {service.originalPrice} ر.س
                              </div>
                            )}
                            <div className="text-2xl font-black text-gold">
                              {service.price} <span className="text-sm font-normal">ر.س</span>
                            </div>
                          </div>
                          {service.isFeatured && (
                            <Badge className="bg-gold/10 text-gold border-gold/20">
                              <Star className="h-3 w-3 ml-1 fill-gold" />
                              مميز
                            </Badge>
                          )}
                        </div>
                        <Button
                          onClick={() => setSelectedService(service)}
                          className="w-full bg-gold/10 text-gold hover:bg-gold hover:text-charcoal font-bold transition-all duration-300"
                        >
                          اطلب الخدمة
                          <ArrowLeft className="h-4 w-4 mr-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Order Dialog */}
      <Dialog open={!!selectedService} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {submitted ? "تم إرسال الطلب!" : `طلب خدمة: ${selectedService?.name}`}
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold">شكراً لك!</h3>
              <p className="text-muted-foreground text-sm">
                تم استلام طلبك بنجاح. سيتواصل معك فريقنا قريباً لمناقشة التفاصيل.
              </p>
              <Button onClick={resetForm} variant="outline">
                إغلاق
              </Button>
            </div>
          ) : (
            <form onSubmit={handleOrder} className="space-y-4">
              {selectedService && (
                <div className="bg-gold/5 border border-gold/10 rounded-lg p-3 text-center">
                  <div className="text-sm text-muted-foreground">{selectedService.name}</div>
                  <div className="text-xl font-black text-gold mt-1">
                    {selectedService.price} ر.س
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gold" />
                  الاسم الكامل <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="أدخل اسمك الكامل"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gold" />
                  البريد الإلكتروني <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gold" />
                  رقم الهاتف <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+966 5XX XXX XXXX"
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gold" />
                  جهة العمل
                </Label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="اسم جهة العمل (اختياري)"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold" />
                  متطلباتك
                </Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="اشرح متطلباتك بالتفصيل (اختياري)"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gold text-charcoal hover:bg-gold-dark hover:text-white font-bold py-5"
                disabled={orderMutation.isPending}
              >
                {orderMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 ml-2" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
