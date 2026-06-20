/**
 * context/ProfileContext.jsx — the patient's health + customer profile.
 *
 * Browser-only (localStorage), keyed by the logged-in user's email. Lives next
 * to AuthContext so it can re-load whenever the signed-in user changes, and is
 * consumed by the Profile tab (edit/save) and by FormPage (auto-prefill intake).
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { readProfile, writeProfile, isProfileComplete, EMPTY_PROFILE } from "../utils/profile";

const Ctx = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const email = user?.email || "";

  const [profile, setProfile] = useState(() => readProfile(email));

  // Re-hydrate when the signed-in user changes (login/logout/account switch).
  useEffect(() => {
    setProfile(readProfile(email));
  }, [email]);

  const saveProfile = useCallback((next) => {
    const merged = { ...EMPTY_PROFILE, ...next };
    setProfile(merged);
    writeProfile(email, merged);
    return merged;
  }, [email]);

  const value = useMemo(() => ({
    profile,
    saveProfile,
    isComplete: isProfileComplete(profile),
  }), [profile, saveProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
