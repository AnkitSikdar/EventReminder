const cron = require('node-cron');
const Event = require('../models/Event');
const Mailer = require('./Mailer');

class CronJob {
  start() {
    
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const nextMinute = new Date(now.getTime() + 24 *60 * 60 * 1000);

        const events = await Event.aggregate([
          {
            $match: {
              startAt: { $gte: now, $lte: nextMinute }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'interested',
              foreignField: '_id',
              as: 'interestedUsers'
            }
          },
          {
            $project: {
              title: 1,
              description: 1,
              startAt: 1,
              'interestedUsers._id': 1,
              'interestedUsers.name': 1,
              'interestedUsers.email': 1,
              'interestedUsers.reminded': 1 // optional: to track reminders
            }
          }
        ]);

        if (events.length === 0) {
          console.log('No events starting soon. No reminders to send.');
          return;
        }

        for (const event of events) {
          if (!event.interestedUsers || event.interestedUsers.length === 0) {
            console.log(`Event "${event.title}" has no interested users.`);
            continue;
          }

          for (const user of event.interestedUsers) {
            // Optional: skip if already reminded (you can add a "reminded" array in Event schema)
            // if (user.reminded) continue;

            const eventDate = new Date(event.startAt).toLocaleString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            const message = `Hi ${user.name},\n\nThis is a reminder! The event "${event.title}" you marked interest in starts at ${eventDate}.\n\nDescription: ${event.description}\n\nDon't miss it!`;

            try {
              await Mailer.sendEmail(
                user.email,
                `Reminder: ${event.title}`,
                message
              );
              console.log(`[Reminder Sent] ${user.name} (${user.email}) for event "${event.title}" starting at ${eventDate}`);
            } catch (emailErr) {
              console.error(`[Reminder Failed] ${user.name} (${user.email}) for event "${event.title}":`, emailErr);
            }
          }
        }

        console.log('Cron job executed successfully.');
      } catch (err) {
        console.error('Cron job error:', err);
      }
    });

    console.log('Cron job started: will run every 1 minute for testing.');
  }
}
module.exports = new CronJob();
