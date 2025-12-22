/* eslint-disable react-hooks/immutability */
"use client";

import { useRef, useEffect, MouseEvent, useState } from "react";
import { detectSegment } from "../../utils/api";
import { applyAllMaskHighlight, highlightSegment } from "../../utils/canvas";
import { Download } from "lucide-react";

type CanvasProps = {
  currentResultUrl: string | null;
  currentSessionId: string | null;
  isDrawingMode: boolean;
  selectedPoints: number[][];
  setSelectedPoints: (points: number[][]) => void;
  selectedIdx: number | null;
  segmentsCount: number;
  maskCache: React.MutableRefObject<Record<number, boolean[][]>>;
  baseImageCache: React.MutableRefObject<ImageData | null>;
  onSegmentSelect: (idx: number) => void;
  onHighlightSegment: (idx: number) => void;
  canvasRefStatecopy: React.MutableRefObject<HTMLCanvasElement | null>;
  handleDownload: () => void;
};

export default function Canvas({
  currentResultUrl,
  currentSessionId,
  isDrawingMode,
  selectedPoints,
  setSelectedPoints,
  selectedIdx,
  segmentsCount,
  maskCache,
  baseImageCache,
  onSegmentSelect,
  onHighlightSegment,
  canvasRefStatecopy,
  handleDownload,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [allSegmentsLoaded, setAllSegmentsLoaded] = useState(false);

  useEffect(() => {
    if (canvasRef) {
      canvasRefStatecopy.current = canvasRef.current;
    }
  }, [canvasRef]);

  const allsegmentpassed = async (count: number) => {
    setLoading(true);
    for (let i = 0; i < count; i++) {
      onSegmentSelect(i);
      await highlightSegment(
        currentSessionId as string,
        i,
        canvasRef.current as HTMLCanvasElement,
        baseImageCache,
        maskCache,
        count
      );
    }
    setLoading(false);
    setAllSegmentsLoaded(true);
  };

  // ----------------------------
  // Load base image into canvas
  // ----------------------------
  useEffect(() => {
    if (!currentResultUrl || !canvasRef.current) return;

    allsegmentpassed(segmentsCount);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      //Cache the base image
      baseImageCache.current = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
    };
    img.src = `${currentResultUrl}?t=${Date.now()}`;
  }, [currentResultUrl, baseImageCache]);

  // ----------------------------
  // Draw points on canvas (drawing mode)
  // ----------------------------

  // ----------------------------
  // Handle canvas clicks
  // ----------------------------
  const handleCanvasClick = async (e: MouseEvent<HTMLCanvasElement>) => {
    if (!currentSessionId || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isDrawingMode) {
      setSelectedPoints([...selectedPoints, [x, y]]);
      return;
    }

    // Segment detection mode
    try {
      const { index } = await detectSegment(
        currentSessionId,
        Math.floor(x),
        Math.floor(y)
      );
      if (index !== -1) {
        onSegmentSelect(index);
        await highlightSegment(
          currentSessionId,
          index,
          canvas,
          baseImageCache,
          maskCache
        );
        onHighlightSegment(index);
      } else {
        alert("No segment found at this point.");
      }
    } catch (err) {
      console.error("Segment detection failed:", err);
    }
  };

  // ----------------------------
  // Draw points + connecting lines
  // ----------------------------
  function drawPoints() {
    // <-- normal function declaration
    if (!canvasRef.current || !currentResultUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      ctx.fillStyle = "#00ff00";
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;

      selectedPoints.forEach(([x, y], idx) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        ctx.fillText(`${idx + 1}`, x + 8, y + 5);
        ctx.fillStyle = "#00ff00";
      });

      if (selectedPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(selectedPoints[0][0], selectedPoints[0][1]);
        for (let i = 1; i < selectedPoints.length; i++) {
          ctx.lineTo(selectedPoints[i][0], selectedPoints[i][1]);
        }
        ctx.stroke();
      }
    };

    img.src = `${currentResultUrl}?t=${Date.now()}`;
  }

  useEffect(() => {
    if (!isDrawingMode || !currentResultUrl || !canvasRef.current) return;
    drawPoints();
  }, [selectedPoints, isDrawingMode, currentResultUrl]);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="mb-6">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          id="resultCanvas"
          onClick={handleCanvasClick}
          className={`max-w-full h-auto cursor-${
            isDrawingMode ? "crosshair" : "pointer"
          }`}
          style={{ display: currentResultUrl ? "block" : "none" }}
        />
        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-white font-bold flex text-sm flex-col items-center gap-2">
              <span className="loading loading-infinity loading-md"></span>
              Loading Segment...
            </div>
          </div>
        )}
        <button onClick={handleDownload} className="absolute top-4 right-4 ">
          <Download className="w-10 h-10 text-white bg-black/50 p-2 rounded-lg hover:text-secondary cursor-pointer" />
        </button>
      </div>
    </div>
  );
}
