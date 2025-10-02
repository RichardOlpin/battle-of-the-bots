# Responsive Design Quick Reference

## Breakpoints

```css
/* Mobile Small */
@media (max-width: 374px) { }

/* Mobile Standard */
@media (min-width: 375px) and (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1440px) { }
```

## Container Sizes

| Breakpoint | Max Width | Padding |
|------------|-----------|---------|
| < 375px | 100% | 12px |
| 375-767px | 100% | 16px |
| 768-1023px | 600px | 24px |
| 1024-1439px | 800px | 32px |
| ≥ 1440px | 900px | 32px |

## Touch Target Sizes

| Device | Minimum Size |
|--------|--------------|
| Mobile | 44x44px |
| Tablet | 48x48px |
| Desktop | 44x44px |

## Testing Commands

```bash
# Start local server
npx serve webapp

# Or with Python
python3 -m http.server 8080

# Access from mobile
# Find IP: ifconfig (Mac/Linux) or ipconfig (Windows)
# Open: http://[YOUR_IP]:8080
```

## Quick Test Checklist

- [ ] Test at 320px width
- [ ] Test at 375px width
- [ ] Test at 768px width
- [ ] Test at 1024px width
- [ ] Verify touch targets ≥ 44px
- [ ] Test on real mobile device
- [ ] Test landscape orientation
- [ ] Verify no horizontal scroll

## Common Issues

**Horizontal scrolling?**
- Check for fixed widths
- Verify viewport meta tag
- Check for overflow content

**Touch targets too small?**
- Add `min-height: 44px` to buttons
- Add `min-width: 44px` to buttons
- Increase padding

**Layout breaks at breakpoint?**
- Check media query syntax
- Verify specificity
- Test in DevTools

## Testing Tools

1. **responsive-test.html** - Interactive testing page
2. **RESPONSIVE_DESIGN_TESTING.md** - Full testing guide
3. Browser DevTools (F12 → Device Toolbar)

## Key Files

- `webapp/style.css` - All responsive styles
- `webapp/index.html` - Viewport meta tag
- `webapp/responsive-test.html` - Testing tool
