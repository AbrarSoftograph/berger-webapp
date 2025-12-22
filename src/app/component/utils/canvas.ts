/* eslint-disable prefer-const */
// canvas.ts
import { MutableRefObject } from "react";
import { getMaskData } from "./api";
import { decompressMask } from "@/app/lib/decompressMask";

/**
 * Draw points and connecting lines on canvas
 * @param canvas - HTMLCanvasElement
 * @param imageUrl - base image URL
 * @param points - array of [x, y] points
 */
export function drawPointsOnCanvas(
  canvas: HTMLCanvasElement,
  imageUrl: string,
  points: number[][]
) {
  if (!canvas || !imageUrl) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = "#00ff00";
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;

    points.forEach(([x, y], idx) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "14px Arial";
      ctx.fillText(`${idx + 1}`, x + 8, y + 5);
      ctx.fillStyle = "#00ff00";
    });

    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    }
  };

  img.src = `${imageUrl}?t=${Date.now()}`;
}

/**
 * Highlight segment on canvas using cached or fetched mask
 */
export async function highlightSegment(
  sessionId: string,
  index: number,
  canvas: HTMLCanvasElement,
  baseImageCache: MutableRefObject<ImageData | null>,
  maskCache: MutableRefObject<Record<number, boolean[][]>>,
  count?: number
) {
  // Use cache if exists
  if (maskCache.current && maskCache.current[index]) {
    applyMaskHighlight(
      maskCache.current[index],
      canvas,
      baseImageCache.current!,
      "rgba(117, 115, 114, 0.1)",
      "rgba(0, 173, 239, 0.38)",
      2,
      "dashed",
      6,
      "rgba(0, 173, 239, 0.38)"
    );
    return;
  }

  try {
    const data = await getMaskData(sessionId, index);
    if (!maskCache.current) maskCache.current = {};
    maskCache.current[index] = decompressMask(data.mask, data.shape);
    applyMaskHighlight(
      maskCache.current[index],
      canvas,
      baseImageCache.current!,
      "rgba(117, 115, 114, 0.1)",
      "rgba(0, 173, 239, 0.38)",
      2,
      "dashed",
      6,
      "rgba(0, 173, 239, 0.38)"
    );
    if (Object.keys(maskCache.current).length === (count || 0)) {
      applyAllMaskHighlight(
        maskCache.current,
        canvas,
        baseImageCache,
        "rgba(117, 115, 114, 0.1)",
        "rgba(0, 173, 239, 0.38)",
        2,
        "dashed",
        6,
        "rgba(0, 173, 239, 0.38)"
      );
    }
  } catch (err) {
    console.error("Failed to highlight segment", err);
  }
}

/**
 * Apply mask overlay on canvas
 */
