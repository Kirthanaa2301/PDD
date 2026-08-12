const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super-secret-key-asthmasense-ai';
    let decoded;
    console.log('[Auth] Token to verify:', token ? (token.substring(0, 15) + '...') : 'null');
    console.log('[Auth] env.JWT_SECRET:', process.env.JWT_SECRET ? 'Exists' : 'Fallback');
    try {
      decoded = jwt.verify(token, secret);
      console.log('[Auth] Verified with primary secret');
    } catch (e1) {
      console.log('[Auth] Primary secret verification failed:', e1.message);
      try {
        decoded = jwt.verify(token, 'asthmasense_super_secret_jwt_key_2026');
        console.log('[Auth] Verified with backup secret 1');
      } catch (e2) {
        console.log('[Auth] Backup secret 1 failed:', e2.message);
        try {
          decoded = jwt.verify(token, 'super-secret-key-asthmasense-ai');
          console.log('[Auth] Verified with backup secret 2');
        } catch (e3) {
          console.log('[Auth] Backup secret 2 failed:', e3.message);
          throw e3;
        }
      }
    }
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('[Auth] All token verification attempts failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = requireAuth;
