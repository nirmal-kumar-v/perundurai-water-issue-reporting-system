// models/Complaint.js
const INITIAL_COMPLAINTS = [
  {
    complaintId: 'COMP001',
    userId: 'user1@gmail.com',
    userName: 'User One',
    type: 'Low Water Pressure',
    description: 'Morning time water pressure is very low in building A, affecting upper floors',
    photos: [],
    location: { lat: 11.3273, lng: 79.9197, area: 'Block A' },
    status: 'Working',
    createdAt: new Date('2025-11-01T08:30:00'),
    updatedAt: new Date('2025-11-02T10:00:00'),
    endorsements: ['user2@gmail.com', 'user3@gmail.com', 'user4@gmail.com'],
    endorsementCount: 3,
    comments: [
      {
        userId: 'user2@gmail.com',
        userName: 'User Two',
        message: 'Same issue in my flat, Block A 5th floor',
        timestamp: new Date('2025-11-01T09:15:00'),
      },
      {
        userId: 'user3@gmail.com',
        userName: 'User Three',
        message: 'This is urgent! Please fix ASAP',
        timestamp: new Date('2025-11-01T10:45:00'),
      },
    ],
    adminId: 'admin@perundurai',
    adminComments: [
      {
        comment: 'Team assigned, work in progress',
        timestamp: new Date('2025-11-02T10:00:00'),
      },
    ],
    priorityScore: 45,
    isEscalated: false,
    isEmergency: false,
    statusHistory: [
      { status: 'Noted', timestamp: new Date('2025-11-01T08:30:00') },
      { status: 'Working', timestamp: new Date('2025-11-02T10:00:00') },
    ],
  },
  {
    complaintId: 'COMP002',
    userId: 'user2@gmail.com',
    userName: 'User Two',
    type: 'Water Tank Leakage',
    description: 'Overhead tank in common area is leaking, visible water dripping',
    photos: [],
    location: { lat: 11.3275, lng: 79.9199, area: 'Common Area' },
    status: 'Resolved',
    createdAt: new Date('2025-10-28T14:20:00'),
    updatedAt: new Date('2025-11-01T16:30:00'),
    endorsements: ['user1@gmail.com', 'user3@gmail.com'],
    endorsementCount: 2,
    comments: [
      {
        userId: 'user1@gmail.com',
        userName: 'User One',
        message: 'Good work, finally fixed!',
        timestamp: new Date('2025-11-01T16:45:00'),
      },
    ],
    adminId: 'admin@perundurai',
    adminComments: [
      {
        comment: 'Resolved, tank repaired',
        timestamp: new Date('2025-11-01T16:30:00'),
      },
    ],
    priorityScore: 52,
    isEscalated: false,
    isEmergency: false,
    statusHistory: [
      { status: 'Noted', timestamp: new Date('2025-10-28T14:20:00') },
      { status: 'Working', timestamp: new Date('2025-10-30T10:00:00') },
      { status: 'Resolved', timestamp: new Date('2025-11-01T16:30:00') },
    ],
  },
  {
    complaintId: 'COMP003',
    userId: 'user3@gmail.com',
    userName: 'User Three',
    type: 'No Water Supply',
    description: 'No water in Block C for past 5 hours, very urgent',
    photos: [],
    location: { lat: 11.327, lng: 79.9195, area: 'Block C' },
    status: 'Noted',
    createdAt: new Date('2025-11-02T06:00:00'),
    updatedAt: new Date('2025-11-02T06:05:00'),
    endorsements: ['user1@gmail.com', 'user2@gmail.com', 'user4@gmail.com'],
    endorsementCount: 3,
    comments: [],
    adminId: null,
    adminComments: [],
    priorityScore: 98,
    isEscalated: false,
    isEmergency: true,
    statusHistory: [
      { status: 'Noted', timestamp: new Date('2025-11-02T06:00:00') },
    ],
  },
];

async function initializeComplaints(db) {
  const complaintsCollection = db.collection('complaints');

  const count = await complaintsCollection.countDocuments();

  if (count === 0) {
    console.log('📝 Initializing default complaints...');
    await complaintsCollection.insertMany(INITIAL_COMPLAINTS);
    console.log('✅ Default complaints created');
  }
}

module.exports = { initializeComplaints, INITIAL_COMPLAINTS };
