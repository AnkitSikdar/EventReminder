const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: { type: String },
  video: { type: String },
  interested: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', EventSchema);
