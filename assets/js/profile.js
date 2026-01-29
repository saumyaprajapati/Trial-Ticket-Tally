/* ==========================================================================
   Profile Page JavaScript
   User profile, settings, preferences, and activity
   ========================================================================== */

// Check authentication
if (!requireAuth()) {
    // Will redirect if not authenticated
}

const currentUser = getCurrentUser();

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    if (!currentUser) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }
    
    loadProfile();
    loadStats();
    loadRecentActivity();
    setupPreferences();
});

// Load profile information
function loadProfile() {
    // Set avatar initials
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('profileAvatar').textContent = initials;
    
    // Set name and role
    document.getElementById('profileName').textContent = currentUser.name;
    
    // Format role name
    let roleDisplay = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    if (currentUser.role === 'itstaff') {
        roleDisplay = 'IT Staff';
    }
    document.getElementById('profileRole').textContent = roleDisplay;
    
    // Personal Information
    document.getElementById('infoName').textContent = currentUser.name;
    document.getElementById('infoEmail').textContent = currentUser.email;
    document.getElementById('infoRole').textContent = roleDisplay;
    
    // Show department for employees
    if (currentUser.department) {
        document.getElementById('infoDepartment').textContent = currentUser.department;
        document.getElementById('infoDepartmentContainer').style.display = 'block';
    } else {
        document.getElementById('infoDepartmentContainer').style.display = 'none';
    }
    
    // Show team for IT staff
    if (currentUser.team) {
        document.getElementById('infoTeam').textContent = currentUser.team;
        document.getElementById('infoTeamContainer').style.display = 'block';
    }
    
    // Member since
    const memberSince = currentUser.createdAt || currentUser.loginTime || new Date().toISOString();
    document.getElementById('infoMemberSince').textContent = formatDate(memberSince);
}

