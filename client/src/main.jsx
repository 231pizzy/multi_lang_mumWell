import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/context/SessionContext";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import { PageSpinner } from "@/components/PageSpinner";
import "./i18n";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* Suspends briefly while a non-English language file loads. */}
      <Suspense fallback={<PageSpinner />}>
        <ThemeProvider>
          <SessionProvider>
            <App />
            <Toaster richColors closeButton />
          </SessionProvider>
        </ThemeProvider>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
