const express = require('express');
const router = express.Router();
const EventController = require('../controllers/EventController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const RoleMiddleware = require('../middlewares/RoleMiddleware');
const upload = require('../middlewares/Upload');

// View all events
router.get('/', EventController.getAllEvents);

// Show edit form
router.get('/:id/edit', AuthMiddleware.verifyToken, RoleMiddleware.isAdminOrOwner, EventController.showEditForm);

// Create event (Organizer)
router.post(
  '/create',
  AuthMiddleware.verifyToken,
  RoleMiddleware.isOrganizer,
  upload.fields([{ name: 'image' }, { name: 'video' }]),
  EventController.createEvent
);

// Update event
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  RoleMiddleware.isAdminOrOwner,
  upload.fields([{ name: 'image' }, { name: 'video' }]),
  EventController.updateEvent
);

// Delete event
router.delete('/:id', AuthMiddleware.verifyToken, RoleMiddleware.isAdminOrOwner, EventController.deleteEvent);

// Interested
router.post('/:id/interested', AuthMiddleware.verifyToken, EventController.markInterested);


// Remove interested user (Admin only)
router.post(
  '/:eventId/unmark/:userId',
  AuthMiddleware.verifyToken,
  RoleMiddleware.isAdmin,          // only admin can do this
  EventController.unmarkInterested
);

module.exports = router;
