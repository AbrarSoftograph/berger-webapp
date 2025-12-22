/* eslint-disable react-hooks/purity */
import { useMemo } from "react";

const useSegmentColors = (maxSegments: number) => {
  return useMemo(() => {
    const colors: Record<number, string> = {};

    for (let i = 0; i < maxSegments; i++) {
      const r = Math.floor(90 + Math.random() * 120);
      const g = Math.floor(90 + Math.random() * 120);
      const b = Math.floor(90 + Math.random() * 120);
      colors[i] = `rgb(${r}, ${g}, ${b})`;
    }

    return colors;
  }, [maxSegments]);
};

export default useSegmentColors;
