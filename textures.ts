import * as THREE from "three";
import { PRODUCTS, type Product } from "../lib/products";

const W = 2048;
const H = 1024;

const FONT = '"Sora", "Inter", system-ui, sans-serif';

function nextFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

function withAlpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.replace("#", ""), 16);
  const pb = parseInt(b.replace("#", ""), 16);
  const ch = (i: number) =>
    Math.round(
      (((pa >> i) & 255) * (1 - t) + ((pb >> i) & 255) * t),
    );
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
) {
  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total =
    widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y);
    x += widths[i] + spacing;
  }
  ctx.textAlign = prevAlign;
}

/** Draw the same content three times so artwork wraps the cylinder seam. */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  cx: number,
  fn: (ctx: CanvasRenderingContext2D, cx: number) => void,
) {
  for (const offset of [-W, 0, W]) fn(ctx, cx + offset);
}

function brushedMetal(ctx: CanvasRenderingContext2D) {
  ctx.save();
  for (let i = 0; i < 190; i++) {
    const x = Math.random() * W;
    const w = 1 + Math.random() * 2;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    const a = 0.015 + Math.random() * 0.035;
    g.addColorStop(0, `rgba(255,255,255,0)`);
    g.addColorStop(0.5, `rgba(255,255,255,${a})`);
    g.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, H);
  }
  ctx.restore();
}

