"""Background removal using a shared rembg session (u2netp only)."""

from __future__ import annotations

import gc
from io import BytesIO
from typing import TYPE_CHECKING

from rembg import remove

if TYPE_CHECKING:
    from PIL import Image


def image_to_png_bytes(img: Image.Image) -> bytes:
    """
    Single BytesIO encode path: avoid optimize=True (extra pass / higher peak RSS).
    compress_level 3 balances size vs encoder work for small web images.
    """
    buf = BytesIO()
    try:
        img.save(buf, format="PNG", optimize=False, compress_level=3)
        out = buf.getvalue()
    finally:
        buf.close()
    return out


def remove_background_rgb(
    rgb_image: Image.Image,
    session,
    *,
    post_process_mask: bool = True,
) -> bytes:
    """
    Run rembg; drop the RGBA output as soon as bytes exist.
    post_process_mask=False under memory pressure reduces CPU/RAM slightly.
    """
    rgba = remove(
        rgb_image,
        session=session,
        alpha_matting=False,
        post_process_mask=post_process_mask,
    )
    try:
        png_bytes = image_to_png_bytes(rgba)
        return png_bytes
    finally:
        rgba.close()
        del rgba
        gc.collect()
