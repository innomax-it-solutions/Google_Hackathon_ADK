/**
 * SidePanel — the tabbed panel on the right of the chat.
 *
 * Two tabs: "Report" (latest medical-report analysis) and "Profile" (health +
 * customer details). On wide screens it sits in the empty space beside the
 * centered chat; on small screens ChatPage renders it as a slide-over.
 */

import { useEffect, useState } from "react";
import { useDocuments } from "../../context/DocumentContext";
import ReportPanel from "./ReportPanel";
import ProfilePanel from "./ProfilePanel";
import { cn } from "../../lib/utils";

function TabButton({ active, onClick, children, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-1 py-2.5 text-[13px] font-medium transition-colors",
        active
          ? "text-[var(--color-accent)]"
          : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {badge && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />}
      </span>
      {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent)]" />}
    </button>
  );
}

export default function SidePanel({ onClose, onCollapse, onPlanned }) {
  const { status, analyses } = useDocuments();
  const [tab, setTab] = useState("report");

  // Pull attention to the Report tab whenever a new analysis starts or lands.
  useEffect(() => {
    if (status === "analyzing" || status === "error" || analyses.length) setTab("report");
  }, [status, analyses.length]);

  const hasReport = status === "analyzing" || analyses.length > 0;

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg)]">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center border-b border-[var(--color-border)] px-1">
        <TabButton active={tab === "report"} onClick={() => setTab("report")} badge={hasReport && tab !== "report"}>
          Report
        </TabButton>
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
          Profile
        </TabButton>
        {/* Desktop: collapse/hide the panel */}
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Hide panel"
            title="Hide panel"
            className="ml-1 mr-1 p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] hidden lg:inline-flex"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        )}

        {/* Mobile: close the slide-over */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="ml-1 mr-1 p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] lg:hidden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Active tab */}
      <div className="flex-1 min-h-0">
        {tab === "report" ? <ReportPanel onPlanned={onPlanned} /> : <ProfilePanel />}
      </div>
    </div>
  );
}
