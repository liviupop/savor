# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — serve the site locally at http://127.0.0.1:8765 (`python3 -m http.server`). No build step; edits are live on refresh.
- `npm run deploy` — publish the working tree to Cloudflare Pages (`wrangler pages deploy . --project-name=savor --branch=main`). Uses an isolated npm cache at `/private/tmp/savor-npm-cache`.

The working directory lives inside iCloud Drive (`com~apple~CloudDocs/savor`). Always quote the path in shell commands — the unescaped tilde and spaces will otherwise break.

## Architecture

Static site. There is no framework, bundler, package manager runtime, or test suite — just hand-written HTML files that all link to one shared stylesheet and (for the deck) one web component.

### Pages

Top-level HTML files are numbered to reflect the storyboard order, not a routing scheme:

- `01-design-system.html` — identity / tokens reference page.
- `02-website.html` — the public homepage. This is the canonical entry point: both `index.html` (meta-refresh) and `_redirects` (Cloudflare Pages 302) send `/` here.
- `03-search.html`, `04-recipe.html` — Tavola register (warm/serif) consumer-facing pages.
- `05-dataset.html` — Lab register (cool/sans) docs page; uses `<body class="lab">`.
- `06-deck.html` — slide deck built on the `<deck-stage>` web component.

### Design system (`assets/savor.css`)

Single source of truth for tokens, type scale, and primitives. Two visual *registers* share the token set:

- **Tavola** (default) — Fraunces serif display, terracotta/ochre/aubergine palette. Used for website, search, recipes.
- **Lab** — opt-in by adding `class="lab"` to `<body>`. Overrides headings to Montserrat, switches accents to a cooler blue (`--lab-mark`), used for dataset/schema/docs.

Both registers carry the same accent thread (`--terracotta` / `--lab-accent` are the same red) so they read as one system. The Italian/Romanian bilingual concept drives several primitives: `.bilingual` grid for RO|IT title pairs, `.chip.lang` for language tags, and three handwritten "marginalia" fonts (`.margin-note.cook|.scholar|.translator`) that each map to a different voice.

When adding a page, link `assets/savor.css`, then reach for the existing primitives (`.nav`, `.foot`, `.container`, `.h-display/.h-1/.h-2`, `.eyebrow`, `.lede`, `.chip`, `.btn`) before writing new CSS. Page-specific styles go in a `<style>` block in the page itself — there is no per-page stylesheet convention.

### Deck (`assets/deck-stage.js`)

`<deck-stage>` is a self-contained web component used only by `06-deck.html`. It renders a fixed 1920×1080 canvas of `<section>` slides, auto-scaling to fit the viewport, with keyboard nav, a slidechange CustomEvent, speaker-notes JSON, and a print stylesheet that yields one-slide-per-page PDFs. Slides are hidden (not unmounted) on nav, so iframe/video/form state survives. The header comment in `assets/deck-stage.js` is the API reference — read it before modifying deck behavior.

### Assets

- `assets/` — production assets shipped with the site (logos, css, deck JS).
- `uploads/` — older / alternate logo variants kept around because some pages reference them by hashed names (e.g. `logo_savor_white-1dbd33c3.png`). Don't assume files here are unused without grepping.
- Root-level PNGs (e.g. `*-clean.png`, `montserrat-home.png`) are local verification screenshots and are gitignored.

### Site-root metadata files

These live at the repo root and ship as-is:

- `_redirects` — Cloudflare Pages redirects (root → `02-website.html`).
- `_headers` — Cloudflare Pages response headers. Sets `Link: </sitemap.xml>; rel="sitemap"` on every URL and forces correct `Content-Type` on the metadata files below.
- `robots.txt` — RFC 9309 crawl rules with explicit entries for AI crawlers (GPTBot, ClaudeBot, Google-Extended, etc.) and a Content-Signal directive (`ai-train=yes, search=yes, ai-input=yes`). Sitemap line uses an absolute URL (`https://savor.pages.dev/sitemap.xml`).
- `sitemap.xml` — canonical URL list. **When publishing a content change, bump `<lastmod>` on the affected URL** (and add a `<url>` entry if you added a new HTML page).
- `.well-known/agent-skills/index.json` — Agent Skills Discovery (RFC v0.2.0) index. Currently `skills: []` because the site exposes no agent-callable tools; populate it if/when WebMCP or hosted skills are added.

The canonical base URL is hard-coded as `https://savor.pages.dev` in `robots.txt` and `sitemap.xml`. If a custom domain is wired up, do a find-and-replace across both files.

**Markdown for Agents** (Cloudflare runtime feature that returns `text/markdown` when `Accept: text/markdown` is sent) is *not* a file change — enable it on the Cloudflare Pages dashboard for the `savor` project, or front the site with a Worker that does the negotiation.
