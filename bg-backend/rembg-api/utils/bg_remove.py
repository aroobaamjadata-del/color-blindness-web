"""
**rembg / ONNX bridge — memory contract mirror** (no FastAPI here).

This module implements the ONNX-facing half of the pipeline **after** ``app`` has
applied thread containment (§1), model session reuse (§2), RSS→``max_side`` (§3), and
RSS→``png_optimize`` (§4). It does **not** implement additional scaling tiers.

Contract alignment
    * ``remove(..., alpha_matting=False, post_process_mask=False)`` — avoids matting and
      heavy mask post-processing that would raise peak RAM and CPU.
    * ``image_to_png_bytes(..., optimize=png_optimize)`` — ``optimize`` is **only** toggled
      upstream per §4 (enabled at RSS ≤ 400 MB or when RSS is unknown).
    * ``finally``: ``rgba.close()``, ``del rgba``, ``gc.collect()`` — RGBA tensor holder is
      released immediately after PNG bytes are produced; no retention of intermediate images.

Design principle: strict CPU-first execution, minimal branching inside this file; all RSS
logic remains in ``app.py``.
"""

from __future__ import annotations

import gc
from io import BytesIO
from typing import TYPE_CHECKING

from rembg import remove

if TYPE_CHECKING:
    from PIL import Image


def image_to_png_bytes(img: Image.Image, *, optimize: bool = True) -> bytes:
    """
    Encode a ``PIL`` image to PNG in a single ``BytesIO``.

    ``optimize`` follows contract §4 from the caller. ``compress_level=1`` limits zlib
    workspace versus high levels.
    """
    buf = BytesIO()
    try:
        img.save(buf, format="PNG", optimize=optimize, compress_level=1)
        out = buf.getvalue()
    finally:
        buf.close()
    return out


def remove_background_rgb(
    rgb_image: Image.Image,
    session,
    *,
    post_process_mask: bool = False,
    png_optimize: bool = True,
) -> bytes:
    """
    One ``remove()`` bound to the process-global ``session`` (contract §2).

    Matting stays off; mask post matches the default ``False`` expected for low-RAM CPU.
    Lifecycle: RGBA closed and GC urged in ``finally`` after bytes are materialized (§7).
    """
    rgba = remove(
        rgb_image,
        session=session,
        alpha_matting=False,
        post_process_mask=post_process_mask,
    )
    try:
        png_bytes = image_to_png_bytes(rgba, optimize=png_optimize)
        return png_bytes
    finally:
        rgba.close()
        del rgba
        gc.collect()
