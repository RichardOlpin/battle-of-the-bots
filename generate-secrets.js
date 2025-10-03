#!/usr/bin/env node

/**
 * Generate random secrets for .env file
 */

const crypto = require('crypto');

console.log('\n🔐 AuraFlow Secret Generator\n');
console.log('Copy these values to your .env file:\n');
console.log('─'.repeat(60));

// Generate SESSION_SECRET (64 characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('\nSESSION_SECRET (64 characters):');
console.log(sessionSecret);

// Generate ENCRYPTION_KEY (32 characters - required for AES-256)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('\nENCRYPTION_KEY (32 characters):');
console.log(encryptionKey);

console.log('\n' + '─'.repeat(60));
console.log('\n📋 Add to your .env file:\n');
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('\n✅ These are cryptographically secure random values\n');
