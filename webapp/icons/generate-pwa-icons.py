#!/usr/bin/env python3
"""
Generate PWA icons for AuraFlow
Creates 192x192 and 512x512 PNG icons with maskable safe zones
"""

import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("PIL/Pillow not available.")
    print("Please open generate-pwa-icons.html in your browser to generate icons manually.")
    sys.exit(0)

def create_rounded_rectangle_mask(size, radius):
    """Create a rounded rectangle mask"""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=255)
    return mask

def draw_calendar_icon(size):
    """Draw the AuraFlow calendar icon"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background (simplified - solid color with gradient effect)
    for y in range(size):
        # Interpolate between two colors
        ratio = y / size
        r = int(102 + (118 - 102) * ratio)
        g = int(110 + (75 - 110) * ratio)
        b = int(234 + (162 - 234) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Apply rounded corners to background
    bg_radius = int(size * 0.15)
    mask = create_rounded_rectangle_mask(size, bg_radius)
    
    # Create final image with rounded corners
    rounded_img = Image.new('RGB', (size, size), (255, 255, 255))
    rounded_img.paste(img, (0, 0), mask)
    img = rounded_img
    draw = ImageDraw.Draw(img)
    
    # For maskable icons, content should be in center 60%
    safe_zone = int(size * 0.2)
    content_size = size - (safe_zone * 2)
    content_x = safe_zone
    content_y = safe_zone
    
    # Draw calendar shape in safe zone
    padding = int(content_size * 0.2)
    cal_width = content_size - (padding * 2)
    cal_height = int(cal_width * 0.9)
    cal_x = content_x + padding
    cal_y = content_y + int(content_size * 0.15)
    cal_radius = int(size * 0.04)
    
    # Calendar body (white with slight transparency effect)
    draw.rounded_rectangle(
        [(cal_x, cal_y), (cal_x + cal_width, cal_y + cal_height)],
        radius=cal_radius,
        fill=(242, 242, 242)
    )
    
    # Calendar header (pure white)
    header_height = int(cal_height * 0.2)
    draw.rounded_rectangle(
        [(cal_x, cal_y), (cal_x + cal_width, cal_y + header_height)],
        radius=cal_radius,
        fill=(255, 255, 255)
    )
    
    # Draw dots (events)
    dot_size = int(cal_width * 0.08)
    dot_spacing = cal_width // 4
    start_x = cal_x + int(dot_spacing * 0.7)
    start_y = cal_y + int(cal_height * 0.4)
    
    # First row - purple dots
    for i in range(3):
        x = start_x + (i * dot_spacing)
        draw.ellipse(
            [(x - dot_size, start_y - dot_size), (x + dot_size, start_y + dot_size)],
            fill=(102, 110, 234)
        )
    
    # Second row - darker purple dots
    for i in range(3):
        x = start_x + (i * dot_spacing)
        y = start_y + dot_spacing
        draw.ellipse(
            [(x - dot_size, y - dot_size), (x + dot_size, y + dot_size)],
            fill=(118, 75, 162)
        )
    
    # Third row - purple dots (partial)
    for i in range(2):
        x = start_x + (i * dot_spacing)
        y = start_y + (dot_spacing * 2)
        draw.ellipse(
            [(x - dot_size, y - dot_size), (x + dot_size, y + dot_size)],
            fill=(102, 110, 234)
        )
    
    return img

def generate_icon(size):
    """Generate and save an icon of the specified size"""
    print(f"Generating {size}x{size} icon...")
    img = draw_calendar_icon(size)
    filename = f"icon-{size}.png"
    img.save(filename, 'PNG')
    print(f"✓ Created {filename}")

if __name__ == "__main__":
    print("Generating PWA icons for AuraFlow...\n")
    
    try:
        generate_icon(192)
        generate_icon(512)
        print("\n✓ All PWA icons generated successfully!")
        print("Icons meet PWA maskable requirements with 20% safe zone padding.")
    except Exception as e:
        print(f"Error generating icons: {e}")
        print("\nFallback: Please open generate-pwa-icons.html in your browser to generate icons manually.")
        sys.exit(1)
