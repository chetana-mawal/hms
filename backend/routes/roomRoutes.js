const express = require('express');
const { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getRooms)
  .post(protect, authorize('Admin', 'Staff'), createRoom);

router.route('/:id')
  .get(getRoomById)
  .put(protect, authorize('Admin', 'Staff'), updateRoom)
  .delete(protect, authorize('Admin'), deleteRoom);

module.exports = router;
