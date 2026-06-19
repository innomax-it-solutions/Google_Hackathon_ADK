/**
 * generate-sitemap.mjs — build public/sitemap.xml + robots.txt from the static
 * content snapshot. Run via `npm run sitemap` (also wired as `prebuild`).
 *
 * Base origin comes from SITE_URL (or VITE_SITE_URL); defaults to a placeholder
 * so the file is valid even before the real domain is configured.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA = resolve(ROOT, "src/data/healtour");

const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://www.healtour.com").replace(/\/+$/, "");

async function load(name) {
  try {
    return JSON.parse(await readFile(resolve(DATA, `${name}.json`), "utf8"));
  } catch {
    console.warn(`[sitemap] could not read ${name}.json — skipping`);
    return [];
  }
}

const slugs = (rows) => rows.map((r) => r.slug).filter(Boolean);

// Static, indexable routes (auth/app routes are intentionally excluded).
const STATIC = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/treatments", priority: "0.9", changefreq: "weekly" },
  { path: "/hospitals", priority: "0.9", changefreq: "weekly" },
  { path: "/doctors", priority: "0.9", changefreq: "weekly" },
  { path: "/specialties", priority: "0.8", changefreq: "monthly" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  { path: "/stories", priority: "0.6", changefreq: "monthly" },
  { path: "/wellness", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "yearly" },
  { path: "/partner", priority: "0.5", changefreq: "yearly" },
  { path: "/opinion", priority: "0.6", changefreq: "yearly" },
];

const xmlEscape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function urlNode(path, { priority = "0.7", changefreq = "monthly", lastmod } = {}) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(SITE_URL + path)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

async function main() {
  const [treatments, hospitals, doctors, departments, blogs, stories, wellness] = await Promise.all([
    load("treatments"), load("hospitals"), load("doctors"), load("departments"),
    load("blogs"), load("stories"), load("wellness"),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const nodes = [];

  for (const s of STATIC) nodes.push(urlNode(s.path, { ...s, lastmod: today }));

  const dynamic = [
    ["/treatments", slugs(treatments), "0.7"],
    ["/hospitals", slugs(hospitals), "0.7"],
    ["/doctors", slugs(doctors), "0.6"],
    ["/specialties", slugs(departments), "0.6"],
    ["/blog", slugs(blogs), "0.6"],
    ["/stories", slugs(stories), "0.5"],
    ["/wellness", slugs(wellness), "0.5"],
  ];
  for (const [base, list, priority] of dynamic) {
    for (const slug of list) nodes.push(urlNode(`${base}/${slug}`, { priority, changefreq: "monthly" }));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nodes.join("\n")}
</urlset>
`;
  await writeFile(resolve(ROOT, "public/sitemap.xml"), xml, "utf8");

  const robots = `User-agent: *
Allow: /
Disallow: /login
Disallow: /register
Disallow: /chat
Disallow: /form
Disallow: /forms
Disallow: /wishlist

Sitemap: ${SITE_URL}/sitemap.xml
`;
  await writeFile(resolve(ROOT, "public/robots.txt"), robots, "utf8");

  console.log(`[sitemap] wrote ${nodes.length} URLs to public/sitemap.xml (base: ${SITE_URL})`);
}

main().catch((e) => {
  console.error("[sitemap] failed:", e);
  process.exit(1);
});
