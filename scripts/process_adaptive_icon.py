import os
from PIL import Image, ImageDraw

def main():
    icon_path = 'assets/images/xj/icone_mascote_512.png'
    output_path = 'assets/images/xj/icone_mascote_foreground.png'
    
    if not os.path.exists(icon_path):
        print(f"Error: {icon_path} not found.")
        return
        
    print("Loading icon...")
    img = Image.open(icon_path).convert('RGBA')
    
    # 1. Floodfill from the corners to make the black background transparent
    print("Floodfilling black background to transparent...")
    ImageDraw.floodfill(img, (0, 0), (0, 0, 0, 0), thresh=20)
    ImageDraw.floodfill(img, (511, 0), (0, 0, 0, 0), thresh=20)
    ImageDraw.floodfill(img, (0, 511), (0, 0, 0, 0), thresh=20)
    ImageDraw.floodfill(img, (511, 511), (0, 0, 0, 0), thresh=20)
    
    # 2. Get the bounding box of the mascot
    bbox = img.getbbox()
    if not bbox:
        print("Error: Could not find mascot bounding box.")
        return
        
    print(f"Mascot bounding box: {bbox}")
    mascot = img.crop(bbox)
    w, h = mascot.size
    print(f"Mascot original size: {w}x{h}")
    
    # 3. Scale the mascot so that its maximum dimension is 300px (safe zone inside 512x512)
    max_dim = 300
    if w > h:
        new_w = max_dim
        new_h = int(h * (max_dim / w))
    else:
        new_h = max_dim
        new_w = int(w * (max_dim / h))
        
    print(f"Scaling mascot to: {new_w}x{new_h}")
    mascot_resized = mascot.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # 4. Create a new transparent 512x512 canvas and center the mascot
    foreground = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    paste_x = (512 - new_w) // 2
    paste_y = (512 - new_h) // 2
    
    foreground.paste(mascot_resized, (paste_x, paste_y), mascot_resized)
    
    # 5. Save the output
    foreground.save(output_path, 'PNG')
    print(f"Successfully generated adaptive icon foreground at: {output_path}")

if __name__ == '__main__':
    main()
