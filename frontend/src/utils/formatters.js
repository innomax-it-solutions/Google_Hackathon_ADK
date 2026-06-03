/**
 * utils/formatters.js
 * Markdown renderer + helpers used across the chat UI.
 */

import { createElement, useState } from "react";

// ── Timestamp ─────────────────────────────────────────────────────────────────

export function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10)   return "just now";
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Inline parser ─────────────────────────────────────────────────────────────

export function inlineParse(text, keyPrefix = "") {
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[(.+?)\]\((.+?)\))/g;
  const parts = [];
  let last = 0, m, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${k++}`;
    if (m[2])
      parts.push(createElement("strong", { key, className: "font-semibold text-inherit" }, m[2]));
    else if (m[3])
      parts.push(createElement("em", { key }, m[3]));
    else if (m[4])
      parts.push(createElement("code", { key, className: "bg-black/[.06] dark:bg-white/[.1] text-[0.85em] px-1.5 py-0.5 rounded font-mono" }, m[4]));
    else if (m[5]) {
      // Only allow http/https — block javascript: data: and other risky schemes
      const href = /^https?:\/\//i.test(m[6]) ? m[6] : "#";
      parts.push(createElement("a", { key, href, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 underline underline-offset-2 hover:text-blue-700" }, m[5]));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── Code block with copy ──────────────────────────────────────────────────────

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return createElement(
    "div",
    { className: "my-3 rounded-xl overflow-hidden border border-slate-200 text-sm" },
    // header bar
    createElement(
      "div",
      { className: "flex items-center justify-between bg-slate-100 px-4 py-2" },
      createElement("span", { className: "text-xs text-slate-500 font-mono" }, lang || "code"),
      createElement(
        "button",
        { onClick: copy, className: "text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition" },
        copied ? "✓ Copied" : "Copy"
      )
    ),
    // code content
    createElement(
      "pre",
      { className: "bg-slate-950 text-slate-100 p-4 overflow-x-auto" },
      createElement("code", { className: "font-mono text-sm leading-relaxed" }, code.trim())
    )
  );
}

// ── Block-level markdown renderer ─────────────────────────────────────────────

export function renderMarkdown(text) {
  if (!text) return null;

  // 1. Extract code blocks first
  const segments = [];
  const codeRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m, segKey = 0;
  while ((m = codeRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ t: "text", v: text.slice(last, m.index) });
    segments.push({ t: "code", lang: m[1], v: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ t: "text", v: text.slice(last) });

  // 2. Render each segment
  const rendered = segments.map((seg) => {
    if (seg.t === "code") {
      return createElement(CodeBlock, { key: segKey++, lang: seg.lang, code: seg.v });
    }
    return renderTextBlock(seg.v, segKey++);
  });

  return createElement("div", { className: "space-y-0.5 leading-7" }, rendered);
}

function renderTextBlock(text, blockKey) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0, k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key  = `${blockKey}-${k++}`;

    // Blank line
    if (!line.trim()) {
      elements.push(createElement("div", { key, className: "h-2" }));
      i++; continue;
    }
    // h1
    if (/^# /.test(line)) {
      elements.push(createElement("h1", { key, className: "text-2xl font-bold mt-5 mb-2" }, inlineParse(line.slice(2), key)));
      i++; continue;
    }
    // h2
    if (/^## /.test(line)) {
      elements.push(createElement("h2", { key, className: "text-xl font-bold mt-4 mb-1.5 pb-1 border-b border-slate-200" }, inlineParse(line.slice(3), key)));
      i++; continue;
    }
    // h3
    if (/^### /.test(line)) {
      elements.push(createElement("h3", { key, className: "text-base font-semibold mt-3 mb-1" }, inlineParse(line.slice(4), key)));
      i++; continue;
    }
    // blockquote
    if (/^> /.test(line)) {
      elements.push(
        createElement("blockquote", { key, className: "border-l-4 border-slate-300 pl-4 text-slate-600 italic my-2" },
          inlineParse(line.slice(2), key))
      );
      i++; continue;
    }
    // unordered list — collect consecutive items
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(createElement("li", { key: i }, inlineParse(lines[i].slice(2), `${key}-li-${i}`)));
        i++;
      }
      elements.push(createElement("ul", { key, className: "list-none space-y-1 my-1 pl-1" },
        items.map((item, idx) =>
          createElement("div", { key: idx, className: "flex items-start gap-2.5" },
            createElement("span", { className: "mt-[0.45rem] w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" }),
            createElement("span", { className: "flex-1" }, item.props.children)
          )
        )
      ));
      continue;
    }
    // ordered list — collect consecutive items
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const dot = lines[i].indexOf(". ");
        items.push({
          num: lines[i].slice(0, dot),
          content: inlineParse(lines[i].slice(dot + 2), `${key}-oli-${i}`),
        });
        i++;
      }
      elements.push(createElement("ol", { key, className: "space-y-1.5 my-1 pl-1" },
        items.map((item, idx) =>
          createElement("div", { key: idx, className: "flex items-start gap-3" },
            createElement("span", { className: "flex-shrink-0 w-5 h-5 text-xs font-bold text-blue-600 bg-blue-50 rounded-full flex items-center justify-center mt-0.5" }, item.num),
            createElement("span", { className: "flex-1 mt-0.5" }, item.content)
          )
        )
      ));
      continue;
    }
    // table
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      elements.push(renderTable(rows, key));
      continue;
    }
    // paragraph
    elements.push(createElement("p", { key, className: "my-0.5" }, inlineParse(line, key)));
    i++;
  }
  return createElement("div", { key: blockKey, className: "space-y-0.5" }, elements);
}

function renderTable(rows, key) {
  const parseRow = (row) => row.split("|").map(c => c.trim()).filter(Boolean);
  const header = parseRow(rows[0]);
  const dataRows = rows.slice(2).filter(r => !/^[|\s:-]+$/.test(r)).map(parseRow);

  return createElement(
    "div",
    { key, className: "my-3 overflow-x-auto" },
    createElement(
      "table",
      { className: "min-w-full text-sm border-collapse" },
      createElement("thead", null,
        createElement("tr", null,
          header.map((h, i) =>
            createElement("th", { key: i, className: "border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold" }, inlineParse(h))
          )
        )
      ),
      createElement("tbody", null,
        dataRows.map((row, ri) =>
          createElement("tr", { key: ri, className: ri % 2 === 0 ? "" : "bg-slate-50/50" },
            row.map((cell, ci) =>
              createElement("td", { key: ci, className: "border border-slate-200 px-3 py-2" }, inlineParse(cell))
            )
          )
        )
      )
    )
  );
}
