import { useChatContext } from "../context/ChatContext";
import Header           from "../components/Header/Header";
import ChatWindow       from "../components/ChatWindow/ChatWindow";
import SuggestedPrompts from "../components/SuggestedPrompts/SuggestedPrompts";
import Composer         from "../components/Composer/Composer";

export default function ChatPage() {
  const { messages } = useChatContext();
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">
      <Header />

      {isEmpty ? <SuggestedPrompts /> : <ChatWindow messages={messages} />}

      <Composer />
    </div>
  );
}
