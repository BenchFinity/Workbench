#!/usr/bin/env node
// Generates the company-OS division showcases (product/review.html + software/review.html)
// from content owned HERE in Workbench, into the Benchfinity company OS (default ../brand).
//
// Why: the company OS (BenchFinity/company) holds product/ and software/, but the data
// lives in Workbench. This keeps Workbench the single source of truth and emits brand-matching,
// honest-state review pages into the OS so the two never fall out of sync by hand.
//
// Brand rules applied at the source (see ../../docs and ../brand/CLAUDE.md):
//   - Honest-state: what SHIPS today is present tense; everything else is LABELED ROADMAP.
//   - Never "AI" (parametric/deterministic), never paid/pricing/monetization, never "a Gridfinity
//     generator" (it is THE platform that unifies Gridfinity generation), never hobbyist fluff.
//   - "workspace system" + "engineered to the Gridfinity standard" + build-in-the-open register.
//   - Mirrors brand/review.html + marketing/review.html: --bf-* tokens, IBM Plex Sans/Mono,
//     the 3x3 mark, and the shared CSS vocabulary.
//
// Usage:  node scripts/company-os/generate.mjs            # writes into ../brand
//         COMPANY_OS_DIR=/path/to/company node ...        # override target

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const COMPANY_OS_DIR = process.env.COMPANY_OS_DIR
  ? resolve(process.env.COMPANY_OS_DIR)
  : resolve(REPO_ROOT, "..", "brand");
const STAMP = process.env.GENERATED_STAMP || "v0.1"; // date is passed in by CI; kept out of source for determinism

const REPO = "https://github.com/BenchFinity/Workbench";
const BLOB = `${REPO}/blob/develop`;

// ---- shared presentation (mirrors brand/marketing review.html) -------------------------------

