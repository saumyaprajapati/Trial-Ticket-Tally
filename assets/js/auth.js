/* ==========================================================================
   Authentication Utilities
   ========================================================================== */

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('ticket-tally-user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if user is logged in
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Logout user
function logout() {
    localStorage.removeItem('ticket-tally-user');
    window.location.href = 'login.html';
}

// Protect page (require authentication)
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Check user role
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    switch(user.role) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'itstaff':
            window.location.href = 'itstaff-dashboard.html';
            break;
        case 'employee':
        default:
            window.location.href = 'employee-dashboard.html';
            break;
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// Generate random ticket ID
function generateTicketId() {
    const prefix = 'TKT';
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${randomNum}`;
}

// Calculate time ago
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(dateString);
}