// ========================================
// PERUNTHURAI WATER COMPLAINT MANAGEMENT SYSTEM
// Connected to MongoDB Backend
// ========================================

// Global Data Storage (loaded from MongoDB)
let appData = {
  users: [],
  complaints: [],
  notifications: [],
  currentUser: null,
  currentRole: null // 'user', 'admin', 'supreme'
};

// Problem Categories
const PROBLEM_CATEGORIES = [
  'No Water Supply',
  'Low Water Pressure',
  'Broken/Leaking Pipes',
  'Water Tank Leakage',
  'Contaminated Water',
  'Irregular Water Timing',
  'Unequal Distribution',
  'Overflowing Tanks',
  'Blocked Water Meters',
  'Illegal Connections',
  'Water Quality Issues',
  'Sewage Mixing',
  'Pump Failure',
  'Pipeline Corrosion',
  'Water Wastage',
  'Billing Disputes'
];

const STATUS_OPTIONS = ['Noted', 'Pending', 'Working', 'On Hold', 'Resolved', 'Rejected', 'Duplicated'];

// Initialize app data
function initializeApp() {
  // Data will be loaded from MongoDB after login via auth.js
  // Check for auto-escalation every 5 minutes (UI-only)
  setInterval(checkAutoEscalation, 300000);
  checkAutoEscalation();
  
  // Show landing page
  showLandingPage();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateId(prefix = 'ID') {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(dateString);
}

function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `
    <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'x-circle' : 'info-circle'}"></i>
    ${message}
  `;
  
  const app = document.getElementById('app');
  app.insertBefore(alertDiv, app.firstChild);
  
  setTimeout(() => alertDiv.remove(), 3000);
}

function showModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

async function addNotification(userId, message, type, relatedComplaintId = null) {
  try {
    const res = await apiCreateNotification(userId, message, type, relatedComplaintId);
    if (res.success && res.notification) {
      // Add to local cache for immediate UI update
      appData.notifications.push(res.notification);
    }
  } catch (e) {
    console.error('Create notification failed:', e);
  }
}

// Auto-escalation check
async function checkAutoEscalation() {
  const now = new Date();
  const escalationTime = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
  
  appData.complaints.forEach(async (complaint) => {
    if (!complaint.isEscalated && complaint.status !== 'Resolved' && complaint.status !== 'Rejected') {
      const createdTime = new Date(complaint.createdAt);
      const timeDiff = now - createdTime;
      
      if (timeDiff > escalationTime) {
        complaint.isEscalated = true;
        complaint.escalatedAt = now.toISOString();
        
        // Notify user and supreme
        const complaintId = complaint.complaintId || complaint.id;
        await addNotification(complaint.userId, `Your complaint ${complaintId} has been escalated to Supreme Authority`, 'escalation', complaintId);
        await addNotification('supreme@perundurai', `Complaint ${complaintId} has been auto-escalated due to delay`, 'escalation', complaintId);
      }
    }
  });
}

// ========================================
// AUTHENTICATION (handled by auth.js)
// ========================================

// ========================================
// PAGE RENDERING
// ========================================

function showLandingPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="landing-page">
      <div class="landing-container">
        <div class="landing-header">
          <h1><i class="bi bi-droplet-fill"></i> Perundurai Water Complaint System</h1>
          <p>Report, Track &amp; Resolve Water Issues in Your Community</p>
        </div>
        
        <div class="auth-cards">
          <!-- User Login/Signup -->
          <div class="auth-card">
            <h3><i class="bi bi-person"></i> User Portal</h3>
            <form id="userLoginForm">
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" id="userEmail" value="user1@gmail.com" required>
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" class="form-control" id="userPassword" value="user1@123" required>
              </div>
              <button type="submit" class="btn btn-primary btn-full">Login as User</button>
            </form>
            <hr style="margin: 20px 0;">
            <button class="btn btn-outline btn-full" onclick="showSignupForm()">New User? Sign Up</button>
          </div>
          
          <!-- Admin Login -->
          <div class="auth-card">
            <h3><i class="bi bi-shield-check"></i> Admin Portal</h3>
            <form id="adminLoginForm">
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" id="adminEmail" value="" required>
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" class="form-control" id="adminPassword" value="" required>
              </div>
              <button type="submit" class="btn btn-primary btn-full">Login as Admin</button>
            </form>
          </div>
          
          <!-- Supreme Login -->
          <div class="auth-card">
            <h3><i class="bi bi-star-fill"></i> Supreme Portal</h3>
            <form id="supremeLoginForm">
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" id="supremeEmail" value="" required>
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" class="form-control" id="supremePassword" value="" required>
              </div>
              <button type="submit" class="btn btn-primary btn-full">Login as Supreme</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Event listeners
  document.getElementById('userLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    login(email, password, 'user');
  });
  
  document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    login(email, password, 'admin');
  });
  
  document.getElementById('supremeLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('supremeEmail').value;
    const password = document.getElementById('supremePassword').value;
    login(email, password, 'supreme');
  });
}

function showSignupForm() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="landing-page">
      <div class="landing-container">
        <div class="landing-header">
          <h1>User Registration</h1>
          <p>Join Perundurai Water Management Community</p>
        </div>
        
        <div class="auth-card" style="max-width: 600px; margin: 0 auto;">
          <form id="signupForm">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" class="form-control" id="signupName" required>
            </div>
            
            <div class="form-group">
              <label>Email *</label>
              <input type="email" class="form-control" id="signupEmail" required>
            </div>
            
            <div class="form-group">
              <label>Password *</label>
              <input type="password" class="form-control" id="signupPassword" required minlength="6">
            </div>
            
            <div class="form-group">
              <label>Aadhaar Number *</label>
              <input type="text" class="form-control" id="signupAadhaar" placeholder="1234-5678-9012" required>
            </div>
            
            <div class="form-group">
              <label>Mobile Number *</label>
              <input type="tel" class="form-control" id="signupPhone" required>
            </div>
            
            <div class="form-group">
              <label>Address *</label>
              <textarea class="form-control" id="signupAddress" rows="2" required></textarea>
            </div>
            
            <div class="form-group">
              <label>Family Size</label>
              <input type="number" class="form-control" id="signupFamilySize" value="1" min="1">
            </div>
            
            <div class="form-group">
              <label>Property Type</label>
              <select class="form-control" id="signupPropertyType">
                <option>Apartment</option>
                <option>Villa</option>
                <option>Independent House</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Profile Photo</label>
              <input type="file" class="form-control" id="signupPhoto" accept="image/*">
            </div>
            
            <button type="submit" class="btn btn-success btn-full">Register</button>
            <button type="button" class="btn btn-secondary btn-full mt-20" onclick="showLandingPage()">Back to Login</button>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const photoFile = document.getElementById('signupPhoto').files[0];
    let photoBase64 = '';
    
    if (photoFile) {
      photoBase64 = await fileToBase64(photoFile);
    }
    
    const userData = {
      name: document.getElementById('signupName').value,
      email: document.getElementById('signupEmail').value,
      password: document.getElementById('signupPassword').value,
      aadhaar: document.getElementById('signupAadhaar').value,
      phone: document.getElementById('signupPhone').value,
      address: document.getElementById('signupAddress').value,
      familySize: parseInt(document.getElementById('signupFamilySize').value),
      propertyType: document.getElementById('signupPropertyType').value,
      photo: photoBase64
    };
    
    signup(userData);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========================================
