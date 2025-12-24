import ImageShow from "@/app/component/common/image/ImageShow";
import { SquareDashedMousePointer } from "lucide-react";
import React from "react";
interface SampleImageProps {
  handleSelectedImag: (imagePath: string) => void;
}
const SampleImage = ({ handleSelectedImag }: SampleImageProps) => {
  const images = [
    "/media/room-7.avif",
    "/media/room-8.avif",
    "/media/room-9.avif",
    "/media/room-5.jpg",
    "/media/room-6.jpg",
    "/media/room-1.jpg",
  ];
  return (
    <div>
      <div className=" flex flex-col justify-center items-center gap-2">
        <h1 className="lg:text-xl text-lg font-bold text-primary tracking-widest">
          Sample Images
        </h1>
        <p className="lg:text-sm text-xs ">
          Explore our curated selection of room images to visualize paint colors
          in different settings.
        </p>
      </div>
      <div className=" grid lg:grid-cols-3 grid-cols-1 gap-4 lg:mt-10 mt-5">
        {images.map((src, index) => (
          <div
            key={index}
            className="card bg-base-100 shadow-sm cursor-pointer"
          >
            <figure className=" relative">
              <ImageShow
                src={src}
                alt={`Sample Room ${index + 1}`}
                className="w-full h-60 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-primary/5 bg-opacity-0 hover:bg-opacity-30 rounded-lg transition duration-300"></div>
              <button
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-primary font-semibold text-white  px-5 w-fit rounded-lg h-10 cursor-pointer flex items-center gap-2"
                onClick={() => handleSelectedImag(src)}
              >
                <SquareDashedMousePointer size={16} />
                Paint This Room
              </button>
            </figure>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SampleImage;
