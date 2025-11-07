// ========================================
// UTILITY FUNCTIONS & SHARED CODE
// ========================================

function generateId(prefix = 'ID') {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
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
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
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

function addNotification(userId, message, type, relatedComplaintId = null) {
    const notification = {
        id: generateId('NOTIF'),
        userId,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false,
        relatedComplaintId
    };
    appData.notifications.push(notification);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Auto-escalation check
function checkAutoEscalation() {
    const now = new Date();
    const escalationTime = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

    appData.complaints.forEach(complaint => {
        if (!complaint.isEscalated && complaint.status !== 'Resolved' && complaint.status !== 'Rejected') {
            const createdTime = new Date(complaint.createdAt);
            const timeDiff = now - createdTime;

            if (timeDiff > escalationTime) {
                complaint.isEscalated = true;
                complaint.escalatedAt = now.toISOString();

                // Notify user and supreme
                addNotification(complaint.userId, `Your complaint ${complaint.id} has been escalated to Supreme Authority`, 'escalation', complaint.id);
                addNotification('supreme1', `Complaint ${complaint.id} has been auto-escalated due to delay`, 'escalation', complaint.id);
            }
        }
    });
}

// Render complaint card
function renderComplaintCard(complaint) {
    const canEndorse = complaint.userId !== appData.currentUser.id && !complaint.endorsements.includes(appData.currentUser.id);
    return `
        <div class="complaint-card" onclick="viewComplaintDetails('${complaint.id}')">
            <div class="complaint-header">
                <div class="complaint-type">
                    <span class="complaint-id">${complaint.id}</span>
                    <span class="complaint-title">${complaint.category}</span>
                </div>
                <span class="status-badge ${complaint.status.toLowerCase().replace(' ', '-')}">${complaint.status}</span>
            </div>

            <div class="complaint-description">
                ${complaint.description}
            </div>

            <div class="complaint-meta">
                <span class="complaint-location">📍 ${complaint.location}</span>
                <span class="complaint-date">${timeAgo(complaint.createdAt)}</span>
            </div>

            <div class="complaint-footer">
                <div class="endorsement-count">
                    👍 ${complaint.endorsements.length} Endorsements
                </div>
                ${canEndorse ? `<button class="btn btn-sm btn-secondary" onclick="endorseComplaint(event, '${complaint.id}')">Endorse</button>` : ''}
            </div>
        </div>
    `;
}
