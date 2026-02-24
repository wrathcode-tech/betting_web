import React from "react";
import { SnackbarProvider } from "notistack";
import { SnackbarUtilsConfigurator } from "./utils/snackbarUtils";
import "./App.css";
import Routing from "./Routing";
import LoaderHelper from "./customComponents/Loading/LoaderHelper";
import Loading from "./customComponents/Loading";

function App() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      autoHideDuration={5000}
      SnackbarProps={{ style: { zIndex: 2147483647 } }}
    >
      <SnackbarUtilsConfigurator />
      <Routing />
      <Loading ref={ref => LoaderHelper.setLoader(ref)} />
    </SnackbarProvider>
  );
}

export default App;
