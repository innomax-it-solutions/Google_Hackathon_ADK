import { ChatProvider }     from "./context/ChatContext";
import { ThemeProvider }    from "./context/ThemeContext";
import { ToastProvider }    from "./context/ToastContext";
import { LanguageProvider } from "./context/LanguageContext";
import ChatPage             from "./pages/ChatPage";

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <ChatProvider>
            <ChatPage />
          </ChatProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
