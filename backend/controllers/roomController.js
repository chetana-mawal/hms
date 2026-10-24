const { create, findById, getCollection, remove, update } = require('../store');

const roomTypes = ['Single', 'Double', 'Suite', 'Deluxe'];
const roomStatuses = ['Available', 'Booked', 'Maintenance'];

const isValidRoom = (room) =>
  typeof room.roomNumber === 'string' && room.roomNumber.trim() &&
  roomTypes.includes(room.type) &&
  Number.isFinite(Number(room.pricePerNight)) && Number(room.pricePerNight) >= 0 &&
  (!room.status || roomStatuses.includes(room.status)) &&
  (room.amenities === undefined || Array.isArray(room.amenities));

exports.getRooms = (req, res) => res.json(getCollection('rooms'));

exports.getRoomById = (req, res) => {
  const room = findById('rooms', req.params.id);
  if (room) res.json(room);
  else res.status(404).json({ message: 'Room not found' });
};

exports.createRoom = (req, res) => {
  if (!isValidRoom(req.body)) {
    return res.status(400).json({ message: 'Invalid room data' });
  }
  const duplicate = getCollection('rooms').some(
    (room) => room.roomNumber === req.body.roomNumber.trim()
  );
  if (duplicate) return res.status(400).json({ message: 'Room number already exists' });

  const room = create('rooms', {
    ...req.body,
    roomNumber: req.body.roomNumber.trim(),
    pricePerNight: Number(req.body.pricePerNight),
    status: req.body.status || 'Available',
    amenities: req.body.amenities || []
  });
  res.status(201).json(room);
};

exports.updateRoom = (req, res) => {
  const current = findById('rooms', req.params.id);
  if (!current) return res.status(404).json({ message: 'Room not found' });

  const changes = { ...req.body };
  const candidate = { ...current, ...changes };
  if (!isValidRoom(candidate)) return res.status(400).json({ message: 'Invalid data' });

  const roomNumber = candidate.roomNumber.trim();
  const duplicate = getCollection('rooms').some(
    (room) => room._id !== current._id && room.roomNumber === roomNumber
  );
  if (duplicate) return res.status(400).json({ message: 'Room number already exists' });
  candidate.roomNumber = roomNumber;
  candidate.pricePerNight = Number(candidate.pricePerNight);
  res.json(update('rooms', current._id, candidate));
};

exports.deleteRoom = (req, res) => {
  if (remove('rooms', req.params.id)) {
    res.json({ message: 'Room removed' });
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};
