// server/routes/auth.js
const express = require('express');
const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, aadhaar, phone, address, familySize, propertyType, photo } = req.body;

    const db = req.app.locals.db;
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username: email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create new user
    const newUser = {
      username: email,
      passwordHash: password, // In production, hash this with bcrypt
      role: 'user',
      name,
      aadhaar,
      phone,
      address,
      familySize,
      propertyType,
      photo: photo || '',
      badges: [],
      points: 0,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    res.json({
      success: true,
      message: 'Registration successful! Please login.',
      user: {
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const db = req.app.locals.db;
    const usersCollection = db.collection('users');

    // Find user by email and role
    const user = await usersCollection.findOne({
      username: email,
      role: role || 'user',
    });

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Return user data (excluding password hash)
    const userData = {
      username: user.username,
      name: user.name,
      role: user.role,
      aadhaar: user.aadhaar,
      phone: user.phone,
      address: user.address,
      familySize: user.familySize,
      propertyType: user.propertyType,
      photo: user.photo,
      badges: user.badges,
      points: user.points,
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
