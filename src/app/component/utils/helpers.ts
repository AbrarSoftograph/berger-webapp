/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/helpers.ts

export function generateSegmentColor(index?: number): string {
  if (index != null) {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue},70%,60%)`;
  }
  const r = Math.floor(90 + Math.random() * 120);
  const g = Math.floor(90 + Math.random() * 120);
  const b = Math.floor(90 + Math.random() * 120);
  return `rgb(${r},${g},${b})`;
}

export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function debounce<F extends (...args: any[]) => void>(
  func: F,
  wait: number
) {
  let timeout: NodeJS.Timeout;
  return function executed(...args: Parameters<F>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<F extends (...args: any[]) => void>(
  func: F,
  limit: number
) {
  let inThrottle: boolean;
  return function (...args: Parameters<F>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function formatStatusMessage(
  message: string,
  type: "success" | "error" | "info" | "warning" = "info"
) {
  const colors = {
    success: "#9ef5c7",
    error: "#f59e9e",
    info: "#ffffff",
    warning: "#f5d69e",
  };
  return `<span style="color:${colors[type] || colors.info}">${message}</span>`;
}

export function validatePolygon(points: [number, number][]): {
  valid: boolean;
  message: string;
} {
  if (points.length < 3)
    return { valid: false, message: "Need at least 3 points" };
  let sign = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i],
      p2 = points[(i + 1) % points.length],
      p3 = points[(i + 2) % points.length];
    const cross =
      (p2[0] - p1[0]) * (p3[1] - p2[1]) - (p2[1] - p1[1]) * (p3[0] - p2[0]);
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign && cross !== 0)
      return { valid: false, message: "Self-intersecting polygon" };
  }
  return { valid: true, message: "Polygon is valid" };
}
