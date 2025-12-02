const Event = require('../models/Event');
const mongoose = require('mongoose');
const Mailer = require('../utils/Mailer');

class EventController {
  // Get all events with owner details using aggregation
  async getAllEvents(req, res) {
    try {
      const events = await Event.aggregate([
        {
          $lookup: {
            from: 'users', 
            localField: 'owner',
            foreignField: '_id',
            as: 'ownerDetails'
          }
        },
        {
          $unwind: '$ownerDetails'
        },
        {
          $project: {
            title: 1,
            description: 1,
            startAt: 1,
            endAt: 1,
            image: 1,
            video: 1,
            'ownerDetails._id': 1,
            'ownerDetails.name': 1,
            'ownerDetails.email': 1
          }
        },
        { $sort: { startAt: 1 } } // optional sorting by event start date
      ]);

      res.render('events/index', { events });
    } catch (err) {
      console.error('Error fetching events with aggregation:', err);
      req.flash('error_msg', 'Unable to fetch events');
      res.redirect('/dashboard');
    }
  }

  // Show event edit form with aggregation
  async showEditForm(req, res) {
    try {
      const eventId = new mongoose.Types.ObjectId(req.params.id);

      const [event] = await Event.aggregate([
        { $match: { _id: eventId } },
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'ownerDetails'
          }
        },
        { $unwind: '$ownerDetails' }
      ]);

      if (!event) {
        req.flash('error_msg', 'Event not found');
        return res.redirect('/dashboard');
      }

      res.render('events/edit', { event });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Something went wrong');
      res.redirect('/dashboard');
    }
  }

  // Create new event
  async createEvent(req, res) {
    try {
      const { title, description, startAt, endAt } = req.body;
      const image = req.files?.image?.[0]?.filename || null;
      const video = req.files?.video?.[0]?.filename || null;

      const event = new Event({
        title,
        description,
        startAt,
        endAt,
        owner: req.user.id,
        image,
        video
      });

      await event.save();
      logger.info("data create successfully");
      req.flash('success_msg', 'Event created successfully');
      res.redirect('/dashboard');
    } catch (err) {
      logger.error("Error fetching posts", err);
      req.flash('error_msg', 'Error creating event');
      res.redirect('/dashboard');
    }
  }

  // Update event with file handling
  async updateEvent(req, res) {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        req.flash('error_msg', 'Event not found');
        return res.redirect('/dashboard');
      }

      Object.assign(event, req.body);
      if (req.files?.image) event.image = req.files.image[0].filename;
      if (req.files?.video) event.video = req.files.video[0].filename;

      await event.save();
      req.flash('success_msg', 'Event updated successfully');
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error updating event');
      res.redirect('/dashboard');
    }
  }

  // Delete event
  async deleteEvent(req, res) {
    try {
      await Event.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Event deleted successfully');
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error deleting event');
      res.redirect('/dashboard');
    }
  }

  // Mark interested using aggregation and send HTML email
  async markInterested(req, res) {
    try {
      if (!req.user || !req.user.email) {
        console.error('Cannot send email: user not logged in or email missing');
        req.flash('error_msg', 'Cannot send email: missing user information');
        return res.redirect('/dashboard');
      }

      const eventId = new mongoose.Types.ObjectId(req.params.id);

      const [event] = await Event.aggregate([
        { $match: { _id: eventId } },
        {
          $lookup: {
            from: 'users',
            localField: 'interested',
            foreignField: '_id',
            as: 'interestedUsers'
          }
        },
        { $project: { title: 1, startAt: 1, interested: 1 } }
      ]);

      if (!event) {
        req.flash('error_msg', 'Event not found');
        return res.redirect('/dashboard');
      }

      // Prevent duplicate interest
      if (event.interested.some(id => id.toString() === req.user.id.toString())) {
        req.flash('error_msg', 'Already marked as interested');
        return res.redirect('/dashboard');
      }

      await Event.updateOne(
        { _id: eventId },
        { $push: { interested: req.user.id } }
      );

      // Send confirmation email
      try {
        await Mailer.sendEmail(
          req.user.email,
          `Reminder: ${event.title}`,
          `Hi ${req.user.name}, you marked interest in "${event.title}". Event starts at ${event.startAt}.`
        );
        req.flash('success_msg', 'Marked interested! You will receive reminders.');
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
        req.flash('warning_msg', 'Marked interested, but email could not be sent.');
      }

      res.redirect('/dashboard');
    } catch (err) {
      console.error('Mark Interested Error:', err);
      req.flash('error_msg', 'Something went wrong while marking interest');
      res.redirect('/dashboard');
    }
  }

  // Unmark interested using aggregation
  async unmarkInterested(req, res) {
    try {
      const { eventId, userId } = req.params;

      if (!req.user || req.user.role !== 'admin') {
        req.flash('error_msg', 'Unauthorized action');
        return res.redirect('/dashboard');
      }

      const eventObjectId = new mongoose.Types.ObjectId(eventId);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const [event] = await Event.aggregate([
        { $match: { _id: eventObjectId } },
        {
          $lookup: {
            from: 'users',
            localField: 'interested',
            foreignField: '_id',
            as: 'interestedUsers'
          }
        },
        { $project: { title: 1, interestedUsers: 1 } }
      ]);

      if (!event) {
        req.flash('error_msg', 'Event not found');
        return res.redirect('/dashboard');
      }

      const user = event.interestedUsers.find(u => u._id.toString() === userId);
      if (!user) {
        req.flash('error_msg', 'User is not marked as interested');
        return res.redirect('/dashboard');
      }

      // Remove user from interest list
      await Event.updateOne(
        { _id: eventObjectId },
        { $pull: { interested: userObjectId } }
      );

      // Send email notification
      if (user.email) {
        try {
          await Mailer.sendEmail(
            user.email,
            `You have been unmarked from "${event.title}"`,
            `Hi ${user.name},\n\nYou have been removed from the event "${event.title}" by an admin.\n\nRegards,\nEvent Team`
          );
        } catch (err) {
          console.error('Email sending failed:', err);
          req.flash('warning_msg', 'User unmarked but email failed to send.');
        }
      }

      req.flash('success_msg', `User ${user.name} unmarked successfully`);
      res.redirect('/dashboard');

    } catch (err) {
      console.error('Unmark Interested Error:', err);
      req.flash('error_msg', 'Something went wrong while unmarking user');
      res.redirect('/dashboard');
    }
  }
}

module.exports = new EventController();
