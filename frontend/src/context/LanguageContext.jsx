/**
 * context/LanguageContext.jsx — UI language + i18n lookup.
 *
 * Mirrors ThemeContext: a value persisted to localStorage with a DOM side-effect.
 * Provides:
 *   language      - active ISO code ("en", "ar", …)
 *   setLanguage   - switch language
 *   t(key)        - dot-path lookup into the active locale, falling back to English
 *                   then to the key itself. Returns whatever sits at the path
 *                   (string | array | object) so callers can map over prompt lists.
 *   dir           - "rtl" for Arabic/Urdu, else "ltr"
 *   languages     - the selectable list (code + native autonym + dir)
 *
 * Only the small set of static UI-chrome strings live in the locale files. The
 * AI's chat replies are translated live by Gemini (see backend language directive).
 */

import { createContext, useContext, useEffect, useState } from "react";

import en from "../locales/en.json";
import zh from "../locales/zh.json";
import hi from "../locales/hi.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import ar from "../locales/ar.json";
import bn from "../locales/bn.json";
import pt from "../locales/pt.json";
import ru from "../locales/ru.json";
import ur from "../locales/ur.json";

const LOCALES = { en, zh, hi, es, fr, ar, bn, pt, ru, ur };

// Shown in the selector by native name (autonym), regardless of the active UI language.
export const LANGUAGES = [
  { code: "en", name: "English",  dir: "ltr" },
  { code: "zh", name: "中文",      dir: "ltr" },
  { code: "hi", name: "हिन्दी",     dir: "ltr" },
  { code: "es", name: "Español",  dir: "ltr" },
  { code: "fr", name: "Français", dir: "ltr" },
  { code: "ar", name: "العربية",   dir: "rtl" },
  { code: "bn", name: "বাংলা",     dir: "ltr" },
  { code: "pt", name: "Português", dir: "ltr" },
  { code: "ru", name: "Русский",   dir: "ltr" },
  { code: "ur", name: "اردو",      dir: "rtl" },
];

const RTL = new Set(["ar", "ur"]);
const SUPPORTED = new Set(LANGUAGES.map((l) => l.code));

const Ctx = createContext(null);

function lookup(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem("medbridge_language");
    return saved && SUPPORTED.has(saved) ? saved : "en";
  });

  const dir = RTL.has(language) ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = dir;
    localStorage.setItem("medbridge_language", language);
  }, [language, dir]);

  const setLanguage = (code) => {
    if (SUPPORTED.has(code)) setLanguageState(code);
  };

  const t = (key) => {
    const val = lookup(LOCALES[language], key);
    if (val !== undefined) return val;
    const fallback = lookup(LOCALES.en, key);
    return fallback !== undefined ? fallback : key;
  };

  return (
    <Ctx.Provider value={{ language, setLanguage, t, dir, languages: LANGUAGES }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
