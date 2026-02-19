import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [logoUrl, setLogoUrl] = useState("");
  
  const { data: settings } = trpc.settings.getAll.useQuery();
  
  useEffect(() => {
    if (settings?.logoUrl) {
      setLogoUrl(settings.logoUrl);
    }
  }, [settings]);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  
  const utils = trpc.useUtils();
  const { refresh } = useAuth();
  
  const loginMutation = trpc.passwordAuth.login.useMutation({
    onSuccess: async () => {
      toast.success("تم تسجيل الدخول بنجاح");
      // Invalidate and refetch auth.me to update user state
      await utils.auth.me.invalidate();
      await refresh();
      // Use window.location.href for full page reload to ensure auth state is properly updated
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const registerMutation = trpc.passwordAuth.register.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }
    if (registerPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    registerMutation.mutate({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
    });
  };
  


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e8] to-white flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {logoUrl && (
            <div className="mb-4 flex justify-center">
              <img 
                src={logoUrl} 
                alt="شعار المنصة" 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-[#5c4a3d]">منصة إدارة الدورات التدريبية</CardTitle>
          <CardDescription>قم بتسجيل الدخول للوصول إلى لوحة التحكم</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#8b7355] hover:bg-[#6d5a45]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
