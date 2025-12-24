import React from "react";
import ImageShow from "../image/ImageShow";

const Loading = () => {
  return (
    <div className=" mt-20">
      <ImageShow
        src="media/progress.gif"
        alt="Loading..."
        className="w-40 h-40 mx-auto"
      />
    </div>
  );
};

export default Loading;
