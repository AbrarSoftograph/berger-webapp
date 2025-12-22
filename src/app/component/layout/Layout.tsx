import React from "react";
import Header from "./Header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div className="  shadow-xl">
        <Header />
      </div>
      {children}
    </div>
  );
};

export default Layout;
