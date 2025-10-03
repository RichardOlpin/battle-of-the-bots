/**
 * Quick test script for utility modules
 */

async function runTests() {
  try {
    // Test config
    console.log('Testing config...');
    const config = require('./src/utils/config');
    console.log('✓ Config loaded and validated');
    console.log('  Port:', config.port);
    console.log('  Environment:', config.nodeEnv);
    console.log('  Google Client ID:', config.google.clientId ? '✓ Set' : '✗ Missing');
    console.log('  Encryption Key:', config.security.encryptionKey ? '✓ Set' : '✗ Missing');

    // Test date-utils
    console.log('\nTesting date-utils...');
    const dateUtils = require('./src/utils/date-utils');

    const now = new Date();
    console.log('✓ Date utils loaded');
    console.log('  ISO format:', dateUtils.formatToISO(now));

    const duration = dateUtils.calculateDuration('2025-10-03T09:00:00Z', '2025-10-03T10:30:00Z');
    console.log('  Duration calculation: 90 minutes expected, got', duration);
    if (duration !== 90) throw new Error('Duration calculation failed');

    const timeOfDay = dateUtils.getTimeOfDay('2025-10-03T10:00:00Z');
    console.log('  Time of day (10 AM):', timeOfDay);
    if (timeOfDay !== 'morning') throw new Error('Time of day calculation failed');

    const slots = dateUtils.findAvailableSlots(
      [
        { startTime: '2025-10-03T10:00:00Z', endTime: '2025-10-03T11:00:00Z' }
      ],
      '2025-10-03T08:00:00Z',
      '2025-10-03T17:00:00Z'
    );
    console.log('  Found', slots.length, 'available slots');
    if (slots.length !== 2) throw new Error('Available slots calculation failed');

    console.log('✓ All date-utils tests passed!');

    // Test token-manager
    console.log('\nTesting token-manager...');
    const tokenManager = require('./src/utils/token-manager');
    console.log('✓ Token manager loaded');

    // Test encryption/decryption
    const testToken = 'test_access_token_12345';
    const encrypted = await tokenManager.encryptToken(testToken);
    console.log('  Encrypted token:', encrypted.substring(0, 20) + '...');
    
    const decrypted = await tokenManager.decryptToken(encrypted);
    console.log('  Decrypted token matches:', decrypted === testToken ? '✓' : '✗');
    if (decrypted !== testToken) throw new Error('Token encryption/decryption failed');

    // Test token storage
    const userId = 'test_user_123';
    await tokenManager.storeTokens(userId, {
      accessToken: 'access_token_abc',
      refreshToken: 'refresh_token_xyz',
      expiresAt: Date.now() + 3600000
    });
    console.log('  Stored tokens for user:', userId);

    const retrieved = await tokenManager.getTokens(userId);
    console.log('  Retrieved tokens:', retrieved ? '✓' : '✗');
    if (!retrieved || retrieved.accessToken !== 'access_token_abc') {
      throw new Error('Token storage/retrieval failed');
    }

    console.log('✓ All token-manager tests passed!');

    console.log('\n✅ All utility modules working correctly!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
