export type ThemeId = "hatch" | "mist" | "forest" | "paper" | "mono";

export type ThemeMeta = {
  id: ThemeId;
  name: string;
  description: string;
  /** Two CSS color values for the swatch preview (matches the in-CSS theme accents) */
  swatch: [string, string];
};

export const THEMES: ThemeMeta[] = [
  {
    id: "hatch",
    name: "Hatch",
    description: "Warm orange-pink, dark",
    swatch: ["#ff5c1a", "#ff2d8a"],
  },
  {
    id: "mist",
    name: "Mist",
    description: "Cool cyan & indigo, dark",
    swatch: ["#22d3ee", "#6366f1"],
  },
  {
    id: "forest",
    name: "Forest",
    description: "Emerald & lime, dark",
    swatch: ["#10b981", "#84cc16"],
  },
  {
    id: "paper",
    name: "Paper",
    description: "Warm cream, light",
    swatch: ["#c2410c", "#b91c1c"],
  },
  {
    id: "mono",
    name: "Mono",
    description: "True grayscale, dark",
    swatch: ["#e5e5e5", "#a3a3a3"],
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);
export const DEFAULT_THEME: ThemeId = "hatch";

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" && (THEME_IDS as string[]).includes(value)
  );
}
