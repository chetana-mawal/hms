const { create, findById, getCollection, update } = require('../store');

const populatePayment = (payment) => {
  const booking = findById('bookings', payment.booking);
  if (!booking) return { ...payment, booking: null };
  const customer = findById('customers', booking.customer);
  const user = customer && findById('users', customer.user);
  return {
    ...payment,
    booking: {
      ...booking,
      customer: customer && {
        ...customer,
        user: user && { name: user.name, email: user.email }
      },
      room: findById('rooms', booking.room)
    }
  };
};

exports.getPayments = (req, res) =>
  res.json(getCollection('payments').map(populatePayment));

exports.createPayment = (req, res) => {
  const { booking, amount, paymentMethod, status } = req.body;
  if (!findById('bookings', booking) ||
      !Number.isFinite(Number(amount)) || Number(amount) < 0 ||
      !['Cash', 'Card', 'Online'].includes(paymentMethod) ||
      (status && !['Paid', 'Unpaid', 'Refunded'].includes(status))) {
    return res.status(400).json({ message: 'Invalid payment data' });
  }
  const payment = create('payments', {
    ...req.body,
    amount: Number(amount),
    status: status || 'Unpaid'
  });
  res.status(201).json(payment);
};

exports.updatePaymentStatus = (req, res) => {
  const payment = findById('payments', req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  const status = req.body.status || payment.status;
  if (!['Paid', 'Unpaid', 'Refunded'].includes(status)) {
    return res.status(400).json({ message: 'Invalid payment status' });
  }
  res.json(populatePayment(update('payments', payment._id, { status })));
};
