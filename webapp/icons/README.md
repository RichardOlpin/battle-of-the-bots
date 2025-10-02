# AuraFlow PWA Icons

This directory contains all icons for the AuraFlow web application and PWA.

## Icon Files

### Standard Icons (from Chrome Extension)
- `icon16.png` / `icon16.svg` - 16x16 favicon
- `icon48.png` / `icon48.svg` - 48x48 standard icon
- `icon128.png` / `icon128.svg` - 128x128 high-res icon

### PWA Icons
- `icon-192.png` - 192x192 PWA standard icon (maskable)
- `icon-512.png` - 512x512 PWA high-res icon (maskable)

## PWA Maskable Icon Requirements

The PWA icons (192x192 and 512x512) are designed to meet PWA maskable icon requirements:

- **Safe Zone**: 20% padding on all sides (40% total)
- **Content Area**: Icon content is centered in the middle 60% of the canvas
- **Background**: Full-bleed gradient background extends to edges
- **Shape**: Rounded corners that work with various mask shapes

This ensures the icons display correctly when:
- Installed on Android home screens (circular masks)
- Installed on iOS home screens (rounded square masks)
- Displayed in app switchers and notifications

## Regenerating Icons

If you need to regenerate the PWA icons:

### Option 1: Python Script (Recommended)
```bash
cd webapp/icons
python3 generate-pwa-icons.py
```

### Option 2: HTML Generator (Manual)
1. Open `generate-pwa-icons.html` in a web browser
2. Click "Generate PWA Icons"
3. Download each icon using the download buttons
4. Save as `icon-192.png` and `icon-512.png`

### Option 3: Node.js Script (Requires canvas package)
```bash
cd webapp/icons
npm install canvas
node generate-pwa-icons.js
```

## Design

The icon features:
- Gradient background (purple to darker purple)
- White calendar shape with rounded corners
- Colored dots representing calendar events
- Consistent with AuraFlow brand colors (#667eea, #764ba2)

## Testing Maskable Icons

To test if icons meet maskable requirements:
1. Visit https://maskable.app/editor
2. Upload icon-192.png or icon-512.png
3. Verify content remains visible in all mask shapes
4. Ensure no important content is cut off in circular mask
