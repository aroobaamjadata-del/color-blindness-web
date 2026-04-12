"""Background removal using a shared rembg session (u2netp only)."""

from __future__ import annotations

import gc
from io import BytesIO
from typing import TYPE_CHECKING

from rembg import remove

if TYPE_CHECKING:
    from PIL import Image


def image_to_png_bytes(img: Image.Image, *, optimize: bool = True) -> bytes:
    """
    Single BytesIO encode. ``optimize=False`` when RSS is high (caller-controlled)
    to reduce encoder working set; ``compress_level`` stays low (1).
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
    Run rembg; drop the RGBA output as soon as bytes exist.
    post_process_mask=False keeps peak RAM lower (recommended for HF / small instances).
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
