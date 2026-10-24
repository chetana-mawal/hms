const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { afterEach, test } = require('node:test');
const { collections, getCollection } = require('../store');
const { demoAccounts, seedDemoAccounts } = require('../config/seedDemoAccounts');
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  Object.values(collections).forEach((collection) => collection.splice(0));
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

test('development startup seeds demo administrator and customer accounts', async () => {
  delete process.env.NODE_ENV;
  await seedDemoAccounts();

  const users = getCollection('users');
  assert.equal(users.length, 2);
  for (const account of demoAccounts) {
    const user = users.find((entry) => entry.email === account.email);
    assert.ok(user);
    assert.equal(user.role, account.role);
    assert.notEqual(user.password, account.password);
    assert.equal(await bcrypt.compare(account.password, user.password), true);
  }

  const guest = users.find((user) => user.role === 'Customer');
  assert.ok(getCollection('customers').some((customer) => customer.user === guest._id));
});

test('demo account seeding is idempotent', async () => {
  delete process.env.NODE_ENV;
  await seedDemoAccounts();
  await seedDemoAccounts();

  assert.equal(getCollection('users').length, 2);
  assert.equal(getCollection('customers').length, 1);
});

test('production startup does not create demo accounts', async () => {
  process.env.NODE_ENV = 'production';
  await seedDemoAccounts();

  assert.equal(getCollection('users').length, 0);
  assert.equal(getCollection('customers').length, 0);
});
