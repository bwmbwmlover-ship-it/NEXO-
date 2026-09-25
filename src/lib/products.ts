export interface Product {
  id: string;
  /** Brand name printed on the can label (Latin, language independent). */
  name: string;
  /** Two lines used for the big label type. */
  nameLines: [string, string];
  /** Primary label / lighting accent. */
  accent: string;
  /** Secondary label accent. */
  accent2: string;
  /** Deep base tone of the label artwork. */
  base: string;
  code: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "litchi",
    name: "DOUBLE LITCHI",
    nameLines: ["DOUBLE", "LITCHI"],
    accent: "#ff4d7d",
    accent2: "#ffd166",
    base: "#160b12",
    code: "NX-01",
  },
  {
    id: "citrus",
    name: "CITRUS RUSH",
    nameLines: ["CITRUS", "RUSH"],
    accent: "#ffa41b",
    accent2: "#ffe86b",
    base: "#15100a",
    code: "NX-02",
  },
  {
    id: "berry",
    name: "BERRY SHOCK",
    nameLines: ["BERRY", "SHOCK"],
    accent: "#e0245e",
    accent2: "#8b5cf6",
    base: "#140a12",
    code: "NX-03",
  },
  {
    id: "grape",
    name: "DARK GRAPE",
    nameLines: ["DARK", "GRAPE"],
    accent: "#7c4dff",
    accent2: "#37d0ff",
    base: "#0d0a18",
    code: "NX-04",
  },
  {
    id: "lime",
    name: "ICE LIME",
    nameLines: ["ICE", "LIME"],
    accent: "#2fe3a4",
    accent2: "#c9ff5e",
    base: "#08130f",
    code: "NX-05",
  },
];

export const PRODUCT_COUNT = PRODUCTS.length;

/** Shared can dimensions (world units). Height 2.4 / radius 0.62 ≈ slim 330ml can. */
export const CAN_HEIGHT = 2.4;
export const CAN_RADIUS = 0.62;
/** Half of the can height incl. lid — used for the safe-zone camera math. */
export const CAN_BOUND_RADIUS = 1.25;

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToCss(rgb: [number, number, number], a = 1): string {
  const [r, g, b] = rgb;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
