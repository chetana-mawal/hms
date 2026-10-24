const { create, findById, getCollection, update } = require('../store');

const populateBooking = (booking) => {
  const customer = findById('customers', booking.customer);
  const customerUser = customer && findById('users', customer.user);
  return {
    ...booking,
    customer: customer && {
      ...customer,
      user: customerUser && { name: customerUser.name, email: customerUser.email }
    },
    room: findById('rooms', booking.room)
  };
};

exports.getBookings = (req, res) => {
  const bookings = getCollection('bookings');
  if (req.user.role === 'Admin' || req.user.role === 'Staff') {
    return res.json(bookings.map(populateBooking));
  }

  const customer = getCollection('customers').find((entry) => entry.user === req.user._id);
  const ownBookings = customer
    ? bookings.filter((booking) => booking.customer === customer._id)
    : [];
  res.json(ownBookings.map(populateBooking));
};

exports.createBooking = (req, res) => {
  const { customer: customerId, room, checkInDate, checkOutDate } = req.body;
  let customer;
  if (req.user.role === 'Customer') {
    customer = getCollection('customers').find((entry) => entry.user === req.user._id);
    if (!customer) {
      customer = create('customers', { user: req.user._id, phone: '', address: '', preferences: '' });
    }
  } else {
    customer = findById('customers', customerId);
  }

  const roomData = findById('rooms', room);
  if (!roomData || roomData.status !== 'Available') {
    return res.status(400).json({ message: 'Room is not available' });
  }
  if (!customer ||
      !Number.isFinite(Date.parse(checkInDate)) ||
      !Number.isFinite(Date.parse(checkOutDate)) ||
      Date.parse(checkOutDate) <= Date.parse(checkInDate)) {
    return res.status(400).json({ message: 'Invalid booking data' });
  }

  const nights = Math.ceil(
    (Date.parse(checkOutDate) - Date.parse(checkInDate)) / 86400000
  );
  const booking = create('bookings', {
    customer: customer._id,
    room,
    checkInDate: new Date(checkInDate).toISOString(),
    checkOutDate: new Date(checkOutDate).toISOString(),
    totalPrice: Number((nights * roomData.pricePerNight).toFixed(2)),
    status: 'Pending'
  });
  update('rooms', roomData._id, { status: 'Booked' });
  res.status(201).json(booking);
};

exports.updateBookingStatus = (req, res) => {
  const booking = findById('bookings', req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const statuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
  const status = req.body.status || booking.status;
  if (!statuses.includes(status)) return res.status(400).json({ message: 'Invalid booking status' });
  if (req.user.role === 'Customer') {
    const customer = getCollection('customers').find((entry) => entry.user === req.user._id);
    if (!customer || customer._id !== booking.customer) {
      return res.status(403).json({ message: 'You can only update your own reservations' });
    }
    if (status !== 'Cancelled' || !['Pending', 'Confirmed'].includes(booking.status)) {
      return res.status(403).json({ message: 'Customers may only cancel pending or confirmed reservations' });
    }
  }

  const updatedBooking = update('bookings', booking._id, { status });
  if (status === 'Completed' || status === 'Cancelled') {
    const room = findById('rooms', booking.room);
    if (room) update('rooms', room._id, { status: 'Available' });
  }
  res.json(populateBooking(updatedBooking));
};
