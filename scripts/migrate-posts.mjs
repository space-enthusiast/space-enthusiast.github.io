import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "_posts";
const DST = "src/content/blog";

// Parse a tiny subset of frontmatter YAML we actually use in Jekyll posts.
// Supports: scalar (quoted or bare), inline arrays like [a, b, c].
function parseFrontmatter(raw) {
  const out = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];

    if (val.startsWith("[") && val.endsWith("]")) {
      // inline array
      val = val
        .slice(1, -1)
        .split(",")
        .map(s => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function splitDocument(raw) {
  if (!raw.startsWith("---")) return { fm: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: raw };
  const fmRaw = raw.slice(3, end).replace(/^\r?\n/, "");
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  return { fm: parseFrontmatter(fmRaw), body };
}

const SQL_KW = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|GRANT|SET|REVOKE|TRUNCATE|COMMIT|ROLLBACK|BEGIN|END|MERGE|EXPLAIN|USE|SHOW|FROM|WHERE|JOIN|VALUES)\b/i;

function extractDescription(body) {
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^[#>\-*+`|]/.test(line)) continue;       // headers, lists, blockquotes, code fences, table rows
    if (/^\d+\.\s/.test(line)) continue;          // numbered lists
    if (/^!\[.*\]\(.*\)$/.test(line)) continue;   // bare image
    if (SQL_KW.test(line)) continue;              // SQL-looking code
    if (/[;{}]\s*$/.test(line) && /[A-Za-z_][A-Za-z_0-9]*\s*\(/.test(line)) continue; // code call
    let desc = line
      .replace(/`/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1");
    if (desc.length > 160) desc = desc.slice(0, 157).trimEnd() + "...";
    return desc;
  }
  return "";
}

function toSlug(filename) {
  // e.g. 2023-11-05-database_study_chapter_1.markdown
  //   -> database-study-chapter-1
  return filename
    .replace(/\.(markdown|md)$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/_/g, "-")
    .toLowerCase();
}

function pickDate(fm, filename) {
  if (fm.date) {
    const d = new Date(fm.date);
    if (!isNaN(d.valueOf())) return d.toISOString().slice(0, 10);
  }
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
  return m ? m[1] : "1970-01-01";
}

function yamlQuote(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildFrontmatter({ title, description, date, tags, categories }) {
  const lines = ["---"];
  lines.push(`title: ${yamlQuote(title)}`);
  lines.push(`description: ${yamlQuote(description)}`);
  lines.push(`date: ${date}`);
  if (Array.isArray(tags) && tags.length) {
    lines.push(`tags: [${tags.map(t => yamlQuote(t)).join(", ")}]`);
  }
  if (Array.isArray(categories) && categories.length) {
    lines.push(`categories: [${categories.map(c => yamlQuote(c)).join(", ")}]`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

async function main() {
  if (!existsSync(DST)) await mkdir(DST, { recursive: true });

  const files = (await readdir(SRC)).filter(f => /\.(markdown|md)$/.test(f));
  for (const f of files) {
    const raw = await readFile(path.join(SRC, f), "utf8");
    const { fm, body } = splitDocument(raw);
    const slug = toSlug(f);
    const date = pickDate(fm, f);
    const title = fm.title || slug;
    const extracted = extractDescription(body);
    const description = extracted && extracted.length >= 8 ? extracted : title;
    const tags = Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []);
    const categories = Array.isArray(fm.categories)
      ? fm.categories
      : (fm.categories ? [fm.categories] : []);

    const out = buildFrontmatter({ title, description, date, tags, categories }) + body;
    const outPath = path.join(DST, `${slug}.md`);
    await writeFile(outPath, out);
    console.log(`${f}  ->  ${outPath}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
