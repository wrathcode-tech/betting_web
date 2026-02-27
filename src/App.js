import React, { lazy, Suspense, memo } from "react";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Routing from "./Routing";

const ToastContainer = lazy(() =>
  import("react-toastify").then((m) => ({ default: m.ToastContainer }))
);

const App = memo(function App() {
  return (
    <>
      <Routing />
      <Suspense fallback={null}>
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
      </Suspense>
    </>
  );
});

export default App;
