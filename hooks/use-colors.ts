import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";

/**
 * Returns the current theme's color palette.
 * Forced to Light Mode as per user request.
 */
export function useColors(_colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  return Colors.light;
}
