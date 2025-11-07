// models/User.js
const INITIAL_USERS = [
  {
    username: 'user1@gmail.com',
    passwordHash: 'user1123', // In production, use bcrypt to hash passwords
    role: 'user',
    name: 'User One',
    aadhaar: '1234-5678-9012',
    phone: '9876543210',
    address: 'Block A, Flat 101',
    familySize: 4,
    propertyType: 'Apartment',
    photo: '',
    badges: [],
    points: 0,
    createdAt: new Date(),
  },
  {
    username: 'user2@gmail.com',
    passwordHash: 'user2123',
    role: 'user',
    name: 'User Two',
    aadhaar: '2345-6789-0123',
    phone: '9876543211',
    address: 'Block B, Flat 201',
    familySize: 3,
    propertyType: 'Apartment',
    photo: '',
    badges: [],
    points: 0,
    createdAt: new Date(),
  },
  {
    username: 'user3@gmail.com',
    passwordHash: 'user3123',
    role: 'user',
    name: 'User Three',
    aadhaar: '3456-7890-1234',
    phone: '9876543212',
    address: 'Block C, Flat 301',
    familySize: 5,
    propertyType: 'Apartment',
    photo: '',
    badges: [],
    points: 0,
    createdAt: new Date(),
  },
  {
    username: 'user4@gmail.com',
    passwordHash: 'user4123',
    role: 'user',
    name: 'User Four',
    aadhaar: '4567-8901-2345',
    phone: '9876543213',
    address: 'Block D, Flat 401',
    familySize: 2,
    propertyType: 'Apartment',
    photo: '',
    badges: [],
    points: 0,
    createdAt: new Date(),
  },
  {
    username: 'admin@perundurai',
    passwordHash: 'Admin@123',
    role: 'admin',
    name: 'Admin',
    aadhaar: '9999-9999-9999',
    phone: '9999999999',
    address: 'Admin Office',
    familySize: 1,
    propertyType: 'Office',
    photo: '',
    badges: [],
    points: 0,
    createdAt: new Date(),
  },
  {
    username: 'supreme@perundarai',
    passwordHash: 'Supreme@123',
    role: 'supreme',
    name: 'Supreme Authority',
    aadhaar: '8888-8888-8888',
    phone: '8888888888',
    address: 'Supreme Office',
    familySize: 1,
    propertyType: 'Office',
    photo: '',
    badges: [],
    points: 0,
    createdAt: new Date(),
  },
];

async function initializeUsers(db) {
  const usersCollection = db.collection('users');
  
  // Check if users already exist
  const count = await usersCollection.countDocuments();
  
  if (count === 0) {
    console.log('📝 Initializing default users...');
    await usersCollection.insertMany(INITIAL_USERS);
    console.log('✅ Default users created');
  }
}

module.exports = { initializeUsers, INITIAL_USERS };
