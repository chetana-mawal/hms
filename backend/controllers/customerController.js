const { create, findById, getCollection } = require('../store');

exports.getCustomers = (req, res) =>
  res.json(getCollection('customers').map((customer) => {
    const user = findById('users', customer.user);
    return { ...customer, user: user && { name: user.name, email: user.email } };
  }));

exports.createCustomer = (req, res) => {
  const { user, phone } = req.body;
  if (!findById('users', user) || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ message: 'Invalid data' });
  }
  const customer = create('customers', { ...req.body, phone: phone.trim() });
  res.status(201).json(customer);
};
