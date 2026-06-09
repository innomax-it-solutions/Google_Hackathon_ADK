/**
 * context/WishlistContext.jsx — saved Journey Plan cards.
 *
 * The user can "wishlist" a generated Journey Plan from the card; saved items
 * appear on the /wishlist page where they can re-view the card, start a chat
 * about it, or confirm a booking. Persisted to localStorage (client-only, like
 * the chat history) so saves survive reloads.
 *
 * An item stores BOTH:
 *   props   — the exact JourneyPlanCard props, so /wishlist can re-render the
 *             full interactive card faithfully.
 *   preview — small derived fields (title, hospital, total, country) for the
 *             list row + the chat/booking seed messages, so we never re-derive.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "medbridge_wishlist_v1";
const Ctx = createContext(null);

let _seq = Date.now();
const uid = () => `wl_${++_seq}`;

/** Stable identity for a saved plan: condition + the chosen hospital. */
export function wishlistKey(condition, hospitalId) {
  return `${(condition || "").toString().toLowerCase().trim()}::${hospitalId || ""}`;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore parse/quota errors */ }
  return [];
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => load());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore quota */ }
  }, [items]);

  const has = useCallback((key) => items.some((it) => it.key === key), [items]);

  // Add (or no-op if already saved). Returns true if newly added.
  const add = useCallback((item) => {
    if (!item?.key) return false;
    let added = false;
    setItems((prev) => {
      if (prev.some((it) => it.key === item.key)) return prev;
      added = true;
      return [{ id: uid(), savedAt: new Date().toISOString(), ...item }, ...prev];
    });
    return added;
  }, []);

  const removeByKey = useCallback((key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const removeById = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  // Toggle save state for a key. Returns the new state ("saved" | "removed").
  const toggle = useCallback((item) => {
    if (!item?.key) return "removed";
    let result = "removed";
    setItems((prev) => {
      if (prev.some((it) => it.key === item.key)) {
        result = "removed";
        return prev.filter((it) => it.key !== item.key);
      }
      result = "saved";
      return [{ id: uid(), savedAt: new Date().toISOString(), ...item }, ...prev];
    });
    return result;
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, count: items.length, has, add, removeByKey, removeById, toggle, clear }),
    [items, has, add, removeByKey, removeById, toggle, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