const CSS = String.raw`
  :root{
    --bf-bg:#0B0D0F; --bf-surface:#161B20; --bf-surface-2:#1E242B; --bf-border:#232A31;
    --bf-accent:#4FA39D; --bf-accent-bright:#67C7BE; --bf-text:#E7ECEF; --bf-text-muted:#8D98A1;
    --bf-signal:#E0A458; --bf-success:#5FA873; --bf-warning:#E0A458; --bf-error:#CD6457; --bf-info:#6E8FB5;
    --bf-font:"IBM Plex Sans","Inter Tight",system-ui,sans-serif;
    --bf-mono:"IBM Plex Mono",ui-monospace,monospace;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bf-bg);color:var(--bf-text);font-family:var(--bf-font);line-height:1.55;-webkit-font-smoothing:antialiased;}
  .wrap{max-width:1040px;margin:0 auto;padding:64px 28px 120px;}
  header{display:flex;flex-direction:column;gap:28px;padding-bottom:40px;border-bottom:1px solid var(--bf-border);}
  .lock{width:min(440px,80%);}
  .kicker{font-family:var(--bf-mono);font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--bf-text-muted);}
  h1{font-size:39px;font-weight:600;letter-spacing:-0.5px;margin:0;}
  h2{font-size:25px;font-weight:600;letter-spacing:-0.3px;margin:0 0 4px;}
  h3{font-size:15px;font-weight:600;margin:0;}
  .lede{color:var(--bf-text-muted);max-width:66ch;margin:0;}
  .meta{display:flex;gap:10px;flex-wrap:wrap;}
  .pill{font-family:var(--bf-mono);font-size:11px;letter-spacing:1px;padding:5px 12px;border-radius:999px;border:1px solid var(--bf-border);background:var(--bf-surface);color:var(--bf-text-muted);text-decoration:none;}
  .pill:hover{border-color:var(--bf-accent);color:var(--bf-accent-bright);}
  section{padding:46px 0;border-bottom:1px solid var(--bf-border);}
  .sec-label{font-family:var(--bf-mono);font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--bf-accent);margin-bottom:14px;}
  .grid{display:grid;gap:16px;}
  .cards-4{grid-template-columns:repeat(4,1fr);}
  .cards-3{grid-template-columns:repeat(3,1fr);}
  .cards-2{grid-template-columns:repeat(2,1fr);}
  @media(max-width:780px){.cards-4,.cards-3,.cards-2{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:520px){.cards-4,.cards-3,.cards-2{grid-template-columns:1fr;}}
  .card{background:var(--bf-surface);border:1px solid var(--bf-border);border-radius:10px;padding:20px;display:flex;flex-direction:column;gap:8px;}
  .card.tcenter{align-items:center;justify-content:center;text-align:center;}
  .card .label{font-family:var(--bf-mono);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--bf-text-muted);}
  .card .big{font-size:26px;font-weight:600;letter-spacing:-0.5px;color:var(--bf-accent-bright);}
  .card .ds{font-size:13px;color:var(--bf-text-muted);line-height:1.5;}
  .tag{font-family:var(--bf-mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--bf-text-muted);border:1px solid var(--bf-border);border-radius:999px;padding:3px 9px;align-self:flex-start;}
  .tag.lead{color:#0B0D0F;background:var(--bf-accent);border-color:var(--bf-accent);}
  .tag.signal{color:#0B0D0F;background:var(--bf-signal);border-color:var(--bf-signal);}
  .pos{background:var(--bf-surface);border-left:3px solid var(--bf-accent);border-radius:0 10px 10px 0;padding:18px 22px;color:var(--bf-text);}
  .note{font-size:13px;color:var(--bf-text-muted);margin-top:12px;}
  a.inline{color:var(--bf-accent-bright);text-decoration:none;}
  .gate{display:inline-block;font-family:var(--bf-mono);font-size:11px;letter-spacing:1px;color:var(--bf-accent-bright);border:1px solid #2c4f4c;border-radius:999px;padding:4px 12px;}
  .gate.road{color:var(--bf-signal);border-color:#5a4426;}
  .tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;}
  .tag-pill{font-family:var(--bf-mono);font-size:12px;padding:5px 11px;border-radius:999px;border:1px solid var(--bf-border);background:var(--bf-surface);}
  .tag-pill.good{color:var(--bf-accent-bright);border-color:#2c4f4c;}
  .tag-pill.bad{color:var(--bf-text-muted);text-decoration:line-through;}
  .tag-pill.kw{color:var(--bf-text);}
  .phase{display:flex;gap:16px;padding:16px 0;border-bottom:1px dashed var(--bf-border);}
  .phase:last-child{border-bottom:none;}
  .phase .pn{font-family:var(--bf-mono);font-size:12px;color:#0B0D0F;background:var(--bf-accent);border-radius:8px;width:42px;height:34px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;font-weight:600;}
  .phase .pn.road{background:var(--bf-signal);}
  .phase .pb{display:flex;flex-direction:column;gap:3px;}
  .phase .pt{font-size:15px;font-weight:600;}
  .phase .pd{font-size:13px;color:var(--bf-text-muted);line-height:1.5;}
  ul.files{list-style:none;padding:0;margin:18px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:6px;}
  @media(max-width:780px){ul.files{grid-template-columns:1fr;}}
  ul.files a{font-family:var(--bf-mono);font-size:12.5px;color:var(--bf-text);text-decoration:none;display:block;padding:9px 12px;background:var(--bf-surface);border:1px solid var(--bf-border);border-radius:7px;}
  ul.files a:hover{border-color:var(--bf-accent);color:var(--bf-accent-bright);}
  ul.files .ly{color:var(--bf-text-muted);}
  footer{margin-top:40px;color:var(--bf-text-muted);font-size:13px;}
`;

