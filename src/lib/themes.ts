export type ThemeId =
  | "classic"
  | "classic-modern"
  | "hatch"
  | "mist"
  | "forest"
  | "paper"
  | "mono"
  | "bloomberg"
  | "matrix"
  | "dracula"
  | "nord"
  | "gruvbox"
  | "solarized";

export type ThemeMeta = {
  id: ThemeId;
  name: string;
  description: string;
  /** Two CSS color values for the swatch preview (matches the in-CSS theme accents) */
  swatch: [string, string];
};

export const THEMES: ThemeMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "The original HN — cream, orange, dense",
    swatch: ["#ff6600", "#f6f6ef"],
  },
  {
    id: "classic-modern",
    name: "New Classic",
    description: "The HN look, modernized & roomy",
    swatch: ["#ff6600", "#ff9233"],
  },
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
  {
    id: "bloomberg",
    name: "Bloomberg",
    description: "Amber-on-black terminal (ugly on purpose)",
    swatch: ["#ff9b00", "#000000"],
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Green phosphor terminal",
    swatch: ["#39ff14", "#001a00"],
  },
  {
    id: "dracula",
    name: "Dracula",
    description: "The cult dark theme",
    swatch: ["#bd93f9", "#ff79c6"],
  },
  {
    id: "nord",
    name: "Nord",
    description: "Arctic, bluish dark",
    swatch: ["#88c0d0", "#5e81ac"],
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    description: "Retro warm dark",
    swatch: ["#fe8019", "#d79921"],
  },
  {
    id: "solarized",
    name: "Solarized",
    description: "The classic dev palette",
    swatch: ["#268bd2", "#b58900"],
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);
export const DEFAULT_THEME: ThemeId = "classic";

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" && (THEME_IDS as string[]).includes(value)
  );
}
