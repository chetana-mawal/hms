const express = require('express');
const { getPayments, createPayment, updatePaymentStatus } = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, authorize('Admin', 'Staff'), getPayments)
  .post(protect, authorize('Admin', 'Staff'), createPayment);

router.route('/:id')
  .put(protect, authorize('Admin', 'Staff'), updatePaymentStatus);

module.exports = router;
