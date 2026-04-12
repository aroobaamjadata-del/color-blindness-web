"""
FastAPI + rembg — Hugging Face Spaces CPU, **production memory contract** (documentation mirror of runtime).

---------------------------------------------------------------------------
Thread containment (MUST precede any ML import in this module)
---------------------------------------------------------------------------
``OMP_NUM_THREADS``, ``MKL_NUM_THREADS``, and ``OPENBLAS_NUM_THREADS`` are set to ``1``
immediately after ``import os`` and **before** ``fastapi`` / ``rembg`` / ONNX load.
Purpose: avoid BLAS libraries spawning hidden thread pools that duplicate scratch memory
before the ONNX session initializes.

---------------------------------------------------------------------------
Model contract
---------------------------------------------------------------------------
Default ``REMBG_MODEL`` is ``isnet-general-use`` (CPU-oriented rembg preset), loaded once
per process via ``new_session(REMBG_MODEL)`` and stored in ``_session`` — no per-request
reload. Override with env ``REMBG_MODEL`` if required.

---------------------------------------------------------------------------
Memory scaling contract (single rule — no other input-size tiers)
---------------------------------------------------------------------------
``MEMORY_RSS_MAX_SIDE_256_MB = 400.0`` (MB RSS). When ``psutil`` reports process RSS:
  * ``RSS > 400`` → longest side ``max_side = 256`` for preprocessing.
  * else → ``max_side = 384`` (``DEFAULT_MAX_SIDE`` in ``utils.preprocess``).
There are **no** additional fallback or degrade tiers tied to input geometry.
``MEM_REJECT_MB`` (separate constant) may **503-reject** work when RSS exceeds a host
hard cap; it does **not** add further ``max_side`` states.

---------------------------------------------------------------------------
PNG optimization contract
---------------------------------------------------------------------------
``png_optimize`` is ``True`` only when RSS is unknown (no psutil) **or** ``RSS <= 400`` MB.
When RSS **exceeds** 400 MB, PNG zlib optimization is **disabled** to avoid extra working-set
and CPU under pressure (same 400 MB boundary as ``max_side``).

---------------------------------------------------------------------------
Warmup contract (startup only)
---------------------------------------------------------------------------
One non-production path: 32×32 RGB, ``preprocess_for_inference(..., max_side=96)``,
``png_optimize=False``, **exactly one** ``remove()`` — initializes the ONNX graph without
paying a full 384px first request.

---------------------------------------------------------------------------
Memory lifecycle contract (inference worker ``_process_sync``)
---------------------------------------------------------------------------
After ``preprocess_for_inference``: raw upload ``bytes`` are deleted (``del raw``).
The RGB ``PIL`` image is always closed in a ``finally`` block; ``gc.collect()`` runs after
the inference path. Intermediate tensors are not retained beyond ``remove``/encode.

---------------------------------------------------------------------------
API (unchanged)
---------------------------------------------------------------------------
``POST /remove-bg`` (multipart field ``image``), ``GET /health``, ``GET /``.

Deploy: Hugging Face Spaces / Docker (uvicorn ``0.0.0.0:7860``), or gunicorn + uvicorn worker.
"""

from __future__ import annotations

import os

# Memory contract §1 — thread containment BEFORE FastAPI / rembg / ONNX imports.
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

import asyncio
import concurrent.futures
import gc
import logging
import time
import traceback
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from rembg import new_session

from utils.bg_remove import remove_background_rgb
from utils.preprocess import DEFAULT_MAX_SIDE, preprocess_for_inference

# Memory contract §3 — sole RSS→geometry rule (MB). No other scaling tiers.
MEMORY_RSS_MAX_SIDE_256_MB = 400.0
# Memory contract §2 — default ``isnet-general-use``; one session per process (see lifespan).
REMBG_MODEL = os.getenv("REMBG_MODEL", "isnet-general-use").strip() or "isnet-general-use"

try:
    import psutil
except ImportError:  # pragma: no cover - optional dependency
    psutil = None

