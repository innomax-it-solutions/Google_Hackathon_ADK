import { useEffect, useRef } from "react";
import MessageBubble from "../MessageBubble/MessageBubble";

export default function ChatWindow({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto"
      role="log"
      aria-live="polite"
      aria-label="Conversation"
    >
      <div className="max-w-chat mx-auto py-8 space-y-7">
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
          />
        ))}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
}
