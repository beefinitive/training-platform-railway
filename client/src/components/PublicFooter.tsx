import { Link } from "wouter";
import { Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/116757463/jYciXWqZdcDVlMSj.png";

export default function PublicFooter() {
  return (
    <footer className="bg-charcoal text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <img src={LOGO_URL} alt="Beefinitive" className="h-16 w-auto brightness-110" />
            <p className="text-white/70 text-sm leading-relaxed">
              بيفينيتيف للاستشارات والتدريب - نقدم دورات تدريبية احترافية وخدمات تسويقية متكاملة لتطوير الأفراد والمؤسسات.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold/20 hover:text-gold flex items-center justify-center transition-all duration-200">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold/20 hover:text-gold flex items-center justify-center transition-all duration-200">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold/20 hover:text-gold flex items-center justify-center transition-all duration-200">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold/20 hover:text-gold flex items-center justify-center transition-all duration-200">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-gold font-bold text-lg">روابط سريعة</h3>
            <ul className="space-y-3">
              <li><Link href="/public/courses" className="text-white/70 hover:text-gold transition-colors text-sm">الدورات التدريبية</Link></li>
              <li><Link href="/public/services" className="text-white/70 hover:text-gold transition-colors text-sm">خدماتنا</Link></li>
              <li><Link href="/public/about" className="text-white/70 hover:text-gold transition-colors text-sm">من نحن</Link></li>
              <li><Link href="/public/contact" className="text-white/70 hover:text-gold transition-colors text-sm">تواصل معنا</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-gold font-bold text-lg">خدماتنا</h3>
            <ul className="space-y-3">
              <li className="text-white/70 text-sm">دورات تدريبية مباشرة</li>
              <li className="text-white/70 text-sm">دورات أونلاين</li>
              <li className="text-white/70 text-sm">دورات مسجلة</li>
              <li className="text-white/70 text-sm">خدمات تسويقية</li>
              <li className="text-white/70 text-sm">استشارات تدريبية</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-gold font-bold text-lg">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Mail className="h-4 w-4 text-gold shrink-0" />
                <span>info@beefinitive.com</span>
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Phone className="h-4 w-4 text-gold shrink-0" />
                <span dir="ltr">+966 XX XXX XXXX</span>
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <MapPin className="h-4 w-4 text-gold shrink-0" />
                <span>المملكة العربية السعودية</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Beefinitive. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/50 hover:text-gold text-sm transition-colors">سياسة الخصوصية</a>
            <a href="#" className="text-white/50 hover:text-gold text-sm transition-colors">الشروط والأحكام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