// USER DASHBOARD
// ========================================

function showUserDashboard() {
  const myEmail = appData.currentUser.email;
  const userComplaints = appData.complaints.filter(c => c.userId === myEmail);
  const activeComplaints = userComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected');
  const userNotifications = appData.notifications.filter(n => n.userId === myEmail && !n.read);
  
  // Count endorsements received
  let endorsementsReceived = 0;
  userComplaints.forEach(c => {
    endorsementsReceived += c.endorsementCount || 0;
  });
  
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="dashboard-layout">
      ${renderSidebar('user')}
      <div class="main-content" id="mainContent">
        <div class="section-header">
          <h2>Welcome, ${appData.currentUser.name}!</h2>
          <button class="btn btn-primary" onclick="showReportComplaintPage()">
            <i class="bi bi-plus-circle"></i> Report New Problem
          </button>
        </div>
        
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${activeComplaints.length}</div>
                <div class="stat-card-label">Active Complaints</div>
              </div>
              <div class="stat-card-icon blue">
                <i class="bi bi-exclamation-triangle"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${endorsementsReceived}</div>
                <div class="stat-card-label">Endorsements Received</div>
              </div>
              <div class="stat-card-icon green">
                <i class="bi bi-hand-thumbs-up"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${userNotifications.length}</div>
                <div class="stat-card-label">Unread Notifications</div>
              </div>
              <div class="stat-card-icon orange">
                <i class="bi bi-bell"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${userComplaints.filter(c => c.status === 'Resolved').length}</div>
                <div class="stat-card-label">Resolved</div>
              </div>
              <div class="stat-card-icon green">
                <i class="bi bi-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- My Active Complaints -->
        <div class="section-header mt-20">
          <h3>My Active Complaints</h3>
        </div>
        <div class="complaints-grid">
          ${activeComplaints.length > 0 ? activeComplaints.map(c => renderComplaintCard(c)).join('') : '<div class="empty-state"><i class="bi bi-inbox"></i><p>No active complaints</p></div>'}
        </div>
        
        <!-- Community Complaints -->
        <div class="section-header mt-20">
          <h3>Community Complaints</h3>
          <button class="btn btn-secondary" onclick="showCommunityComplaintsPage()">View All</button>
        </div>
        <div class="complaints-grid">
          ${appData.complaints.filter(c => c.userId !== myEmail).slice(0, 3).map(c => renderComplaintCard(c)).join('')}
        </div>
        
        <!-- Water Conservation Tips -->
        <div class="section-header mt-20">
          <h3>Water Conservation Tips</h3>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <h5><i class="bi bi-lightbulb"></i> Fix Leaks</h5>
            <p style="color: #666; font-size: 14px;">A dripping tap can waste 15 liters per day. Report leaks immediately!</p>
          </div>
          <div class="stat-card">
            <h5><i class="bi bi-clock"></i> Shorter Showers</h5>
            <p style="color: #666; font-size: 14px;">Reducing shower time by 2 minutes saves up to 40 liters of water.</p>
          </div>
          <div class="stat-card">
            <h5><i class="bi bi-water"></i> Reuse Water</h5>
            <p style="color: #666; font-size: 14px;">Use RO waste water for plants and cleaning.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderComplaintCard(complaint) {
  const myEmail = appData.currentUser.email;
  const complaintId = complaint.complaintId || complaint.id;
  const canEndorse = complaint.userId !== myEmail && !(complaint.endorsements || []).includes(myEmail);
  
  return `
    <div class="complaint-card" onclick="viewComplaintDetail('${complaintId}')">
      ${complaint.photos && complaint.photos.length > 0 ? `<img src="${complaint.photos[0]}" class="complaint-image" alt="Complaint">` : '<div class="complaint-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;"><i class="bi bi-droplet"></i></div>'}
      <div class="complaint-body">
        <div class="complaint-header">
          <span class="complaint-type">${complaint.type}</span>
          <span class="status-badge ${complaint.status.toLowerCase().replace(' ', '-')}">${complaint.status}</span>
        </div>
        <p class="complaint-description">${complaint.description}</p>
        <div class="complaint-meta">
          <span><i class="bi bi-geo-alt"></i> ${complaint.location.area}</span>
          <span class="endorsement-count">
            <i class="bi bi-hand-thumbs-up-fill"></i> ${complaint.endorsementCount || 0}
          </span>
        </div>
        <div class="complaint-meta" style="margin-top: 10px;">
          <span><i class="bi bi-clock"></i> ${timeAgo(complaint.createdAt)}</span>
          ${complaint.isEmergency ? '<span style="color: #dc3545;"><i class="bi bi-exclamation-circle-fill"></i> Emergency</span>' : ''}
        </div>
      </div>
    </div>
  `;
}

function showReportComplaintPage() {
  const app = document.getElementById('app');
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>Report New Problem</h2>
      <button class="btn btn-secondary" onclick="showUserDashboard()">Back to Dashboard</button>
    </div>
    
    <div class="form-section">
      <form id="complaintForm">
        <div class="form-group">
          <label>Problem Type *</label>
          <select class="form-control" id="problemType" required>
            <option value="">Select Problem Type</option>
            ${PROBLEM_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Description * <span class="char-counter" id="charCounter">0/500</span></label>
          <textarea class="form-control" id="description" rows="4" maxlength="500" required></textarea>
        </div>
        
        <div class="form-group">
          <label>Upload Photos (Max 5)</label>
          <div class="photo-upload-area" onclick="document.getElementById('photoInput').click()">
            <i class="bi bi-cloud-upload" style="font-size: 48px; color: #999;"></i>
            <p>Click to upload photos</p>
          </div>
          <input type="file" id="photoInput" accept="image/*" multiple style="display: none;">
          <div class="photo-preview-grid" id="photoPreview"></div>
        </div>
        
        <div class="form-group">
          <label>Location</label>
          <input type="text" class="form-control" id="locationArea" placeholder="e.g., Block A, Common Area" required>
          <div class="map-container" style="margin-top: 10px;">
            <div id="complaintMap" style="width: 100%; height: 300px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
              <div style="text-align: center; color: #666;">
                <i class="bi bi-geo-alt" style="font-size: 48px;"></i>
                <p>Location: Perundurai Housing Society</p>
                <p style="font-size: 12px;">Lat: 11.3273, Lng: 79.9197</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="sos-toggle">
            <div class="toggle-switch" id="sosToggle" onclick="toggleSOS()">
              <div class="toggle-slider"></div>
            </div>
            <div>
              <strong>Emergency SOS</strong>
              <p style="margin: 0; font-size: 13px; color: #666;">Mark this as an emergency complaint</p>
            </div>
          </div>
        </div>
        
        <button type="submit" class="btn btn-success btn-full">Submit Complaint</button>
      </form>
    </div>
  `;
  
  // Character counter
  document.getElementById('description').addEventListener('input', (e) => {
    const counter = document.getElementById('charCounter');
    counter.textContent = `${e.target.value.length}/500`;
    if (e.target.value.length >= 500) {
      counter.classList.add('limit-reached');
    } else {
      counter.classList.remove('limit-reached');
    }
  });
  
  // Photo upload handling
  let selectedPhotos = [];
  document.getElementById('photoInput').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    selectedPhotos = [];
    
    for (const file of files) {
      const base64 = await fileToBase64(file);
      selectedPhotos.push(base64);
    }
    
    renderPhotoPreview();
  });
  
  function renderPhotoPreview() {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = selectedPhotos.map((photo, index) => `
      <div class="photo-preview">
        <img src="${photo}" alt="Photo ${index + 1}">
        <button class="remove-photo" onclick="removePhoto(${index})"><i class="bi bi-x"></i></button>
      </div>
    `).join('');
  }
  
  window.removePhoto = (index) => {
    selectedPhotos.splice(index, 1);
    renderPhotoPreview();
  };
  
  // SOS Toggle
  let isEmergency = false;
  window.toggleSOS = () => {
    const toggle = document.getElementById('sosToggle');
    isEmergency = !isEmergency;
    toggle.classList.toggle('active');
  };
  
  // Form submission
  document.getElementById('complaintForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
      const complaintPayload = {
        userId: appData.currentUser.email,
        userName: appData.currentUser.name,
        type: document.getElementById('problemType').value,
        description: document.getElementById('description').value,
        photos: selectedPhotos,
        location: {
          lat: 11.3273,
          lng: 79.9197,
          area: document.getElementById('locationArea').value
        },
        status: 'Noted',
        isEmergency
      };
      
      const res = await apiCreateComplaint(complaintPayload);
      if (res.success && res.complaint) {
        // Update local cache
        appData.complaints.unshift(res.complaint);
        
        // Notify admin
        await addNotification('admin@perundurai', `New complaint reported: ${res.complaint.type} (${res.complaint.complaintId})`, 'new_complaint', res.complaint.complaintId);
        
        showAlert('Complaint submitted successfully!', 'success');
        showUserDashboard();
      } else {
        showAlert(res.message || 'Failed to submit complaint', 'danger');
      }
    } catch (err) {
      console.error('Create complaint failed:', err);
      showAlert('Server error. Please try again later.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Complaint';
    }
  });
}

function showCommunityComplaintsPage() {
  const myEmail = appData.currentUser.email;
  const allComplaints = appData.complaints.filter(c => c.userId !== myEmail);
  
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>Community Complaints</h2>
      <button class="btn btn-secondary" onclick="showUserDashboard()">Back to Dashboard</button>
    </div>
    
    <!-- Filters -->
    <div class="filters-section">
      <div class="search-bar">
        <input type="text" id="searchInput" placeholder="Search complaints..." onkeyup="filterComplaints()">
        <i class="bi bi-search"></i>
      </div>
      
      <div class="filters-grid">
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" id="filterStatus" onchange="filterComplaints()">
            <option value="">All Status</option>
            ${STATUS_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Category</label>
          <select class="form-control" id="filterCategory" onchange="filterComplaints()">
            <option value="">All Categories</option>
            ${PROBLEM_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Sort By</label>
          <select class="form-control" id="sortBy" onchange="filterComplaints()">
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="endorsed">Most Endorsed</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="complaints-grid" id="complaintsGrid">
      ${allComplaints.map(c => renderComplaintCard(c)).join('')}
    </div>
  `;
  
  window.filterComplaints = () => {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    const category = document.getElementById('filterCategory').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filtered = allComplaints.filter(c => {
      const matchSearch = !search || c.type.toLowerCase().includes(search) || c.description.toLowerCase().includes(search);
      const matchStatus = !status || c.status === status;
      const matchCategory = !category || c.type === category;
      return matchSearch && matchStatus && matchCategory;
    });
    
    // Sort
    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'endorsed') {
      filtered.sort((a, b) => (b.endorsementCount || 0) - (a.endorsementCount || 0));
    }
    
    document.getElementById('complaintsGrid').innerHTML = filtered.length > 0 
      ? filtered.map(c => renderComplaintCard(c)).join('') 
      : '<div class="empty-state"><i class="bi bi-inbox"></i><p>No complaints found</p></div>';
  };
}

function viewComplaintDetail(complaintId) {
  const complaint = appData.complaints.find(c => (c.complaintId || c.id) === complaintId);
  if (!complaint) return;
  
  const myEmail = appData.currentUser.email;
  const isOwner = complaint.userId === myEmail;
  const canEndorse = !isOwner && !(complaint.endorsements || []).includes(myEmail);
  const canEdit = isOwner && complaint.status === 'Noted';
  
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>Complaint Details</h2>
      <button class="btn btn-secondary" onclick="${appData.currentRole === 'user' ? 'showUserDashboard()' : appData.currentRole === 'admin' ? 'showAdminComplaintsPage()' : 'showSupremeDashboard()'}">Back</button>
    </div>
    
    <div class="form-section">
      <div class="flex-between mb-20">
        <div>
          <h3>${complaint.type}</h3>
          <p style="color: #666; margin: 5px 0;">Complaint ID: <strong>${complaint.complaintId || complaint.id}</strong></p>
          <p style="color: #666; margin: 5px 0;">Reported by: <strong>${complaint.userName}</strong></p>
        </div>
        <span class="status-badge ${complaint.status.toLowerCase().replace(' ', '-')}" style="font-size: 16px; padding: 10px 20px;">${complaint.status}</span>
      </div>
      
      ${complaint.photos && complaint.photos.length > 0 ? `
        <div class="carousel mb-20">
          <div class="carousel-inner" id="carouselInner" style="transform: translateX(0%)">
            ${complaint.photos.map(photo => `<div class="carousel-item"><img src="${photo}" alt="Complaint photo"></div>`).join('')}
          </div>
          ${complaint.photos.length > 1 ? `
            <button class="carousel-control prev" onclick="carouselPrev()"><i class="bi bi-chevron-left"></i></button>
            <button class="carousel-control next" onclick="carouselNext(${complaint.photos.length})"><i class="bi bi-chevron-right"></i></button>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="mb-20">
        <h5>Description</h5>
        <p style="color: #666;">${complaint.description}</p>
      </div>
      
      <div class="mb-20">
        <h5>Location</h5>
        <p style="color: #666;"><i class="bi bi-geo-alt"></i> ${complaint.location.area}</p>
        <div class="map-container">
          <div style="width: 100%; height: 300px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
            <div style="text-align: center; color: #666;">
              <i class="bi bi-geo-alt" style="font-size: 48px;"></i>
              <p>${complaint.location.area}</p>
              <p style="font-size: 12px;">Lat: ${complaint.location.lat}, Lng: ${complaint.location.lng}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mb-20">
        <h5>Status Timeline</h5>
        <div class="timeline">
          ${complaint.statusHistory.map((sh, index) => `
            <div class="timeline-item">
              <div class="timeline-marker ${index < complaint.statusHistory.length - 1 ? 'completed' : ''}">
                <i class="bi bi-${index < complaint.statusHistory.length - 1 ? 'check' : 'circle'}"></i>
              </div>
              <div class="timeline-content">
                <h5>${sh.status}</h5>
                <p class="timeline-time">${formatDateTime(sh.timestamp)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      ${complaint.adminComments && complaint.adminComments.length > 0 ? `
        <div class="mb-20">
          <h5>Admin Updates</h5>
          ${complaint.adminComments.map(ac => `
            <div class="alert alert-info">
              <strong>Admin:</strong> ${ac.comment}
              <div style="font-size: 12px; color: #666; margin-top: 5px;">${formatDateTime(ac.timestamp)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="mb-20">
        <div class="flex-between">
          <h5>Endorsements (${complaint.endorsementCount || 0})</h5>
          ${canEndorse ? `<button class="btn btn-primary" onclick="endorseComplaint('${complaintId}')"><i class="bi bi-hand-thumbs-up"></i> Endorse</button>` : ''}
        </div>
      </div>
      
      <div class="mb-20">
        <h5>Comments (${complaint.comments.length})</h5>
        ${complaint.comments.map(comment => `
          <div class="alert alert-info">
            <strong>${comment.userName}:</strong> ${comment.message}
            <div style="font-size: 12px; color: #666; margin-top: 5px;">${formatDateTime(comment.timestamp)}</div>
          </div>
        `).join('')}
        
        ${appData.currentRole === 'user' ? `
          <div class="form-group mt-20">
            <textarea class="form-control" id="newComment" placeholder="Add a comment..." rows="2"></textarea>
            <button class="btn btn-primary mt-20" onclick="addComment('${complaintId}')">Post Comment</button>
          </div>
        ` : ''}
      </div>
      
      ${canEdit ? `
        <div class="flex gap-10">
          <button class="btn btn-danger" onclick="deleteComplaint('${complaintId}')"><i class="bi bi-trash"></i> Delete</button>
          <button class="btn btn-secondary" onclick="shareComplaint('${complaintId}')"><i class="bi bi-share"></i> Share</button>
        </div>
      ` : ''}
      
      ${appData.currentRole === 'admin' ? `
        <div class="mt-20">
          <h5>Update Status</h5>
          <div class="form-group">
            <label>Change Status</label>
            <select class="form-control" id="newStatus">
              ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === complaint.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Admin Comment *</label>
            <textarea class="form-control" id="adminComment" rows="3" required></textarea>
          </div>
          <button class="btn btn-success" onclick="updateComplaintStatus('${complaintId}')">Update Complaint</button>
        </div>
      ` : ''}
    </div>
  `;
  
  // Carousel controls
  let currentSlide = 0;
  window.carouselNext = (totalSlides) => {
    if (currentSlide < totalSlides - 1) {
      currentSlide++;
      document.getElementById('carouselInner').style.transform = `translateX(-${currentSlide * 100}%)`;
    }
  };
  
  window.carouselPrev = () => {
    if (currentSlide > 0) {
      currentSlide--;
      document.getElementById('carouselInner').style.transform = `translateX(-${currentSlide * 100}%)`;
    }
  };
}

window.endorseComplaint = async (complaintId) => {
  const myEmail = appData.currentUser.email;
  
  try {
    const res = await apiEndorseComplaint(complaintId, myEmail);
    if (res.success && res.complaint) {
      // Update local complaint
      const idx = appData.complaints.findIndex(c => (c.complaintId || c.id) === complaintId);
      if (idx !== -1) appData.complaints[idx] = res.complaint;
      
      // Notify owner
      if (res.complaint.userId !== myEmail) {
        await addNotification(res.complaint.userId, `${appData.currentUser.name} endorsed your complaint: ${res.complaint.type}`, 'endorsement', complaintId);
      }
      
      showAlert('Complaint endorsed!', 'success');
      viewComplaintDetail(complaintId);
    } else {
      showAlert(res.message || 'Failed to endorse complaint', 'danger');
    }
  } catch (err) {
    console.error('Endorse failed:', err);
    showAlert('Server error. Please try again later.', 'danger');
  }
};

window.addComment = async (complaintId) => {
  const commentTextEl = document.getElementById('newComment');
  const message = (commentTextEl?.value || '').trim();
  
  if (!message) {
    showAlert('Please enter a comment', 'warning');
    return;
  }
  
  try {
    const res = await apiAddComment(complaintId, appData.currentUser.email, appData.currentUser.name, message);
    if (res.success && res.comment) {
      // Update local complaint
      const complaint = appData.complaints.find(c => (c.complaintId || c.id) === complaintId);
      if (complaint) complaint.comments.push(res.comment);
      
      // Notify owner
      if (complaint && complaint.userId !== appData.currentUser.email) {
        await addNotification(complaint.userId, `${appData.currentUser.name} commented on your complaint`, 'comment', complaintId);
      }
      
      showAlert('Comment added!', 'success');
      viewComplaintDetail(complaintId);
    } else {
      showAlert(res.message || 'Failed to add comment', 'danger');
    }
  } catch (err) {
    console.error('Add comment failed:', err);
    showAlert('Server error. Please try again later.', 'danger');
  }
};

window.deleteComplaint = async (complaintId) => {
  if (!confirm('Are you sure you want to delete this complaint?')) return;
  
  try {
    const res = await apiDeleteComplaint(complaintId);
    if (res.success) {
      const index = appData.complaints.findIndex(c => (c.complaintId || c.id) === complaintId);
      if (index !== -1) appData.complaints.splice(index, 1);
      showAlert('Complaint deleted', 'success');
      showUserDashboard();
    } else {
      showAlert(res.message || 'Failed to delete complaint', 'danger');
    }
  } catch (err) {
    console.error('Delete complaint failed:', err);
    showAlert('Server error. Please try again later.', 'danger');
  }
};

window.shareComplaint = (complaintId) => {
  const url = `Complaint ID: ${complaintId} - Perundurai Water Management`;
  showAlert('Complaint link copied!', 'success');
};

window.updateComplaintStatus = async (complaintId) => {
  const newStatus = document.getElementById('newStatus').value;
  const adminComment = document.getElementById('adminComment').value.trim();
  
  if (!adminComment) {
    showAlert('Please add a comment', 'warning');
    return;
  }
  
  try {
    const res = await apiUpdateComplaintStatus(complaintId, newStatus, appData.currentUser.email, adminComment);
    if (res.success && res.complaint) {
      // Update local complaint
      const idx = appData.complaints.findIndex(c => (c.complaintId || c.id) === complaintId);
      if (idx !== -1) appData.complaints[idx] = res.complaint;
      
      // Notify user
      await addNotification(res.complaint.userId, `Your complaint ${complaintId} status changed to ${newStatus}`, 'status_update', complaintId);
      
      showAlert('Complaint updated successfully!', 'success');
      viewComplaintDetail(complaintId);
    } else {
      showAlert(res.message || 'Failed to update complaint', 'danger');
    }
  } catch (err) {
    console.error('Update status failed:', err);
    showAlert('Server error. Please try again later.', 'danger');
  }
};

function showUserProfilePage() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>My Profile</h2>
      <button class="btn btn-secondary" onclick="showUserDashboard()">Back to Dashboard</button>
    </div>
    
    <div class="form-section">
      <form id="profileForm">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" class="form-control" value="${appData.currentUser.name}" id="profileName">
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-control" value="${appData.currentUser.email}" readonly>
        </div>
        
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" class="form-control" value="${appData.currentUser.phone}" id="profilePhone">
        </div>
        
        <div class="form-group">
          <label>Address</label>
          <textarea class="form-control" rows="2" id="profileAddress">${appData.currentUser.address}</textarea>
        </div>
        
        <div class="form-group">
          <label>Family Size</label>
          <input type="number" class="form-control" value="${appData.currentUser.familySize}" id="profileFamilySize">
        </div>
        
        <button type="submit" class="btn btn-success">Update Profile</button>
      </form>
      
      <hr style="margin: 30px 0;">
      
      <h4>Change Password</h4>
      <form id="passwordForm">
        <div class="form-group">
          <label>Current Password</label>
          <input type="password" class="form-control" id="currentPassword" required>
        </div>
        
        <div class="form-group">
          <label>New Password</label>
          <input type="password" class="form-control" id="newPassword" required minlength="6">
        </div>
        
        <button type="submit" class="btn btn-primary">Change Password</button>
      </form>
      
      <hr style="margin: 30px 0;">
      
      <h4>Badges &amp; Achievements</h4>
      <div class="flex gap-10" style="flex-wrap: wrap;">
        <div class="badge-item"><i class="bi bi-trophy"></i> Active Member</div>
        <div class="badge-item"><i class="bi bi-star"></i> Community Helper</div>
      </div>
    </div>
  `;
  
  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    appData.currentUser.name = document.getElementById('profileName').value;
    appData.currentUser.phone = document.getElementById('profilePhone').value;
    appData.currentUser.address = document.getElementById('profileAddress').value;
    appData.currentUser.familySize = parseInt(document.getElementById('profileFamilySize').value);
    showAlert('Profile updated successfully!', 'success');
  });
  
  document.getElementById('passwordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPwd = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    
    if (currentPwd === appData.currentUser.password) {
      appData.currentUser.password = newPwd;
      showAlert('Password changed successfully!', 'success');
      document.getElementById('passwordForm').reset();
    } else {
      showAlert('Current password is incorrect', 'danger');
    }
  });
}

function showHelpPage() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>Help &amp; FAQ</h2>
      <button class="btn btn-secondary" onclick="showUserDashboard()">Back to Dashboard</button>
    </div>
    
    <div class="form-section">
      <h4 style="margin-bottom: 20px;">Frequently Asked Questions</h4>
      
      <div class="faq-item" onclick="this.classList.toggle('active')">
        <div class="faq-question">
          How do I report a water complaint?
          <i class="bi bi-chevron-down"></i>
        </div>
        <div class="faq-answer">
          Click on the "Report New Problem" button on your dashboard. Fill in the details including problem type, description, photos, and location. Click Submit to register your complaint.
        </div>
      </div>
      
      <div class="faq-item" onclick="this.classList.toggle('active')">
        <div class="faq-question">
          What happens after I submit a complaint?
          <i class="bi bi-chevron-down"></i>
        </div>
        <div class="faq-answer">
          Your complaint is immediately forwarded to the admin team. They will review and update the status. You will receive notifications at each step. Complaints are auto-escalated if not resolved within 72 hours.
        </div>
      </div>
      
      <div class="faq-item" onclick="this.classList.toggle('active')">
        <div class="faq-question">
          How do endorsements work?
          <i class="bi bi-chevron-down"></i>
        </div>
        <div class="faq-answer">
          You can endorse complaints reported by other users if you face the same issue. Endorsements increase the priority score of complaints, helping them get faster attention.
        </div>
      </div>
      
      <div class="faq-item" onclick="this.classList.toggle('active')">
        <div class="faq-question">
          What is Emergency SOS?
          <i class="bi bi-chevron-down"></i>
        </div>
        <div class="faq-answer">
          Emergency SOS marks your complaint as critical (e.g., no water supply, contaminated water). These complaints get highest priority and immediate attention from the admin team.
        </div>
      </div>
      
      <div class="faq-item" onclick="this.classList.toggle('active')">
        <div class="faq-question">
          How can I track my complaint?
          <i class="bi bi-chevron-down"></i>
        </div>
        <div class="faq-answer">
          Click on any complaint card to view detailed information including status timeline, admin comments, and real-time updates. You'll also receive notifications for all status changes.
        </div>
      </div>
    </div>
    
    <div class="form-section mt-20">
      <h4 style="margin-bottom: 20px;">Contact Information</h4>
      <p><strong>Email:</strong> support@perundurai.com</p>
      <p><strong>Phone:</strong> +91 9876543210</p>
      <p><strong>Office Hours:</strong> Mon-Sat, 9:00 AM - 6:00 PM</p>
    </div>
  `;
}

// ========================================
// ADMIN DASHBOARD
// ========================================

function showAdminDashboard() {
  const newComplaints = appData.complaints.filter(c => {
    const diff = new Date() - new Date(c.createdAt);
    return diff < 24 * 60 * 60 * 1000; // Last 24 hours
  });
  
  const pendingComplaints = appData.complaints.filter(c => c.status === 'Pending' || c.status === 'Noted');
  const workingComplaints = appData.complaints.filter(c => c.status === 'Working');
  const resolvedComplaints = appData.complaints.filter(c => c.status === 'Resolved');
  
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="dashboard-layout">
      ${renderSidebar('admin')}
      <div class="main-content" id="mainContent">
        <div class="section-header">
          <h2>Admin Dashboard</h2>
        </div>
        
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${newComplaints.length}</div>
                <div class="stat-card-label">New (24hrs)</div>
              </div>
              <div class="stat-card-icon blue">
                <i class="bi bi-bell"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${pendingComplaints.length}</div>
                <div class="stat-card-label">Pending</div>
              </div>
              <div class="stat-card-icon orange">
                <i class="bi bi-clock"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${workingComplaints.length}</div>
                <div class="stat-card-label">Working</div>
              </div>
              <div class="stat-card-icon blue">
                <i class="bi bi-tools"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${resolvedComplaints.length}</div>
                <div class="stat-card-label">Resolved</div>
              </div>
              <div class="stat-card-icon green">
                <i class="bi bi-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Priority Queue -->
        <div class="section-header mt-20">
          <h3>Priority Queue</h3>
          <button class="btn btn-primary" onclick="showAdminComplaintsPage()">View All Complaints</button>
        </div>
        
        <div class="form-section">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${appData.complaints.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 10).map(c => `
                <tr style="${c.isEmergency ? 'background: #fff3f3;' : ''}">
                  <td><strong>${c.complaintId || c.id}</strong></td>
                  <td>${c.type}</td>
                  <td>${c.location.area}</td>
                  <td><span class="badge-item" style="background: ${c.priorityScore > 70 ? '#ffebee' : '#e3f2fd'}; color: ${c.priorityScore > 70 ? '#c62828' : '#1976d2'};">${c.priorityScore}</span></td>
                  <td><span class="status-badge ${c.status.toLowerCase().replace(' ', '-')}">${c.status}</span></td>
                  <td>${timeAgo(c.createdAt)}</td>
                  <td><button class="btn btn-sm btn-primary" onclick="viewComplaintDetail('${c.complaintId || c.id}')">View</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Performance Metrics -->
        <div class="section-header mt-20">
          <h3>Performance Metrics</h3>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <h5>Avg Resolution Time</h5>
            <div class="stat-card-value" style="font-size: 1.5rem;">2.5 days</div>
          </div>
          <div class="stat-card">
            <h5>Total Resolved</h5>
            <div class="stat-card-value" style="font-size: 1.5rem;">${resolvedComplaints.length}</div>
          </div>
          <div class="stat-card">
            <h5>User Satisfaction</h5>
            <div class="stat-card-value" style="font-size: 1.5rem;">4.5/5</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showAdminComplaintsPage() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>Manage Complaints</h2>
      <button class="btn btn-secondary" onclick="showAdminDashboard()">Back to Dashboard</button>
    </div>
    
    <!-- Filters -->
    <div class="filters-section">
      <div class="search-bar">
        <input type="text" id="adminSearchInput" placeholder="Search complaints..." onkeyup="adminFilterComplaints()">
        <i class="bi bi-search"></i>
      </div>
      
      <div class="filters-grid">
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" id="adminFilterStatus" onchange="adminFilterComplaints()">
            <option value="">All Status</option>
            ${STATUS_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Category</label>
          <select class="form-control" id="adminFilterCategory" onchange="adminFilterComplaints()">
            <option value="">All Categories</option>
            ${PROBLEM_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Priority</label>
          <select class="form-control" id="adminFilterPriority" onchange="adminFilterComplaints()">
            <option value="">All</option>
            <option value="high">High (&gt;70)</option>
            <option value="medium">Medium (30-70)</option>
            <option value="low">Low (&lt;30)</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="complaints-grid" id="adminComplaintsGrid">
      ${appData.complaints.map(c => renderComplaintCard(c)).join('')}
    </div>
  `;
  
  window.adminFilterComplaints = () => {
    const search = document.getElementById('adminSearchInput').value.toLowerCase();
    const status = document.getElementById('adminFilterStatus').value;
    const category = document.getElementById('adminFilterCategory').value;
    const priority = document.getElementById('adminFilterPriority').value;
    
    let filtered = appData.complaints.filter(c => {
      const matchSearch = !search || c.type.toLowerCase().includes(search) || c.description.toLowerCase().includes(search) || (c.complaintId || c.id).toLowerCase().includes(search);
      const matchStatus = !status || c.status === status;
      const matchCategory = !category || c.type === category;
      
      let matchPriority = true;
      if (priority === 'high') matchPriority = c.priorityScore > 70;
      else if (priority === 'medium') matchPriority = c.priorityScore >= 30 && c.priorityScore <= 70;
      else if (priority === 'low') matchPriority = c.priorityScore < 30;
      
      return matchSearch && matchStatus && matchCategory && matchPriority;
    });
    
    document.getElementById('adminComplaintsGrid').innerHTML = filtered.length > 0 
      ? filtered.map(c => renderComplaintCard(c)).join('') 
      : '<div class="empty-state"><i class="bi bi-inbox"></i><p>No complaints found</p></div>';
  };
}

function showAdminAnalyticsPage() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>Analytics &amp; Reports</h2>
      <button class="btn btn-secondary" onclick="showAdminDashboard()">Back to Dashboard</button>
    </div>
    
    <div class="chart-container">
      <h4>Complaint Distribution by Category</h4>
      <canvas id="categoryChart"></canvas>
    </div>
    
    <div class="chart-container">
      <h4>Status Breakdown</h4>
      <canvas id="statusChart"></canvas>
    </div>
    
    <div class="chart-container">
      <h4>Daily Complaint Volume (Last 7 Days)</h4>
      <canvas id="volumeChart"></canvas>
    </div>
  `;
  
  // Category distribution chart
  const categoryCounts = {};
  PROBLEM_CATEGORIES.forEach(cat => categoryCounts[cat] = 0);
  appData.complaints.forEach(c => {
    if (categoryCounts[c.type] !== undefined) {
      categoryCounts[c.type]++;
    }
  });
  
  new Chart(document.getElementById('categoryChart'), {
    type: 'pie',
    data: {
      labels: Object.keys(categoryCounts),
      datasets: [{
        data: Object.values(categoryCounts),
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
  
  // Status breakdown chart
  const statusCounts = {};
  STATUS_OPTIONS.forEach(s => statusCounts[s] = 0);
  appData.complaints.forEach(c => {
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }
  });
  
  new Chart(document.getElementById('statusChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Complaints',
        data: Object.values(statusCounts),
        backgroundColor: '#667eea'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // Volume chart (mock data)
  new Chart(document.getElementById('volumeChart'), {
    type: 'line',
    data: {
      labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
      datasets: [{
        label: 'Complaints',
        data: [3, 5, 2, 8, 4, 6, 7],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ========================================
// SUPREME DASHBOARD
// ========================================

function showSupremeDashboard() {
  const totalComplaints = appData.complaints.length;
  const resolvedComplaints = appData.complaints.filter(c => c.status === 'Resolved').length;
  const escalatedComplaints = appData.complaints.filter(c => c.isEscalated).length;
  
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="dashboard-layout">
      ${renderSidebar('supreme')}
      <div class="main-content" id="mainContent">
        <div class="section-header">
          <h2>Supreme Authority Dashboard</h2>
        </div>
        
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${totalComplaints}</div>
                <div class="stat-card-label">Total Complaints</div>
              </div>
              <div class="stat-card-icon blue">
                <i class="bi bi-clipboard-data"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${resolvedComplaints}</div>
                <div class="stat-card-label">Resolved</div>
              </div>
              <div class="stat-card-icon green">
                <i class="bi bi-check-circle"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">2.5 days</div>
                <div class="stat-card-label">Avg Resolution</div>
              </div>
              <div class="stat-card-icon orange">
                <i class="bi bi-clock-history"></i>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-header">
              <div>
                <div class="stat-card-value">${escalatedComplaints}</div>
                <div class="stat-card-label">Escalated</div>
              </div>
              <div class="stat-card-icon red">
                <i class="bi bi-exclamation-triangle"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Escalated Complaints -->
        ${escalatedComplaints > 0 ? `
          <div class="section-header mt-20">
            <h3 style="color: #dc3545;"><i class="bi bi-exclamation-triangle-fill"></i> Escalated Complaints</h3>
          </div>
          <div class="complaints-grid">
            ${appData.complaints.filter(c => c.isEscalated).map(c => renderComplaintCard(c)).join('')}
          </div>
        ` : ''}
        
        <!-- Recent Activity -->
        <div class="section-header mt-20">
          <h3>Recent Activity</h3>
          <button class="btn btn-primary" onclick="showSupremeComplaintsPage()">View All Complaints</button>
        </div>
        <div class="complaints-grid">
          ${appData.complaints.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6).map(c => renderComplaintCard(c)).join('')}
        </div>
        
        <!-- Quick Actions -->
        <div class="section-header mt-20">
          <h3>Quick Actions</h3>
        </div>
        <div class="stats-grid">
          <button class="stat-card" style="cursor: pointer; border: none; background: white;" onclick="showSupremeAnalyticsPage()">
            <div style="text-align: center;">
              <i class="bi bi-graph-up" style="font-size: 48px; color: #667eea;"></i>
              <h5 style="margin-top: 15px;">View Analytics</h5>
            </div>
          </button>
          <button class="stat-card" style="cursor: pointer; border: none; background: white;" onclick="showAnnouncementsPage()">
            <div style="text-align: center;">
              <i class="bi bi-megaphone" style="font-size: 48px; color: #667eea;"></i>
              <h5 style="margin-top: 15px;">Send Announcement</h5>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;
}

function showSupremeComplaintsPage() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>All Complaints</h2>
      <button class="btn btn-secondary" onclick="showSupremeDashboard()">Back to Dashboard</button>
    </div>
    
    <!-- Filters -->
    <div class="filters-section">
      <div class="search-bar">
        <input type="text" id="supremeSearchInput" placeholder="Search complaints..." onkeyup="supremeFilterComplaints()">
        <i class="bi bi-search"></i>
      </div>
      
      <div class="filters-grid">
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" id="supremeFilterStatus" onchange="supremeFilterComplaints()">
            <option value="">All Status</option>
            ${STATUS_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Escalation</label>
          <select class="form-control" id="supremeFilterEscalation" onchange="supremeFilterComplaints()">
            <option value="">All</option>
            <option value="yes">Escalated Only</option>
            <option value="no">Non-Escalated</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Sort By</label>
          <select class="form-control" id="supremeSortBy" onchange="supremeFilterComplaints()">
            <option value="latest">Latest</option>
            <option value="priority">Priority</option>
            <option value="endorsed">Most Endorsed</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="complaints-grid" id="supremeComplaintsGrid">
      ${appData.complaints.map(c => renderComplaintCard(c)).join('')}
    </div>
  `;
  
  window.supremeFilterComplaints = () => {
    const search = document.getElementById('supremeSearchInput').value.toLowerCase();
    const status = document.getElementById('supremeFilterStatus').value;
    const escalation = document.getElementById('supremeFilterEscalation').value;
    const sortBy = document.getElementById('supremeSortBy').value;
    
    let filtered = appData.complaints.filter(c => {
      const matchSearch = !search || c.type.toLowerCase().includes(search) || c.description.toLowerCase().includes(search) || (c.complaintId || c.id).toLowerCase().includes(search);
      const matchStatus = !status || c.status === status;
      
      let matchEscalation = true;
      if (escalation === 'yes') matchEscalation = c.isEscalated;
      else if (escalation === 'no') matchEscalation = !c.isEscalated;
      
      return matchSearch && matchStatus && matchEscalation;
    });
    
    // Sort
    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'priority') {
      filtered.sort((a, b) => b.priorityScore - a.priorityScore);
    } else if (sortBy === 'endorsed') {
      filtered.sort((a, b) => (b.endorsementCount || 0) - (a.endorsementCount || 0));
    }
    
    document.getElementById('supremeComplaintsGrid').innerHTML = filtered.length > 0 
      ? filtered.map(c => renderComplaintCard(c)).join('') 
      : '<div class="empty-state"><i class="bi bi-inbox"></i><p>No complaints found</p></div>';
  };
}

function showSupremeAnalyticsPage() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>Comprehensive Analytics</h2>
      <button class="btn btn-secondary" onclick="showSupremeDashboard()">Back to Dashboard</button>
    </div>
    
    <div class="stats-grid mb-20">
      <div class="stat-card">
        <h5>Resolution Rate</h5>
        <div class="stat-card-value" style="font-size: 2rem; color: #28a745;">${Math.round((appData.complaints.filter(c => c.status === 'Resolved').length / appData.complaints.length) * 100)}%</div>
      </div>
      <div class="stat-card">
        <h5>Avg Response Time</h5>
        <div class="stat-card-value" style="font-size: 2rem;">4.2 hrs</div>
      </div>
      <div class="stat-card">
        <h5>User Satisfaction</h5>
        <div class="stat-card-value" style="font-size: 2rem; color: #667eea;">4.5/5</div>
      </div>
    </div>
    
    <div class="chart-container">
      <h4>Problem Distribution</h4>
      <canvas id="supremeCategoryChart"></canvas>
    </div>
    
    <div class="chart-container">
      <h4>Monthly Complaint Trend</h4>
      <canvas id="monthlyTrendChart"></canvas>
    </div>
    
    <div class="chart-container">
      <h4>Status Overview</h4>
      <canvas id="supremeStatusChart"></canvas>
    </div>
  `;
  
  // Category chart
  const categoryCounts = {};
  PROBLEM_CATEGORIES.forEach(cat => categoryCounts[cat] = 0);
  appData.complaints.forEach(c => {
    if (categoryCounts[c.type] !== undefined) {
      categoryCounts[c.type]++;
    }
  });
  
  new Chart(document.getElementById('supremeCategoryChart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryCounts).filter(k => categoryCounts[k] > 0),
      datasets: [{
        data: Object.values(categoryCounts).filter(v => v > 0),
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
  
  // Monthly trend (mock data)
  new Chart(document.getElementById('monthlyTrendChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      datasets: [{
        label: 'Complaints',
        data: [12, 19, 15, 25, 22, 30, 28, 24, 20, 15, appData.complaints.length],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // Status chart
  const statusCounts = {};
  STATUS_OPTIONS.forEach(s => statusCounts[s] = 0);
  appData.complaints.forEach(c => {
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }
  });
  
  new Chart(document.getElementById('supremeStatusChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Complaints',
        data: Object.values(statusCounts),
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280', '#ec4899']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function showAnnouncementsPage() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <h2>System Announcements</h2>
      <button class="btn btn-secondary" onclick="showSupremeDashboard()">Back to Dashboard</button>
    </div>
    
    <div class="form-section">
      <h4>Create New Announcement</h4>
      <form id="announcementForm">
        <div class="form-group">
          <label>Title *</label>
          <input type="text" class="form-control" id="announcementTitle" required>
        </div>
        
        <div class="form-group">
          <label>Message *</label>
          <textarea class="form-control" id="announcementMessage" rows="4" required></textarea>
        </div>
        
        <div class="form-group">
          <label>Priority</label>
          <select class="form-control" id="announcementPriority">
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <button type="submit" class="btn btn-success">Send Announcement</button>
      </form>
    </div>
    
    <div class="form-section mt-20">
      <h4>Recent Announcements</h4>
      <div class="empty-state">
        <i class="bi bi-megaphone"></i>
        <p>No announcements sent yet</p>
      </div>
    </div>
  `;
  
  document.getElementById('announcementForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('announcementTitle').value;
    const message = document.getElementById('announcementMessage').value;
    const priority = document.getElementById('announcementPriority').value;
    
    // Notify all users
    appData.users.forEach(user => {
      addNotification(user.email, `${title}: ${message}`, 'announcement');
    });
    
    showAlert('Announcement sent to all users!', 'success');
    document.getElementById('announcementForm').reset();
  });
}

// ========================================
// COMMON COMPONENTS
// ========================================

function renderNavbar() {
  const unreadNotifications = appData.notifications.filter(n => 
    n.userId === appData.currentUser.email && !n.read
  ).length;
  
  return `
    <nav class="navbar">
      <div class="container-fluid" style="display: flex; justify-content: space-between; align-items: center; padding: 0 30px;">
        <div class="navbar-brand">
          <i class="bi bi-droplet-fill"></i> Perundurai Water System
        </div>
        
        <div style="display: flex; gap: 20px; align-items: center;">
          <div class="notification-badge" onclick="toggleNotificationPanel()">
            <i class="bi bi-bell" style="font-size: 20px; cursor: pointer;"></i>
            ${unreadNotifications > 0 ? `<span class="badge">${unreadNotifications}</span>` : ''}
          </div>
          
          <div class="user-profile">
            <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="toggleProfileDropdown()">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ${appData.currentUser.name.charAt(0)}
              </div>
              <span>${appData.currentUser.name}</span>
              <i class="bi bi-chevron-down"></i>
            </div>
            
            <div class="profile-dropdown" id="profileDropdown">
              ${appData.currentRole === 'user' ? `<a class="dropdown-item" onclick="showUserProfilePage()"><i class="bi bi-person"></i> My Profile</a>` : ''}
              <a class="dropdown-item" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Logout</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Notification Panel -->
    <div class="notification-panel" id="notificationPanel">
      <div class="notification-header">
        <h4>Notifications</h4>
        <button class="btn btn-sm btn-secondary" onclick="markAllNotificationsRead()">Mark All Read</button>
      </div>
      <div id="notificationList">
        ${renderNotifications()}
      </div>
    </div>
  `;
}

function renderNotifications() {
  const userNotifications = appData.notifications
    .filter(n => n.userId === appData.currentUser.email)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);
  
  if (userNotifications.length === 0) {
    return '<div class="empty-state"><i class="bi bi-bell-slash"></i><p>No notifications</p></div>';
  }
  
  return userNotifications.map(n => `
    <div class="notification-item ${n.read ? '' : 'unread'}" onclick="markNotificationRead('${n.id}')">
      <div class="notification-message">${n.message}</div>
      <div class="notification-time">${timeAgo(n.timestamp)}</div>
    </div>
  `).join('');
}

window.toggleNotificationPanel = () => {
  const panel = document.getElementById('notificationPanel');
  panel.classList.toggle('show');
};

window.toggleProfileDropdown = () => {
  const dropdown = document.getElementById('profileDropdown');
  dropdown.classList.toggle('show');
};

window.markNotificationRead = (notificationId) => {
  const notification = appData.notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    document.getElementById('notificationList').innerHTML = renderNotifications();
  }
};