function energyStrikes(ctx: CanvasRenderingContext2D, product: Product) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 6; i++) {
    const x = -400 + i * 470 + 120;
    const grad = ctx.createLinearGradient(x, H, x + 520, 0);
    grad.addColorStop(0, withAlpha(product.accent, 0.0));
    grad.addColorStop(0.45, withAlpha(product.accent, 0.16));
    grad.addColorStop(1, withAlpha(product.accent2, 0.0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + 150, H);
    ctx.lineTo(x + 640, 0);
    ctx.lineTo(x + 490, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function band(
  ctx: CanvasRenderingContext2D,
  product: Product,
  y: number,
  height: number,
  flip: boolean,
) {
  const g = ctx.createLinearGradient(0, flip ? y + height : y, 0, flip ? y : y + height);
  g.addColorStop(0, "rgba(6,7,11,0.95)");
  g.addColorStop(1, "rgba(14,16,24,0.15)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, height);

  const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, withAlpha(product.accent, 0.1));
  lineGrad.addColorStop(0.5, withAlpha(product.accent, 0.95));
  lineGrad.addColorStop(1, withAlpha(product.accent, 0.1));
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, flip ? y + height - 3 : y, W, 3);
}

export function createLabelTexture(product: Product): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ---- base ------------------------------------------------------------
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, mixHex("#0b0d13", product.base, 0.55));
  base.addColorStop(0.45, product.base);
  base.addColorStop(1, "#05060a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  energyStrikes(ctx, product);
  brushedMetal(ctx);

  // ---- halo behind the wordmark ---------------------------------------
  const halo = ctx.createRadialGradient(W / 2, 452, 30, W / 2, 452, 640);
  halo.addColorStop(0, withAlpha(product.accent, 0.34));
  halo.addColorStop(0.45, withAlpha(product.accent, 0.12));
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // ---- top & bottom bands ---------------------------------------------
  band(ctx, product, 0, 92, false);
  band(ctx, product, H - 108, 108, true);

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `600 22px ${FONT}`;
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 232;
    ctx.fillText("N E X O   E N E R G Y", x, 58);
    ctx.fillText("N E X O   E N E R G Y", x, H - 58);
  }
  ctx.restore();

  // ---- front label (canvas centre = can front, +Z) ---------------------
  const cx = W / 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `600 30px ${FONT}`;
  drawSpaced(ctx, "ENERGY DRINK", cx, 208, 16);

  ctx.fillStyle = withAlpha(product.accent, 0.9);
  ctx.fillRect(cx - 190, 236, 380, 3);

  // wordmark
  ctx.shadowColor = withAlpha(product.accent, 0.55);
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 178px ${FONT}`;
  drawSpaced(ctx, product.nameLines[0], cx, 404, 6);

  ctx.shadowColor = withAlpha(product.accent2, 0.5);
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 10;
  ctx.font = `800 178px ${FONT}`;
  drawSpaced(ctx, product.nameLines[1], cx, 578, 6);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // accent underline
  const bar = ctx.createLinearGradient(cx - 260, 0, cx + 260, 0);
  bar.addColorStop(0, withAlpha(product.accent, 0));
  bar.addColorStop(0.5, withAlpha(product.accent, 1));
  bar.addColorStop(1, withAlpha(product.accent, 0));
  ctx.fillStyle = bar;
  ctx.fillRect(cx - 260, 636, 520, 9);

  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = `600 44px ${FONT}`;
  drawSpaced(ctx, product.name.split(" ")[0], cx, 716, 14);

  ctx.fillStyle = "rgba(255,255,255,0.46)";
  ctx.font = `400 27px ${FONT}`;
  drawSpaced(ctx, "ZERO SUGAR  ·  160MG CAFFEINE  ·  330 ML", cx, 778, 8);

  // flavour seal
  ctx.strokeStyle = withAlpha(product.accent2, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, 856, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = withAlpha(product.accent2, 0.95);
  ctx.font = `700 30px ${FONT}`;
  drawSpaced(ctx, product.code.replace("NX-", ""), cx, 866, 2);
  ctx.restore();

  // ---- back artwork (wraps the seam) ----------------------------------
  drawWrapped(ctx, 0, (c, x) => {
    c.save();
    c.textAlign = "center";

    // badge
    c.strokeStyle = withAlpha(product.accent, 0.6);
    c.lineWidth = 3;
    c.beginPath();
    c.arc(x, 330, 108, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(x, 330, 96, 0, Math.PI * 2);
    c.strokeStyle = withAlpha(product.accent, 0.18);
    c.stroke();

    c.fillStyle = "#ffffff";
    c.font = `800 74px ${FONT}`;
    c.fillText("NEXO", x, 312);
    c.fillStyle = withAlpha(product.accent2, 0.95);
    c.font = `600 26px ${FONT}`;
    drawSpaced(c, "ENERGY", x, 356, 12);
    c.fillStyle = "rgba(255,255,255,0.4)";
    c.font = `400 22px ${FONT}`;
    c.fillText("SINCE 2019", x, 396);

    // nutrition block
    c.textAlign = "left";
    const bx = x - 190;
    const rows: [string, string][] = [
      ["ENERGY", "12 kcal"],
      ["CAFFEINE", "160 mg"],
      ["SUGAR", "0 g"],
      ["VITAMIN B3", "8 mg"],
      ["VOLUME", "330 ml"],
    ];
    c.fillStyle = "rgba(255,255,255,0.5)";
    c.font = `600 24px ${FONT}`;
    c.fillText("NUTRITION / 100 ML", bx, 510);
    c.fillStyle = withAlpha(product.accent, 0.8);
    c.fillRect(bx, 524, 380, 2);

    rows.forEach((row, i) => {
      const y = 570 + i * 46;
      c.fillStyle = "rgba(255,255,255,0.55)";
      c.font = `400 24px ${FONT}`;
      c.fillText(row[0], bx, y);
      c.fillStyle = "rgba(255,255,255,0.9)";
      c.font = `600 24px ${FONT}`;
      c.textAlign = "right";
      c.fillText(row[1], bx + 380, y);
      c.textAlign = "left";
    });

    // barcode-ish detail
    let bx2 = x - 150;
    for (let i = 0; i < 34; i++) {
      const w = i % 3 === 0 ? 7 : 3;
      c.fillStyle = `rgba(255,255,255,${0.25 + (i % 4) * 0.18})`;
      c.fillRect(bx2, 830, w, 74);
      bx2 += w + 6;
    }
    c.fillStyle = "rgba(255,255,255,0.32)";
    c.font = `400 18px ${FONT}`;
    c.fillText("4 789012 345678", x - 150, 936);
    c.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// ---------------------------------------------------------------------------
const cache = new Map<number, THREE.CanvasTexture>();

export function getLabelTexture(index: number): THREE.CanvasTexture {
  let tex = cache.get(index);
  if (!tex) {
    tex = createLabelTexture(PRODUCTS[index]);
    cache.set(index, tex);
  }
  return tex;
}

export async function prepareLabelTextures(
  onProgress: (ratio: number) => void,
) {
  // Canvas 2D does not trigger webfont loads by itself — request the exact
  // faces the label artwork needs before drawing anything.
  try {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      await Promise.race([
        Promise.all([
          fonts.load('800 178px "Sora"'),
          fonts.load('600 30px "Sora"'),
          fonts.load('400 27px "Inter"'),
          fonts.ready,
        ]),
        new Promise((r) => setTimeout(r, 2600)),
      ]);
    }
  } catch {
    /* ignore */
  }
  onProgress(0.1);
  for (let i = 0; i < PRODUCTS.length; i++) {
    getLabelTexture(i);
    onProgress((i + 1) / PRODUCTS.length);
    await nextFrame();
  }
}

// --------------------------------------------------------------- utilities
export function createRadialTexture(
  size = 256,
  stops: [number, string][] = [
    [0, "rgba(255,255,255,1)"],
    [0.35, "rgba(255,255,255,0.55)"],
    [1, "rgba(255,255,255,0)"],
  ],
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBackdropTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#1b2030");
  g.addColorStop(0.42, "#0c0f18");
  g.addColorStop(0.72, "#06070c");
  g.addColorStop(1, "#030407");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
