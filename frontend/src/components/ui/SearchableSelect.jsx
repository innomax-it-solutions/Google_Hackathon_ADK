/**
 * SearchableSelect — a themed, accessible combobox with type-to-filter search.
 *
 * Options may be flat (`[{value, label, keywords?}]`) or grouped
 * (`[{specialty, options:[...]}]`). Filtering matches label, value and keywords.
 * When `allowCustom` is set, an unmatched query can be selected verbatim as the
 * value (useful for free-text conditions the backend can still resolve).
 *
 * Styled with the same CSS-variable theme + inputClass shape as FormPage so it
 * sits cleanly next to the native inputs/selects.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "../../lib/utils";

// Normalise grouped/flat option props into a single grouped shape for rendering,
// plus a flat list for keyboard navigation + lookup.
function normalise(options) {
  if (!options?.length) return { groups: [], flat: [] };
  const grouped = "options" in options[0];
  const groups = grouped
    ? options.map((g) => ({ label: g.specialty ?? g.label ?? "", options: g.options }))
    : [{ label: "", options }];
  const flat = groups.flatMap((g) => g.options);
  return { groups, flat };
}

export default function SearchableSelect({
  id,
  name,
  value,
  onChange,          // (value) => void  — called with the selected option value
  onBlur,            // forwarded so the parent's touched/validation logic still fires
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Type to search…",
  disabled = false,
  hasError = false,
  allowCustom = false,
  className,
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);   // highlighted index into `filtered`

  const rootRef   = useRef(null);
  const searchRef = useRef(null);

  const { groups, flat } = useMemo(() => normalise(options), [options]);

  const selected = useMemo(
    () => flat.find((o) => o.value === value) || null,
    [flat, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flat;
    return flat.filter((o) =>
      `${o.label} ${o.value} ${o.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [flat, query]);

  // Rebuild the grouped view from the filtered set so empty groups disappear.
  const filteredGroups = useMemo(() => {
    const allow = new Set(filtered.map((o) => o.value));
    return groups
      .map((g) => ({ ...g, options: g.options.filter((o) => allow.has(o.value)) }))
      .filter((g) => g.options.length);
  }, [groups, filtered]);

  const showCustom =
    allowCustom && query.trim().length >= 3 &&
    !flat.some((o) => o.value.toLowerCase() === query.trim().toLowerCase());

  // Close on outside click + reset the highlight when the filter changes.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => { if (open) searchRef.current?.focus(); }, [open]);

  function commit(optValue) {
    onChange?.(optValue);
    setOpen(false);
    setQuery("");
    // Mirror a native control losing focus so parent validation runs.
    onBlur?.({ target: { name, value: optValue } });
  }

  function handleKeyDown(e) {
    if (!open && (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    const max = filtered.length + (showCustom ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, max - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showCustom && active === filtered.length) commit(query.trim());
      else if (filtered[active]) commit(filtered[active].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  const triggerClass = cn(
    "w-full rounded-xl border px-3.5 py-2.5 text-[14px] bg-[var(--color-surface)]",
    "flex items-center justify-between gap-2 text-left transition-colors duration-150",
    "focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
    hasError
      ? "border-red-400 focus:ring-red-200 dark:focus:ring-red-900"
      : "border-[var(--color-border)] hover:border-[var(--color-accent-muted)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-muted)]",
    className
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          // Only treat as a blur if focus left the whole widget (not into the panel).
          if (!rootRef.current?.contains(e.relatedTarget)) onBlur?.({ target: { name, value: value || "" } });
        }}
        className={triggerClass}
      >
        <span className={cn("truncate", !selected && "text-[var(--color-text-tertiary)]")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden"
          role="listbox"
        >
          {/* Search box */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
            />
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredGroups.length === 0 && !showCustom && (
              <p className="px-3.5 py-3 text-[13px] text-[var(--color-text-tertiary)]">
                No matches found.
              </p>
            )}

            {filteredGroups.map((group) => (
              <div key={group.label || "_"}>
                {group.label && (
                  <p className="px-3.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    {group.label}
                  </p>
                )}
                {group.options.map((opt) => {
                  const idx = filtered.indexOf(opt);
                  const isActive   = idx === active;
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => commit(opt.value)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-[14px] transition-colors",
                        isActive
                          ? "bg-[var(--color-surface-2)] text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-secondary)]"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />}
                    </button>
                  );
                })}
              </div>
            ))}

            {showCustom && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActive(filtered.length)}
                onClick={() => commit(query.trim())}
                className={cn(
                  "flex w-full items-center gap-2 px-3.5 py-2 text-left text-[14px] transition-colors",
                  active === filtered.length
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)]"
                )}
              >
                Use “<span className="font-medium">{query.trim()}</span>”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
