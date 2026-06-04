import { useChatContext } from "../context/ChatContext";
import Header             from "../components/Header/Header";
import ChatWindow         from "../components/ChatWindow/ChatWindow";
import SuggestedPrompts   from "../components/SuggestedPrompts/SuggestedPrompts";
import Composer           from "../components/Composer/Composer";
import ClarificationPrompt from "../components/ClarificationPrompt/ClarificationPrompt";

export default function ChatPage() {
  const { messages, pendingClarification, submitClarification, dismissClarification } = useChatContext();
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">
      <Header />

      {isEmpty ? <SuggestedPrompts /> : <ChatWindow messages={messages} />}

      {pendingClarification && (
        <ClarificationPrompt
          fields={pendingClarification.fields}
          onComplete={submitClarification}
          onDismiss={dismissClarification}
        />
      )}

      <Composer />
    </div>
  );
}