window.markAllNotificationsRead = () => {
  appData.notifications
    .filter(n => n.userId === appData.currentUser.email)
    .forEach(n => n.read = true);
  document.getElementById('notificationList').innerHTML = renderNotifications();
  showAlert('All notifications marked as read', 'success');
};

function renderSidebar(role) {
  let menuItems = [];
  
  if (role === 'user') {
    menuItems = [
      { icon: 'house', label: 'Dashboard', action: 'showUserDashboard()' },
      { icon: 'plus-circle', label: 'Report Problem', action: 'showReportComplaintPage()' },
      { icon: 'grid', label: 'Community', action: 'showCommunityComplaintsPage()' },
      { icon: 'person', label: 'My Profile', action: 'showUserProfilePage()' },
      { icon: 'question-circle', label: 'Help', action: 'showHelpPage()' }
    ];
  } else if (role === 'admin') {
    menuItems = [
      { icon: 'house', label: 'Dashboard', action: 'showAdminDashboard()' },
      { icon: 'clipboard-check', label: 'Manage Complaints', action: 'showAdminComplaintsPage()' },
      { icon: 'bar-chart', label: 'Analytics', action: 'showAdminAnalyticsPage()' }
    ];
  } else if (role === 'supreme') {
    menuItems = [
      { icon: 'house', label: 'Dashboard', action: 'showSupremeDashboard()' },
      { icon: 'clipboard-data', label: 'All Complaints', action: 'showSupremeComplaintsPage()' },
      { icon: 'graph-up', label: 'Analytics', action: 'showSupremeAnalyticsPage()' },
      { icon: 'megaphone', label: 'Announcements', action: 'showAnnouncementsPage()' }
    ];
  }
  
  return `
    <aside class="sidebar">
      <div style="padding: 0 25px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
        <h4 style="color: white; margin: 0;">${role.charAt(0).toUpperCase() + role.slice(1)} Menu</h4>
      </div>
      <ul class="sidebar-menu">
        ${menuItems.map(item => `
          <li class="sidebar-item" onclick="${item.action}">
            <i class="bi bi-${item.icon}"></i>
            <span>${item.label}</span>
          </li>
        `).join('')}
      </ul>
    </aside>
  `;
}

// ========================================
// INITIALIZE APP
// ========================================

initializeApp();