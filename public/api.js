// public/api.js
const API_URL = 'http://localhost:5000/api';

// ==================== AUTH APIs ====================
async function apiSignup(userData) {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return res.json();
  } catch (error) {
    console.error('Signup API error:', error);
    return { success: false, message: 'Network error' };
  }
}

async function apiLogin(email, password, role) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    return res.json();
  } catch (error) {
    console.error('Login API error:', error);
    return { success: false, message: 'Network error' };
  }
}

// ==================== COMPLAINT APIs ====================
async function apiCreateComplaint(complaint) {
  try {
    const res = await fetch(`${API_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint),
    });
    return res.json();
  } catch (error) {
    console.error('Create complaint API error:', error);
    return { success: false, message: 'Network error' };
  }
}

async function apiGetComplaints() {
  try {
    const res = await fetch(`${API_URL}/complaints`);
    return res.json();
  } catch (error) {
    console.error('Get complaints API error:', error);
    return { success: false, complaints: [] };
  }
}

async function apiGetComplaint(complaintId) {
  try {
    const res = await fetch(`${API_URL}/complaints/${complaintId}`);
    return res.json();
  } catch (error) {
    console.error('Get complaint API error:', error);
    return { success: false, message: 'Network error' };
  }
}

async function apiGetUserComplaints(userId) {
  try {
    const res = await fetch(`${API_URL}/complaints/user/${userId}`);
    return res.json();
  } catch (error) {
    console.error('Get user complaints API error:', error);
    return { success: false, complaints: [] };
  }
}

async function apiEndorseComplaint(complaintId, userId) {
  try {
    const res = await fetch(`${API_URL}/complaints/${complaintId}/endorse`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  } catch (error) {
    console.error('Endorse complaint API error:', error);
    return { success: false, message: 'Network error' };
  }
}

async function apiUpdateComplaintStatus(complaintId, status, adminId, adminComment) {
  try {
    const res = await fetch(`${API_URL}/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminId, adminComment }),
    });
    return res.json();
  } catch (error) {
    console.error('Update status API error:', error);
    return { success: false, message: 'Network error' };
  }
}

async function apiDeleteComplaint(complaintId) {
  try {
    const res = await fetch(`${API_URL}/complaints/${complaintId}`, {
      method: 'DELETE',
    });
    return res.json();
  } catch (error) {
    console.error('Delete complaint API error:', error);
    return { success: false, message: 'Network error' };
  }
}

// ==================== COMMENT APIs ====================
async function apiAddComment(complaintId, userId, userName, message) {
  try {
    const res = await fetch(`${API_URL}/comments/${complaintId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, message }),
    });
    return res.json();
  } catch (error) {
    console.error('Add comment API error:', error);
    return { success: false, message: 'Network error' };
  }
}

// ==================== NOTIFICATION APIs ====================
async function apiGetNotifications(userId) {
  try {
    const res = await fetch(`${API_URL}/notifications/${userId}`);
    return res.json();
  } catch (error) {
    console.error('Get notifications API error:', error);
    return { success: false, notifications: [] };
  }
}

async function apiCreateNotification(userId, message, type, relatedComplaintId) {
  try {
    const res = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message, type, relatedComplaintId }),
    });
    return res.json();
  } catch (error) {
    console.error('Create notification API error:', error);
    return { success: false, message: 'Network error' };
  }
}
