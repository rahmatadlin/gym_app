const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Get all bookings
router.get('/', bookingController.getAllBookings);

// Get bookings by member ID
router.get('/member/:memberId', bookingController.getBookingsByMemberId);

// Get bookings by coach ID
router.get('/coach/:coachId', bookingController.getBookingsByCoachId);

// Create booking
router.post('/', bookingController.createBooking);

// Update booking
router.put('/:id', bookingController.updateBooking);

// Update booking status
router.patch('/:id/status', bookingController.updateBookingStatus);

// Delete booking
router.delete('/:id', bookingController.deleteBooking);

module.exports = router; 