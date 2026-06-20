/**
 * useResizablePanel — width state for the draggable chat side panel.
 *
 * Returns the current width plus a `startResize` mousedown handler for a drag
 * handle on the panel's LEFT edge (the panel is flush against the viewport's
 * right edge, so width = viewportWidth - cursorX). The width is clamped to a
 * sensible range, kept in bounds on window resize, and persisted to
 * localStorage so it survives reloads. Double-click the handle to reset.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "medbridge-panel-width";
const COLLAPSE_KEY = "medbridge-panel-collapsed";
export const DEFAULT_WIDTH = 460;
const MIN = 360;
const MAX = 820;

function clampWidth(w) {
  if (typeof window === "undefined") return w;
  const hardMax = Math.min(MAX, Math.round(window.innerWidth * 0.6));
  return Math.max(MIN, Math.min(w, hardMax));
}

export function useResizablePanel() {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(saved) && saved > 0 ? clampWidth(saved) : DEFAULT_WIDTH;
  });
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  });
  const frame = useRef(0);

  const setCollapsedPersist = useCallback((next) => {
    setCollapsed(next);
    try { window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
  }, []);
  const hidePanel = useCallback(() => setCollapsedPersist(true), [setCollapsedPersist]);
  const showPanel = useCallback(() => setCollapsedPersist(false), [setCollapsedPersist]);

  const onMove = useCallback((e) => {
    const { clientX } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setWidth(clampWidth(window.innerWidth - clientX));
    });
  }, []);

  const startResize = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const resetWidth = useCallback(() => setWidth(clampWidth(DEFAULT_WIDTH)), []);

  // Attach global listeners only while dragging.
  useEffect(() => {
    if (!dragging) return;
    const stop = () => setDragging(false);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      cancelAnimationFrame(frame.current);
    };
  }, [dragging, onMove]);

  // Persist once a drag settles.
  useEffect(() => {
    if (dragging) return;
    try { window.localStorage.setItem(KEY, String(width)); } catch { /* ignore quota */ }
  }, [dragging, width]);

  // Keep the panel within bounds when the window is resized.
  useEffect(() => {
    const onResize = () => setWidth((w) => clampWidth(w));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { width, dragging, startResize, resetWidth, collapsed, hidePanel, showPanel };
}
