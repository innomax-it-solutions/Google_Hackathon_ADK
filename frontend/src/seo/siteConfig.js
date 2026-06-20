// Central SEO/site configuration. The canonical site origin is configurable via
// VITE_SITE_URL (set it to the real domain at deploy time); it defaults to a
// placeholder so canonical/OG URLs and the sitemap are still well-formed.
const RAW_URL = (import.meta.env?.VITE_SITE_URL || "https://www.healtour.com").trim();

export const SITE = {
  name: "Healtour",
  legalName: "Healtour Solutions Pvt Ltd",
  url: RAW_URL.replace(/\/+$/, ""),
  defaultTitle: "Healtour — AI-Powered Medical Tourism Platform",
  description:
    "Healtour is an AI-powered medical tourism platform by Healtour Solutions Pvt Ltd — find trusted accredited hospitals, top doctors, transparent treatment costs and end-to-end travel coordination.",
  // Social share image. Replace with a dedicated 1200×630 OG image when available.
  ogImage: "/healtour-logo.png",
  twitter: "@healtour",
  locale: "en_US",
};

/** Absolute URL for a site-relative path. */
export const absUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return SITE.url + (path.startsWith("/") ? path : `/${path}`);
};
