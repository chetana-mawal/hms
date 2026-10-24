const bcrypt = require('bcrypt');
const { timingSafeEqual } = require('crypto');
const jwt = require('jsonwebtoken');
const { create, getCollection, tokenSecret, withoutPassword } = require('../store');

const matchesAdminSetupKey = (key) => {
  const configuredKey = process.env.ADMIN_SETUP_KEY;
  if (typeof key !== 'string' || !configuredKey) return false;
  const provided = Buffer.from(key);
  const configured = Buffer.from(configuredKey);
  return provided.length === configured.length && timingSafeEqual(provided, configured);
};

const generateToken = (id) => {
  return jwt.sign({ id }, tokenSecret, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, adminSetupKey } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (typeof name !== 'string' || !name.trim() ||
        !normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const isAdminRegistration = role === 'Admin';
    if (isAdminRegistration && !matchesAdminSetupKey(adminSetupKey)) {
      return res.status(403).json({ message: 'A valid administrator setup key is required' });
    }

    const userExists = getCollection('users').some((user) => user.email === normalizedEmail);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = create('users', {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: isAdminRegistration ? 'Admin' : 'Customer'
    });
    if (user.role === 'Customer') {
      create('customers', { user: user._id, phone: '', address: '', preferences: '' });
    }
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('User registration failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = getCollection('users').find((entry) => entry.email === normalizedEmail);

    if (user && typeof password === 'string' && await bcrypt.compare(password, user.password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('User login failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = (req, res) => res.json(withoutPassword(req.user));
