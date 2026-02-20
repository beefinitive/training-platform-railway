import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, BookOpen, ShoppingBag, Phone, Home, LogIn, LayoutDashboard, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/116757463/jYciXWqZdcDVlMSj.png";

const navLinks = [
  { href: "/public", label: "الرئيسية", icon: Home },
  { href: "/public/courses", label: "الدورات التدريبية", icon: BookOpen },
  { href: "/public/recorded-courses", label: "الدورات المسجلة", icon: PlayCircle },
  { href: "/public/services", label: "خدماتنا", icon: ShoppingBag },
  { href: "/public/contact", label: "تواصل معنا", icon: Phone },
];

export default function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gold/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/public" className="flex items-center gap-3 shrink-0">
            <img
              src={LOGO_URL}
              alt="Beefinitive - بيفينيتيف للاستشارات"
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location === link.href || 
                (link.href !== "/public" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gold/10 text-gold-dark font-bold"
                      : "text-charcoal/70 hover:text-charcoal hover:bg-gold/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link href="/">
                <Button className="bg-gold text-charcoal hover:bg-gold-dark hover:text-white font-bold px-6 shadow-lg shadow-gold/20">
                  <LayoutDashboard className="w-4 h-4 ml-2" />
                  لوحة التحكم
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-gold/30 text-charcoal hover:bg-gold/5 font-medium">
                    <LogIn className="w-4 h-4 ml-2" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/public/courses">
                  <Button className="bg-gold text-charcoal hover:bg-gold-dark hover:text-white font-bold px-6 shadow-lg shadow-gold/20">
                    سجّل الآن
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-charcoal hover:bg-gold/5 transition-colors"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gold/10 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || 
                (link.href !== "/public" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-gold/10 text-gold-dark font-bold"
                      : "text-charcoal/70 hover:bg-gold/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-gold/10 space-y-2">
              {user ? (
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-gold text-charcoal hover:bg-gold-dark hover:text-white font-bold">
                    <LayoutDashboard className="w-4 h-4 ml-2" />
                    لوحة التحكم
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/public/courses" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-gold text-charcoal hover:bg-gold-dark hover:text-white font-bold shadow-lg shadow-gold/20">
                      سجّل الآن
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-gold/30 text-charcoal font-medium">
                      <LogIn className="w-4 h-4 ml-2" />
                      تسجيل الدخول
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
