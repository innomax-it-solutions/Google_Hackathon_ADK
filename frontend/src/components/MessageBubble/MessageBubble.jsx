import { motion } from "framer-motion";
import { renderMarkdown } from "../../utils/formatters";
import MessageActions     from "../MessageActions/MessageActions";
import { MessageAttachments } from "../FileAttachment/FileAttachment";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge }   from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import JourneyPlanCard   from "../JourneyPlanCard/JourneyPlanCard";
import CardErrorBoundary from "../JourneyPlanCard/CardErrorBoundary";

const TOOL_LABELS = {
  find_hospitals:          "Searching hospitals",
  estimate_cost:           "Estimating treatment costs",
  get_document_checklist:  "Checking visa & documents",
  request_appointment:     "Booking appointment",
  flight_search:           "Searching live flights",
  flight_farequote:        "Confirming flight fare",
  hotel_search:            "Finding hotels",
  prepare_booking_summary: "Preparing booking summary",
};

const msgVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
};

export default function MessageBubble({ message, isLast }) {
  return message.role === "user"
    ? <UserMessage message={message} />
    : <AssistantMessage message={message} isLast={isLast} />;
}

/* ── User ────────────────────────────────────────────────────────────────── */

function UserMessage({ message }) {
  return (
    <motion.div
      variants={msgVariants}
      initial="hidden"
      animate="show"
      className="flex justify-end group px-4 sm:px-6"
    >
      <div className="max-w-[80%] sm:max-w-[68%]">
        <MessageAttachments attachments={message.attachments} />
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-indigo-600 dark:to-violet-700 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] leading-relaxed shadow-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <MessageActions message={message} isLast={false} align="right" />
      </div>
    </motion.div>
  );
}

/* ── Assistant ───────────────────────────────────────────────────────────── */

function AssistantMessage({ message, isLast }) {
  const isStreaming = message.status === "streaming";
  const isError     = message.status === "error";
  const isEmpty     = !message.content && isStreaming;

  // If the agent used its tools, render the structured Journey Plan dashboard
  // (Venkat's card) above the narrative, fed by the captured tool payloads.
  const td       = message.toolData || {};
  const hasPlan  = !isError && (
    td.find_hospitals || td.estimate_cost || td.get_document_checklist || td.request_appointment
  );

  return (
    <motion.div
      variants={msgVariants}
      initial="hidden"
      animate="show"
      className="flex items-start gap-3 group px-4 sm:px-6"
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5 flex-none">
        <AvatarFallback gradient>
          <HeartIcon />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 pt-1">

        {/* Tool badges */}
        {message.tools?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {message.tools.map((t, i) => (
              <Badge key={i} variant={t.status === "done" ? "success" : "running"}>
                {t.status === "done"
                  ? <CheckMiniIcon />
                  : <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-ping flex-shrink-0" />
                }
                {TOOL_LABELS[t.name] ?? t.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Structured Journey Plan card (renders once any tool returns data) */}
        {hasPlan && (
          <div className="mb-3">
            <CardErrorBoundary>
              <JourneyPlanCard
                intake={message.intake}
                hospital={td.find_hospitals}
                cost={td.estimate_cost}
                docs={td.get_document_checklist}
                booking={td.request_appointment}
                flights={td.flight_search}
                summary={message.content}
                isLoading={isStreaming}
              />
            </CardErrorBoundary>
          </div>
        )}

        {/* Skeleton loading state (the card shows its own skeletons when active) */}
        {isEmpty && !hasPlan && (
          <div className="space-y-2.5 w-full max-w-xs">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>
        )}

        {/* Error */}
        {!isEmpty && isError && (
          <div className="inline-flex items-start gap-2.5 text-[13.5px] leading-relaxed bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-2xl rounded-tl-sm px-4 py-3">
            <ErrorIcon />
            <p>{message.content}</p>
          </div>
        )}

        {/* Content */}
        {!isEmpty && !isError && (
          <div className="assistant-prose">
            {renderMarkdown(message.content)}
            {isStreaming && (
              <span className="inline-block w-[2.5px] h-[1.1em] bg-[var(--color-accent)] ml-0.5 animate-[cursorBlink_1s_ease-in-out_infinite] align-text-bottom rounded-full" />
            )}
          </div>
        )}

        {/* Actions */}
        {!isError && !isEmpty && (
          <MessageActions message={message} isLast={isLast} />
        )}
      </div>
    </motion.div>
  );
}

/* ── Icons ── */
const HeartIcon = () => (
  <svg className="w-[15px] h-[15px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const CheckMiniIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);
const ErrorIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
