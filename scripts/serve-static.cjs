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

// BG Remover: VISIONX_BG_API overrides; otherwise Hugging Face Space (FastAPI /remove-bg).
const DEFAULT_HF_BG_API = "https://arooba09-visionx-bg-remover.hf.space";
app.get("/visionx-bg-api.js", (_req, res) => {
  res.type("application/javascript; charset=utf-8");
  const base = (process.env.VISIONX_BG_API || DEFAULT_HF_BG_API).trim().replace(/\/$/, "");
  res.send(`window.VISIONX_BG_API=${JSON.stringify(base)};`);
});

app.use(express.static(dist));

app.listen(port, "0.0.0.0", () => {
  console.log(`Serving dist/ on http://0.0.0.0:${port}`);
  if (!(process.env.VISIONX_BG_API || "").trim()) {
    console.log("[visionx] VISIONX_BG_API unset — using default HF Space:", DEFAULT_HF_BG_API);
  }
});
