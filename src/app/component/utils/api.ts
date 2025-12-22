/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export type UploadResponse = {
  success: boolean;
  url: string;
  session_id?: string;
};
export type MaskDataResponse = { mask: string; shape: [number, number] };
export type GenericResponse = { error?: string; [key: string]: any };

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function autoSegment(sessionId: string): Promise<GenericResponse> {
  const response = await fetch(`${API_BASE}/auto_segment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Segmentation failed");
  }
  return response.json();
}

export async function detectSegment(
  sessionId: string,
  x: number,
  y: number
): Promise<any> {
  const response = await fetch(`${API_BASE}/detect_segment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      x: Math.floor(x),
      y: Math.floor(y),
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Detection failed");
  }
  return response.json();
}

export async function getMaskData(
  sessionId: string,
  index: number
): Promise<MaskDataResponse> {
  const response = await fetch(`${API_BASE}/mask_data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, index }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Mask data fetch failed");
  }

  return response.json();
}

export async function applyColor(
  sessionId: string,
  index: number,
  color: string
): Promise<GenericResponse> {
  const response = await fetch(`${API_BASE}/recolor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, index, color }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Recolor failed");
  }
  return response.json();
}

export async function deleteSegment(
  sessionId: string,
  index: number
): Promise<GenericResponse> {
  const response = await fetch(`${API_BASE}/delete_segment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, index }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Delete failed");
  }
  return response.json();
}

export async function polygonSegment(
  sessionId: string,
  points: [number, number][]
): Promise<any> {
  const response = await fetch(`${API_BASE}/polygon_prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, points }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Polygon segmentation failed");
  }
  return response.json();
}
