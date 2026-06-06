import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider as UIToastProvider } from "./components/ui/Toast";
import { ToastProvider } from "./context/ToastContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ChatProvider } from "./context/ChatContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* Landing/auth toasts (homepage-ui) */}
          <UIToastProvider>
            {/* Chat toasts + language + chat state (our app) */}
            <ToastProvider>
              <LanguageProvider>
                <ChatProvider>
                  <App />
                </ChatProvider>
              </LanguageProvider>
            </ToastProvider>
          </UIToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
