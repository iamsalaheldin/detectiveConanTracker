// scripts/scrape.mjs
// One-time / refresh scraper: builds data/episodes.js from Arabic Wikipedia.
// Usage:  node scripts/scrape.mjs
// Node 18+ (built-in fetch). No external dependencies.
//
// Source: "قائمة حلقات المحقق كونان" + per-season sub-pages on ar.wikipedia.org.
// Each season page has a wikitable where every episode is a 6-cell row:
//   [ # (JP) | # (AR) | العنوان (<b>title</b> + japanese) | عنوان الدبلجة | في المانغا | تاريخ العرض ]
// followed by a <td colspan="6"> synopsis row.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = "https://ar.wikipedia.org/w/api.php";
const UA = "DetectiveConanWatchTracker/1.0 (personal project)";
const MAIN = "قائمة حلقات المحقق كونان";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "episodes.js");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function api(params, attempt = 0) {
  const u = API + "?" + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (r.status === 429 && attempt < 6) {
    const wait = 2000 * 2 ** attempt; // 2s, 4s, 8s, 16s, 32s, 64s
    console.warn(`    429 rate-limited, backing off ${wait / 1000}s…`);
    await sleep(wait);
    return api(params, attempt + 1);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${params.page}`);
  return r.json();
}

// --- tiny HTML helpers -----------------------------------------------------
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");

const stripTags = (s) => decode(s.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();

// Japanese (kana/kanji) + fullwidth brackets. Titles on arwiki sometimes glue the
// original Japanese title onto the Arabic one; cut everything from the first such char.
const CJK = /[぀-ヿ㐀-鿿＀-￯「」『』]/;
const cleanTitle = (s) => {
  const t = stripTags(s);
  const i = t.search(CJK);
  return (i >= 0 ? t.slice(0, i) : t).replace(/\s+/g, " ").replace(/[-–،,]\s*$/, "").trim();
};

// Extract cells (th/td) inner-HTML from a single <tr> block.
function cellsOf(rowHtml) {
  const cells = [];
  const re = /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(rowHtml))) cells.push(m[2]);
  return cells;
}

// The season pages use several column layouts over the years (4, 6, 7 cells).
// Rather than hard-code positions, detect each field by content:
//   number  = the first cell that is purely a digit/range
//   title   = the cell carrying a <b>…</b> literal Arabic title
//   kind    = the cell mentioning فصل (manga chapter) / فلر (filler) / متفرقات
//   airDate = the cell containing a 19xx / 20xx year
function parseSeason(html, season) {
  const out = [];
  const rows = html.split(/<\/tr>/i);
  for (const row of rows) {
    const cells = cellsOf(row);
    if (cells.length < 2) continue;

    // strip footnote <sup> markers (e.g. the "س." special-episode flag) before reading the number
    const numRaw = stripTags(cells[0].replace(/<sup\b[\s\S]*?<\/sup>/gi, ""));
    if (!/\d/.test(numRaw)) continue; // must contain an episode number

    const titleIndex = cells.findIndex((c) => /<b>/i.test(c));
    if (titleIndex < 0) continue; // every episode row has a bold title
    const title = cleanTitle(cells[titleIndex].match(/<b>([\s\S]*?)<\/b>/i)[1]);
    if (!title || /^\d+$/.test(title)) continue; // skip stray rows whose bold is just a number

    const text = cells.map((c) => stripTags(c.replace(/<sup\b[\s\S]*?<\/sup>/gi, "")));
    const mangaCell = text.find((t) => /فلر|فصل|متفرقات|مانغا/.test(t)) || "";
    const dateCell = text.find((t) => /\b(?:19|20)\d{2}\b/.test(t)) || "";
    const kind = /فلر/.test(mangaCell) ? "filler" : "canon";

    // Arabic-dub title lives in the cell right after the title (when present).
    const dubRaw = text[titleIndex + 1] || "";
    const dub =
      dubRaw &&
      dubRaw !== mangaCell &&
      dubRaw !== dateCell &&
      !/^\d+$/.test(dubRaw) &&
      !/فلر|فصل|متفرقات/.test(dubRaw)
        ? cleanTitle(dubRaw)
        : "";

    const nums = numRaw.match(/\d+/g).map(Number);
    const number = nums[0];
    const endNumber = nums.length > 1 ? nums[nums.length - 1] : number;

    out.push({
      number,
      endNumber,
      numberLabel: numRaw.replace(/\s+/g, ""),
      title,
      dubTitle: dub && dub !== title ? dub : "",
      kind,
      manga: mangaCell,
      airDate: dateCell,
      season,
    });
  }
  return out;
}

async function main() {
  console.log("Discovering season sub-pages…");
  const linksData = await api({ action: "parse", page: MAIN, prop: "links" });
  const seasonPages = (linksData.parse.links || [])
    .map((l) => l.title)
    .filter((t) => /^المحقق كونان \(الموسم \d+\)$/.test(t))
    .map((t) => ({ title: t, n: +t.match(/(\d+)/)[1] }))
    .sort((a, b) => a.n - b.n);

  console.log(`Found ${seasonPages.length} season pages.`);

  const all = [];
  for (const sp of seasonPages) {
    try {
      const d = await api({ action: "parse", page: sp.title, prop: "text" });
      const eps = parseSeason(d.parse.text, sp.n);
      console.log(`  الموسم ${String(sp.n).padStart(2)}: ${eps.length} episodes`);
      all.push(...eps);
    } catch (e) {
      console.warn(`  ! season ${sp.n} failed: ${e.message}`);
    }
    await sleep(2500); // be polite to the Wikipedia API
  }

  // dedupe by number (keep first), then sort
  const seen = new Set();
  const deduped = [];
  for (const e of all.sort((a, b) => a.number - b.number)) {
    if (seen.has(e.number)) continue;
    seen.add(e.number);
    deduped.push(e);
  }

  const fillers = deduped.filter((e) => e.kind === "filler").length;
  console.log(
    `\nTotal: ${deduped.length} episodes (canon ${deduped.length - fillers}, filler ${fillers}).`
  );
  console.log(`Range: ${deduped[0]?.number} … ${deduped[deduped.length - 1]?.number}`);

  const banner =
    "// AUTO-GENERATED by scripts/scrape.mjs from Arabic Wikipedia. Do not edit by hand.\n" +
    "// Re-run:  node scripts/scrape.mjs\n";
  const body = "window.DC_EPISODES = " + JSON.stringify(deduped) + ";\n";
  await writeFile(OUT, banner + body, "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
