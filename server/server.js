// server/server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

// Import models and routes
const { initializeUsers } = require('./models/User');
const { initializeComplaints } = require('./models/Complaint');
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const commentRoutes = require('./routes/comments');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = 5000;
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'water_complaint_system';

let db;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
async function startServer() {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB');

    // Initialize default data
    await initializeUsers(db);
    await initializeComplaints(db);

    // Make db available to routes
    app.locals.db = db;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
