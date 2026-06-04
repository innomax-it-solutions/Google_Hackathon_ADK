import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider }     from "./context/ChatContext";
import { ThemeProvider }    from "./context/ThemeContext";
import { ToastProvider }    from "./context/ToastContext";
import { LanguageProvider } from "./context/LanguageContext";
import ChatPage             from "./pages/ChatPage";
import FormPage             from "./pages/FormPage";

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <ChatProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/"     element={<ChatPage />} />
                <Route path="/Form" element={<FormPage />} />
              </Routes>
            </BrowserRouter>
          </ChatProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
