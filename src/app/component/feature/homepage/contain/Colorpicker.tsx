"use client";

import useSegmentColors from "@/app/lib/useSegmentColors";
import React, { useState, useRef, useEffect, use } from "react";
import { ColorPicker, IColor, useColor } from "react-color-palette";
import "react-color-palette/css";

interface ColorPickerProps {
  onChange?: (color: IColor) => void;
  className?: string;
  index?: number;
  setSelectedIdx?: (idx: number) => void;
  segmentsCount?: number;
  selectedIdx?: number;
  handleApplyColor?: (index: number, color: string) => Promise<void>;
  setColorPicker?: (color: string) => void;
}

const Colorpicker = ({
  onChange,
  className,
  index,
  setSelectedIdx,
  segmentsCount,
  selectedIdx,
  handleApplyColor,
  setColorPicker,
}: ColorPickerProps) => {
  const colors = useSegmentColors(segmentsCount || 0);
  const [color, setColor] = useColor(colors[index || 0]);
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    setColorPicker?.(color.hex);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full">
      {/* Color Box */}
      <div
        onClick={() => {
          setOpen(true);
          setSelectedIdx?.(index || 0);
        }}
        className="w-full h-14 rounded-xl  shadow cursor-pointer transition-all hover:scale-105 lg:block hidden"
        style={{
          backgroundColor: color.hex,
          border:
            selectedIdx === index ? "3px solid rgba(0, 0, 0, 0.12)" : "none",
          boxShadow:
            selectedIdx === index
              ? "rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px"
              : "none",
        }}
      />

      {/* Popup */}
      {open && (
        <div
          ref={pickerRef}
          className="absolute w-fit z-10 mt-3 p-3 bg-white rounded-xl shadow-lg  animate-fade"
        >
          <ColorPicker
            color={color}
            onChange={(newColor) => {
              setColor(newColor);
              onChange?.(newColor);
              setColorPicker?.(newColor.hex);
            }}
            hideInput={["hsv", "rgb"]}
            height={100}
          />
          <button
            className="mt-3  w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/80 transition"
            onClick={() => {
              handleApplyColor?.(index || 0, color.hex);
              setOpen(false);
            }}
          >
            Select Color
          </button>
        </div>
      )}
      <button
        className="btn lg:hidden w-full h-14 rounded-xl  shadow cursor-pointer transition-all hover:scale-105"
        style={{ backgroundColor: color.hex }}
        onClick={() => {
          setSelectedIdx?.(index || 0);
          const dialog = document.getElementById(
            `color-picker-modal-${index}`
          ) as HTMLDialogElement;
          dialog.showModal();
        }}
      ></button>

      <dialog id={`color-picker-modal-${index}`} className="modal">
        <div className="absolute w-96 z-10 mt-3 p-3 bg-white rounded-xl shadow-lg  animate-fade">
          <ColorPicker
            color={color}
            onChange={setColor}
            hideInput={["hsv", "rgb"]}
            height={180}
          />
          <button
            className="mt-3  w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/80 transition"
            onClick={() => {
              handleApplyColor?.(index || 0, color.hex);
              const dialog = document.getElementById(
                `color-picker-modal-${index}`
              ) as HTMLDialogElement;
              dialog.close();
            }}
          >
            Select Color
          </button>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default Colorpicker;
