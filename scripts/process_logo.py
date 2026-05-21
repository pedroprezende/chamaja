import os
from PIL import Image

src_path = r"C:\Users\Pedro\.gemini\antigravity-ide\brain\c7789cbf-25b8-4be5-9eca-48097073255b\media__1779336401814.jpg"
dest_dir = r"c:\Users\Pedro\Downloads\chama\chamaja\assets\images"

os.makedirs(dest_dir, exist_ok=True)

# Load original logo
img = Image.open(src_path)
print(f"Loaded logo from {src_path} with size {img.size}")

# 1. icon.png (1024x1024)
icon_img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
icon_img.save(os.path.join(dest_dir, "icon.png"), "PNG")
print("Generated icon.png")

# 2. splash-icon.png (1024x1024)
splash_img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
splash_img.save(os.path.join(dest_dir, "splash-icon.png"), "PNG")
print("Generated splash-icon.png")

# 3. favicon.png (48x48)
favicon_img = img.resize((48, 48), Image.Resampling.LANCZOS)
favicon_img.save(os.path.join(dest_dir, "favicon.png"), "PNG")
print("Generated favicon.png")

# Get exact background color from top-left pixel
bg_pixel = img.convert("RGB").getpixel((10, 10))
bg_hex = "#%02x%02x%02x" % bg_pixel
print(f"Detected background color: {bg_hex}")

# 4. android-icon-background.png (1024x1024 solid background color)
bg_img = Image.new("RGBA", (1024, 1024), bg_hex)
bg_img.save(os.path.join(dest_dir, "android-icon-background.png"), "PNG")
print("Generated android-icon-background.png")

# 5. android-icon-foreground.png (1024x1024 transparent canvas with logo centered and scaled to 60%)
fg_img = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
# Scale logo to 600x600 px (60% safe zone size)
logo_scaled = img.resize((600, 600), Image.Resampling.LANCZOS)
# Paste at center: (1024-600)//2 = 212
fg_img.paste(logo_scaled, (212, 212))
fg_img.save(os.path.join(dest_dir, "android-icon-foreground.png"), "PNG")
print("Generated android-icon-foreground.png")

# 6. android-icon-monochrome.png (monochrome version, fallback)
fg_img.save(os.path.join(dest_dir, "android-icon-monochrome.png"), "PNG")
print("Generated android-icon-monochrome.png")

# Save background color to a text file so we can read it
with open(os.path.join(dest_dir, "bg_color.txt"), "w") as f:
    f.write(bg_hex)
print("Saved detected background color to bg_color.txt")
