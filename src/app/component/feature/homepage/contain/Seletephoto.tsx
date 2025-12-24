import ImageShow from "@/app/component/common/image/ImageShow";
import { Camera } from "lucide-react";
import React from "react";
interface SeletephotoProps {
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  handleOwnImage: (file: File) => void;
}
const Seletephoto = ({ setScreen, handleOwnImage }: SeletephotoProps) => {
  return (
    <div>
      <div className=" flex flex-col justify-center items-center gap-2">
        <h1 className="lg:text-xl text-lg font-bold text-primary tracking-widest">
          Try Your Favorite Colors
        </h1>
        <p className="lg:text-sm text-xs ">
          Upload a photo and experiment with different paint colors to see how
          they transform your space.
        </p>
      </div>

      <div className=" flex lg:flex-row flex-col justify-center gap-6 lg:mt-10 mt-5 items-center">
        <button
          className="card bg-base-100 w-96 shadow-sm text-start cursor-pointer hover:bg-primary/5"
          onClick={() => setScreen(1)}
        >
          <figure>
            <ImageShow
              src="berger/media/room-1.jpg"
              alt="Room Image"
              className="w-full h-60 object-cover"
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title gradient-text-color font-bold tracking-wide">
              Use Our Photo
            </h2>
            <p>
              Explore our curated selection of room images to visualize paint
            </p>
          </div>
        </button>
        <input
          type="file"
          className="hidden"
          id="upload-photo"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              // Call the handler function passed via props
              handleOwnImage(file);
            }
          }}
        />
        <label
          htmlFor="upload-photo"
          className="card bg-base-100 w-96 shadow-sm cursor-pointer text-start hover:bg-primary/5"
        >
          <figure className=" relative">
            <ImageShow
              src="berger/media/upload-file.png"
              alt="Room Image"
              className="w-full h-60 object-contain p-16 bg-black/5"
            />
            <Camera
              size={20}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 rounded-full bg-white  p-2 w-10 h-10 text-primary"
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title gradient-text-color font-bold tracking-wide">
              Upload Your Photo
            </h2>
            <p>
              Upload your own photo to see how different paint colors will look
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default Seletephoto;
