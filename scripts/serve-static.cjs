/**
 * Serves ./dist for Render (or local) after `npm run build`.
 * Uses PORT from the environment; defaults to 3000 locally.
 */
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const dist = path.join(__dirname, "..", "dist");

// BG Remover: set VISIONX_BG_API in Render (e.g. https://your-api.onrender.com) so the page can reach a separate API service.
app.get("/visionx-bg-api.js", (_req, res) => {
  res.type("application/javascript; charset=utf-8");
  const base = (process.env.VISIONX_BG_API || "").trim().replace(/\/$/, "");
  if (base) {
    res.send(`window.VISIONX_BG_API=${JSON.stringify(base)};`);
  } else {
    res.send("/* VisionX: set env VISIONX_BG_API to your BG API base URL (no trailing slash). */");
  }
});

app.use(express.static(dist));

app.listen(port, "0.0.0.0", () => {
  console.log(`Serving dist/ on http://0.0.0.0:${port}`);
  if (!(process.env.VISIONX_BG_API || "").trim()) {
    console.warn("[visionx] VISIONX_BG_API is unset — BG Remover will call /health on this host unless ?api= is used.");
  }
});
