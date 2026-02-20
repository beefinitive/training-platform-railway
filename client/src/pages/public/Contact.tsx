import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PublicLayout from "@/components/PublicLayout";
import { toast } from "sonner";
import {
  Mail, Phone, MapPin, Clock, Send, Loader2,
  Instagram, Twitter, Linkedin, MessageCircle
} from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setSending(true);
    // Simulate sending (in production, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSending(false);
    setSent(true);
    toast.success("تم إرسال رسالتك بنجاح!");
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-bl from-charcoal via-charcoal-light to-charcoal py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-black text-white">
            تواصل <span className="text-gold">معنا</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            نسعد بتواصلكم معنا. فريقنا جاهز للإجابة على استفساراتكم ومساعدتكم في اختيار الخدمة المناسبة
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-gold/20">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">البريد الإلكتروني</h3>
                      <p className="text-muted-foreground text-sm mt-1">info@beefinitive.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Phone className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">الهاتف</h3>
                      <p className="text-muted-foreground text-sm mt-1" dir="ltr">+966 XX XXX XXXX</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">واتساب</h3>
                      <p className="text-muted-foreground text-sm mt-1" dir="ltr">+966 XX XXX XXXX</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">الموقع</h3>
                      <p className="text-muted-foreground text-sm mt-1">المملكة العربية السعودية</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">ساعات العمل</h3>
                      <p className="text-muted-foreground text-sm mt-1">الأحد - الخميس: 9 ص - 5 م</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="border-gold/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">تابعنا على</h3>
                  <div className="flex items-center gap-3">
                    <a href="#" className="w-11 h-11 rounded-xl bg-gold/10 hover:bg-gold hover:text-charcoal text-gold flex items-center justify-center transition-all duration-300">
                      <Instagram className="h-5 w-5" />
                    </a>
                    <a href="#" className="w-11 h-11 rounded-xl bg-gold/10 hover:bg-gold hover:text-charcoal text-gold flex items-center justify-center transition-all duration-300">
                      <Twitter className="h-5 w-5" />
                    </a>
                    <a href="#" className="w-11 h-11 rounded-xl bg-gold/10 hover:bg-gold hover:text-charcoal text-gold flex items-center justify-center transition-all duration-300">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-gold/20 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gold/10 to-gold/5 border-b border-gold/10">
                  <CardTitle className="text-xl">
                    {sent ? "تم إرسال رسالتك!" : "أرسل لنا رسالة"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {sent ? (
                    <div className="text-center space-y-4 py-12">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Send className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold">شكراً لتواصلك!</h3>
                      <p className="text-muted-foreground">
                        تم استلام رسالتك بنجاح. سنرد عليك في أقرب وقت ممكن.
                      </p>
                      <Button
                        onClick={() => {
                          setSent(false);
                          setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
                        }}
                        variant="outline"
                      >
                        إرسال رسالة أخرى
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="أدخل اسمك"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>البريد الإلكتروني <span className="text-destructive">*</span></Label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="example@email.com"
                            dir="ltr"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>رقم الهاتف</Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+966 5XX XXX XXXX"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الموضوع</Label>
                          <Input
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="موضوع الرسالة"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>الرسالة <span className="text-destructive">*</span></Label>
                        <Textarea
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="اكتب رسالتك هنا..."
                          rows={6}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full sm:w-auto bg-gold text-charcoal hover:bg-gold-dark hover:text-white font-bold px-8 py-5"
                        disabled={sending}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin ml-2" />
                            جاري الإرسال...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5 ml-2" />
                            إرسال الرسالة
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
      </section>
    </PublicLayout>
  );
}
