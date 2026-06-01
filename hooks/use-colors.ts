import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { useThemeContext } from "@/lib/theme-provider";

/**
 * Returns the current theme's color palette.
 */
export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  if (colorSchemeOverride) {
    return Colors[colorSchemeOverride];
  }
  try {
    const context = useThemeContext();
    if (context && context.colorScheme) {
      return Colors[context.colorScheme];
    }
  } catch (err) {
    // Fallback if context is not available
  }
  return Colors.light;
}
