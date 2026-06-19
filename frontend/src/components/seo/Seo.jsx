import { Helmet } from "react-helmet-async";
import { SITE, absUrl } from "../../seo/siteConfig";

/**
 * Seo — per-page <head> manager (title, description, canonical, OpenGraph,
 * Twitter cards, and JSON-LD Schema.org blocks) via react-helmet-async.
 *
 * Props:
 *   title       bare page title; " · Healtour" is appended (omit on home)
 *   description meta description (falls back to the site default)
 *   path        site-relative path for canonical + og:url (e.g. "/treatments")
 *   image       absolute or site-relative OG image (defaults to the brand image)
 *   type        OG type ("website" | "article" | "profile" …)
 *   noindex     emit robots noindex,nofollow (auth / utility pages)
 *   jsonLd      one Schema.org object or an array of them
 */
export default function Seo({ title, description, path, image, type = "website", noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} · ${SITE.name}` : SITE.defaultTitle;
  const desc = (description || SITE.description).slice(0, 300);
  const url = path ? absUrl(path) : SITE.url;
  const img = absUrl(image || SITE.ogImage);
  const blocks = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean);

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}
      <link rel="canonical" href={url} />

      {/* OpenGraph */}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content={SITE.locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {/* Schema.org JSON-LD */}
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(block)}</script>
      ))}
    </Helmet>
  );
}
