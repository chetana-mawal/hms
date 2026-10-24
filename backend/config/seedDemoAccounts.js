const bcrypt = require('bcrypt');
const { create, getCollection } = require('../store');

const demoAccounts = [
  {
    name: 'Demo Administrator',
    email: 'admin@havenhouse.demo',
    password: 'HavenAdmin!2026',
    role: 'Admin'
  },
  {
    name: 'Demo Guest',
    email: 'guest@havenhouse.demo',
    password: 'HavenGuest!2026',
    role: 'Customer'
  }
];

const seedDemoAccounts = async () => {
  if (process.env.NODE_ENV === 'production') return;

  for (const account of demoAccounts) {
    let user = getCollection('users').find((entry) => entry.email === account.email);
    if (!user) {
      const password = await bcrypt.hash(account.password, 10);
      user = create('users', {
        name: account.name,
        email: account.email,
        password,
        role: account.role
      });
    }

    if (account.role === 'Customer' &&
        !getCollection('customers').some((customer) => customer.user === user._id)) {
      create('customers', { user: user._id, phone: '', address: '', preferences: '' });
    }
  }
};

module.exports = { demoAccounts, seedDemoAccounts };
