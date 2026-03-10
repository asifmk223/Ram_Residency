require('dotenv').config({ path: './backend/.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./backend/config/database');
const seedDatabase = require('./backend/seed');

const publicRoutes = require('./backend/routes/public');
const authRoutes = require('./backend/routes/auth');
const bookingRoutes = require('./backend/routes/bookings');
const paymentRoutes = require('./backend/routes/payments');
const reviewRoutes = require('./backend/routes/reviews');
const adminRoutes = require('./backend/routes/admin');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'RAM Residency API is running', timestamp: new Date().toISOString() });
});

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  
  if (req.path.startsWith('/rooms/') && !req.path.includes('.')) {
    return res.sendFile(path.join(__dirname, 'public', 'rooms.html'));
  }
  
  if (req.path === '/rooms') {
    return res.sendFile(path.join(__dirname, 'public', 'rooms.html'));
  }
  
  if (req.path === '/login') {
    return res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log('Database connected');
    await seedDatabase();
  } catch (error) {
    console.log('Database not available - running with fallback data');
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
