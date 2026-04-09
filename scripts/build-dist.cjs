/**
 * Copies the VisionX marketing site into dist/ for Netlify (or any static host).
 * Run: npm run build
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const ROOT_FILES = [
  "index.html",
  "about.html",
  "tool.html",
  "bg-remover.html",
  "contact.html",
  "plugin.html",
  "style.css",
  "main.js",
  "site-nav.js",
  "colorEngine.js",
  "colorSwap.js",
  "contrastChecker.js",
  "textureOverlay.js",
];

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyRootFile(name) {
  const src = path.join(root, name);
  const dest = path.join(dist, name);
  if (!fs.existsSync(src)) {
    console.warn("[build-dist] missing (skipped):", name);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyAssets() {
  const src = path.join(root, "assets");
  const dest = path.join(dist, "assets");
  if (!fs.existsSync(src)) {
    console.warn("[build-dist] no assets/ folder — create it for images & plugin .zip");
    return;
  }
  fs.cpSync(src, dest, { recursive: true });
}

console.log("[build-dist] cleaning", path.relative(root, dist));
rmrf(dist);
fs.mkdirSync(dist, { recursive: true });

for (const f of ROOT_FILES) {
  copyRootFile(f);
}
copyAssets();

const needPlugin = path.join(dist, "assets", "plugin", "VisionX-Photoshop-Plugin.zip");
const needSample = path.join(dist, "assets", "images", "sample.png");
if (!fs.existsSync(needPlugin)) {
  console.warn("[build-dist] add plugin zip at: assets/plugin/VisionX-Photoshop-Plugin.zip");
}
if (!fs.existsSync(needSample)) {
  console.warn("[build-dist] add hero image at: assets/images/sample.png");
}

console.log("[build-dist] done →", dist);
