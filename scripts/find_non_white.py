from PIL import Image

src_path = r"c:\Users\Pedro\Downloads\chama\chamaja\attached_assets\ChatGPT_Image_7_05_2026,_22_13_32_1778202879904.png"
img = Image.open(src_path)
width, height = img.size

# Let's find all pixels that are not white/light (e.g., at least one channel < 240)
non_white_pixels = []
for y in range(height):
    for x in range(width):
        r, g, b = img.getpixel((x, y))[:3]
        if r < 240 or g < 240 or b < 240:
            non_white_pixels.append((x, y))

if non_white_pixels:
    xs = [p[0] for p in non_white_pixels]
    ys = [p[1] for p in non_white_pixels]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    print(f"Non-white bounding box: x in [{min_x}, {max_x}], y in [{min_y}, {max_y}]")
    print(f"Width: {max_x - min_x + 1}, Height: {max_y - min_y + 1}")
else:
    print("No non-white pixels found!")
