import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface PlatformSettings {
  logoUrl: string;
  platformName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface PlatformSettingsContextType {
  settings: PlatformSettings;
  isLoading: boolean;
  refetch: () => void;
}

const defaultSettings: PlatformSettings = {
  logoUrl: "",
  platformName: "منصة التدريب",
  primaryColor: "#4a5d23",
  secondaryColor: "#6b7c3f",
  accentColor: "#8fa058",
};

const PlatformSettingsContext = createContext<PlatformSettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refetch: () => {},
});

export function PlatformSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  
  const { data, isLoading, refetch } = trpc.settings.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setSettings({
        logoUrl: data.logoUrl || "",
        platformName: data.platformName || "منصة التدريب",
        primaryColor: data.primaryColor || "#4a5d23",
        secondaryColor: data.secondaryColor || "#6b7c3f",
        accentColor: data.accentColor || "#8fa058",
      });
    }
  }, [data]);

  // Apply colors to CSS variables whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    
    // Convert hex to HSL for better Tailwind integration
    const hexToHSL = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return "0 0% 0%";
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Apply primary color
    root.style.setProperty('--primary', hexToHSL(settings.primaryColor));
    root.style.setProperty('--primary-foreground', '0 0% 100%');
    
    // Apply accent color
    root.style.setProperty('--accent', hexToHSL(settings.accentColor));
    root.style.setProperty('--accent-foreground', '0 0% 100%');
    
    // Apply sidebar colors
    root.style.setProperty('--sidebar-primary', hexToHSL(settings.primaryColor));
    root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
    root.style.setProperty('--sidebar-accent', hexToHSL(settings.accentColor));
    root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
    
    // Store raw hex values for components that need them
    root.style.setProperty('--color-primary-hex', settings.primaryColor);
    root.style.setProperty('--color-secondary-hex', settings.secondaryColor);
    root.style.setProperty('--color-accent-hex', settings.accentColor);
    
  }, [settings]);

  return (
    <PlatformSettingsContext.Provider value={{ settings, isLoading, refetch }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const context = useContext(PlatformSettingsContext);
  if (!context) {
    throw new Error("usePlatformSettings must be used within PlatformSettingsProvider");
  }
  return context;
}
