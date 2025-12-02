const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

class DashboardController {
  async showDashboard(req, res) {
    const role = req.user.role;

    if (role === 'admin') {
      // Fetch events with owner + interested using aggregation
      const events = await Event.aggregate([
        {
          $lookup: {
            from: 'users', // collection name (plural, lowercase)
            localField: 'owner',
            foreignField: '_id',
            as: 'owner'
          }
        },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'interested',
            foreignField: '_id',
            as: 'interested'
          }
        }
      ]);

      const users = await User.find();
      return res.render('dashboard/admin', { user: req.user, events, users });
    }

    if (role === 'organizer') {
      // Organizer sees only their events
      const events = await Event.aggregate([
        {
          $match: { owner: new mongoose.Types.ObjectId(req.user.id) }
        }
      ]);
      return res.render('dashboard/organizer', { user: req.user, events });
    }

    if (role === 'user') {
      // User sees events with owner details
      const events = await Event.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner'
          }
        },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } }
      ]);
      return res.render('dashboard/user', { user: req.user, events });
    }

    res.redirect('/events');
  }
}

module.exports = new DashboardController();
