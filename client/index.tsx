import "sanitize.css";
import "./style.scss";
import { setLogLevel, original } from "./utils/logger";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "mobx-react";
import { stores } from "./stores";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { ErrorBoundary } from "react-error-boundary";
import { SnackbarProvider } from "notistack";
import { App } from "./containers/app";
import { Catch } from "./components/catch";
import { Loading } from "./containers/loading";

original.info("%c" + `ping-checker | Web Client`, "font-size: 32px; color: #90CAF9");
original.info("%c" + `hash: ${import.meta.env.VITE_GIT_HASH || "-"}`, "font-size: 22px; color: #F48FB1");

setLogLevel((import.meta.env.VITE_LOG_LEVEL as any) || "silly");

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

createRoot(document.querySelector("#app")!).render(
  <ErrorBoundary FallbackComponent={Catch}>
    <Provider {...stores}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={5}
          autoHideDuration={5000}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          preventDuplicate
        >
          <App />
          <Loading />
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  </ErrorBoundary>,
);