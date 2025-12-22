/* eslint-disable react-hooks/purity */
import ImageShow from "@/app/component/common/image/ImageShow";
import React, { useRef } from "react";
import Colorpicker from "./Colorpicker";
import Loading from "@/app/component/common/loader/Loading";
import Canvas from "@/app/component/common/image/Canvas";
import {
  applyColorfn,
  downloadCanvasImage,
  highlightSegment,
} from "@/app/component/utils/canvas";
interface PreviewImageProps {
  imageFile: string | null;
  status: string;
  uploadProgress: boolean;
  segmentsCount?: number;
  baseImageCache: React.MutableRefObject<ImageData | null>;
  imagefile?: File | null;
  currentSessionId?: string | null;
  maskCache?: React.MutableRefObject<Record<number, boolean[][]>>;
  setSelectedIdx?: React.Dispatch<React.SetStateAction<number>>;
  selectedIdx?: number | null;
  handleApplyColor?: (index: number, color: string) => Promise<void>;
  setColorPicker?: (color: string) => void;
}

const PreviewImage = ({
  imageFile,
  status = "Upload an image to get started",
  uploadProgress,
  segmentsCount = 0,
  baseImageCache,
  imagefile,
  currentSessionId,
  maskCache,
  setSelectedIdx,
  selectedIdx,
  handleApplyColor,
  setColorPicker,
}: PreviewImageProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onSegmentSelect = async (idx: number) => {
    setSelectedIdx?.(idx);
    await highlightSegment(
      currentSessionId as string,
      idx,
      canvasRef.current as HTMLCanvasElement,
      baseImageCache,
      maskCache as React.MutableRefObject<Record<number, boolean[][]>>
    );
  };

  const handleDownload = () => {
    if (!canvasRef.current) return alert("No canvas to download");
    downloadCanvasImage(canvasRef.current);
  };

  return (
    <div>
      <div className=" flex flex-col justify-center items-center gap-2">
        <h1 className="lg:text-xl text-lg font-bold text-primary tracking-widest">
          Paint This Image
        </h1>
        <p className="lg:text-sm text-xs ">
          Preview the selected image and visualize how different paint colors
          can transform its appearance.
        </p>
      </div>
      <div>
        {uploadProgress ? (
          <div className="flex flex-col justify-center items-center h-64">
            <Loading />
            <p className="mt-4 text-black/70">{status}</p>
          </div>
        ) : (
          <>
            {imageFile !== "" && (
              <div className="grid lg:grid-cols-12 grid-cols-1 mt-10 gap-2">
                <div className=" lg:col-span-9">
                  <Canvas
                    currentResultUrl={
                      `${process.env.NEXT_PUBLIC_API_URL}/image` + imageFile ||
                      ""
                    }
                    baseImageCache={baseImageCache}
                    currentSessionId={currentSessionId || null}
                    isDrawingMode={false}
                    selectedPoints={[]}
                    setSelectedPoints={() => {}}
                    selectedIdx={null}
                    segmentsCount={segmentsCount}
                    maskCache={maskCache || { current: {} }}
                    onSegmentSelect={setSelectedIdx || (() => {})}
                    onHighlightSegment={() => {}}
                    canvasRefStatecopy={canvasRef}
                    handleDownload={handleDownload}
                  />
                  {/* <ImageShow
                    src={"http://192.168.68.155:5500" + imageFile || ""}
                    alt="Selected"
                    className="w-full h-auto object-contain  shadow-md"
                  /> */}
                </div>
                <div className="lg:col-span-3 bg-secondary/20 p-3 rounded-lg">
                  <div>
                    <h2 className="font-bold text-lg mb-2 text-black/80">
                      Choose Colors
                    </h2>
                    <div className="mb-4 text-sm text-black/70">
                      Select from the color options below to see how they look
                      on your chosen image.
                    </div>
                  </div>

                  <div className=" grid lg:grid-cols-2 grid-cols-3 gap-4 lg:gap-2 lg:pr-2">
                    {Array.from({ length: segmentsCount }).map((_, index) => {
                      return (
                        <div
                          key={`colorpicker-${index}`}
                          className="flex flex-col items-start gap-2 relative"
                          role="group"
                          aria-label={`Color picker for segment ${index + 1}`}
                        >
                          <p className="font-semibold text-sm  text-black/80truncatew-fulltext-center">
                            Segment {index + 1}
                          </p>
                          <Colorpicker
                            className="w-full"
                            index={index}
                            segmentsCount={segmentsCount}
                            setSelectedIdx={onSegmentSelect}
                            selectedIdx={selectedIdx || 0}
                            handleApplyColor={handleApplyColor}
                            setColorPicker={setColorPicker}
                          />
                        </div>
                      );
                    })}
                    {/* Optional: Image preview */}
                    {/* {imageFile && (
    <div className="lg:mt-4 mt-2 w-full">
      <ImageShow
        src={URL.createObjectURL(imageFile)}
        alt="Selected image preview"
        className="w-full h-auto shadow-md rounded"
      />
    </div>
  )} */}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PreviewImage;
