import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";
import "./styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "./app/providers";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
);
