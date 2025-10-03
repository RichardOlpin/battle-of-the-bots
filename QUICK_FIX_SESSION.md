# Quick Fix: Session Secret Error

## Error
```
Error: secret option required for sessions
```

## Cause
The session middleware was looking for `config.sessionSecret` but it's actually at `config.security.sessionSecret`.

## Fix Applied
Changed:
```javascript
secret: config.sessionSecret  // ❌ Wrong
```

To:
```javascript
secret: config.security.sessionSecret  // ✅ Correct
```

## Test Now

**Restart backend:**
```bash
./restart-all.sh
```

**Then test:**
```
http://localhost:5000
```

Should work now! ✅
