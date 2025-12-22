import React from "react";
import Herosection from "./Herosection";
import Painanimage from "./Painanimage";

const Homepage = () => {
  return (
    <div>
      <Herosection />
      <div className=" container mx-auto px-4 bg-primary/5 py-10 my-10 rounded-lg">
        <Painanimage />
      </div>
    </div>
  );
};

export default Homepage;
