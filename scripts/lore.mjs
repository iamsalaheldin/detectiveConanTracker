// scripts/lore.mjs
// Scrapes factual reference lists from the Detective Conan World wiki into data/lore.js:
//   - songs    : opening/ending/theme TITLES + performer credits (no lyrics)
//   - volumes  : manga volume number, chapters, first JP release date
//   - ovas     : OVA number + title + airdate
//   - specials : TV special title + airdate
//   - magicKaito: Magic Kaito 1412 episodes (number + title)
// Usage:  node scripts/lore.mjs   (Node 18+, built-in fetch, no deps)

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const UA = "DetectiveConanWatchTracker/1.0 (personal project)";
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "lore.js");

const strip = (s) =>
  s.replace(/<[^>]*>/g, "").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
const firstDate = (s) => {
  var m = strip(s).match(/[A-Z][a-z]+ \d{1,2}, \d{4}/);
  return m ? m[0] : "";
};
const yearOf = (s) => { var m = (s || "").match(/\b(19|20)\d{2}\b/); return m ? m[0] : ""; };

async function get(page) {
  const r = await fetch("https://www.detectiveconanworld.com/wiki/" + page, {
    headers: { "User-Agent": UA },
  });
  if (!r.ok) throw new Error("HTTP " + r.status + " for " + page);
  return r.text();
}

const rowsOf = (tableHtml) =>
  tableHtml.split(/<\/tr>/i).map((r) =>
    [...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => strip(m[1]))
  );

function tablesWithHeadings(html) {
  const heads = [...html.matchAll(/<h[234]\b[^>]*>([\s\S]*?)<\/h[234]>/g)].map((m) => ({
    pos: m.index, text: strip(m[1]).replace(/\[edit\]/i, "").trim(),
  }));
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => ({ pos: m.index, html: m[0] }));
  return tables.map((t) => {
    let section = "";
    for (const h of heads) if (h.pos < t.pos) section = h.text;
    return { section, html: t.html };
  });
}

async function scrapeSongs() {
  const html = await get("Music");
  const out = [];
  for (const { section, html: th } of tablesWithHeadings(html)) {
    const rows = rowsOf(th);
    const header = rows.find((r) => r.length) || [];
    if (!header.some((c) => /Artist/i.test(c))) continue; // only song tables
    if (!/opening|ending|theme/i.test(section)) continue; // OP/ED/theme sections only
    const ai = header.findIndex((c) => /Artist/i.test(c));
    const ti = header.findIndex((c) => /Song name|Title/i.test(c));
    const ei = header.findIndex((c) => /Episode/i.test(c));
    const di = header.findIndex((c) => /Release|date/i.test(c));
    rows.forEach((c) => {
      if (c.length < 4 || !/^\d/.test(c[0]) || c === header) return;
      const title = ti >= 0 ? c[ti] : c[2];
      const artist = ai >= 0 ? c[ai] : c[3];
      if (!title || !artist) return;
      out.push({
        section,
        n: parseInt(c[0], 10),
        title,
        artist,
        episodes: ei >= 0 ? c[ei] : "",
        year: yearOf(di >= 0 ? c[di] : ""),
      });
    });
  }
  return out;
}

async function scrapeVolumes() {
  const html = await get("Manga");
  const out = [];
  for (const { html: th } of tablesWithHeadings(html)) {
    if (!/Chapters/i.test(th) || !/Vol/i.test(th)) continue;
    rowsOf(th).forEach((c) => {
      if (c.length < 3 || !/^\d+$/.test(c[0])) return;
      out.push({ vol: parseInt(c[0], 10), chapters: c[1], date: firstDate(c[2] || "") });
    });
  }
  // dedupe by vol
  const seen = {}, uniq = [];
  out.sort((a, b) => a.vol - b.vol).forEach((v) => { if (!seen[v.vol]) { seen[v.vol] = 1; uniq.push(v); } });
  return uniq;
}

// Listing pages (OVAs, TV specials) interleave description rows and sometimes nest
// tables, so parse every <tr> across the whole page and keep the [num, title, date] rows.
async function scrapeListing(page) {
  const html = await get(page);
  const out = [], seen = {};
  for (const r of html.split(/<\/tr>/i)) {
    const c = [...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => strip(m[1]));
    if (c.length < 2) continue;
    if (!/^\d{1,3}$/.test(c[0])) continue;          // first cell is a small number
    const title = c[1];
    if (!title || title.length < 4 || /^\d/.test(title) || /^ISBN/i.test(title)) continue;
    const n = parseInt(c[0], 10);
    const key = n + "|" + title;
    if (seen[key]) continue;
    seen[key] = 1;
    out.push({ n: n, title: title, date: c.map(firstDate).find(Boolean) || "" });
  }
  return out.sort((a, b) => a.n - b.n);
}

async function main() {
  console.log("Scraping songs (Music)…");
  const songs = await scrapeSongs();
  console.log("  songs:", songs.length, "| sections:", [...new Set(songs.map((s) => s.section))].join(" | "));

  console.log("Scraping volumes (Manga)…");
  const volumes = await scrapeVolumes();
  console.log("  volumes:", volumes.length, "(max vol", volumes.length ? volumes[volumes.length - 1].vol : 0, ")");

  console.log("Scraping OVAs / TV Specials…");
  const ovas = await scrapeListing("OVAs");
  const specials = await scrapeListing("TV_Specials");
  console.log("  ovas:", ovas.length, "| specials:", specials.length);

  const banner =
    "// AUTO-GENERATED by scripts/lore.mjs from detectiveconanworld.com.\n" +
    "// Song entries are titles + performer credits only (no lyrics). Re-run: node scripts/lore.mjs\n";
  const data = { songs, volumes, ovas, specials };
  await writeFile(OUT, banner + "window.DC_LORE = " + JSON.stringify(data) + ";\n", "utf8");
  console.log("Wrote " + OUT);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
