const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SESSION_SECRET || 'chipstock_default_jwt_secret_key_change_in_production';

function authMiddleware(req, res, next) {
  try {
    let token = null;

    // Check cookie first
    if (req.cookies && req.cookies.chipstock_token) {
      token = req.cookies.chipstock_token;
    }

    // Check Authorization header fallback (useful for mobile PWA standalone if cookies are partitioned)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Invalid or expired session' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET,
};
