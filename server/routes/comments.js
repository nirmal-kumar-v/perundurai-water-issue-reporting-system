// server/routes/comments.js
const express = require('express');
const router = express.Router();

// POST /api/comments/:complaintId - Add comment to complaint
router.post('/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { userId, userName, message } = req.body;

    const db = req.app.locals.db;
    const complaintsCollection = db.collection('complaints');

    const complaint = await complaintsCollection.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Add comment
    const newComment = {
      userId,
      userName,
      message,
      timestamp: new Date(),
    };

    complaint.comments.push(newComment);
    complaint.updatedAt = new Date();

    await complaintsCollection.updateOne(
      { complaintId },
      { $set: complaint }
    );

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
