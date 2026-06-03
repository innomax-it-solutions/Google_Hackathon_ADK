import { ChatProvider }   from "./context/ChatContext";
import { ThemeProvider }  from "./context/ThemeContext";
import { ToastProvider }  from "./context/ToastContext";
import ChatPage           from "./pages/ChatPage";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ChatProvider>
          <ChatPage />
        </ChatProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
