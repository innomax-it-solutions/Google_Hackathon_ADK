// Schema.org JSON-LD builders. Each returns a plain object consumed by <Seo jsonLd>.
import { SITE, absUrl } from "./siteConfig";
import { CONTACT, SOCIAL_LINKS } from "../data/shellData";

const text = (s) => String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** "DD-MM-YYYY" → "YYYY-MM-DD" (ISO date); returns undefined if unparseable. */
function toISODate(raw) {
  const m = String(raw || "").match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return undefined;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: absUrl(SITE.ogImage),
    description: SITE.description,
    address: { "@type": "PostalAddress", addressLocality: CONTACT.address, addressCountry: "IN" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: "customer support",
      availableLanguage: ["en"],
    },
    sameAs: SOCIAL_LINKS.map((s) => s.href),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** items: [{ name, path }] in order (Home first). */
export function breadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function medicalProcedureSchema(t, path) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: t.name,
    description: text(t.shortDescription || t.description).slice(0, 300),
    url: absUrl(path),
    ...(t.department ? { howPerformed: t.department } : {}),
    provider: { "@type": "MedicalOrganization", name: SITE.name, url: SITE.url },
  };
}

export function hospitalSchema(h, path) {
  return {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: h.name,
    url: absUrl(path),
    description: text(h.description).slice(0, 300),
    ...(h.phone ? { telephone: h.phone } : {}),
    ...(h.email ? { email: h.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: h.address || undefined,
      addressLocality: h.city || undefined,
      addressRegion: h.state || undefined,
      addressCountry: h.country || undefined,
    },
    ...(h.departments?.length ? { medicalSpecialty: h.departments } : {}),
  };
}

export function physicianSchema(d, path) {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: d.name,
    url: absUrl(path),
    ...(d.designation ? { description: d.designation } : {}),
    ...(d.departments?.length ? { medicalSpecialty: d.departments } : {}),
    ...(d.hospital ? { worksFor: { "@type": "Hospital", name: d.hospital } } : {}),
  };
}

export function medicalSpecialtySchema(dep, path) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: dep.name,
    url: absUrl(path),
    description: text(dep.description).slice(0, 300),
    about: { "@type": "MedicalSpecialty", name: dep.name },
  };
}

export function articleSchema(a, path, { assetDir } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: text(a.excerpt).slice(0, 300),
    url: absUrl(path),
    ...(a.photo ? { image: absUrl(`/uploads/${a.photo}`) } : {}),
    ...(toISODate(a.date) ? { datePublished: toISODate(a.date) } : {}),
    ...(a.publisher ? { author: { "@type": "Person", name: a.publisher } } : {}),
    ...(a.category ? { articleSection: a.category } : {}),
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absUrl(SITE.ogImage) },
    },
  };
}

export function wellnessSchema(w, path, price) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: w.name,
    description: text(w.shortDescription || w.description).slice(0, 300),
    url: absUrl(path),
    category: "Wellness package",
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            price: price.final,
            priceCurrency: price.symbol === "$" ? "USD" : "INR",
            availability: "https://schema.org/InStock",
            url: absUrl(path),
          },
        }
      : {}),
  };
}
