"""
Memory-conscious FastAPI service: u2netp rembg session, 512px cap, single-flight inference.
Deploy: gunicorn app:app --workers=1 --threads=2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
"""

from __future__ import annotations

import asyncio
import concurrent.futures
import gc
import logging
import os
import time
import traceback
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from rembg import new_session

from utils.bg_remove import remove_background_rgb
from utils.preprocess import (
    DEFAULT_MAX_SIDE,
    DEGRADED_MAX_SIDE,
    preprocess_for_inference,
)

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
# Hard cap: refuse new work before we allocate preprocess buffers (tunable via env).
MEM_REJECT_MB = float(os.environ.get("MEM_REJECT_MB", "420"))
# Softer cap: smaller thumbnail + lighter rembg post-processing.
MEM_DEGRADE_MB = float(os.environ.get("MEM_DEGRADE_MB", "350"))

# One in-flight job keeps peak RSS predictable on 512MB Render instances.
INFERENCE_CONCURRENCY = asyncio.Semaphore(1)

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _session, _model_ready, _executor
    loop = asyncio.get_running_loop()
    # Single worker thread: no hidden parallel inferences stacking model memory.
    _executor = concurrent.futures.ThreadPoolExecutor(
        max_workers=1,
        thread_name_prefix="rembg",
    )
    loop.set_default_executor(_executor)

    logger.info("Loading rembg session (u2netp)…")
    _log_rss("before model load")
    _session = new_session("u2netp")
    _model_ready = True
    _log_rss("after model load")
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
    """CPU-heavy path: runs in the single-thread default executor."""
    if _session is None:
        raise RuntimeError("Model session is not initialized.")

    rss0 = _get_rss_mb()
    if rss0 is not None and rss0 >= MEM_REJECT_MB:
        raise MemGuardRejected()

    max_side = DEFAULT_MAX_SIDE
    post_process = True
    if rss0 is not None and rss0 >= MEM_DEGRADE_MB:
        max_side = DEGRADED_MAX_SIDE
        post_process = False
        logger.info(
            "Degraded inference path (RSS %.1f MB >= %.1f MB): max_side=%s post_process_mask=%s",
            rss0,
            MEM_DEGRADE_MB,
            max_side,
            post_process,
        )

    _log_rss("before preprocess")
    rgb = preprocess_for_inference(raw, max_side=max_side)
    try:
        del raw
        _log_rss("after preprocess")
        png_bytes = remove_background_rgb(
            rgb,
            _session,
            post_process_mask=post_process,
        )
        _log_rss("after inference")
        return png_bytes
    finally:
        rgb.close()
        del rgb
        gc.collect()


@app.get("/health")
async def health():
    return {
        "ok": _model_ready,
        "model": "u2netp" if _model_ready else None,
        "max_upload_mb": MAX_UPLOAD_BYTES // (1024 * 1024),
        "max_inference_side": DEFAULT_MAX_SIDE,
        "degraded_max_inference_side": DEGRADED_MAX_SIDE,
        "memory_reject_mb": MEM_REJECT_MB,
        "memory_degrade_from_mb": MEM_DEGRADE_MB,
        "debug_memory": DEBUG_MEMORY,
    }


@app.get("/test")
async def test_page():
    """Tiny static tester (bonus)."""
    page = static_dir / "index.html"
    if not page.is_file():
        raise HTTPException(status_code=404, detail="Test page not found.")
    return FileResponse(page)


@app.post("/remove-bg")
async def remove_bg(image: UploadFile = File(..., description="Image file (<= 2 MB)")):
    if not _model_ready or _session is None:
        raise HTTPException(status_code=503, detail="Model not ready. Retry shortly.")

    if image.content_type and not image.content_type.startswith("image/"):
        logger.info("Non-image content-type (will still try): %s", image.content_type)

    started = time.perf_counter()
    rss_req_start = _get_rss_mb()
    _log_rss("before request")

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
            png_bytes = await loop.run_in_executor(None, _process_sync, raw)
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
            del raw
            gc.collect()

    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info("remove-bg ok in %.1f ms", elapsed_ms)
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

    return Response(content=png_bytes, media_type="image/png")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        reload=False,
    )
