import sys
from rembg import remove
from PIL import Image
import requests
from io import BytesIO
from pathlib import Path


def load_image(source: str) -> Image.Image:
    if source.startswith(("http://", "https://")):
        resp = requests.get(source)
        resp.raise_for_status()
        return Image.open(BytesIO(resp.content))
    img_path = Path(source)
    if not img_path.exists():
        raise FileNotFoundError(f"Not found: {img_path}")
    return Image.open(img_path)


def main():
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)

    input_path, output_path = sys.argv[1], sys.argv[2]
    img = load_image(input_path)
    no_bg = remove(img)

    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    no_bg.save(out_file)


if __name__ == "__main__":
    main()