const LOCKUP = String.raw`<svg class="lock" viewBox="0 0 484 110" role="img" aria-label="Benchfinity">
  <g transform="translate(8 15) scale(0.8)">
    <g fill="none" stroke="#E7ECEF" stroke-width="4">
      <rect x="5" y="5" width="24" height="24" rx="2"/><rect x="38" y="5" width="24" height="24" rx="2"/><rect x="71" y="5" width="24" height="24" rx="2"/>
      <rect x="5" y="38" width="24" height="24" rx="2"/><rect x="71" y="38" width="24" height="24" rx="2"/>
      <rect x="5" y="71" width="24" height="24" rx="2"/><rect x="38" y="71" width="24" height="24" rx="2"/><rect x="71" y="71" width="24" height="24" rx="2"/>
    </g>
    <rect x="38" y="38" width="24" height="24" rx="2" fill="#4FA39D"/>
  </g>
  <text x="110" y="62" font-family="'IBM Plex Sans','Inter Tight',sans-serif" font-size="42" font-weight="600" letter-spacing="0.5"><tspan fill="#E7ECEF">BENCH</tspan><tspan fill="#4FA39D">FINITY</tspan></text>
  <text x="112" y="88" font-family="'IBM Plex Sans',sans-serif" font-size="11" font-weight="500" letter-spacing="4" fill="#8D98A1">BUILD YOUR WORKSPACE SYSTEM</text>
</svg>`;

// ---- tiny render helpers ---------------------------------------------------------------------

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cards = (items, cols = 3) =>
  `<div class="grid cards-${cols}" style="margin-top:18px;">` +
  items
    .map(
      (c) =>
        `<div class="card">${c.tag ? `<span class="tag ${c.tagKind || ""}">${esc(c.tag)}</span>` : ""}` +
        `<h3>${c.h}</h3><span class="ds">${c.d}</span></div>`,
    )
    .join("") +
  `</div>`;
const phases = (list) =>
  `<div style="margin-top:18px;">` +
  list
    .map(
      (p) =>
        `<div class="phase"><div class="pn ${p.road ? "road" : ""}">${esc(p.n)}</div>` +
        `<div class="pb"><span class="pt">${p.t}</span><span class="pd">${p.d}</span></div></div>`,
    )
    .join("") +
  `</div>`;
const files = (list) =>
  `<ul class="files">` +
  list.map((f) => `<li><a href="${f.href}"><span class="ly">${f.ly}</span> ${esc(f.t)}</a></li>`).join("") +
  `</ul>`;

const section = ({ label, h2, gate, gateRoad, lede, body }) =>
  `<section>
    <div class="sec-label">${label}</div>
    <h2>${h2}${gate ? `&nbsp;<span class="gate${gateRoad ? " road" : ""}">${esc(gate)}</span>` : ""}</h2>
    ${lede ? `<p class="lede">${lede}</p>` : ""}
    ${body || ""}
  </section>`;

