#!/usr/bin/env node

/**
 * Generate PWA icons for AuraFlow
 * This script creates 192x192 and 512x512 PNG icons with maskable safe zones
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let Canvas;
try {
    Canvas = require('canvas');
} catch (e) {
    console.log('Canvas module not available. Generating using HTML5 Canvas approach...');
    console.log('Please open generate-pwa-icons.html in your browser to generate icons.');
    process.exit(0);
}

const { createCanvas } = Canvas;

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawIcon(canvas, size) {
    const ctx = canvas.getContext('2d');
    
    // For maskable icons, we need to add safe zone padding (20% on each side)
    const safeZone = size * 0.2;
    const contentSize = size - (safeZone * 2);
    const contentX = safeZone;
    const contentY = safeZone;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    // Draw rounded rectangle background (full canvas)
    const bgRadius = size * 0.15;
    ctx.fillStyle = gradient;
    roundRect(ctx, 0, 0, size, size, bgRadius);
    ctx.fill();

    // Draw calendar shape in safe zone
    const padding = contentSize * 0.2;
    const calWidth = contentSize - (padding * 2);
    const calHeight = calWidth * 0.9;
    const calX = contentX + padding;
    const calY = contentY + (contentSize * 0.15);
    const calRadius = size * 0.04;

    // Calendar body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, calX, calY, calWidth, calHeight, calRadius);
    ctx.fill();

    // Calendar header
    ctx.fillStyle = 'white';
    roundRect(ctx, calX, calY, calWidth, calHeight * 0.2, calRadius);
    ctx.fill();

    // Draw dots (events)
    const dotSize = calWidth * 0.08;
    const dotSpacing = calWidth / 4;
    const startX = calX + dotSpacing * 0.7;
    const startY = calY + calHeight * 0.4;

    // First row - purple dots
    ctx.fillStyle = '#667eea';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(startX + (i * dotSpacing), startY, dotSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Second row - darker purple dots
    ctx.fillStyle = '#764ba2';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(startX + (i * dotSpacing), startY + dotSpacing, dotSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Third row - purple dots
    ctx.fillStyle = '#667eea';
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(startX + (i * dotSpacing), startY + (dotSpacing * 2), dotSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    drawIcon(canvas, size);
    
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(__dirname, `icon-${size}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`✓ Created ${filename}`);
}

console.log('Generating PWA icons for AuraFlow...\n');

try {
    generateIcon(192);
    generateIcon(512);
    console.log('\n✓ All PWA icons generated successfully!');
    console.log('Icons meet PWA maskable requirements with 20% safe zone padding.');
} catch (error) {
    console.error('Error generating icons:', error.message);
    console.log('\nFallback: Please open generate-pwa-icons.html in your browser to generate icons manually.');
}
