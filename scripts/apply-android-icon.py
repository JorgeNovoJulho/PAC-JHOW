"""Gera ícones Android a partir da arte oficial assets/android-icon.png."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / "assets" / "android-icon.png"
if not source.is_file():
    raise SystemExit("Ícone ausente: adicione assets/android-icon.png antes de gerar o APK.")

image = Image.open(source).convert("RGBA")
android_res = root / "android" / "app" / "src" / "main" / "res"
sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}

for density, size in sizes.items():
    folder = android_res / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    icon = image.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(folder / "ic_launcher.png")
    icon.save(folder / "ic_launcher_round.png")

# Android adaptive launcher icons: foreground with safe-area margins and solid background.
for density, size in sizes.items():
    folder = android_res / f"mipmap-{density}"
    extent = round(108 * (size / 48))
    safe = round(extent * 0.72)
    canvas = Image.new("RGBA", (extent, extent), (0, 0, 0, 0))
    image_part = image.resize((safe, safe), Image.Resampling.LANCZOS)
    canvas.alpha_composite(image_part, ((extent - safe)//2, (extent-safe)//2))
    canvas.save(folder / "ic_launcher_foreground.png")

drawable = android_res / "values"
drawable.mkdir(parents=True, exist_ok=True)
(drawable / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources><color name="ic_launcher_background">#070A26</color></resources>\n',
    encoding="utf8"
)
for density in sizes:
    folder = android_res / f"mipmap-{density}"
    (folder / "ic_launcher_background.png").unlink(missing_ok=True)
adaptive = android_res / "mipmap-anydpi-v26"
adaptive.mkdir(exist_ok=True)
for name in ("ic_launcher", "ic_launcher_round"):
    (adaptive / f"{name}.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">'
        '<background android:drawable="@color/ic_launcher_background"/>'
        '<foreground android:drawable="@mipmap/ic_launcher_foreground"/>'
        '</adaptive-icon>\n',
        encoding="utf8"
    )
print("Ícones Android (mipmap + adaptativos) gerados.")
