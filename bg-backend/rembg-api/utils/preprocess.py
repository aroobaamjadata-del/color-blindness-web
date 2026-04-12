"""PIL-only preprocessing: RGB, max side via thumbnail (in-place), no OpenCV."""

from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageOps

# Default cap keeps ONNX activations bounded on 512MB hosts.
DEFAULT_MAX_SIDE = 512
# Used when RSS is elevated but below hard reject (see app.py).
DEGRADED_MAX_SIDE = 384


def preprocess_for_inference(raw: bytes, *, max_side: int = DEFAULT_MAX_SIDE) -> Image.Image:
    """
    Decode once, close the BytesIO backing store after load(), then transpose / RGB /
    thumbnail without keeping redundant copies of the full-resolution bitmap.
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
