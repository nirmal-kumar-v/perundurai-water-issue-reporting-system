// server/routes/notifications.js
const express = require('express');
const router = express.Router();

// GET /api/notifications/:userId - Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const db = req.app.locals.db;
    const notificationsCollection = db.collection('notifications');

    const notifications = await notificationsCollection
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/notifications - Add notification
router.post('/', async (req, res) => {
  try {
    const { userId, message, type, relatedComplaintId } = req.body;

    const db = req.app.locals.db;
    const notificationsCollection = db.collection('notifications');

    const notification = {
      userId,
      message,
      type,
      relatedComplaintId: relatedComplaintId || null,
      read: false,
      timestamp: new Date(),
    };

    await notificationsCollection.insertOne(notification);

    res.json({
      success: true,
      message: 'Notification created',
      notification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const db = req.app.locals.db;
    const notificationsCollection = db.collection('notifications');
    const { ObjectId } = require('mongodb');

    await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
