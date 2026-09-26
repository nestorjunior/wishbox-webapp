import { createContext, useContext } from "react";

export const colors = {
  primary: "#5B2BE8",
  primarySoft: "#EFE9FF",
  background: "#F6F6FA",
  card: "#FFFFFF",
  text: "#14141C",
  muted: "#6C6C7E",
  border: "#EAEAF1",
  danger: "#E4405F",
  success: "#12A594",
};

export const darkColors = {
  primary: "#7B4FF0",
  primarySoft: "#2D1B6E",
  background: "#111020",
  card: "#1C1A2E",
  text: "#FFFFFF",
  muted: "#8E8AA0",
  border: "#2C2840",
  danger: "#FF6B7A",
  success: "#2DC98E",
};

export const tints: Record<string, string> = {
  lilac: "#EFE9FF",
  mint: "#DFF6EE",
  rose: "#FFE6EE",
  cream: "#FFF3DC",
  sky: "#E2F0FF",
  peach: "#FFE8DC",
};

export const darkTints: Record<string, string> = {
  lilac: "#2D1B6E",
  mint: "#0F3D2A",
  rose: "#3D1020",
  cream: "#3D2C0A",
  sky: "#0A1F3D",
  peach: "#3D1A0A",
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };

export const spacing = (n: number) => n * 4;

export const shadow = {
  shadowColor: "#1B1B33",
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

export const darkShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

export const primaryShadow = {
  shadowColor: colors.primary,
  shadowOpacity: 0.4,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

export const darkPrimaryShadow = {
  shadowColor: darkColors.primary,
  shadowOpacity: 0.5,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ---------- Theme type & context ----------

export type Theme = {
  colors: typeof colors;
  tints: typeof tints;
  isDark: boolean;
  shadow: typeof shadow;
  primaryShadow: typeof primaryShadow;
  font: {
    h1: { fontSize: number; fontWeight: "700"; color: string };
    h2: { fontSize: number; fontWeight: "700"; color: string };
    body: { fontSize: number; color: string };
    small: { fontSize: number; color: string };
  };
};

function buildFont(c: typeof colors) {
  return {
    h1: { fontSize: 22, fontWeight: "700" as const, color: c.text },
    h2: { fontSize: 17, fontWeight: "700" as const, color: c.text },
    body: { fontSize: 14, color: c.text },
    small: { fontSize: 12, color: c.muted },
  };
}

export const lightTheme: Theme = {
  colors,
  tints,
  isDark: false,
  shadow,
  primaryShadow,
  font: buildFont(colors),
};

export const darkTheme: Theme = {
  colors: darkColors,
  tints: darkTints,
  isDark: true,
  shadow: darkShadow,
  primaryShadow: darkPrimaryShadow,
  font: buildFont(darkColors),
};

// Backward-compat export so old `import { font }` still compiles
export const font = lightTheme.font;

export const ThemeContext = createContext<Theme>(lightTheme);

export const useTheme = () => useContext(ThemeContext);
