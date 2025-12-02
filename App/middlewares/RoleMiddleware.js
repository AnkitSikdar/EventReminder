const Event = require('../models/Event');

class RoleMiddleware {
  async isAdminOrOwner(req, res, next) {
    try {
      const eventId = req.params.id || req.params.eventId; // ✅ handle both
      const event = await Event.findById(eventId);

      if (!event) {
        req.flash('error_msg', 'Event not found');
        return res.redirect('/dashboard');
      }

      const userId = req.user.id || req.user._id;

      if (req.user.role === 'admin' || userId.toString() === event.owner.toString()) {
        return next();
      }

      req.flash('error_msg', 'Access denied');
      return res.redirect('/dashboard');
    } catch (err) {
      console.error('RoleMiddleware Error:', err);
      req.flash('error_msg', 'Something went wrong');
      return res.redirect('/dashboard');
    }
  }

  isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      req.flash('error_msg', 'Access denied');
      return res.redirect('/dashboard');
    }
    next();
  }

  isOrganizer(req, res, next) {
    if (req.user.role !== 'organizer') {
      req.flash('error_msg', 'Access denied');
      return res.redirect('/dashboard');
    }
    next();
  }
}

module.exports = new RoleMiddleware();
