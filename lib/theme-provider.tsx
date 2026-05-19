import { createContext, useContext, useMemo } from "react";
import { View } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always force light mode
  const colorScheme: ColorScheme = "light";

  // Dummy setter that does nothing to maintain API compatibility
  const setColorScheme = () => {};

  // Force nativewind to light
  nativewindColorScheme.set("light");

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors.light.primary,
        "color-background": SchemeColors.light.background,
        "color-surface": SchemeColors.light.surface,
        "color-foreground": SchemeColors.light.foreground,
        "color-muted": SchemeColors.light.muted,
        "color-border": SchemeColors.light.border,
        "color-success": SchemeColors.light.success,
        "color-warning": SchemeColors.light.warning,
        "color-error": SchemeColors.light.error,
      }),
    [],
  );

  const value = useMemo(
    () => ({
      colorScheme: "light" as const,
      setColorScheme,
    }),
    [],
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