logger = logging.getLogger("rembg-api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# Verbose per-request RSS delta: set True here and/or REMBG_DEBUG_MEMORY=1 on the host.
DEBUG_MEMORY_FORCE = False
DEBUG_MEMORY = DEBUG_MEMORY_FORCE or os.environ.get("REMBG_DEBUG_MEMORY", "").lower() in (
    "1",
    "true",
    "yes",
)

MAX_UPLOAD_BYTES = 2 * 1024 * 1024
# Refuse new work before preprocess / upload buffer (~62 MB headroom on 512 MB hosts).
MEM_REJECT_MB = float(os.environ.get("MEM_REJECT_MB", "450"))
# Hard cap on executor wall time (ONNX thread may still finish in background).
INFERENCE_TIMEOUT_SEC = float(os.environ.get("INFERENCE_TIMEOUT_SEC", "20"))

# One in-flight job keeps peak RSS predictable on 512MB Render instances.
INFERENCE_CONCURRENCY = asyncio.Semaphore(1)

# Hugging Face Spaces default port; Docker / Render may set PORT.
LISTEN_PORT = int(os.environ.get("PORT", "7860"))

_session = None
_model_ready = False
_executor: concurrent.futures.ThreadPoolExecutor | None = None


class MemGuardRejected(Exception):
    """Raised from the worker thread when RSS is too high to safely run inference."""

    def __init__(self, detail: str = "Server busy due to memory pressure. Retry shortly."):
        self.detail = detail
        super().__init__(detail)


def _get_rss_mb() -> float | None:
    if not psutil:
        return None
    try:
        return psutil.Process().memory_info().rss / (1024 * 1024)
    except Exception:  # pragma: no cover
        return None


def _log_rss(label: str) -> None:
    rss = _get_rss_mb()
    if rss is None:
        return
    logger.info("%s approx RSS: %.1f MB", label, rss)


def _warmup_session_sync() -> None:
    """
    Memory contract §6 — warmup (startup, non-production workload).

    * Input: 32×32 RGB dummy image encoded to PNG bytes.
    * ``preprocess_for_inference(..., max_side=96)`` — not the production 384 cap.
    * ``png_optimize=False``.
    * **Exactly one** ``remove()`` call to initialize the ONNX graph and avoid a cold
      first-user allocation spike at full ``max_side``.

    RGB ``PIL`` image is closed in ``finally``; ``gc.collect()`` runs after the path.
    """
    if _session is None:
        return
    from PIL import Image

    tiny = Image.new("RGB", (32, 32), (128, 128, 128))
    buf = BytesIO()
    try:
        tiny.save(buf, format="PNG")
        raw = buf.getvalue()
    finally:
        buf.close()
    tiny.close()
    del tiny

    # Skip full 384 path during warmup — only allocator / graph init matters.
    rgb = preprocess_for_inference(raw, max_side=96)
    try:
        del raw
        out = remove_background_rgb(
            rgb,
            _session,
            post_process_mask=False,
            png_optimize=False,
        )
        del out
    finally:
        rgb.close()
        del rgb
    gc.collect()
    logger.info("Warmup inference complete (32x32, max_side=96).")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load **one** rembg ONNX session (``new_session(REMBG_MODEL)``), run warmup, then serve.

    Shutdown clears ``_session`` and stops the single-thread executor. This matches the
    model contract: CPU-optimized backend, single session reused for the process lifetime.
    """
    global _session, _model_ready, _executor
    loop = asyncio.get_running_loop()
    # Single worker thread: no hidden parallel inferences stacking model memory.
    _executor = concurrent.futures.ThreadPoolExecutor(
        max_workers=1,
        thread_name_prefix="rembg",
    )
    loop.set_default_executor(_executor)

    logger.info("Loading rembg session (%s)…", REMBG_MODEL)
    _log_rss("before model load")
    _session = new_session(REMBG_MODEL)
    _log_rss("after model load")
    try:
        _warmup_session_sync()
        _log_rss("after warmup")
    except Exception as exc:  # pragma: no cover
        logger.warning("Warmup failed (service still starting): %s", exc)
    _model_ready = True
    logger.info("Model ready.")
    yield
    _model_ready = False
    _session = None
    if _executor is not None:
        _executor.shutdown(wait=True)
        _executor = None
    gc.collect()
    logger.info("Shutdown complete.")


app = FastAPI(title="Background Removal API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(__file__).resolve().parent / "static"
if static_dir.is_dir():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
def root():
    return {"message": "BG Remover API Running"}


def _mem_guard_or_raise(where: str) -> None:
    rss = _get_rss_mb()
    if rss is None:
        if not psutil:
            logger.debug("psutil unavailable; memory guard skipped (%s)", where)
        return
    if rss >= MEM_REJECT_MB:
        logger.warning("Memory guard trip (%s): RSS %.1f MB >= %.1f MB", where, rss, MEM_REJECT_MB)
        raise HTTPException(
            status_code=503,
            detail="Server busy due to memory pressure. Retry shortly.",
        )


async def _read_limited_upload(upload: UploadFile) -> bytes:
    """Stream upload into one buffer (avoids list-of-chunks + join peak)."""
    _mem_guard_or_raise("before upload body")
    out = BytesIO()
    total = 0
    chunk_size = 64 * 1024
    try:
        while True:
            chunk = await upload.read(chunk_size)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum allowed size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
                )
            out.write(chunk)
        data = out.getvalue()
    finally:
        out.close()
    if not data:
        raise HTTPException(status_code=400, detail="Empty upload.")
    return data


def _process_sync(raw: bytes) -> bytes:
    """
    Synchronous inference path (``run_in_executor`` worker) — encodes the memory contract.

    **Scaling (§3):** compare ``rss_mb`` to ``MEMORY_RSS_MAX_SIDE_256_MB`` (400.0): if
    ``rss_mb > 400`` then ``max_side=256``, else ``max_side=384``. No other tiers.

    **PNG (§4):** ``png_optimize`` iff ``rss_mb is None`` or ``rss_mb <= 400``.

    **Lifecycle (§7):** after ``preprocess_for_inference``, ``del raw`` drops upload bytes.
    ``finally`` always ``rgb.close()`` and ``del rgb``; ``gc.collect()`` runs after inference.
    """
    if _session is None:
        raise RuntimeError("Model session is not initialized.")

    # Guard before touching preprocess (same threshold as HTTP guards).
    rss0 = _get_rss_mb()
    if rss0 is not None and rss0 >= MEM_REJECT_MB:
        raise MemGuardRejected()

    rss_mb = rss0
    if rss_mb is not None and rss_mb > MEMORY_RSS_MAX_SIDE_256_MB:
        max_side = 256
        logger.info(
            "Input cap (RSS %.1f MB > %.0f MB): max_side=%s",
            rss_mb,
            MEMORY_RSS_MAX_SIDE_256_MB,
            max_side,
        )
    else:
        max_side = DEFAULT_MAX_SIDE

    # Memory contract §4 — PNG optimize only at RSS ≤ 400 MB (or RSS unknown).
    png_optimize = rss_mb is None or rss_mb <= MEMORY_RSS_MAX_SIDE_256_MB

    _log_rss("memory before preprocess")
    rgb = preprocess_for_inference(raw, max_side=max_side)
    try:
        del raw
        _log_rss("memory after preprocess")
        png_bytes = remove_background_rgb(
            rgb,
            _session,
            post_process_mask=False,
            png_optimize=png_optimize,
        )
        _log_rss("memory after inference")
        return png_bytes
    finally:
        rgb.close()
        del rgb
        gc.collect()


@app.get("/health")
async def health():
    """
    Liveness: ``{"status","model","ready"}``. ``model`` echoes ``REMBG_MODEL`` when ready
    (default ``isnet-general-use`` per model contract §2).
    """
    if _model_ready:
        return {"status": "ok", "model": REMBG_MODEL, "ready": True}
    return {"status": "starting", "model": None, "ready": False}


@app.get("/test")
async def test_page():
    """Tiny static tester (bonus)."""
    page = static_dir / "index.html"
    if not page.is_file():
        raise HTTPException(status_code=404, detail="Test page not found.")
    return FileResponse(page)


def _stream_png_from_buffer(buffer: BytesIO, chunk_size: int = 32768):
    try:
        while True:
            chunk = buffer.read(chunk_size)
            if not chunk:
                break
            yield chunk
    finally:
        buffer.close()


@app.post("/remove-bg")
async def remove_bg(image: UploadFile = File(..., description="Image file (<= 2 MB)")):
    """
    ``POST /remove-bg`` — multipart field **image** (contract unchanged).

    Inference obeys §3–§7 via ``_process_sync`` (single semaphore, executor timeout separate
    from scaling tiers). Response streams PNG after dropping the in-memory ``bytes`` copy
    used for encoding where possible.
    """
    if not _model_ready or _session is None:
        raise HTTPException(status_code=503, detail="Model not ready. Retry shortly.")

    if image.content_type and not image.content_type.startswith("image/"):
        logger.info("Non-image content-type (will still try): %s", image.content_type)

    logger.info("remove-bg request start")
    started = time.perf_counter()
    rss_req_start = _get_rss_mb()
    _log_rss("before request")
    png_bytes: bytes | None = None

    # Reject before semaphore / upload buffering when RSS already leaves little headroom.
    _mem_guard_or_raise("before semaphore")

    async with INFERENCE_CONCURRENCY:
        _mem_guard_or_raise("after semaphore")

        try:
            raw = await _read_limited_upload(image)
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover
            logger.error("Upload read failed: %s", exc)
            raise HTTPException(status_code=400, detail="Could not read upload.") from exc

        _mem_guard_or_raise("after upload read")

        try:
            loop = asyncio.get_running_loop()
            _log_rss("memory before inference (async)")
            png_bytes = await asyncio.wait_for(
                loop.run_in_executor(None, _process_sync, raw),
                timeout=INFERENCE_TIMEOUT_SEC,
            )
            _log_rss("memory after inference (async)")
        except asyncio.TimeoutError:
            logger.error("Inference timed out after %.0fs", INFERENCE_TIMEOUT_SEC)
            gc.collect()
            raise HTTPException(
                status_code=503,
                detail="Processing timed out. Retry with a smaller image or in a few seconds.",
            ) from None
        except MemGuardRejected as exc:
            gc.collect()
            raise HTTPException(status_code=503, detail=exc.detail) from exc
        except MemoryError as exc:
            logger.error("MemoryError during inference: %s", exc)
            gc.collect()
            raise HTTPException(
                status_code=503,
                detail="Server ran out of memory while processing this image. Try a smaller image.",
            ) from exc
        except Exception as exc:
            logger.error("Inference failed: %s\n%s", exc, traceback.format_exc())
            gc.collect()
            raise HTTPException(
                status_code=500,
                detail="Background removal failed. The server stayed up; please try another image.",
            ) from exc
        finally:
            try:
                del raw
            except NameError:
                pass
            gc.collect()

    elapsed_ms = (time.perf_counter() - started) * 1000
    rss_end = _get_rss_mb()
    if rss_req_start is not None and rss_end is not None:
        logger.info(
            "remove-bg done in %.1f ms (RSS %.1f MB -> %.1f MB)",
            elapsed_ms,
            rss_req_start,
            rss_end,
        )
    else:
        logger.info("remove-bg done in %.1f ms", elapsed_ms)
    _log_rss("after request")

    if DEBUG_MEMORY:
        rss_req_end = _get_rss_mb()
        if rss_req_start is not None and rss_req_end is not None:
            logger.info(
                "[debug] request RSS %.1f MB -> %.1f MB (Δ%+.1f MB)",
                rss_req_start,
                rss_req_end,
                rss_req_end - rss_req_start,
            )

    assert png_bytes is not None
    n = len(png_bytes)
    buffer = BytesIO(png_bytes)
    del png_bytes
    gc.collect()
    return StreamingResponse(
        _stream_png_from_buffer(buffer),
        media_type="image/png",
        headers={"Content-Length": str(n)},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=LISTEN_PORT,
        reload=False,
    )
