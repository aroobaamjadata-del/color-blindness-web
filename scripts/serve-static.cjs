/**
 * Serves ./dist for Render (or local) after `npm run build`.
 * Uses PORT from the environment; defaults to 3000 locally.
 */
const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const dist = path.join(__dirname, "..", "dist");

app.use(express.static(dist));

app.listen(port, "0.0.0.0", () => {
  console.log(`Serving dist/ on http://0.0.0.0:${port}`);
});
