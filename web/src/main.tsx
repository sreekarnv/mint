import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import RouterProvider from "./providers/router.provider.tsx";
import { store } from "./store";
import ThemeProvider from "./providers/theme.provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ReduxProvider store={store}>
        <RouterProvider />
      </ReduxProvider>
    </ThemeProvider>
  </StrictMode>,
);
