import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatContext } from "../../context/ChatContext";
import { useToast }       from "../../context/ToastContext";
import { Button }         from "../ui/button";
import { Tooltip }        from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { AttachmentChip } from "../FileAttachment/FileAttachment";

/* ── Quick prompt library ── */
const PROMPT_LIBRARY = [
  { group: "Hospitals", items: [
    { icon: "🏥", label: "Find best hospitals in India",    text: "What are the best JCI-accredited hospitals in India for orthopedic surgery?" },
    { icon: "🏥", label: "Compare Apollo vs Fortis",        text: "Compare Apollo Hospitals and Fortis Healthcare for cardiac treatment — quality, cost, and international patient support." },
  ]},
  { group: "Costs", items: [
    { icon: "💰", label: "Estimate treatment cost",         text: "How much does hip replacement surgery cost in India compared to the UK?" },
    { icon: "💰", label: "Full trip budget",                text: "What's the total budget I need for knee replacement in India including hospital, stay, and travel from Canada?" },
  ]},
  { group: "Travel", items: [
    { icon: "✈️", label: "Plan my medical trip",            text: "Help me plan a complete medical trip to India for liver transplant from Nigeria." },
    { icon: "📋", label: "Visa checklist",                  text: "What visa do I need and what documents should I prepare for medical treatment in India? I'm from Bangladesh." },
    { icon: "📄", label: "Required documents",              text: "What medical documents and reports do I need to bring for cancer treatment at an Indian hospital?" },
  ]},
  { group: "Urgent", items: [
    { icon: "🚨", label: "Emergency assistance",            text: "I need urgent medical help in India — what are my options and who should I contact?" },
  ]},
];

export default function Composer() {
  const { sendMessage, stopStream, isStreaming } = useChatContext();
  const { toast }                                = useToast();

  const [text,     setText]     = useState("");
  const [files,    setFiles]    = useState([]);
  const [dragging, setDragging] = useState(false);
  const [focused,  setFocused]  = useState(false);
  const textareaRef  = useRef(null);
  const fileInputRef = useRef(null);

  function grow(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }

  function handleInput(e) {
    setText(e.target.value);
    grow(e.target);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const t = text.trim();
    if (!t || isStreaming) return;
    sendMessage(t, files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    setText("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  function fillPrompt(promptText) {
    setText(promptText);
    setTimeout(() => {
      if (textareaRef.current) {
        grow(textareaRef.current);
        textareaRef.current.focus();
      }
    }, 50);
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList).filter(f => f.size < 20 * 1024 * 1024);
    setFiles(prev => [...prev, ...incoming]);
    if (incoming.length) {
      toast({ title: `${incoming.length} file${incoming.length > 1 ? "s" : ""} attached`, variant: "success" });
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  function clearText() {
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  const isActive = focused || dragging;
  const canSend  = text.trim().length > 0 && !isStreaming;

  return (
    <div
      className="flex-shrink-0 px-3 sm:px-6 pb-5 pt-2 safe-bottom bg-[var(--color-bg)]"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="max-w-[860px] mx-auto">

        {/* Drop zone indicator */}
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mb-2 rounded-2xl border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-4 py-3 text-center text-[13px] text-[var(--color-accent)] font-medium"
            >
              Drop files to attach
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attached files */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-2 overflow-hidden"
            >
              {files.map((f, i) => (
                <AttachmentChip
                  key={i}
                  file={f}
                  onRemove={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating composer */}
        <div className={`
          composer-surface rounded-[20px] border transition-all duration-200
          ${isActive
            ? "border-[var(--color-accent)] shadow-composer-focus"
            : "border-[var(--color-border)] shadow-composer"
          }
        `}>
          {/* Textarea */}
          <div className="px-5 pt-5 pb-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ask MedBridge anything…"
              disabled={isStreaming}
              rows={2}
              aria-label="Message input"
              className="w-full bg-transparent resize-none text-[15px] leading-[1.65] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none max-h-[240px] disabled:opacity-50"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)] mx-4" />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2.5">

            {/* Left: Attach | Mic | Prompt library */}
            <div className="flex items-center gap-0.5">

              {/* Attach */}
              <Tooltip content="Attach file" side="top">
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <AttachIcon className="w-[18px] h-[18px]" />
                </Button>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />

              {/* Voice (placeholder) */}
              <Tooltip content="Voice input (coming soon)" side="top">
                <Button variant="ghost" size="icon" disabled>
                  <MicIcon className="w-[18px] h-[18px]" />
                </Button>
              </Tooltip>

              {/* Prompt Library */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Tooltip content="Prompt library" side="top">
                    <Button variant="ghost" size="icon">
                      <SparklesIcon className="w-[18px] h-[18px]" />
                    </Button>
                  </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[380px] overflow-y-auto w-[260px]">
                  {PROMPT_LIBRARY.map(group => (
                    <div key={group.group}>
                      <DropdownMenuLabel>{group.group}</DropdownMenuLabel>
                      {group.items.map(item => (
                        <DropdownMenuItem
                          key={item.label}
                          onClick={() => fillPrompt(item.text)}
                        >
                          <span className="mr-1 text-base">{item.icon}</span>
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear text */}
              <AnimatePresence>
                {text.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Tooltip content="Clear" side="top">
                      <Button variant="ghost" size="icon" onClick={clearText}>
                        <XIcon className="w-[16px] h-[16px]" />
                      </Button>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: hint + Send / Stop */}
            <div className="flex items-center gap-2.5">
              <AnimatePresence>
                {canSend && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hidden sm:block text-[11px] text-[var(--color-text-tertiary)] select-none"
                  >
                    Enter ↵
                  </motion.span>
                )}
              </AnimatePresence>

              {isStreaming ? (
                <Tooltip content="Stop generating" side="top">
                  <Button
                    variant="outline"
                    size="icon-lg"
                    onClick={stopStream}
                    className="hover:border-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <StopIcon className="w-[14px] h-[14px]" />
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip content="Send message" side="top">
                  <Button variant="gradient" size="icon-lg" onClick={submit} disabled={!canSend}>
                    <SendIcon className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Hint */}
        <p className="text-center text-[11.5px] text-[var(--color-text-tertiary)] mt-2.5 select-none">
          <kbd className="px-1.5 py-0.5 rounded-md text-[10px] font-sans bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]">
            Shift+Enter
          </kbd>{" "}
          for new line · MedBridge may make mistakes
        </p>
      </div>
    </div>
  );
}

/* ── Icons ── */
const SendIcon     = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14M12 5l7 7-7 7" /></svg>;
const StopIcon     = ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2.5" /></svg>;
const AttachIcon   = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const MicIcon      = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 016 0v4a3 3 0 01-6 0z" /></svg>;
const SparklesIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const XIcon        = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>;
