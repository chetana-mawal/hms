const express = require('express');
const { getBookings, createBooking, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router.route('/:id')
  .put(protect, updateBookingStatus);

module.exports = router;