export function applyMaskHighlight(
  mask: boolean[][],
  canvas: HTMLCanvasElement,
  baseImage: ImageData,
  highlightColor: string,
  borderColor?: string,
  borderThickness: number = 1,
  borderStyle: "solid" | "dashed" = "solid",
  dashLength: number = 4,
  glowColor?: string,
  glowSize: number = 6,
  glowIntensity: number = 0.4
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  const imgData = new ImageData(
    new Uint8ClampedArray(baseImage.data),
    baseImage.width,
    baseImage.height
  );
  const data = imgData.data;

  function parseColor(css: string) {
    const m = css.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\s*\)/
    );
    if (!m) return null;
    return [
      parseInt(m[1], 10),
      parseInt(m[2], 10),
      parseInt(m[3], 10),
      m[4] ? parseFloat(m[4]) : 1,
    ] as const;
  }

  const hc = parseColor(highlightColor);
  if (!hc) return;

  const [hr, hg, hb, ha] = hc;
  const blendAmount = 0.6 * ha;

  // Apply highlight
  for (let y = 0; y < h; y++) {
    const row = mask[y];
    if (!row) continue;

    for (let x = 0; x < w; x++) {
      if (!row[x]) continue;

      const k = (y * w + x) * 4;

      data[k] = data[k] * (1 - blendAmount) + hr * blendAmount;
      data[k + 1] = data[k + 1] * (1 - blendAmount) + hg * blendAmount;
      data[k + 2] = data[k + 2] * (1 - blendAmount) + hb * blendAmount;
    }
  }

  // ✔------ BORDER DRAWING ------✔
  if (borderColor && borderThickness > 0) {
    const bc = parseColor(borderColor);
    if (!bc) return;

    const [br, bg, bb, ba] = bc;

    // Detect border pixels
    const borderMask: boolean[][] = Array.from({ length: h }, () =>
      Array(w).fill(false)
    );

    for (let y = 0; y < h; y++) {
      const row = mask[y];
      if (!row) continue;

      for (let x = 0; x < w; x++) {
        if (!row[x]) continue;

        const up = y > 0 && mask[y - 1]?.[x];
        const down = y < h - 1 && mask[y + 1]?.[x];
        const left = x > 0 && row[x - 1];
        const right = x < w - 1 && row[x + 1];

        if (!(up && down && left && right)) borderMask[y][x] = true;
      }
    }

    // Apply dashed effect
    let counter = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!borderMask[y][x]) continue;

        const onDash =
          borderStyle === "solid"
            ? true
            : Math.floor(counter / dashLength) % 2 === 0;

        counter++;

        if (!onDash) continue;

        const baseAlpha = ba;

        for (let t = 0; t < borderThickness; t++) {
          const yy = y + t;
          const xx = x + t;
          if (yy >= h || xx >= w) continue;

          const k = (yy * w + xx) * 4;

          data[k] = br * baseAlpha + data[k] * (1 - baseAlpha);
          data[k + 1] = bg * baseAlpha + data[k + 1] * (1 - baseAlpha);
          data[k + 2] = bb * baseAlpha + data[k + 2] * (1 - baseAlpha);
        }
      }
    }

    // ✔------ BORDER GLOW (OUTER GLOW) ------✔
    if (glowColor && glowSize > 0) {
      const gc = parseColor(glowColor);
      if (gc) {
        const [gr, gg, gb, ga] = gc;
        const glowMask = new Float32Array(w * h); // stores glow strength around borders

        // 1) Collect border coordinates for glow spreading
        const borderPixels: [number, number][] = [];
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (borderMask?.[y]?.[x]) {
              borderPixels.push([x, y]);
            }
          }
        }

        // 2) Spread glow outward using distance falloff
        for (const [bx, by] of borderPixels) {
          for (let dy = -glowSize; dy <= glowSize; dy++) {
            for (let dx = -glowSize; dx <= glowSize; dx++) {
              const xx = bx + dx;
              const yy = by + dy;

              if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;

              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > glowSize) continue;

              const falloff = (1 - dist / glowSize) * glowIntensity * ga;
              const idx = yy * w + xx;

              glowMask[idx] = Math.max(glowMask[idx], falloff);
            }
          }
        }

        // 3) Apply glow to pixel data
        for (let i = 0; i < glowMask.length; i++) {
          const a = glowMask[i];
          if (a <= 0) continue;

          const k = i * 4;

          data[k] = gr * a + data[k] * (1 - a);
          data[k + 1] = gg * a + data[k + 1] * (1 - a);
          data[k + 2] = gb * a + data[k + 2] * (1 - a);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Convert mouse event to canvas coordinates
 */
export function getCanvasCoordinates(
  event: MouseEvent,
  canvas: HTMLCanvasElement
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

/**
 * Redraw canvas base image and return ImageData
 */
export function redrawCanvas(
  canvas: HTMLCanvasElement,
  imageUrl: string
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    if (!canvas) return reject("Canvas not found");
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject("Canvas context not found");

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = reject;
    img.src = `${imageUrl}?t=${Date.now()}`;
  });
}

