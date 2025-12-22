import React from "react";
import Contain from "./contain/Contain";
import { X } from "lucide-react";

const Painanimage = () => {
  return (
    <div className="tabs tabs-border">
      <input
        type="radio"
        name="my_tabs_2"
        className="tab tab-bordered gradient-text-color tab-active lg:text-lg text-base font-bold"
        aria-label="PAINT AN IMAGE"
      />
      <div className="tab-content p-4">
        <Contain />
      </div>
    </div>
  );
};

export default Painanimage;
