/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";

const ImageShow = ({
  src,
  alt,
  className = "",
  width = 0,
  height = 0,
  blurDataURL = "",
}: any) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes="100vw"
      className={className}
    />
  );
};

export default ImageShow;