export function downloadCanvasImage(
  canvas: HTMLCanvasElement,
  filename = "Berger360_Result.png"
) {
  if (!canvas) {
    console.error("No canvas available for download");
    return;
  }

  try {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to download image");
  }
}

export function applyColorfn(
  mask: boolean[][],
  canvas: HTMLCanvasElement,
  baseImageCache: React.MutableRefObject<ImageData | null>,
  color: string, // e.g., "rgba(255,0,0,0.7)"
  borderColor?: string,
  borderThickness: number = 0,
  glowColor?: string,
  glowSize: number = 0,
  glowIntensity: number = 0.4
) {
  console.log("Applying color:", mask, color, baseImageCache.current, canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (!baseImageCache.current) {
    console.error("Base image missing in cache");
    return;
  }

  const w = canvas.width;
  const h = canvas.height;

  // Clone base image
  const imgData = new ImageData(
    new Uint8ClampedArray(baseImageCache.current.data),
    baseImageCache.current.width,
    baseImageCache.current.height
  );
  const data = imgData.data;

  // Helper: parse "rgba(r,g,b,a)" into numeric array
  function parseColor(css: string) {
    const m = css.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\s*\)/
    );
    if (!m) return null;
    return [
      parseInt(m[1], 10),
      parseInt(m[2], 10),
      parseInt(m[3], 10),
      m[4] ? parseFloat(m[4]) : 1,
    ] as const;
  }

  const parsed = parseColor(color);
  if (!parsed) return;
  const [cr, cg, cb, ca] = parsed;
  const blendAmount = ca;

  // Step 1: Apply color to mask pixels
  for (let y = 0; y < h; y++) {
    const row = mask[y];
    if (!row) continue;
    for (let x = 0; x < w; x++) {
      if (!row[x]) continue;
      const k = (y * w + x) * 4;
      data[k] = data[k] * (1 - blendAmount) + cr * blendAmount;
      data[k + 1] = data[k + 1] * (1 - blendAmount) + cg * blendAmount;
      data[k + 2] = data[k + 2] * (1 - blendAmount) + cb * blendAmount;
    }
  }

  // Step 2: Draw intermediate result
  ctx.putImageData(imgData, 0, 0);

  // Step 3: Apply border or glow directly using canvas compositing
  if (borderColor || glowColor) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    // Draw border
    if (borderColor && borderThickness > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderThickness;
      for (let y = 0; y < h; y++) {
        const row = mask[y];
        if (!row) continue;
        for (let x = 0; x < w; x++) {
          if (!row[x]) continue;

          // Draw 1px rectangle around pixel
          ctx.strokeRect(
            x - borderThickness / 2,
            y - borderThickness / 2,
            borderThickness,
            borderThickness
          );
        }
      }
    }

    // Draw glow
    if (glowColor && glowSize > 0) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowSize;
      ctx.globalAlpha = glowIntensity;

      for (let y = 0; y < h; y++) {
        const row = mask[y];
        if (!row) continue;
        for (let x = 0; x < w; x++) {
          if (!row[x]) continue;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Reset shadow and alpha
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // Step 4: Update base cache
  baseImageCache.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function applyAllMaskHighlight(
  masks: Record<number, boolean[][]>,
  canvas: HTMLCanvasElement,
  baseImage: MutableRefObject<ImageData | null>,
  highlightColor: string,
  borderColor?: string,
  borderThickness: number = 1,
  borderStyle: "solid" | "dashed" = "solid",
  dashLength: number = 4,
  glowColor?: string,
  glowSize: number = 6,
  glowIntensity: number = 0.4
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const data = new Uint8ClampedArray(baseImage.current!.data); // copy

  // Parse color helper
  const parseColor = (css: string) => {
    const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (!m) return null;
    return [
      parseInt(m[1], 10),
      parseInt(m[2], 10),
      parseInt(m[3], 10),
      m[4] ? parseFloat(m[4]) : 1,
    ] as const;
  };

  const hc = parseColor(highlightColor);
  if (!hc) return;
  const [hr, hg, hb, ha] = hc;
  const blendAmount = 0.6 * ha;

  // --- HIGHLIGHT ---
  for (const mask of Object.values(masks)) {
    for (let y = 0; y < h; y++) {
      const row = mask[y];
      if (!row) continue;
      for (let x = 0; x < w; x++) {
        if (!row[x]) continue;
        const k = (y * w + x) * 4;
        data[k] = data[k] * (1 - blendAmount) + hr * blendAmount;
        data[k + 1] = data[k + 1] * (1 - blendAmount) + hg * blendAmount;
        data[k + 2] = data[k + 2] * (1 - blendAmount) + hb * blendAmount;
      }
    }
  }

  // --- BORDER & GLOW ---
  let borderMask: boolean[][] = Array.from({ length: h }, () =>
    Array(w).fill(false)
  );
  if (borderColor && borderThickness > 0) {
    const bc = parseColor(borderColor);
    if (!bc) return;
    const [br, bg, bb, ba] = bc;

    for (const mask of Object.values(masks)) {
      for (let y = 0; y < h; y++) {
        const row = mask[y];
        if (!row) continue;
        for (let x = 0; x < w; x++) {
          if (!row[x]) continue;

          const up = y > 0 && mask[y - 1]?.[x];
          const down = y < h - 1 && mask[y + 1]?.[x];
          const left = x > 0 && row[x - 1];
          const right = x < w - 1 && row[x + 1];

          if (!(up && down && left && right)) borderMask[y][x] = true;
        }
      }
    }

    for (let y = 0; y < h; y++) {
      let dashCounter = 0;
      for (let x = 0; x < w; x++) {
        if (!borderMask[y][x]) continue;
        const onDash =
          borderStyle === "solid"
            ? true
            : Math.floor(dashCounter / dashLength) % 2 === 0;
        dashCounter++;
        if (!onDash) continue;

        for (let ty = 0; ty < borderThickness; ty++) {
          for (let tx = 0; tx < borderThickness; tx++) {
            const yy = y + ty;
            const xx = x + tx;
            if (yy >= h || xx >= w) continue;
            const k = (yy * w + xx) * 4;
            data[k] = br * ba + data[k] * (1 - ba);
            data[k + 1] = bg * ba + data[k + 1] * (1 - ba);
            data[k + 2] = bb * ba + data[k + 2] * (1 - ba);
          }
        }
      }
    }
  }

  // --- GLOW ---
  if (glowColor && glowSize > 0 && borderMask.length) {
    const gc = parseColor(glowColor);
    if (gc) {
      const [gr, gg, gb, ga] = gc;
      const glowMask = new Float32Array(w * h);
      const borderPixels: [number, number][] = [];

      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          if (borderMask[y][x]) borderPixels.push([x, y]);

      for (const [bx, by] of borderPixels) {
        for (let dy = -glowSize; dy <= glowSize; dy++) {
          for (let dx = -glowSize; dx <= glowSize; dx++) {
            const xx = bx + dx;
            const yy = by + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > glowSize) continue;
            const falloff = (1 - dist / glowSize) * glowIntensity * ga;
            const idx = yy * w + xx;
            glowMask[idx] = Math.max(glowMask[idx], falloff);
          }
        }
      }

      for (let i = 0; i < glowMask.length; i++) {
        const a = glowMask[i];
        if (a <= 0) continue;
        const k = i * 4;
        data[k] = gr * a + data[k] * (1 - a);
        data[k + 1] = gg * a + data[k + 1] * (1 - a);
        data[k + 2] = gb * a + data[k + 2] * (1 - a);
      }
    }
  }

  ctx.putImageData(new ImageData(data, w, h), 0, 0);
}
