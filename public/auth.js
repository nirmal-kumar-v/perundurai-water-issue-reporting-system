// public/auth.js

// ==================== AUTHENTICATION ====================
async function login(email, password, role) {
  try {
    const response = await apiLogin(email, password, role);
    
    if (response.success) {
      appData.currentUser = response.user;
      appData.currentRole = response.user.role;

      // Load all complaints from database
      const complaintsRes = await apiGetComplaints();
      if (complaintsRes.success) {
        appData.complaints = complaintsRes.complaints;
      }

      // Load notifications
      const notificationsRes = await apiGetNotifications(email);
      if (notificationsRes.success) {
        appData.notifications = notificationsRes.notifications;
      }

      if (response.user.role === 'admin') {
        showAdminDashboard();
      } else if (response.user.role === 'supreme') {
        showSupremeDashboard();
      } else {
        showUserDashboard();
      }

      showAlert('Login successful!', 'success');
      return true;
    } else {
      showAlert(response.message || 'Invalid credentials', 'danger');
      return false;
    }
  } catch (err) {
    console.error('Login error:', err);
    showAlert('Server error. Please try again later.', 'danger');
    return false;
  }
}

async function signup(userData) {
  try {
    console.log('📨 Sending signup request to backend with data:', userData);

    const response = await apiSignup(userData);

    if (response.success) {
      showAlert('Registration successful! Please login.', 'success');
      showLandingPage();
      return true;
    } else {
      showAlert(response.message || 'Registration failed', 'danger');
      return false;
    }
  } catch (err) {
    console.error('Signup error:', err);
    showAlert('Server error. Please try again later.', 'danger');
    return false;
  }
}

function logout() {
  appData.currentUser = null;
  appData.currentRole = null;
  showLandingPage();
  showAlert('Logged out successfully', 'success');
}
