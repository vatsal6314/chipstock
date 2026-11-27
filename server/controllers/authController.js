const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const envHash = process.env.ADMIN_PASSWORD_HASH;
    let isMatch = false;

    if (envHash) {
      if (envHash.startsWith('$2a$') || envHash.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, envHash);
      } else {
        // Plain text fallback if user provided direct password in env
        isMatch = password === envHash;
      }
    } else {
      // Default initial password for local testing if not configured yet
      isMatch = password === 'chipstock123';
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // 30 days expiration for hostel owner convenience
    const token = jwt.sign({ role: 'admin', loggedInAt: Date.now() }, JWT_SECRET, {
      expiresIn: '30d',
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('chipstock_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    return res.json({
      success: true,
      token,
      message: 'Logged in successfully',
      user: { role: 'admin' },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('chipstock_token', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
};

exports.me = (req, res) => {
  return res.json({
    success: true,
    authenticated: true,
    user: req.user,
  });
  });
};

exports.generateHash = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    return res.json({
      success: true,
      hash,
      note: 'Copy this hash and set it as ADMIN_PASSWORD_HASH in your .env or Netlify settings',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate hash' });
  }
};
