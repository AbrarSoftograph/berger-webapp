/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useRef, useState } from "react";
import Seletephoto from "./Seletephoto";
import SampleImage from "./SampleImage";
import ImageShow from "@/app/component/common/image/ImageShow";
import { Backpack, ChevronLeft, X } from "lucide-react";
import PreviewImage from "./PreviewImage";
import {
  applyColor,
  autoSegment,
  deleteSegment,
  polygonSegment,
  uploadImage,
} from "@/app/component/utils/api";
import {
  downloadCanvasImage,
  highlightSegment,
} from "@/app/component/utils/canvas";

const Contain = () => {
  const [screen, setScreen] = useState<number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // -----------------------------
  // State
  // -----------------------------
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentResultUrl, setCurrentResultUrl] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [segmentsCount, setSegmentsCount] = useState<number>(0);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [selectedPoints, setSelectedPoints] = useState<number[][]>([]);
  const [isPolygonComplete, setIsPolygonComplete] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [colorPicker, setColorPicker] = useState<string>("");

  // -----------------------------
  // Refs for cache
  // -----------------------------
  const maskCache = useRef<Record<number, boolean[][]>>({});
  const baseImageCache = useRef<ImageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -----------------------------
  // File upload
  // -----------------------------
  const handleUpload = async (file: File) => {
    if (!file) return alert("Select a file first");
    setUploadProgress(true);
    setScreen(2);
    setStatus("Uploading...");

    try {
      const result = await uploadImage(file);
      setCurrentFile(file);
      setStatus("Upload successful");
      setCurrentSessionId(result.session_id || null);
      await handleAutoSegment(result.session_id || null);
      maskCache.current = {};
      baseImageCache.current = null;
      setSelectedIdx(-1);
      setSelectedPoints([]);
      setIsDrawingMode(false);
      setIsPolygonComplete(false);
    } catch (err) {
      setScreen(1);
      setUploadProgress(false);
      console.log(err);
      alert("Upload failed");
      setStatus("Upload failed");
    }
  };

  // -----------------------------
  // Auto segment
  // -----------------------------
  const handleAutoSegment = async (currentSessionId: string | null) => {
    setStatus("Segmenting...");
    try {
      const result = await autoSegment(
        currentSessionId || currentSessionId || ""
      );
      if (result.error) return alert(result.error);
      selectedIdx === -1 && setSelectedIdx(0);

      setSegmentsCount(result.segments);
      setCurrentResultUrl(result.result_url);

      setStatus(
        `Segmented ${result.segments} masks. Click a segment to highlight it.`
      );

      if (result.result_url !== null) {
        setUploadProgress(false);
      }
    } catch (err) {
      setScreen(1);
      setUploadProgress(false);
      console.error(err);
      alert("Segmentation failed");
      setStatus("Segmentation failed");
    }
  };

  // -----------------------------
  // Apply color
  // -----------------------------
  const handleApplyColor = async () => {
    if (selectedIdx === -1 || !currentSessionId)
      return alert("Select a segment first");

    setStatus("Applying color...");
    try {
      const result = await applyColor(
        currentSessionId,
        selectedIdx,
        colorPicker
      );
      setSelectedIdx(selectedIdx);
      setCurrentResultUrl(result.result_url);
      setStatus("Color applied");
    } catch (err) {
      console.error(err);
      alert("Recolor failed");
      setStatus("Error");
    }
  };

  // -----------------------------
  // Delete segment
  // -----------------------------
  const handleDeleteSegment = async (idx: number) => {
    if (!currentSessionId) return alert("No session active");

    setStatus("Deleting segment...");
    try {
      const result = await deleteSegment(currentSessionId, idx);
      setSegmentsCount(result.segments);
      setCurrentResultUrl(result.result_url);

      maskCache.current = {};
      if (selectedIdx === idx) setSelectedIdx(-1);
      else if (selectedIdx > idx) setSelectedIdx(selectedIdx - 1);

      setStatus(`Segment deleted. ${result.segments} segments remaining.`);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
      setStatus("Error deleting segment");
    }
  };

  // -----------------------------
  // Polygon segmentation
  // -----------------------------
  const handlePolygonSegment = async () => {
    if (!currentSessionId || selectedPoints.length < 3)
      return alert("Need at least 3 points");

    setStatus("Segmenting selected area...");
    setIsDrawingMode(false);

    try {
      const result = await polygonSegment(
        currentSessionId,
        selectedPoints as [number, number][]
      );
      setSegmentsCount(result.segments || 0);
      setCurrentResultUrl(result?.result_url || null);
      maskCache.current = {};
      setSelectedPoints([]);
      setIsPolygonComplete(false);

      let actionMsg = "";
      if (result.action === "merged") {
        actionMsg = `Merged with segment ${result.merged_with_index + 1} (${
          result.overlap_percentage
        }% overlap)`;
      } else {
        actionMsg = `Created new segment ${result.new_index + 1}`;
        if (result.overlap_percentage > 0) {
          actionMsg += ` (${result.overlap_percentage}% overlap, below threshold)`;
        }
      }
      setStatus(actionMsg);
    } catch (err) {
      console.error(err);
      alert("Polygon segmentation failed");
      setSelectedPoints([]);
      setIsPolygonComplete(false);
      setStatus("Polygon segmentation failed");
    }
  };

  // -----------------------------
  // Toggle drawing mode
  // -----------------------------
  const toggleDrawingMode = () => {
    if (isDrawingMode) {
      if (selectedPoints.length >= 3 && !isPolygonComplete)
        handlePolygonSegment();
      else {
        setSelectedPoints([]);
        setIsPolygonComplete(false);
        setIsDrawingMode(false);
        setStatus("Polygon drawing cancelled");
      }
    } else {
      setSelectedPoints([]);
      setIsPolygonComplete(false);
      setIsDrawingMode(true);
      setStatus(
        'Click points to draw polygon. Click "Finish Polygon" when done.'
      );
    }
  };

  // -----------------------------
  // Download result
  // -----------------------------
  // const handleDownload = () => {
  //   if (!canvasRef.current) return alert("No canvas to download");
  //   downloadCanvasImage(canvasRef.current);
  // };

  // -----------------------------
  // Render
  // -----------------------------
  const handleSelectedImage = async (imagePath: string) => {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const file = await new File([blob], "room-1.jpg", { type: blob.type });

    await handleUpload(file);
  };
  const handleOwnImage = async (file: File) => {
    await handleUpload(file);
  };

  return (
    <div className=" relative">
      {screen === 0 && (
        <Seletephoto setScreen={setScreen} handleOwnImage={handleOwnImage} />
      )}
      {screen === 1 && <SampleImage handleSelectedImag={handleSelectedImage} />}
      {screen === 2 && (
        <PreviewImage
          imageFile={currentResultUrl}
          status={status}
          uploadProgress={uploadProgress}
          segmentsCount={segmentsCount}
          baseImageCache={baseImageCache}
          imagefile={imageFile}
          currentSessionId={currentSessionId}
          maskCache={maskCache}
          setSelectedIdx={setSelectedIdx}
          selectedIdx={selectedIdx}
          handleApplyColor={handleApplyColor}
          setColorPicker={setColorPicker}
        />
      )}

      {screen !== 0 && (
        <button
          className="btn btn-circle btn-sm absolute top-2 right-4 transform -translate-y-1/2 bg-primary border-0 hover:bg-primary/80 text-white"
          onClick={() => setScreen((prev) => (prev === 0 ? 0 : prev - 1))}
        >
          <ChevronLeft size={16} />
        </button>
      )}
    </div>
  );
};

export default Contain;
