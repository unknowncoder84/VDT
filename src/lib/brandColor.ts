// Brand color theming helper.
// Converts a single hex color (the firm's chosen brand color) into a full
// 50–900 shade scale and writes them as CSS variables (--brand-50 ... --brand-900)
// as space-separated RGB triplets so Tailwind's `rgb(var(--brand-500) / <alpha>)`
// utilities pick them up across the whole app.

type RGB = { r: number; g: number; b: number };

// Default = Tailwind orange (matches the app's original look exactly)
const DEFAULT_ORANGE: Record<number, string> = {
  50: '255 247 237',
  100: '255 237 213',
  200: '254 215 170',
  300: '253 186 116',
  400: '251 146 60',
  500: '249 115 22',
  600: '234 88 12',
  700: '194 65 12',
  800: '154 52 18',
  900: '124 45 18',
};

const hexToRgb = (hex: string): RGB | null => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
};

// Mix a colour towards a target (white or black) by a weight 0..1
const mix = (c: RGB, target: RGB, w: number): RGB => ({
  r: Math.round(c.r * (1 - w) + target.r * w),
  g: Math.round(c.g * (1 - w) + target.g * w),
  b: Math.round(c.b * (1 - w) + target.b * w),
});

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

// Lightness weights tuned to roughly follow Tailwind's shade curve
const LIGHTEN: Record<number, number> = { 50: 0.9, 100: 0.8, 200: 0.62, 300: 0.43, 400: 0.22 };
const DARKEN: Record<number, number> = { 600: 0.12, 700: 0.3, 800: 0.45, 900: 0.58 };

const triplet = (c: RGB) => `${c.r} ${c.g} ${c.b}`;

/**
 * Apply a brand colour across the app. Pass a hex like "#ec4899".
 * Pass null/undefined to reset to the default orange theme.
 */
export const applyBrandColor = (hex?: string | null) => {
  const root = document.documentElement;

  // Reset to default orange
  if (!hex) {
    Object.entries(DEFAULT_ORANGE).forEach(([shade, rgb]) => {
      root.style.setProperty(`--brand-${shade}`, rgb);
    });
    return;
  }

  const base = hexToRgb(hex);
  if (!base) {
    // Invalid hex — fall back to default
    applyBrandColor(null);
    return;
  }

  const shades: Record<number, RGB> = { 500: base };
  Object.entries(LIGHTEN).forEach(([shade, w]) => {
    shades[Number(shade)] = mix(base, WHITE, w);
  });
  Object.entries(DARKEN).forEach(([shade, w]) => {
    shades[Number(shade)] = mix(base, BLACK, w);
  });

  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].forEach((shade) => {
    root.style.setProperty(`--brand-${shade}`, triplet(shades[shade]));
  });
};
