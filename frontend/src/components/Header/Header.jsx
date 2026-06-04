import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect }    from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useChatContext } from "../../context/ChatContext";
import { useTheme }       from "../../context/ThemeContext";
import { useToast }       from "../../context/ToastContext";
import { useLanguage }    from "../../context/LanguageContext";
import { healthCheck }    from "../../services/ai/provider";
import { Button }         from "../ui/button";
import { Badge }          from "../ui/badge";
import { Tooltip }        from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";

/** Polls /healthz every 15 s and returns the current backend status. */
function useBackendStatus() {
  const [online, setOnline] = useState(null); // null = checking

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const ok = await healthCheck();
      if (!cancelled) setOnline(ok);
    }
    check();
    const id = setInterval(check, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return online;
}

export default function Header() {
  const { clearConversation, messages }          = useChatContext();
  const { isDark, toggle }                        = useTheme();
  const { toast }                                 = useToast();
  const { language, setLanguage, languages }      = useLanguage();
  const backendOnline                             = useBackendStatus();
  const navigate                                  = useNavigate();
  const location                                  = useLocation();

  const onFormPage = location.pathname.toLowerCase() === "/form";

  const hasMessages = messages.length > 0;
  const firstUser   = messages.find(m => m.role === "user");
  const convTitle   = firstUser
    ? firstUser.content.length > 44
      ? firstUser.content.slice(0, 44) + "…"
      : firstUser.content
    : null;

  function exportConversation() {
    const text = messages
      .map(m => `${m.role === "user" ? "You" : "MedBridge"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "medbridge-conversation.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Conversation exported", variant: "success" });
  }

  return (
    <header className="flex-shrink-0 h-[56px] glass border-b border-[var(--color-border)] sticky top-0 z-30">
      <div className="h-full max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <HeartIcon />
          </div>
          <div className="flex items-center gap-2 leading-none">
            <span className="font-semibold text-[14px] tracking-tight text-[var(--color-text-primary)]">
              MedBridge
            </span>
            <Badge variant="accent" className="hidden sm:inline-flex text-[9.5px] tracking-wider uppercase">
              AI
            </Badge>
            {/* Backend connection status */}
            <Tooltip
              content={
                backendOnline === null  ? "Connecting to backend…"  :
                backendOnline           ? "Backend connected"        :
                                          "Backend offline — start uvicorn"
              }
              side="bottom"
            >
              <span className={[
                "w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-500",
                backendOnline === null ? "bg-yellow-400 animate-pulse" :
                backendOnline          ? "bg-emerald-400"              :
                                         "bg-red-500 animate-pulse",
              ].join(" ")} />
            </Tooltip>
          </div>
        </div>

        {/* Conversation title */}
        <div className="flex-1 flex justify-center min-w-0 px-3">
          <AnimatePresence mode="wait">
            {convTitle && (
              <motion.span
                key={convTitle}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{ opacity: 0,    y:  5 }}
                transition={{ duration: 0.18 }}
                className="hidden md:block text-[13px] text-[var(--color-text-tertiary)] truncate max-w-[320px] select-none"
              >
                {convTitle}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* Hospital finder form — blue CTA (or "Chat" link when on the form page) */}
          {onFormPage ? (
            <Tooltip content="Back to chat" side="bottom">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-1.5 text-[var(--color-text-tertiary)]"
              >
                <ChatIcon className="w-3.5 h-3.5" />
                Chat
              </Button>
            </Tooltip>
          ) : (
            <Tooltip content="Fill a form to get hospital suggestions" side="bottom">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/Form")}
                className="gap-1.5"
              >
                <FormIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Find Hospitals</span>
              </Button>
            </Tooltip>
          )}

          {/* New conversation — appears when chat has messages */}
          <AnimatePresence>
            {hasMessages && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1  }}
                exit={{ opacity: 0,    scale: 0.9 }}
              >
                <Tooltip content="New conversation" side="bottom">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearConversation}
                    className="hidden sm:flex gap-1.5 text-[var(--color-text-tertiary)]"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    New
                  </Button>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Theme toggle */}
          <Tooltip content={isDark ? "Light mode" : "Dark mode"} side="bottom">
            <Button variant="ghost" size="icon" onClick={toggle}>
              {isDark
                ? <SunIcon className="w-[17px] h-[17px]" />
                : <MoonIcon className="w-[17px] h-[17px]" />
              }
            </Button>
          </Tooltip>

          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Tooltip content="Language" side="bottom">
                <Button variant="ghost" size="icon">
                  <GlobeIcon className="w-[17px] h-[17px]" />
                </Button>
              </Tooltip>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[340px] overflow-y-auto">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map(l => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  icon={language === l.code ? <CheckIcon className="w-4 h-4" /> : <span className="w-4 h-4" />}
                >
                  {l.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Tooltip content="Menu" side="bottom">
                <Button variant="ghost" size="icon">
                  <DotsIcon className="w-[17px] h-[17px]" />
                </Button>
              </Tooltip>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>MedBridge</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {hasMessages && (
                <>
                  <DropdownMenuItem
                    icon={<PlusIcon className="w-4 h-4" />}
                    onClick={clearConversation}
                    shortcut="Alt+N"
                  >
                    New chat
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    icon={<DownloadIcon className="w-4 h-4" />}
                    onClick={exportConversation}
                  >
                    Export conversation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    icon={<TrashIcon className="w-4 h-4" />}
                    onClick={clearConversation}
                    destructive
                  >
                    Clear conversation
                  </DropdownMenuItem>
                </>
              )}

              {!hasMessages && (
                <DropdownMenuItem disabled icon={<ChatIcon className="w-4 h-4" />}>
                  No conversation yet
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/* ── Icons ── */
const HeartIcon    = () => <svg className="w-[16px] h-[16px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const PlusIcon     = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const MoonIcon     = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const SunIcon      = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const DotsIcon     = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;
const TrashIcon    = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DownloadIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const ChatIcon     = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const GlobeIcon    = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M3.6 9h16.8 M3.6 15h16.8 M12 3a15 15 0 010 18 M12 3a15 15 0 000 18" /></svg>;
const CheckIcon    = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" /></svg>;
const FormIcon     = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h4" /></svg>;
