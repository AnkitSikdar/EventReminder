const bcrypt = require('bcryptjs');
const Token = require('../utils/Token');
const User = require('../models/User');

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      let user = await User.findOne({ email });
      if (user) {
        req.flash('error_msg', 'User already exists');
        return res.redirect('/register');
      }

      const hashed = await bcrypt.hash(password, 10);
      user = new User({ name, email, password: hashed, role });
      await user.save();

      req.flash('success_msg', 'Registered successfully. Please login.');
      res.redirect('/login');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Something went wrong');
      res.redirect('/register');
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        req.flash('error_msg', 'Invalid credentials');
        return res.redirect('/login');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.flash('error_msg', 'Invalid credentials');
        return res.redirect('/login');
      }

      // JWT Token
      const payload = { id: user._id, role: user.role, name: user.name };
      const accessToken = Token.generateAccessToken(payload);

      res.cookie('token', accessToken, { httpOnly: true });
      req.flash('success_msg', 'Login successful');
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Login error');
      res.redirect('/login');
    }
  }

  logout(req, res) {
    res.clearCookie('token');
    req.flash('success_msg', 'Logged out successfully');
    res.redirect('/login');
  }
}

module.exports = new AuthController();
