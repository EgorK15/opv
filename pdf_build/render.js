const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");

// --- load katex markdown-it plugin (handle export shape) ---
let mdKatex = require("@vscode/markdown-it-katex");
mdKatex = mdKatex.default || mdKatex;

// --- anchor plugin: generates id= on headings so TOC links work in PDF ---
let mdAnchor = require("markdown-it-anchor");
mdAnchor = mdAnchor.default || mdAnchor;

const ROOT = "D:/pycharm_projects_d/opv";
const SRC = path.join(ROOT, "Ответы.md");
const OUT_HTML = path.join(ROOT, "pdf_build", "output.html");
const KATEX_CSS = path.join(ROOT, "pdf_build", "node_modules", "katex", "dist", "katex.min.css");

const md = new MarkdownIt({ html: true, linkify: false, typographer: false });
md.use(mdKatex, { throwOnError: false, errorColor: "#cc0000" });
// slugify matches GitHub-flavoured anchor style (lowercase, strip punctuation, spaces→hyphens)
md.use(mdAnchor, {
  slugify: s => s.toLowerCase()
                 .replace(/[^\w\s\-]/gu, "")
                 .trim()
                 .replace(/\s+/g, "-")
                 .replace(/-+/g, "-"),
  tabIndex: false,
});

let text = fs.readFileSync(SRC, "utf8");
let body = md.render(text);

// Rewrite relative image paths -> absolute file:// URLs.
// markdown-it has ALREADY percent-encoded the Cyrillic path, so do NOT
// encode again (that would turn %D0 into %25D0 and break loading).
body = body.replace(/src="(markdown\/[^"]+)"/g, (m, rel) => {
  return 'src="file:///' + ROOT + "/" + rel + '"';
});

const cssLink = "file:///" + KATEX_CSS;

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${encodeURI(cssLink)}">
<style>
  @page { size: A4; margin: 18mm 16mm; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: "Segoe UI", "DejaVu Sans", Arial, sans-serif;
    font-size: 11pt; line-height: 1.45; color: #1a1a1a;
    max-width: 100%;
  }
  h1 { font-size: 20pt; border-bottom: 2px solid #444; padding-bottom: 4px; margin-top: 18px; }
  h2 { font-size: 14pt; margin-top: 16px; page-break-after: avoid; }
  h3 { font-size: 12pt; margin-top: 12px; page-break-after: avoid; }
  h2, h3 { color: #14315c; }
  p, li { orphans: 2; widows: 2; }
  blockquote {
    border-left: 4px solid #b0b8c4; background: #f4f6f9;
    margin: 8px 0; padding: 6px 12px; color: #333;
  }
  code {
    font-family: "Consolas", "DejaVu Sans Mono", monospace;
    background: #f0f2f5; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt;
  }
  pre {
    background: #f6f8fa; border: 1px solid #dfe2e7; border-radius: 5px;
    padding: 8px 10px; overflow-x: auto; font-size: 9pt; line-height: 1.35;
    page-break-inside: avoid; white-space: pre-wrap;
  }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; margin: 8px 0; font-size: 10pt; }
  th, td { border: 1px solid #b8c0cc; padding: 4px 8px; text-align: left; vertical-align: top; }
  th { background: #eef1f5; }
  img { max-width: 92%; height: auto; display: block; margin: 8px auto;
        page-break-inside: avoid; border: 1px solid #e2e5ea; }
  hr { border: none; border-top: 1px solid #d0d4da; margin: 14px 0; }
  .katex { font-size: 1.04em; }
  .katex-display { overflow-x: auto; overflow-y: hidden; padding: 2px 0; }
  /* force a Cyrillic-capable font inside \\text{...} so Cyrillic labels render */
  .katex .text, .katex .text .mord { font-family: "Segoe UI", "DejaVu Sans", sans-serif !important; }
</style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync(OUT_HTML, html, "utf8");
console.log("HTML written:", OUT_HTML, "(" + html.length + " chars)");
