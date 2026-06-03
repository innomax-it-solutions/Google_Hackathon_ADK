import { useState } from "react";
import { useChatContext } from "../../context/ChatContext";
import { useToast }       from "../../context/ToastContext";
import { Button }         from "../ui/button";
import { Tooltip }        from "../ui/tooltip";

export default function MessageActions({ message, isLast, align = "left" }) {
  const { regenerate, isStreaming } = useChatContext();
  const { toast }                   = useToast();
  const [liked,    setLiked]    = useState(false);
  const [disliked, setDisliked] = useState(false);

  if (message.status === "streaming" || message.status === "error") return null;

  function copy() {
    navigator.clipboard.writeText(message.content).then(() => {
      toast({ title: "Copied to clipboard", variant: "success" });
    });
  }

  function handleRegenerate() {
    regenerate();
    toast({ title: "Regenerating response…", variant: "info" });
  }

  function handleLike() {
    setLiked(v => !v);
    setDisliked(false);
    if (!liked) toast({ title: "Feedback received", description: "Thanks for the positive feedback." });
  }

  function handleDislike() {
    setDisliked(v => !v);
    setLiked(false);
    if (!disliked) toast({ title: "Feedback received", description: "We'll use this to improve responses." });
  }

  return (
    <div className={`
      flex items-center gap-0.5 mt-2
      opacity-0 group-hover:opacity-100 transition-opacity duration-150
      ${align === "right" ? "justify-end" : "justify-start"}
    `}>
      {/* Copy */}
      <Tooltip content="Copy" side="bottom">
        <Button variant="ghost" size="icon-sm" onClick={copy}>
          <CopyIcon />
        </Button>
      </Tooltip>

      {/* Regenerate — only on last assistant message */}
      {message.role === "assistant" && isLast && !isStreaming && (
        <Tooltip content="Regenerate" side="bottom">
          <Button variant="ghost" size="icon-sm" onClick={handleRegenerate}>
            <RefreshIcon />
          </Button>
        </Tooltip>
      )}

      {/* Like / Dislike — assistant messages only */}
      {message.role === "assistant" && (
        <>
          <Tooltip content={liked ? "Liked" : "Good response"} side="bottom">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLike}
              className={liked ? "text-emerald-500 hover:text-emerald-600" : ""}
            >
              <ThumbUpIcon filled={liked} />
            </Button>
          </Tooltip>

          <Tooltip content={disliked ? "Disliked" : "Bad response"} side="bottom">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDislike}
              className={disliked ? "text-red-500 hover:text-red-600" : ""}
            >
              <ThumbDownIcon filled={disliked} />
            </Button>
          </Tooltip>
        </>
      )}

      {/* Timestamp */}
      <span className="ml-1.5 text-[11px] text-[var(--color-text-tertiary)] select-none tabular-nums">
        {new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

/* ── Icons ── */
const CopyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const RefreshIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const ThumbUpIcon = ({ filled }) =>
  filled ? (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3m7-10l-4 10v12h9.3a2 2 0 001.93-1.48l1.7-7A2 2 0 0022.7 9H16V4a2 2 0 00-2-2z" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  );
const ThumbDownIcon = ({ filled }) =>
  filled ? (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 2H20a2 2 0 012 2v7a2 2 0 01-2 2h-3M10 22l4-10V0H4.7a2 2 0 00-1.93 1.48l-1.7 7A2 2 0 003.3 15H10v5a2 2 0 002 2z" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
    </svg>
  );
