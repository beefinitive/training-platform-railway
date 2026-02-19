import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Palette, Image, Save, Upload, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";


// Predefined color themes
const colorThemes = [
  { name: "أخضر زيتي", primary: "#4a5d23", secondary: "#6b7c3f", accent: "#8fa058" },
  { name: "أزرق داكن", primary: "#1e3a5f", secondary: "#2d5a87", accent: "#3d7ab0" },
  { name: "بنفسجي", primary: "#5b3a7d", secondary: "#7a4d9e", accent: "#9a60bf" },
  { name: "برتقالي", primary: "#c45c26", secondary: "#e07030", accent: "#f08040" },
  { name: "أحمر قرمزي", primary: "#8b2942", secondary: "#a83a55", accent: "#c54b68" },
  { name: "ذهبي", primary: "#8b7355", secondary: "#a68b6a", accent: "#c4a882" },
  { name: "رمادي", primary: "#4a4a4a", secondary: "#6a6a6a", accent: "#8a8a8a" },
  { name: "أخضر زمردي", primary: "#0d6e5b", secondary: "#109b7e", accent: "#13c8a1" },
];

export default function Settings() {
  const { hasPermission } = usePermissions();
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.getAll.useQuery();
  
  const [logoUrl, setLogoUrl] = useState("");
  const [platformName, setPlatformName] = useState("منصة التدريب");
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [customColors, setCustomColors] = useState({
    primary: "#4a5d23",
    secondary: "#6b7c3f",
    accent: "#8fa058",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { refetch: refetchPlatformSettings } = usePlatformSettings();

  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.getAll.invalidate();
      refetchPlatformSettings(); // Refresh global settings
      toast.success("تم حفظ الإعدادات بنجاح");
      // Apply colors immediately
      applyColors(customColors);
    },
    onError: (error) => {
      console.error("Settings save error:", error);
      toast.error("حدث خطأ أثناء حفظ الإعدادات: " + error.message);
    },
  });

  useEffect(() => {
    if (settings) {
      if (settings.logoUrl) setLogoUrl(settings.logoUrl);
      if (settings.platformName) setPlatformName(settings.platformName);
      if (settings.primaryColor) {
        setCustomColors({
          primary: settings.primaryColor,
          secondary: settings.secondaryColor || settings.primaryColor,
          accent: settings.accentColor || settings.primaryColor,
        });
      }
    }
  }, [settings]);

  useEffect(() => {
    // Apply saved colors on load
    if (settings?.primaryColor) {
      applyColors({
        primary: settings.primaryColor,
        secondary: settings.secondaryColor || settings.primaryColor,
        accent: settings.accentColor || settings.primaryColor,
      });
    }
  }, [settings]);

  const applyColors = (colors: { primary: string; secondary: string; accent: string }) => {
    const root = document.documentElement;
    // Convert hex to oklch (simplified - just use the hex for now)
    root.style.setProperty('--primary-custom', colors.primary);
    root.style.setProperty('--secondary-custom', colors.secondary);
    root.style.setProperty('--accent-custom', colors.accent);
    
    // Update CSS variables for the theme
    root.style.setProperty('--color-primary', colors.primary);
  };

  const handleThemeSelect = (index: number) => {
    setSelectedTheme(index);
    setCustomColors(colorThemes[index]);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoUrl(base64);
        setUploading(false);
        toast.success("تم رفع الشعار بنجاح");
      };
      reader.onerror = () => {
        setUploading(false);
        toast.error("حدث خطأ أثناء رفع الشعار");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      toast.error("حدث خطأ أثناء رفع الشعار");
    }
  };

  const handleSave = () => {
    console.log("Saving settings:", {
      logoUrl: logoUrl ? logoUrl.substring(0, 50) + "..." : "empty",
      platformName,
      primaryColor: customColors.primary,
    });
    updateSettingsMutation.mutate({
      settings: {
        logoUrl,
        platformName,
        primaryColor: customColors.primary,
        secondaryColor: customColors.secondary,
        accentColor: customColors.accent,
      },
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
              <SettingsIcon className="h-6 w-6" />
              الإعدادات
            </h1>
            <p className="text-muted-foreground mt-1">تخصيص مظهر المنصة والإعدادات العامة</p>
          </div>
          {hasPermission(PERMISSIONS.SETTINGS_EDIT) && (
            <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
              <Save className="h-4 w-4 ml-2" />
              {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          )}
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList>
            <TabsTrigger value="branding" className="gap-2">
              <Image className="h-4 w-4" />
              الهوية البصرية
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="h-4 w-4" />
              الألوان
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الشعار واسم المنصة</CardTitle>
                <CardDescription>قم بتخصيص شعار المنصة واسمها</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <Label>شعار المنصة</Label>
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Image className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 ml-2" />
                        {uploading ? "جاري الرفع..." : "رفع شعار جديد"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG أو SVG. الحد الأقصى 2 ميجابايت.
                      </p>
                      {logoUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setLogoUrl("")}
                        >
                          إزالة الشعار
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Platform Name */}
                <div className="space-y-2">
                  <Label>اسم المنصة</Label>
                  <Input
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    placeholder="منصة التدريب"
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيظهر هذا الاسم في القائمة الجانبية وعنوان الصفحة
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ألوان المنصة</CardTitle>
                <CardDescription>اختر نظام ألوان جاهز أو قم بتخصيص الألوان يدوياً</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Predefined Themes */}
                <div className="space-y-3">
                  <Label>أنظمة ألوان جاهزة</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {colorThemes.map((theme, index) => (
                      <button
                        key={index}
                        onClick={() => handleThemeSelect(index)}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          selectedTheme === index
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex gap-1 mb-2">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: theme.secondary }}
                          />
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <span className="text-sm font-medium">{theme.name}</span>
                        {selectedTheme === index && (
                          <div className="absolute top-2 left-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="space-y-4 pt-4 border-t">
                  <Label>تخصيص الألوان يدوياً</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">اللون الرئيسي</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.primary}
                          onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={customColors.primary}
                          onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">اللون الثانوي</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.secondary}
                          onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={customColors.secondary}
                          onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">لون التمييز</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.accent}
                          onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={customColors.accent}
                          onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-3 pt-4 border-t">
                  <Label>معاينة</Label>
                  <div className="p-6 rounded-lg border bg-card">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: customColors.primary }}
                      >
                        م
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: customColors.primary }}>
                          {platformName || "منصة التدريب"}
                        </h3>
                        <p className="text-sm text-muted-foreground">نظرة عامة</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        style={{ backgroundColor: customColors.primary }}
                        className="text-white"
                      >
                        زر رئيسي
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        style={{ borderColor: customColors.secondary, color: customColors.secondary }}
                      >
                        زر ثانوي
                      </Button>
                      <span
                        className="px-3 py-1 rounded-full text-sm text-white"
                        style={{ backgroundColor: customColors.accent }}
                      >
                        شارة
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
