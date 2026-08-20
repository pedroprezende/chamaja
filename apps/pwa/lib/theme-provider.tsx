import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { View } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setSchemeState] = useState<ColorScheme>("light");

  // Load theme on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const stored = await AsyncStorage.getItem("@chamaja_color_scheme");
        if (stored === "light" || stored === "dark") {
          setSchemeState(stored);
          nativewindColorScheme.set(stored);
        }
      } catch (e) {
        console.error("Failed to load theme:", e);
      }
    }
    loadTheme();
  }, []);

  const setColorScheme = (scheme: ColorScheme) => {
    setSchemeState(scheme);
    nativewindColorScheme.set(scheme);
    AsyncStorage.setItem("@chamaja_color_scheme", scheme).catch((e) =>
      console.error("Failed to save theme:", e),
    );
  };

  const themeVariables = useMemo(() => {
    const activeColors = SchemeColors[colorScheme];
    return vars({
      "color-primary": activeColors.primary,
      "color-background": activeColors.background,
      "color-surface": activeColors.surface,
      "color-foreground": activeColors.foreground,
      "color-muted": activeColors.muted,
      "color-border": activeColors.border,
      "color-success": activeColors.success,
      "color-warning": activeColors.warning,
      "color-error": activeColors.error,
    });
  }, [colorScheme]);

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
    }),
    [colorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
