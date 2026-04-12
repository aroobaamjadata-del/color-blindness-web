"""
**Preprocessing memory contract** (PIL only — no OpenCV).

Contract §5 — input geometry before ONNX
    * ``DEFAULT_MAX_SIDE = 384`` is the production default longest side (pixels).
    * ``app`` is the **only** caller that may pass ``max_side=256``; that happens solely
      when process RSS **exceeds** ``MEMORY_RSS_MAX_SIDE_256_MB`` (400 MB) — see ``app.py``.
      No other tiers exist.

Contract §5 — resize semantics
    * All downscaling uses in-place ``Image.thumbnail((max_side, max_side), LANCZOS)``.
    * Thumbnail runs **after** decode, EXIF transpose, and RGB conversion — so the tensor
      handed to rembg/ONNX is already bounded **before** ONNX input construction.

Resource handling
    * The ``BytesIO`` backing the upload is closed after ``img.load()`` so decoded pixels
      are not tied to the original buffer longer than necessary.
    * EXIF transpose / RGB convert close superseded ``PIL`` images to avoid duplicate
      full-resolution buffers where a new image object is returned.
"""

from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageOps

# Production default longest side (pixels). ``app`` may pass 256 per RSS contract only.
DEFAULT_MAX_SIDE = 384


def preprocess_for_inference(raw: bytes, *, max_side: int = DEFAULT_MAX_SIDE) -> Image.Image:
    """
    Apply preprocessing contract §5: decode → EXIF orientation → RGB → in-place thumbnail.

    The caller must pass ``max_side`` consistent with ``app`` (384 or 256). After return,
    the input ``raw`` bytes may be discarded by the caller (``del raw`` in ``_process_sync``).
    """
    buf = BytesIO(raw)
    img = Image.open(buf)
    try:
        img.load()
    except Exception:
        img.close()
        raise
    finally:
        buf.close()

    try:
        transposed = ImageOps.exif_transpose(img)
        if transposed is not img:
            img.close()
        img = transposed

        if img.mode != "RGB":
            converted = img.convert("RGB")
            if converted is not img:
                img.close()
            img = converted

        if max(img.size) > max_side:
            img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        return img
    except Exception:
        img.close()
        raise
