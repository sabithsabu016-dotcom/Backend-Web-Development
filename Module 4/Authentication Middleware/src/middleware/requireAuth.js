const jwt = require('jsonwebtoken');

const AUTH_ERROR = {
  error: {
    code: 'AUTH_REQUIRED',
    message: 'Authentication required',
  },
};

module.exports = function requireAuth(req, res, next) {
 // Replace this with your implementation:
   const authorization = req.get('Authorization') || '';

  // Require the exact "Bearer <token>" format.
  const match = authorization.match(/^Bearer ([^\s]+)$/);

  if (!match) {
    return res.status(401).json(AUTH_ERROR);
  }

  const token = match[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    req.user = payload;
    return next();
  } catch {
    return res.status(401).json(AUTH_ERROR);
  }
};
