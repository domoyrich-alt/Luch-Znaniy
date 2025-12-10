import { Platform } from "react-native";

const tintColorLight = "#7C3AED";
const tintColorDark = "#A78BFA";

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    link: "#7C3AED",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F3F4F6",
    backgroundSecondary: "#E5E7EB",
    backgroundTertiary: "#D1D5DB",
    primary: "#7C3AED",
    primaryLight: "#A78BFA",
    secondary: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    yellowLight: "#FFF8E1",
    yellowMedium: "#FFECB3",
    yellowAccent: "#FFC107",
    yellowBright: "#FFD700",
    border: "#E5E7EB",
    cardBackground: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: "#A78BFA",
    backgroundRoot: "#0F0F0F",
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#252525",
    backgroundTertiary: "#303030",
    primary: "#A78BFA",
    primaryLight: "#C4B5FD",
    secondary: "#60A5FA",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    yellowLight: "#3D3520",
    yellowMedium: "#4A4025",
    yellowAccent: "#FFC107",
    yellowBright: "#FFD700",
    border: "#2A2A2A",
    cardBackground: "#1A1A1A",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
};

export const RoleBadgeColors = {
  student: "#3B82F6",
  teacher: "#10B981",
  director: "#F59E0B",
  curator: "#EF4444",
};

export const GradeColors = {
  excellent: "#10B981",
  good: "#3B82F6",
  average: "#F59E0B",
  poor: "#EF4444",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  fabSize: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
