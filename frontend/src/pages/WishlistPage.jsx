/**
 * WishlistPage — saved Journey Plan cards (/wishlist).
 *
 * Each saved plan can be re-viewed (renders the full interactive JourneyPlanCard
 * inline), discussed with the agent, or moved toward booking — the latter two
 * seed a fresh chat from the saved plan and jump to /chat.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Header from "../components/Header/Header";
import JourneyPlanCard from "../components/JourneyPlanCard/JourneyPlanCard";
import CardErrorBoundary from "../components/JourneyPlanCard/CardErrorBoundary";
import { Button } from "../components/ui/button";
import { useWishlist } from "../context/WishlistContext";
import { useChatContext } from "../context/ChatContext";

export default function WishlistPage() {
  const { items, removeById } = useWishlist();
  const { startCardConversation } = useChatContext();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);

  function chatAbout(item) {
    startCardConversation(buildChatSeed(item.preview));
    navigate("/chat");
  }

  function confirmBooking(item) {
    startCardConversation(buildBookingSeed(item.preview));
    navigate("/chat");
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* Intro */}
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Your wishlist
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
              {items.length
                ? `${items.length} saved plan${items.length > 1 ? "s" : ""}. View a plan, chat with the agent about it, or confirm a booking.`
                : "Plans you save from the Journey Plan card appear here."}
            </p>
          </div>

          {items.length === 0 ? (
            <EmptyState onFind={() => navigate("/form")} />
          ) : (
            <ul className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden"
                  >
                    <WishlistRow
                      item={item}
                      open={openId === item.id}
                      onToggleView={() => setOpenId((id) => (id === item.id ? null : item.id))}
                      onChat={() => chatAbout(item)}
                      onBook={() => confirmBooking(item)}
                      onRemove={() => removeById(item.id)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function WishlistRow({ item, open, onToggleView, onChat, onBook, onRemove }) {
  const p = item.preview || {};
  return (
    <>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[var(--color-text-primary)] truncate">
              {p.title || "Journey plan"}
            </p>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5 truncate">
              {[p.hospitalName, p.hospitalCity].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px] text-[var(--color-text-tertiary)]">
              {p.country && <span>From {p.country}</span>}
              {p.totalUsd && <span className="font-semibold text-[var(--color-text-secondary)]">{p.totalUsd}</span>}
              {Number.isFinite(p.timelineWeeks) && <span>{p.timelineWeeks} weeks</span>}
              <span>Saved {fmtSaved(item.savedAt)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            title="Remove from wishlist"
            aria-label="Remove from wishlist"
            className="flex-shrink-0 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors p-1"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Three actions */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onToggleView} className="gap-1.5">
            <EyeIcon className="w-3.5 h-3.5" />
            {open ? "Hide card" : "View card"}
          </Button>
          <Button variant="secondary" size="sm" onClick={onChat} className="gap-1.5">
            <ChatIcon className="w-3.5 h-3.5" />
            Chat with agent
          </Button>
          <Button variant="gradient" size="sm" onClick={onBook} className="gap-1.5">
            <CheckIcon className="w-3.5 h-3.5" />
            Confirm booking
          </Button>
        </div>
      </div>

      {/* Inline full card */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="card"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[var(--color-border)]"
          >
            <div className="p-4 sm:p-5 bg-[var(--color-bg)]">
              <CardErrorBoundary>
                <JourneyPlanCard {...item.props} isLoading={false} />
              </CardErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({ onFind }) {
  return (
    <div className="text-center border border-dashed border-[var(--color-border)] rounded-2xl py-14 px-6">
      <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] mx-auto flex items-center justify-center">
        <HeartIcon className="w-6 h-6" />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-[var(--color-text-primary)]">No saved plans yet</p>
      <p className="mt-1 text-[13px] text-[var(--color-text-secondary)] max-w-sm mx-auto">
        Generate a Journey Plan, then tap <span className="font-medium">Wishlist</span> on the card to save it here.
      </p>
      <Button variant="default" size="lg" onClick={onFind} className="mt-5 gap-1.5">
        <FormIcon className="w-4 h-4" /> Find hospitals
      </Button>
    </div>
  );
}

// --- chat / booking seed messages ------------------------------------------

function buildChatSeed(p = {}) {
  const proc = p.procedureLabel || p.condition || "treatment";
  let s = `I'd like to continue planning my ${proc} at ${p.hospitalName || "the recommended hospital"}`;
  if (p.hospitalCity) s += `, ${p.hospitalCity}`;
  s += ".";
  if (p.country) s += ` I'm travelling from ${p.country}.`;
  if (p.budget) s += ` My budget is about $${p.budget.toLocaleString("en-US")}.`;
  if (Number.isFinite(p.timelineWeeks)) s += ` I'd like treatment within ${p.timelineWeeks} weeks.`;
  s += " Please pull up my journey plan and help me proceed.";
  return s;
}

function buildBookingSeed(p = {}) {
  const proc = p.procedureLabel || p.condition || "treatment";
  let s = `Please book my appointment for ${proc} at ${p.hospitalName || "the recommended hospital"}`;
  if (p.hospitalCity) s += ` in ${p.hospitalCity}`;
  s += ".";
  if (p.country) s += ` I'm travelling from ${p.country}.`;
  s += " Go ahead and confirm the booking and share the reference number.";
  return s;
}

function fmtSaved(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

// --- icons -----------------------------------------------------------------

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const ChatIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const HeartIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const FormIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h4" />
  </svg>
);
