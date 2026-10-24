// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const customerRoutes = require('./routes/customerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { seedDemoAccounts } = require('./config/seedDemoAccounts');

const app = express();

// Init Middleware
app.use(express.json());
app.use(cors());

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/', (req, res) => res.send('HMS API Running'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await seedDemoAccounts();
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
};

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exitCode = 1;
});