// Load statistics based on role
function loadStats() {
    const statsContainer = document.getElementById('profileStats');
    const tickets = getTickets();
    
    if (currentUser.role === 'employee') {
        // Employee stats
        const myTickets = tickets.filter(t => t.createdBy === currentUser.email);
        const openTickets = myTickets.filter(t => t.status === 'Open').length;
        const resolvedTickets = myTickets.filter(t => t.status === 'Resolved').length;
        const totalTickets = myTickets.length;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalTickets}</div>
                <div class="stat-label">Total Tickets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${openTickets}</div>
                <div class="stat-label">Open Tickets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${resolvedTickets}</div>
                <div class="stat-label">Resolved Tickets</div>
            </div>
        `;
    } else if (currentUser.role === 'itstaff') {
        // IT Staff stats
        const assignedTickets = tickets.filter(t => t.assignedTo && t.assignedTo.includes('Team'));
        const resolvedByMe = assignedTickets.filter(t => t.status === 'Resolved').length;
        const inProgress = assignedTickets.filter(t => t.status === 'In Progress').length;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${assignedTickets.length}</div>
                <div class="stat-label">Assigned Tickets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${inProgress}</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${resolvedByMe}</div>
                <div class="stat-label">Resolved</div>
            </div>
        `;
    } else if (currentUser.role === 'admin') {
        // Admin stats
        const totalTickets = tickets.length;
        const openTickets = tickets.filter(t => t.status === 'Open').length;
        const totalUsers = getTotalUsers();
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalTickets}</div>
                <div class="stat-label">System Tickets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${openTickets}</div>
                <div class="stat-label">Open Tickets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalUsers}</div>
                <div class="stat-label">Total Users</div>
            </div>
        `;
    }
}

// Get total users count
function getTotalUsers() {
    const tickets = getTickets();
    const users = new Set(tickets.map(t => t.createdBy).filter(Boolean));
    const staff = getStaff();
    return users.size + staff.length;
}

// Load recent activity
function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    const tickets = getTickets();
    
    // Get user's recent activities
    let activities = [];
    
    if (currentUser.role === 'employee') {
        // Employee: tickets they created
        const myTickets = tickets.filter(t => t.createdBy === currentUser.email);
        activities = myTickets.slice(0, 5).map(ticket => ({
            icon: 'fa-ticket-alt',
            title: `Ticket ${ticket.id}: ${ticket.subject}`,
            time: timeAgo(ticket.createdAt),
            color: getStatusColor(ticket.status)
        }));
    } else if (currentUser.role === 'itstaff') {
        // IT Staff: assigned tickets
        const assignedTickets = tickets.filter(t => t.assignedTo && t.assignedTo.includes('Team'));
        activities = assignedTickets.slice(0, 5).map(ticket => ({
            icon: 'fa-tasks',
            title: `Working on: ${ticket.subject}`,
            time: timeAgo(ticket.createdAt),
            color: getStatusColor(ticket.status)
        }));
    } else {
        // Admin: all recent tickets
        activities = tickets.slice(0, 5).map(ticket => ({
            icon: 'fa-clipboard-list',
            title: `${ticket.id} - ${ticket.status}`,
            time: timeAgo(ticket.createdAt),
            color: getStatusColor(ticket.status)
        }));
    }
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent activity</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color};">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// Get status color
function getStatusColor(status) {
    const colors = {
        'Open': '#3b82f6',
        'In Progress': '#f59e0b',
        'Resolved': '#10b981',
        'Closed': '#6b7280'
    };
    return colors[status] || '#3b82f6';
}

// Setup preferences
function setupPreferences() {
    // Dark mode switch
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    const currentTheme = localStorage.getItem('ticket-tally-theme') || 'light';
    darkModeSwitch.checked = currentTheme === 'dark';
    
    darkModeSwitch.addEventListener('change', function() {
        const newTheme = this.checked ? 'dark' : 'light';
        localStorage.setItem('ticket-tally-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    // Email notifications
    const emailNotifications = localStorage.getItem('email-notifications') === 'true';
    document.getElementById('emailNotifications').checked = emailNotifications;
    
    document.getElementById('emailNotifications').addEventListener('change', function() {
        localStorage.setItem('email-notifications', this.checked);
        showToast(this.checked ? 'Email notifications enabled' : 'Email notifications disabled');
    });
    
    // Auto-refresh
    const autoRefresh = localStorage.getItem('auto-refresh') !== 'false';
    document.getElementById('autoRefresh').checked = autoRefresh;
    
    document.getElementById('autoRefresh').addEventListener('change', function() {
        localStorage.setItem('auto-refresh', this.checked);
        showToast(this.checked ? 'Auto-refresh enabled' : 'Auto-refresh disabled');
    });
    
    // Show closed tickets
    const showClosed = localStorage.getItem('show-closed') === 'true';
    document.getElementById('showClosed').checked = showClosed;
    
    document.getElementById('showClosed').addEventListener('change', function() {
        localStorage.setItem('show-closed', this.checked);
        showToast(this.checked ? 'Showing closed tickets' : 'Hiding closed tickets');
    });
}

// Update theme icon
function updateThemeIcon(theme) {
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Edit profile
function editProfile() {
    const newName = prompt('Enter new name:', currentUser.name);
    if (newName && newName.trim()) {
        currentUser.name = newName.trim();
        localStorage.setItem('ticket-tally-user', JSON.stringify(currentUser));
        loadProfile();
        showToast('Profile updated successfully');
    }
}

// Change password
function changePassword() {
    alert('Password Change Feature\n\n' +
          'In a production environment, this would:\n' +
          '1. Verify current password\n' +
          '2. Request new password\n' +
          '3. Confirm new password\n' +
          '4. Update securely on server\n\n' +
          'For this demo, password changes are simulated.');
    showToast('Password change simulated');
}

// Download user data
function downloadMyData() {
    const tickets = getTickets();
    const myTickets = currentUser.role === 'employee' 
        ? tickets.filter(t => t.createdBy === currentUser.email)
        : tickets;
    
    const data = {
        user: {
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            department: currentUser.department,
            memberSince: currentUser.createdAt || currentUser.loginTime
        },
        tickets: myTickets,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-tally-data-${currentUser.email}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully');
}

// Clear notifications
function clearNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        localStorage.removeItem('notifications');
        showToast('Notifications cleared');
    }
}

// Confirm logout
function confirmLogout() {
    if (confirm('Are you sure you want to logout?')) {
        logout();
    }
}

// Go back to dashboard
function goBackToDashboard() {
    if (currentUser.role === 'employee') {
        window.location.href = 'employee-dashboard.html';
    } else if (currentUser.role === 'itstaff') {
        window.location.href = 'itstaff-dashboard.html';
    } else if (currentUser.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = '../index.html';
    }
}

// Show toast notification
function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--primary-500);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-xl);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Get tickets from localStorage
function getTickets() {
    const ticketsStr = localStorage.getItem('ticket-tally-tickets');
    return ticketsStr ? JSON.parse(ticketsStr) : [];
}

// Get IT staff
function getStaff() {
    const staffStr = localStorage.getItem('ticket-tally-staff');
    if (staffStr) {
        return JSON.parse(staffStr);
    }
    return [];
}