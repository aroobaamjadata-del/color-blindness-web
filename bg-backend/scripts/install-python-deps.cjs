/**
 * Installs Python deps for remove_bg.py. On Render (RENDER=true), failure exits non-zero.
 * Locally, skips with a warning if python/pip is missing.
 */
const { execSync } = require("child_process");
const path = require("path");

const req = path.join(__dirname, "..", "requirements.txt");
const onRender = process.env.RENDER === "true";

function run(cmd) {
  console.log("[bg-backend]", cmd);
  execSync(cmd, { stdio: "inherit", shell: true });
}

const candidates = [
  `python3 -m pip install -r "${req}"`,
  `python3 -m pip install --user -r "${req}"`,
  `python3 -m pip install --break-system-packages -r "${req}"`,
  `python -m pip install -r "${req}"`,
];

let ok = false;
for (const cmd of candidates) {
  try {
    run(cmd);
    ok = true;
    break;
  } catch {
    /* try next */
  }
}

if (!ok) {
  if (onRender) {
    console.error("[bg-backend] pip install failed — Python 3 is required on Render for rembg.");
    process.exit(1);
  }
  console.warn("[bg-backend] Skipping pip (no python3/python). Install rembg locally for /image/remove.");
}
