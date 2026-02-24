import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Routing from "./Routing";
import LoaderHelper from "./customComponents/Loading/LoaderHelper";
import Loading from "./customComponents/Loading";

function App() {
  return (
    <>
      <Routing />
      <Loading ref={(ref) => LoaderHelper.setLoader(ref)} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 2147483647 }}
      />
    </>
  );
}

export default App;
