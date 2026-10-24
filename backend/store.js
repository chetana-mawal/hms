const { randomUUID, randomBytes } = require('crypto');

const collections = {
  users: [],
  rooms: [],
  customers: [],
  bookings: [],
  payments: []
};

const tokenSecret = process.env.JWT_SECRET || randomBytes(32).toString('hex');

const getCollection = (name) => collections[name];

const findById = (name, id) =>
  getCollection(name).find((record) => record._id === id) || null;

const create = (name, fields) => {
  const now = new Date().toISOString();
  const record = {
    ...fields,
    _id: randomUUID(),
    createdAt: now,
    updatedAt: now
  };
  getCollection(name).push(record);
  return record;
};

const update = (name, id, fields) => {
  const record = findById(name, id);
  if (!record) return null;
  Object.assign(record, fields, { updatedAt: new Date().toISOString() });
  return record;
};

const remove = (name, id) => {
  const collection = getCollection(name);
  const index = collection.findIndex((record) => record._id === id);
  if (index === -1) return null;
  return collection.splice(index, 1)[0];
};

const withoutPassword = ({ password, ...user }) => user;

module.exports = {
  collections,
  create,
  findById,
  getCollection,
  remove,
  tokenSecret,
  update,
  withoutPassword
};
