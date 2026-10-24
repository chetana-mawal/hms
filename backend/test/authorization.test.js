const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { registerUser } = require('../controllers/authController');
const {
  create,
  getCollection
} = require('../store');
const {
  createBooking,
  getBookings,
  updateBookingStatus
} = require('../controllers/bookingController');
const { authorize } = require('../middlewares/authMiddleware');

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const customerUser = (name) => create('users', {
  name,
  email: `${name.toLowerCase()}@example.test`,
  password: 'hashed',
  role: 'Customer'
});

const room = (pricePerNight = 100) => create('rooms', {
  roomNumber: '101',
  type: 'Single',
  pricePerNight,
  status: 'Available',
  amenities: []
});

beforeEach(() => {
  Object.values(require('../store').collections).forEach((collection) => collection.splice(0));
});

afterEach(() => {
  delete process.env.ADMIN_SETUP_KEY;
});

test('public registration cannot grant admin without the setup key', async () => {
  process.env.ADMIN_SETUP_KEY = 'private-test-key';
  const res = response();
  await registerUser({
    body: {
      name: 'Unverified Admin',
      email: 'admin@example.test',
      password: 'password',
      role: 'Admin'
    }
  }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(getCollection('users').length, 0);
});

test('administrator registration requires the configured setup key', async () => {
  process.env.ADMIN_SETUP_KEY = 'private-test-key';
  const res = response();
  await registerUser({
    body: {
      name: 'Hotel Admin',
      email: 'admin@example.test',
      password: 'password',
      role: 'Admin',
      adminSetupKey: 'private-test-key'
    }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.role, 'Admin');
});

test('customers only receive their own bookings', () => {
  const firstUser = customerUser('Ava');
  const secondUser = customerUser('Noah');
  const firstCustomer = create('customers', { user: firstUser._id, phone: '' });
  const secondCustomer = create('customers', { user: secondUser._id, phone: '' });
  const roomData = room();
  const firstBooking = create('bookings', { customer: firstCustomer._id, room: roomData._id });
  create('bookings', { customer: secondCustomer._id, room: roomData._id });

  const res = response();
  getBookings({ user: firstUser }, res);

  assert.deepEqual(res.body.map((booking) => booking._id), [firstBooking._id]);
});

test('customer bookings use their identity and the room rate, not submitted values', () => {
  const user = customerUser('Ava');
  const customer = create('customers', { user: user._id, phone: '' });
  const otherCustomer = create('customers', { user: customerUser('Noah')._id, phone: '' });
  const roomData = room(125);
  const res = response();

  createBooking({
    user,
    body: {
      customer: otherCustomer._id,
      room: roomData._id,
      checkInDate: '2026-11-01',
      checkOutDate: '2026-11-04',
      totalPrice: 1
    }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.customer, customer._id);
  assert.equal(res.body.totalPrice, 375);
});

test('customers can cancel their own reservation but cannot change its status', () => {
  const user = customerUser('Ava');
  const customer = create('customers', { user: user._id, phone: '' });
  const roomData = room();
  const booking = create('bookings', {
    customer: customer._id,
    room: roomData._id,
    status: 'Pending'
  });
  const res = response();

  updateBookingStatus({ user, params: { id: booking._id }, body: { status: 'Cancelled' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'Cancelled');
  assert.equal(roomData.status, 'Available');
});

test('customers cannot cancel another guest reservation', () => {
  const user = customerUser('Ava');
  const otherCustomer = create('customers', { user: customerUser('Noah')._id, phone: '' });
  const roomData = room();
  const booking = create('bookings', {
    customer: otherCustomer._id,
    room: roomData._id,
    status: 'Pending'
  });
  const res = response();

  updateBookingStatus({ user, params: { id: booking._id }, body: { status: 'Cancelled' } }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(booking.status, 'Pending');
});

test('administrators can view bookings across customers', () => {
  const firstCustomer = create('customers', { user: customerUser('Ava')._id, phone: '' });
  const secondCustomer = create('customers', { user: customerUser('Noah')._id, phone: '' });
  const roomData = room();
  create('bookings', { customer: firstCustomer._id, room: roomData._id });
  create('bookings', { customer: secondCustomer._id, room: roomData._id });
  const res = response();

  getBookings({ user: { _id: 'admin-id', role: 'Admin' } }, res);

  assert.equal(res.body.length, 2);
});

test('customer role is denied manager-only API access', () => {
  const res = response();
  let nextCalled = false;
  authorize('Admin', 'Staff')(
    { user: { role: 'Customer' } },
    res,
    () => { nextCalled = true; }
  );

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});
