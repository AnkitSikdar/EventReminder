const jwt = require('jsonwebtoken');
const User = require('../models/User'); // make sure path is correct

class AuthMiddleware {
  async verifyToken(req, res, next) {
    const token = req.cookies.token || req.headers['authorization'];
    if (!token) return res.status(401).send('Access Denied');

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // Fetch user from DB to get email
      const user = await User.findById(decoded.id).select('id name email role');
      if (!user) return res.status(401).send('User not found');

      req.user = user; // now req.user has id, name, email, role
      next();
    } catch (err) {
      console.error('AuthMiddleware Error:', err);
      return res.status(403).send('Invalid Token');
    }
  }
}

module.exports = new AuthMiddleware();
