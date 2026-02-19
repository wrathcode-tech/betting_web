import React from "react";
import "./App.css";
import Routing from "./Routing";
import LoaderHelper from "./customComponents/Loading/LoaderHelper";
import Loading from "./customComponents/Loading";

function App() {
  return (
    <>
      <Routing />
      <Loading ref={ref => LoaderHelper.setLoader(ref)} />
    </>
  );
}

export default App;
