import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChatContext } from "../context/ChatContext";
import { useDocuments }   from "../context/DocumentContext";
import { useResizablePanel } from "../hooks/useResizablePanel";
import Header             from "../components/Header/Header";
import ChatWindow         from "../components/ChatWindow/ChatWindow";
import SuggestedPrompts   from "../components/SuggestedPrompts/SuggestedPrompts";
import Composer           from "../components/Composer/Composer";
import ClarificationPrompt from "../components/ClarificationPrompt/ClarificationPrompt";
import SidePanel          from "../components/SidePanel/SidePanel";

export default function ChatPage() {
  const { messages, pendingClarification, submitClarification, dismissClarification } = useChatContext();
  const { status, analyses } = useDocuments();
  const { width, dragging, startResize, resetWidth, collapsed, hidePanel, showPanel } = useResizablePanel();
  const isEmpty = messages.length === 0;

  const [panelOpen, setPanelOpen] = useState(false);

  // On small screens, surface the panel automatically when a report is analysing.
  useEffect(() => {
    if (status === "analyzing") setPanelOpen(true);
  }, [status]);

  const hasReport = status === "analyzing" || analyses.length > 0;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">
      <Header />

      <div className="flex flex-1 min-h-0">
        {/* Main chat column */}
        <div className="flex flex-col flex-1 min-w-0">
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

        {/* Desktop side panel — resizable + collapsible; fills the space beside the chat */}
        {!collapsed && (
          <aside
            className="hidden lg:flex flex-shrink-0 relative"
            style={{ width }}
          >
            {/* Drag handle on the panel's left edge */}
            <div
              onMouseDown={startResize}
              onDoubleClick={resetWidth}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panel"
              title="Drag to resize · double-click to reset"
              className="absolute left-0 top-0 bottom-0 z-20 w-2.5 -translate-x-1/2 cursor-col-resize flex items-center justify-center group"
            >
              <span
                className={`h-12 w-1 rounded-full transition-colors duration-150 ${
                  dragging
                    ? "bg-[var(--color-accent)]"
                    : "bg-[var(--color-border)] group-hover:bg-[var(--color-accent-muted)]"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0 border-l border-[var(--color-border)]">
              <SidePanel onCollapse={hidePanel} />
            </div>
          </aside>
        )}

        {/* Desktop reopen tab — shown when the panel is hidden */}
        {collapsed && (
          <button
            type="button"
            onClick={showPanel}
            aria-label="Show report & profile panel"
            title="Show panel"
            className="hidden lg:flex fixed top-1/2 right-0 -translate-y-1/2 z-30 items-center gap-1.5 rounded-l-xl border border-r-0 border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-2.5 pr-2 shadow-md hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)] text-[var(--color-text-secondary)] transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="text-[11px] font-medium [writing-mode:vertical-rl] rotate-180 tracking-wide">Report &amp; Profile</span>
            {hasReport && <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[var(--color-bg)]" />}
          </button>
        )}
      </div>

      {/* Mobile slide-over panel */}
      <AnimatePresence>
        {panelOpen && (
          <div className="lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[88%] max-w-[420px] border-l border-[var(--color-border)] shadow-xl"
            >
              <SidePanel onClose={() => setPanelOpen(false)} onPlanned={() => setPanelOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Floating panel toggle — mobile only */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label="Open report & profile panel"
        className="lg:hidden fixed bottom-28 right-4 z-30 h-11 w-11 rounded-full bg-[var(--color-accent)] text-white shadow-lg flex items-center justify-center"
      >
        <PanelIcon className="w-5 h-5" />
        {hasReport && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[var(--color-bg)]" />}
      </button>
    </div>
  );
}

const PanelIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z M15 3v18" />
  </svg>
);
const ChevronLeftIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
