# SPDX-License-Identifier: AGPL-3.0-or-later
"""Package the generic image for ESP Web Tools: the factory image and its manifest.

    python3 firmware/scripts/web_image.py FACTORY_BIN VERSION OUT_DIR

Copies FACTORY_BIN to OUT_DIR/blade-reader.factory.bin and writes OUT_DIR/manifest.json beside
it. Fails unless the image is an ESP32-C3 image that fits the yoke's 4 MB of flash, so a wrong
build can't reach the Install button.
"""

import hashlib
import json
import shutil
import sys
from pathlib import Path

IMAGE = "blade-reader.factory.bin"
FLASH_BYTES = 4 * 1024 * 1024
ESP_IMAGE_MAGIC = 0xE9
ESP32_C3_CHIP_ID = 5  # esp_image_header_t.chip_id, bytes 12 and 13, little-endian


def check(image: bytes) -> None:
    if len(image) < 24 or image[0] != ESP_IMAGE_MAGIC:
        sys.exit("not an ESP image: no 0xE9 magic byte at offset 0")
    chip_id = int.from_bytes(image[12:14], "little")
    if chip_id != ESP32_C3_CHIP_ID:
        sys.exit(f"built for chip id {chip_id}, not the ESP32-C3 ({ESP32_C3_CHIP_ID})")
    if len(image) > FLASH_BYTES:
        sys.exit(f"{len(image)} bytes is more than the module's 4 MB of flash")


def main() -> None:
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    factory, version, out = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    image = factory.read_bytes()
    check(image)
    out.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(factory, out / IMAGE)
    manifest = {
        "name": "Blade Reader",
        "version": version,
        "home_assistant_domain": "esphome",
        # A yoke flashed the old way keeps its keys in flash; offer to clear them.
        "new_install_prompt_erase": True,
        "builds": [{"chipFamily": "ESP32-C3", "parts": [{"path": IMAGE, "offset": 0}]}],
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{IMAGE}: {len(image)} bytes, sha256 {hashlib.sha256(image).hexdigest()}")


if __name__ == "__main__":
    main()
