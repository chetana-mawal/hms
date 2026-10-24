const express = require('express');
const { getCustomers, createCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, authorize('Admin', 'Staff'), getCustomers)
  .post(protect, authorize('Admin', 'Staff'), createCustomer);

module.exports = router;