const page = ({ titleSuffix, kicker, h1, lede, pills, sections }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Benchfinity — ${titleSuffix}</title>
<!-- GENERATED from BenchFinity/Workbench (scripts/company-os/generate.mjs). Do not edit by hand. -->
<link rel="icon" type="image/png" sizes="32x32" href="../brand/logos/exports/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="kicker">${esc(kicker)}</span>
    ${LOCKUP}
    <div>
      <h1>${h1}</h1>
      <p class="lede">${lede}</p>
    </div>
    <div class="meta">${pills.map((p) => `<a class="pill" href="${p.href}">${esc(p.t)}</a>`).join("")}</div>
  </header>
  ${sections.join("\n  ")}
  <footer>Generated from <a class="inline" href="${REPO}">BenchFinity/Workbench</a> — the product and software data is owned there and rendered here so the two never drift. Honest-state: present tense is shipped; everything labeled <span class="gate road">Roadmap</span> is planned, not built.</footer>
</div>
</body>
</html>
`;

// ---- PRODUCT division ------------------------------------------------------------------------

const productPage = page({
  titleSuffix: "Product System Review",
  kicker: `Product System Review · ${STAMP} · source: BenchFinity/Workbench`,
  h1: "Product — one coordinated workspace system.",
  lede: "What Benchfinity is and why, ahead of how it's coded. The product is owned in the Workbench repo; this page renders it for the company OS. Held to honest-state: what ships today is a Gridfinity-compatible grid generator — the rest is labeled roadmap.",
  pills: [
    { t: "← Company OS", href: "../index.html" },
    { t: "Brand showcase ↗", href: "../brand/review.html" },
    { t: "Marketing showcase ↗", href: "../marketing/review.html" },
    { t: "PRODUCT-VISION ↗", href: `${BLOB}/docs/PRODUCT-VISION.md` },
  ],
  sections: [
    section({
      label: "The frame",
      h2: "Free, open source, organization-first",
      gate: "Foundation ✓",
      lede: "Benchfinity turns a whole collection into one coordinated workspace system — measure your real drawers and spaces, generate parts engineered to the Gridfinity standard, and compose them into reusable systems. Free and open source; monetization is a non-goal.",
      body: cards(
        [
          {
            h: "Organization",
            d: "A system for the workspace, not a pile of one-off parts.",
            tag: "Purpose",
            tagKind: "lead",
          },
          {
            h: "Engineered to the Gridfinity standard",
            d: "Parts fit together and snap into what you already own. Parametric and deterministic — never &ldquo;AI.&rdquo;",
            tag: "Register",
          },
          {
            h: "One place",
            d: "The platform that unifies Gridfinity generation — not one more single-purpose generator.",
            tag: "Scope",
          },
        ],
        3,
      ),
    }),
    section({
      label: "What it generates",
      h2: "Grids today, a growing family next",
      lede: "Everything starts with a grid fit to a measured drawer. Bins that sit on grids, and stand-alone boxes, are the planned families — each a parametric generator emitting a Gridfinity-compatible footprint.",
      body: cards(
        [
          {
            h: "Grids (baseplates)",
            d: "Measure a drawer; Benchfinity fits whole Gridfinity cells, centers and pads to the real space, and auto-splits to your printer bed. Exports STL, split ZIP, and Bambu-style 3MF.",
            tag: "Ships today",
            tagKind: "lead",
          },
          {
            h: "Bins",
            d: "An open-ended family of parametric bin types — open, storage, tool-traced (from a captured outline), and collection-specific (e.g. model-railroad, sockets, wrenches). Added continuously.",
            tag: "Roadmap",
          },
          {
            h: "Stand-alone boxes",
            d: "Modular boxes that interoperate with grids and bins under the same compatibility contract, without being grid-bound.",
            tag: "Roadmap",
          },
        ],
        3,
      ),
    }),
    section({
      label: "How a system is organized",
      h2: "Collection → system, with reuse",
      gate: "Roadmap",
      gateRoad: true,
      lede: "Signed in, parts compose into real furniture and reuse across it: a System (a tool chest, an HO-railroad table) holds measured Container Types (a drawer + its grid), stamped into many identical instances with different contents, filled from a shared Component Library.",
      body:
        cards(
          [
            {
              h: "Part reuse",
              d: "A saved part (say a 2×1 scoop bin) dropped across any number of containers.",
              tag: "Reuse axis",
            },
            {
              h: "Grid reuse",
              d: "Define a drawer + grid once; stamp it across 12 identical drawers, each with unique contents.",
              tag: "Reuse axis",
            },
            {
              h: "Layout reuse",
              d: "Saved spatial arrangements of bins on a grid, remembered per drawer. The richer end-state.",
              tag: "Reuse axis",
            },
          ],
          3,
        ) +
        `<div class="pos" style="margin-top:18px;"><strong>Access line.</strong> Anyone can generate a single part, preview it in real-time 3D, and export STL/3MF with <strong>no account</strong>. Saving, reuse, and full systems are the signed-in capability — all labeled roadmap until they ship.</div>`,
    }),
    section({
      label: "Roadmap",
      h2: "Launch, then build — small increments to production",
      lede: "The grid generator goes live first; depth is added against a running, public app. A logged-in backbone and an anonymous generators track advance in parallel. Full detail in ROADMAP.md.",
      body: phases([
        {
          n: "0",
          t: "Launch — grid generator live",
          d: "Deploy the existing grid generator to production at benchfinity.com. The launch-then-build beachhead.",
        },
        {
          n: "A",
          t: "Platform spine",
          d: "Accounts, persistence, and a signed-in app shell. Backend foundation.",
          road: true,
        },
        {
          n: "B",
          t: "Grid persisted & reusable",
          d: "Save and reuse grids; container types and instances; export history. The pure generator is wrapped, never rewritten.",
          road: true,
        },
        {
          n: "C",
          t: "Bin generators",
          d: "The parametric bin family + stand-alone boxes, shipping to the live anonymous app in parallel.",
          road: true,
        },
        {
          n: "D",
          t: "Composition & visual layout",
          d: "Compose whole systems and place bins on grids visually — the rich end-state.",
          road: true,
        },
      ]),
    }),
    section({
      label: "The discipline",
      h2: "Honest-state",
      lede: "Shipped capability is present tense; the vision is labeled roadmap, never blurred. Today Benchfinity generates Gridfinity-compatible grids with real exports — orchestrating a whole collection into a coordinated system is where it's going.",
      body: `<div class="pos" style="margin-top:6px;"><span style="font-family:var(--bf-mono);font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--bf-accent-bright);display:block;margin-bottom:7px;">Output rights (fixed)</span>The platform code is AGPL-3.0; <strong>the designs you generate are yours to use, share, sell, or print</strong> — no copyleft attaches to your output.</div>`,
    }),
    section({
      label: "Source (owned in Workbench)",
      h2: "Where the product is defined",
      body: files([
        { ly: "vis", t: "docs/PRODUCT-VISION.md (authoritative)", href: `${BLOB}/docs/PRODUCT-VISION.md` },
        { ly: "map", t: "docs/ROADMAP.md (phases)", href: `${BLOB}/docs/ROADMAP.md` },
        { ly: "ops", t: "AGENTS.md (operational guide)", href: `${BLOB}/AGENTS.md` },
        { ly: "src", t: "BenchFinity/Workbench (repo)", href: REPO },
      ]),
    }),
  ],
});

// ---- SOFTWARE division -----------------------------------------------------------------------

const softwarePage = page({
  titleSuffix: "Software System Review",
  kicker: `Software System Review · ${STAMP} · source: BenchFinity/Workbench`,
  h1: "Software — engineered in the open.",
  lede: "The platform is open source (AGPL-3.0) and lives in a separate repo; this division holds company-side references. Rendered from Workbench so the stack, architecture, and status never drift. Honest-state throughout: shipped vs. labeled roadmap.",
  pills: [
    { t: "← Company OS", href: "../index.html" },
    { t: "Brand showcase ↗", href: "../brand/review.html" },
    { t: "Workbench repo ↗", href: REPO },
    { t: "ROADMAP ↗", href: `${BLOB}/docs/ROADMAP.md` },
  ],
  sections: [
    section({
      label: "The frame",
      h2: "Open source, separate repo, brand-aligned",
      gate: "Foundation ✓",
      lede: "The code is BenchFinity/Workbench — public, AGPL-3.0, default branch develop. It is not mirrored into the company OS; this division references it. When it builds UI, it consumes the brand tokens rather than redefining them.",
      body: cards(
        [
          {
            h: "AGPL-3.0",
            d: "Copyleft on the code. Your generated designs are yours.",
            tag: "License",
            tagKind: "lead",
          },
          {
            h: "Client-only today",
            d: "A Vite + React + Three.js app that runs entirely in the browser — near-zero hosting cost.",
            tag: "Shipped",
          },
          {
            h: "Brand tokens, not redefined",
            d: "The product UI should compile brand/colors.md + typography.md into its theme.",
            tag: "Convention",
          },
        ],
        3,
      ),
    }),
    section({
      label: "The stack",
      h2: "What runs, and what's planned",
      lede: "The frontend and the deploy pipeline ship today. The backend is a deliberate, labeled roadmap addition for accounts and persistence.",
      body: cards(
        [
          {
            h: "Frontend",
            d: "Vite + React + TypeScript + Three.js. Real-time 3D preview; STL, split-ZIP, and Bambu-style 3MF export. The quality bar.",
            tag: "Ships today",
            tagKind: "lead",
          },
          {
            h: "Geometry & export core",
            d: "Pure TypeScript (no React/DOM/storage) — centered-padded sizing, bed-fit split planning, mesh + 3MF generation. Tested.",
            tag: "Ships today",
            tagKind: "lead",
          },
          {
            h: "Delivery / ops",
            d: "Distroless Chainguard images, multi-arch GHCR publish, Helm chart, HIGH+ security gates (audit, dependency-review, Trivy, CodeQL), signed commits.",
            tag: "Ships today",
            tagKind: "lead",
          },
          {
            h: "Backend",
            d: "A QQQ + Postgres service for accounts, persistence, and admin — the spine that saved/reusable systems need.",
            tag: "Roadmap",
          },
        ],
        2,
      ),
    }),
    section({
      label: "Architecture",
      h2: "A pure core, wrapped — never rewritten",
      lede: "The geometry/validation/export core stays free of framework, DOM, and storage. Persistence and new generators wrap it; the math is never reimplemented. This is also what makes a pluggable generator family possible.",
      body: cards(
        [
          {
            h: "Pure generation core",
            d: "Inputs in, geometry + export out. Deterministic and unit-tested, independent of any UI.",
            tag: "Boundary",
          },
          {
            h: "Pluggable generators",
            d: "Each part type (grid, each bin, stand-alone box) is a self-contained pure module emitting a Gridfinity-compatible footprint.",
            tag: "Roadmap",
          },
          {
            h: "Persistence seam",
            d: "Designs persist as inputs + derived metadata; 3D meshes are recomputed on load, never stored.",
            tag: "Roadmap",
          },
        ],
        3,
      ),
    }),
    section({
      label: "Modules",
      h2: "The software division map",
      lede: "The company-OS software/ subfolders hold references; the implementations live in Workbench.",
      body: phases([
        {
          n: "web",
          t: "Web app",
          d: "The React + Three.js generator UI and app shell. Shipping (grid generator); app shell is roadmap.",
        },
        { n: "core", t: "Generation core", d: "Pure geometry, validation, and split planning. Shipping." },
        { n: "gen", t: "Generators", d: "The bin/box plugin family. Roadmap.", road: true },
        { n: "cli", t: "CLI", d: "Headless/batch generation. Not started.", road: true },
        {
          n: "int",
          t: "Integrations",
          d: "Slicer-friendly export and capture (photo/scan/measurement) inputs. Roadmap.",
          road: true,
        },
      ]),
    }),
    section({
      label: "Source (owned in Workbench)",
      h2: "Where the software is defined",
      body: files([
        { ly: "src", t: "BenchFinity/Workbench (repo)", href: REPO },
        { ly: "ops", t: "AGENTS.md (architecture boundaries)", href: `${BLOB}/AGENTS.md` },
        { ly: "map", t: "docs/ROADMAP.md", href: `${BLOB}/docs/ROADMAP.md` },
        { ly: "dep", t: "docs/DEPLOY.md", href: `${BLOB}/docs/DEPLOY.md` },
      ]),
    }),
  ],
});

// ---- write -----------------------------------------------------------------------------------

const targets = [
  { rel: "product/review.html", html: productPage },
  { rel: "software/review.html", html: softwarePage },
];

if (!existsSync(COMPANY_OS_DIR)) {
  console.error(`Company OS dir not found: ${COMPANY_OS_DIR} (set COMPANY_OS_DIR to override)`);
  process.exit(1);
}

for (const t of targets) {
  const out = resolve(COMPANY_OS_DIR, t.rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, t.html);
  console.log(`wrote ${out} (${t.html.length} bytes)`);
}
