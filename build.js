#!/usr/bin/env node
/**
 * TimeCalc build script.
 * Reads src/index.html and produces dist/ with one SEO-optimised page per calculator,
 * shared assets, and a sitemap.
 *
 * Usage: node build.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./calculators.config.js');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src', 'index.html');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');

// ---------- helpers ----------
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Find <section ... id="X" ...> and return its outer HTML plus start/end indices.
function findSection(html, id) {
  const pattern = new RegExp('<section[^>]*\\sid="' + id + '"[^>]*>', 'i');
  const match = pattern.exec(html);
  if (!match) return null;

  const startIndex = match.index;
  let i = match.index + match[0].length;
  let depth = 1;
  const openRe = /<section\b[^>]*>/gi;
  const closeRe = /<\/section>/gi;

  while (i < html.length && depth > 0) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);
    if (!nextClose) break;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      i = nextOpen.index + nextOpen[0].length;
    } else {
      depth--;
      i = nextClose.index + nextClose[0].length;
    }
  }
  return { start: startIndex, end: i, html: html.slice(startIndex, i) };
}

// Move one section to just before another. No-op if already in position.
function moveSectionBefore(html, moveId, targetId) {
  const moveSection = findSection(html, moveId);
  const targetSection = findSection(html, targetId);
  if (!moveSection || !targetSection) return html;
  if (moveSection.start < targetSection.start) return html;

  const movedHtml = moveSection.html;
  const withoutMoved = html.slice(0, moveSection.start) + html.slice(moveSection.end);

  const newTarget = findSection(withoutMoved, targetId);
  if (!newTarget) return html;

  return withoutMoved.slice(0, newTarget.start)
    + movedHtml
    + '\n\n  '
    + withoutMoved.slice(newTarget.start);
}

// Insert content immediately after the closing tag of a section.
function injectAfterSection(html, id, content) {
  const section = findSection(html, id);
  if (!section) return html;
  return html.slice(0, section.end) + '\n\n  ' + content + '\n\n  ' + html.slice(section.end);
}

// ---------- read source ----------
if (!fs.existsSync(SRC)) {
  console.error('Error: src/index.html not found.');
  console.error('Move your existing single-file app to src/index.html first.');
  process.exit(1);
}

const source = fs.readFileSync(SRC, 'utf8');

// ---------- extract CSS ----------
const styleOpen = source.indexOf('<style>');
const styleClose = source.indexOf('</style>', styleOpen);
if (styleOpen === -1 || styleClose === -1) {
  console.error('Error: could not find <style> block in source.');
  process.exit(1);
}
const css = source.slice(styleOpen + '<style>'.length, styleClose).trim();

// ---------- extract main JS (the last <script> before </body>) ----------
const bodyClose = source.lastIndexOf('</body>');
const scriptClose = source.lastIndexOf('</script>', bodyClose);
const scriptOpen = source.lastIndexOf('<script>', scriptClose);
if (scriptOpen === -1 || scriptClose === -1) {
  console.error('Error: could not find main <script> block in source.');
  process.exit(1);
}
let js = source.slice(scriptOpen + '<script>'.length, scriptClose);

// Patch the default calculator so split pages can override it via window.__TIMECALC_DEFAULT__.
js = js.replace(
  /calcId:\s*'duration'/,
  "calcId: (typeof window !== 'undefined' && window.__TIMECALC_DEFAULT__) || 'duration'"
);

// ---------- build the HTML shell ----------
let shell = source;

shell = shell.slice(0, styleOpen) +
  '<link rel="stylesheet" href="{ASSET_PATH}style.css">' +
  shell.slice(styleClose + '</style>'.length);

const scriptClose2 = shell.lastIndexOf('</script>', shell.lastIndexOf('</body>'));
const scriptOpen2 = shell.lastIndexOf('<script>', scriptClose2);
shell = shell.slice(0, scriptOpen2) +
  '<script src="{ASSET_PATH}script.js"></script>' +
  shell.slice(scriptClose2 + '</script>'.length);

// ---------- clean output ----------
rmDir(DIST);
ensureDir(ASSETS);
writeFile(path.join(ASSETS, 'style.css'), css);
writeFile(path.join(ASSETS, 'script.js'), js);

// ---------- write sitemap and robots ----------
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    ...config.calculators.map(c => ({
      loc: '/' + c.slug + '/',
      priority: '0.8',
      changefreq: 'monthly'
    }))
  ];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u =>
      '  <url>\n' +
      '    <loc>' + config.domain + u.loc + '</loc>\n' +
      '    <lastmod>' + today + '</lastmod>\n' +
      '    <changefreq>' + u.changefreq + '</changefreq>\n' +
      '    <priority>' + u.priority + '</priority>\n' +
      '  </url>'
    ),
    '</urlset>'
  ].join('\n');
  writeFile(path.join(DIST, 'sitemap.xml'), xml);
}

function buildRobots() {
  const txt = [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: ' + config.domain + '/sitemap.xml'
  ].join('\n');
  writeFile(path.join(DIST, 'robots.txt'), txt);
}

// ---------- hub page (root index.html) ----------
function buildHub() {
  const html = shell.replace(/\{ASSET_PATH\}/g, 'assets/');
  writeFile(path.join(DIST, 'index.html'), html);
  console.log('  ✓ dist/index.html  (hub)');
}

// ---------- split page generator ----------
function buildCalculatorPage(calc) {
  let html = shell;

  // 1. Rewrite the canonical and OG URLs
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    '<link rel="canonical" href="' + config.domain + '/' + calc.slug + '/">'
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    '<meta property="og:url" content="' + config.domain + '/' + calc.slug + '/">'
  );

  // 2. Title
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeHtml(calc.title) + '</title>');
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    '<meta property="og:title" content="' + escapeHtml(calc.title) + '">'
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    '<meta name="twitter:title" content="' + escapeHtml(calc.title) + '">'
  );

  // 3. Description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    '<meta name="description" content="' + escapeHtml(calc.description) + '">'
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    '<meta property="og:description" content="' + escapeHtml(calc.description) + '">'
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    '<meta name="twitter:description" content="' + escapeHtml(calc.description) + '">'
  );

  // 4. H1 and lede
  html = html.replace(/<h1>[^<]*<\/h1>/, '<h1>' + escapeHtml(calc.h1) + '</h1>');
  html = html.replace(/<p class="lede">[^<]*<\/p>/, '<p class="lede">' + escapeHtml(calc.lede) + '</p>');

  // 5. Breadcrumb final item
  html = html.replace(
    /<li aria-current="page">[^<]*<\/li>/,
    '<li aria-current="page">' + escapeHtml(calc.h1) + '</li>'
  );

  // 6. Inject a script that sets the default calculator (before the external script loads)
  html = html.replace(
    '</head>',
    '<script>window.__TIMECALC_DEFAULT__ = ' + JSON.stringify(calc.calcId) + ';</script>\n</head>'
  );

  // 7. Replace the generic FAQ section with a calculator-specific one
  if (calc.faq && calc.faq.length) {
    const genericFaq = findSection(html, 'faq');
    if (genericFaq) {
      const faqItems = calc.faq.map(item =>
        '<details class="faq-item">' +
        '<summary>' + escapeHtml(item.q) + '</summary>' +
        '<p>' + escapeHtml(item.a) + '</p>' +
        '</details>'
      ).join('\n      ');
      const customFaq =
        '<section class="section" id="faq" aria-labelledby="faqHeading">\n' +
        '  <div class="wrap narrow">\n' +
        '    <h2 id="faqHeading">Frequently asked questions</h2>\n' +
        '    ' + faqItems + '\n' +
        '  </div>\n' +
        '</section>';
      html = html.slice(0, genericFaq.start) + customFaq + html.slice(genericFaq.end);
    }
  }

  // 8. Drop the generic long-form guide and learn sections on split pages
  const guideSection = findSection(html, 'guide');
  if (guideSection) html = html.slice(0, guideSection.start) + html.slice(guideSection.end);

  const learnSection = findSection(html, 'learn');
  if (learnSection) html = html.slice(0, learnSection.start) + html.slice(learnSection.end);

  // 9. Move the workspace (the actual calculator) above the tools grid so
  // visitors land directly on the calculator they came for.
  html = moveSectionBefore(html, 'workspace', 'tools');

  // 10. Rename the tools heading since it now sits at the bottom.
  html = html.replace(
    '<h2 id="toolsHeading">All calculators</h2>',
    '<h2 id="toolsHeading">Other calculators</h2>'
  );

  // 11. Inject the custom intro section right after the hero, before the workspace.
  const introSection =
    '<section class="section" id="intro" aria-labelledby="introHeading">' +
    '<div class="wrap prose">' +
    '<div class="article-body">' + calc.intro + '</div>' +
    '</div>' +
    '</section>';
  html = injectAfterSection(html, 'hero', introSection);

  // 12. Fix asset paths — pages live one level deep so use ../assets/
  html = html.replace(/\{ASSET_PATH\}/g, '../assets/');

  // 13. Write the file
  writeFile(path.join(DIST, calc.slug, 'index.html'), html);
  console.log('  ✓ dist/' + calc.slug + '/index.html');
}

// ---------- run ----------
console.log('Building TimeCalc...\n');

buildHub();
console.log('Generating calculator pages:');
config.calculators.forEach(buildCalculatorPage);
buildSitemap();
buildRobots();

console.log('\nWrote dist/robots.txt');
console.log('Wrote dist/sitemap.xml');
console.log('Wrote dist/assets/style.css');
console.log('Wrote dist/assets/script.js');
console.log('\nDone. Output is in dist/.');
console.log('Serve locally with: python -m http.server 3000 --directory dist');