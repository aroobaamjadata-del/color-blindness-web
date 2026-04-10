import sys
from rembg import remove, new_session
from PIL import Image
import requests
from io import BytesIO
from pathlib import Path

MAX_SIDE = 1280


def load_image(source: str) -> Image.Image:
    if source.startswith(("http://", "https://")):
        resp = requests.get(source)
        resp.raise_for_status()
        return Image.open(BytesIO(resp.content))
    img_path = Path(source)
    if not img_path.exists():
        raise FileNotFoundError(f"Not found: {img_path}")
    return Image.open(img_path)

def downscale_for_inference(img: Image.Image, max_side: int = MAX_SIDE) -> Image.Image:
    """Reduce peak RAM/CPU usage on small instances by limiting max image side."""
    w, h = img.size
    side = max(w, h)
    if side <= max_side:
        return img
    scale = max_side / float(side)
    nw = max(1, int(w * scale))
    nh = max(1, int(h * scale))
    # LANCZOS keeps quality while shrinking.
    return img.resize((nw, nh), Image.Resampling.LANCZOS)


def main():
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)

    input_path, output_path = sys.argv[1], sys.argv[2]
    img = load_image(input_path)
    # Free-tier profile: downscale + lighter model to avoid OOM on 512MB instances.
    img = downscale_for_inference(img)
    session = new_session("u2netp")
    no_bg = remove(
        img,
        session=session,
        alpha_matting=False,
        post_process_mask=True,
    )

    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    no_bg.save(out_file)


if __name__ == "__main__":
    main()
