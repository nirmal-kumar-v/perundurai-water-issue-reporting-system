// server/routes/complaints.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Helper to generate complaint ID
function generateComplaintId() {
  return 'COMP' + Date.now() + Math.floor(Math.random() * 1000);
}

// POST /api/complaints - Create new complaint
router.post('/', async (req, res) => {
  try {
    const { userId, userName, type, description, photos, location, isEmergency } = req.body;

    const db = req.app.locals.db;
    const complaintsCollection = db.collection('complaints');

    const newComplaint = {
      complaintId: generateComplaintId(),
      userId,
      userName,
      type,
      description,
      photos: photos || [],
      location,
      status: 'Noted',
      createdAt: new Date(),
      updatedAt: new Date(),
      endorsements: [],
      endorsementCount: 0,
      comments: [],
      adminId: null,
      adminComments: [],
      priorityScore: isEmergency ? 100 : 10,
      isEscalated: false,
      isEmergency: isEmergency || false,
      statusHistory: [
        { status: 'Noted', timestamp: new Date() },
      ],
    };

    await complaintsCollection.insertOne(newComplaint);

    res.json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: newComplaint,
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/complaints - Get all complaints
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const complaintsCollection = db.collection('complaints');

    const complaints = await complaintsCollection.find({}).toArray();

    res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/complaints/user/:userId - Get complaints by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const db = req.app.locals.db;
    const complaintsCollection = db.collection('complaints');

    const complaints = await complaintsCollection.find({ userId }).toArray();

    res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/complaints/:complaintId - Get single complaint
router.get('/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;

    const db = req.app.locals.db;
    const complaintsCollection = db.collection('complaints');

    const complaint = await complaintsCollection.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/complaints/:complaintId/endorse - Endorse a complaint
router.put('/:complaintId/endorse', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { userId } = req.body;

    const db = req.app.locals.db;
    const complaintsCollection = db.collection('complaints');

    const complaint = await complaintsCollection.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Check if already endorsed by this user
    if (complaint.endorsements.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already endorsed' });
    }

    // Add endorsement
    complaint.endorsements.push(userId);
    complaint.endorsementCount = complaint.endorsements.length;
    complaint.priorityScore += 5;
    complaint.updatedAt = new Date();

    await complaintsCollection.updateOne(
      { complaintId },
      { $set: complaint }
    );

    res.json({
      success: true,
      message: 'Complaint endorsed successfully',
      complaint,
    });
  } catch (error) {
    console.error('Endorse complaint error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/complaints/:complaintId/status - Update complaint status
router.put('/:complaintId/status', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, adminId, adminComment } = req.body;

    const db = req.app.locals.db;
    const complaintsCollection = db.collection('complaints');

    const complaint = await complaintsCollection.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Update complaint
    complaint.status = status;
    complaint.updatedAt = new Date();
    complaint.adminId = adminId;

    if (adminComment) {
      complaint.adminComments.push({
        comment: adminComment,
        timestamp: new Date(),
      });
    }

    complaint.statusHistory.push({
      status,
      timestamp: new Date(),
    });

    await complaintsCollection.updateOne(
      { complaintId },
      { $set: complaint }
    );

    res.json({
      success: true,
      message: 'Complaint status updated',
      complaint,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/complaints/:complaintId - Delete complaint
router.delete('/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;

    const db = req.app.locals.db;
    const complaintsCollection = db.collection('complaints');

    const result = await complaintsCollection.deleteOne({ complaintId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({
      success: true,
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
