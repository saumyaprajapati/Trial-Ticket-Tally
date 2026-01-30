/* ==========================================================================
   Admin Dashboard JavaScript
   Full System Management with Charts and Analytics
   ========================================================================== */

// Authentication check
if (!requireAuth()) {
    // Will redirect if not authenticated
}

const user = getCurrentUser();
if (!user || user.role !== 'admin') {
    alert('Access denied. Administrator privileges required.');
    redirectToDashboard();
}

// Chart instances
let lineChart, pieChart, barChart;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadDashboardData();
    setupEventListeners();
    initializeCharts();
    showSection('dashboard');
});

// Initialize dashboard
function initializeDashboard() {
    document.getElementById('userName').textContent = user.name || 'Administrator';
    
    // Set user avatar initials
    const initials = (user.name || 'AD').split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    
    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('addStaffForm').addEventListener('submit', handleAddStaff);
    document.getElementById('changePriorityForm').addEventListener('submit', handleChangePriority);
    
    const searchInput = document.getElementById('searchAllTickets');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

// Get all tickets (including closed)
function getTickets() {
    const ticketsStr = localStorage.getItem('ticket-tally-tickets');
    return ticketsStr ? JSON.parse(ticketsStr) : [];
}

// Save tickets
function saveTickets(tickets) {
    localStorage.setItem('ticket-tally-tickets', JSON.stringify(tickets));
}

// Get IT staff
function getStaff() {
    const staffStr = localStorage.getItem('ticket-tally-staff');
    if (staffStr) {
        return JSON.parse(staffStr);
    }
    
    // Initialize default IT staff
    const defaultStaff = [
        { name: 'John Smith', email: 'itstaff@demo.com', team: 'Software Team', status: 'Active', joinedAt: new Date().toISOString() },
        { name: 'Mike Johnson', email: 'mike.j@demo.com', team: 'Hardware Team', status: 'Active', joinedAt: new Date().toISOString() },
        { name: 'Sarah Williams', email: 'sarah.w@demo.com', team: 'Network Team', status: 'Active', joinedAt: new Date().toISOString() }
    ];
    
    saveStaff(defaultStaff);
    return defaultStaff;
}

// Save IT staff
function saveStaff(staff) {
    localStorage.setItem('ticket-tally-staff', JSON.stringify(staff));
}

// Load dashboard data
function loadDashboardData() {
    const tickets = getTickets();
    
    // Filter out closed tickets for KPI (but count all for total)
    const activeTickets = tickets.filter(t => t.status !== 'Closed');
    
    const total = tickets.length;
    const open = activeTickets.filter(t => t.status === 'Open').length;
    const inProgress = activeTickets.filter(t => t.status === 'In Progress').length;
    const resolved = activeTickets.filter(t => t.status === 'Resolved').length;
    
    document.getElementById('totalTickets').textContent = total;
    document.getElementById('openTickets').textContent = open;
    document.getElementById('inProgressTickets').textContent = inProgress;
    document.getElementById('resolvedTickets').textContent = resolved;
}

// Initialize charts
function initializeCharts() {
    const tickets = getTickets();
    
    // Prepare chart theme colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#f1f5f9' : '#111827';
    
    // Line Chart - Ticket Trends
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        lineChart = new Chart(lineCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Tickets Created',
                        data: [12, 19, 15, 25, 22, 18, 20],
                        borderColor: 'rgb(37, 99, 235)',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Tickets Resolved',
                        data: [8, 15, 12, 20, 18, 15, 17],
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Pie Chart - Category Distribution
    const categories = {
        'Software Issue': 0,
        'Hardware Issue': 0,
        'Network Issue': 0,
        'Email Issue': 0
    };
    
    tickets.forEach(ticket => {
        if (categories[ticket.category] !== undefined) {
            categories[ticket.category]++;
        }
    });
    
    // Use demo data if no real tickets
    const categoryValues = Object.values(categories);
    const hasData = categoryValues.some(v => v > 0);
    const pieData = hasData ? categoryValues : [15, 10, 8, 12];
    
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        pieChart = new Chart(pieCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Software Issue', 'Hardware Issue', 'Network Issue', 'Email Issue'],
                datasets: [{
                    data: pieData,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(6, 182, 212, 0.8)'
                    ],
                    borderColor: [
                        'rgb(37, 99, 235)',
                        'rgb(245, 158, 11)',
                        'rgb(16, 185, 129)',
                        'rgb(6, 182, 212)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 15,
                            font: {
                                size: 11,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8
                    }
                }
            }
        });
    }
    
    // Bar Chart - Priority Breakdown
    const priorities = {
        'Low': tickets.filter(t => t.priority === 'Low').length,
        'Medium': tickets.filter(t => t.priority === 'Medium').length,
        'High': tickets.filter(t => t.priority === 'High').length,
        'Critical': tickets.filter(t => t.priority === 'Critical').length
    };
    
    // Use demo data if no real tickets
    const priorityValues = Object.values(priorities);
    const hasPriorityData = priorityValues.some(v => v > 0);
    const barData = hasPriorityData ? priorityValues : [5, 12, 8, 3];
    
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        barChart = new Chart(barCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Low', 'Medium', 'High', 'Critical'],
                datasets: [{
                    label: 'Number of Tickets',
                    data: barData,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(59, 130, 246)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1,
                            color: textColor,
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 11,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        });
    }
}

// Show section
function showSection(section) {
    // Hide all sections
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('ticketsSection').style.display = 'none';
    document.getElementById('usersSection').style.display = 'none';
    document.getElementById('itstaffSection').style.display = 'none';
    
    // Update nav links
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    if (section === 'dashboard') {
        document.getElementById('dashboardSection').style.display = 'block';
        // Reinitialize charts if they don't exist or need refresh
        if (!lineChart || !pieChart || !barChart) {
            setTimeout(() => {
                initializeCharts();
            }, 100);
        }
    } else if (section === 'tickets') {
        document.getElementById('ticketsSection').style.display = 'block';
        loadAllTickets();
    } else if (section === 'users') {
        document.getElementById('usersSection').style.display = 'block';
        loadUsers();
    } else if (section === 'itstaff') {
        document.getElementById('itstaffSection').style.display = 'block';
        loadITStaff();
    }
}

// Current filter state
let currentTicketFilter = 'all';

// Load all tickets with optional filter
function loadAllTickets(filter = 'all') {
    const allTickets = getTickets();
    let tickets = allTickets;
    
    // Apply status filter
    if (filter !== 'all') {
        tickets = allTickets.filter(t => t.status === filter);
    }
    
    // For "Closed (7 days)" filter - only show closed tickets from last 7 days
    if (filter === 'Closed') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        tickets = allTickets.filter(t => {
            if (t.status !== 'Closed') return false;
            if (!t.closedAt) return true; // Show if no close date
            const closedDate = new Date(t.closedAt);
            return closedDate >= sevenDaysAgo;
        });
    }
    
    const tbody = document.getElementById('allTicketsTableBody');
    
    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-5"><div class="text-muted"><i class="fas fa-inbox fa-3x mb-3"></i><p>No tickets found</p></div></td></tr>';
        return;
    }
    
    // Sort by priority and date
    const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    tickets.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    tbody.innerHTML = tickets.map(ticket => `
        <tr>
            <td><strong>${ticket.id}</strong></td>
            <td>${ticket.subject}</td>
            <td><span class="badge bg-secondary">${ticket.category}</span></td>
            <td><span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></td>
            <td><span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span></td>
            <td>${ticket.createdByName || 'Unknown'}</td>
            <td>${ticket.assignedTo || '<span class="text-muted">Unassigned</span>'}</td>
            <td>${timeAgo(ticket.createdAt)}</td>
            <td>
                <div class="d-flex gap-2">
                    <a href="ticket-details.html?id=${ticket.id}" class="btn btn-sm btn-view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="btn btn-sm btn-primary-custom" onclick="showChangePriorityModal('${ticket.id}')" title="Change Priority">
                        <i class="fas fa-flag"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter admin tickets by status
function filterAdminTickets(status) {
    currentTicketFilter = status;
    loadAllTickets(status);
    
    // Update active tab
    document.querySelectorAll('#ticketStatusTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.closest('.nav-link').classList.add('active');
}

// Load users
function loadUsers() {
    const tickets = getTickets();
    const tbody = document.getElementById('usersTableBody');
    
    // Get unique employees from tickets
    const employeesMap = new Map();
    
    tickets.forEach(ticket => {
        if (ticket.createdBy && !employeesMap.has(ticket.createdBy)) {
            employeesMap.set(ticket.createdBy, {
                email: ticket.createdBy,
                name: ticket.createdByName || 'Unknown',
                ticketCount: 0,
                createdAt: ticket.createdAt
            });
        }
        
        if (ticket.createdBy) {
            const employee = employeesMap.get(ticket.createdBy);
            employee.ticketCount++;
        }
    });
    
    // Add demo employee if exists
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'employee' && !employeesMap.has(currentUser.email)) {
        employeesMap.set(currentUser.email, {
            email: currentUser.email,
            name: currentUser.name,
            ticketCount: 0,
            createdAt: currentUser.createdAt || new Date().toISOString()
        });
    }
    
    const employees = Array.from(employeesMap.values());
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="text-muted"><i class="fas fa-users fa-3x mb-3"></i><p>No employees registered</p></div></td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td><strong>${emp.name}</strong></td>
            <td>${emp.email}</td>
            <td><span class="badge bg-info">Employee</span></td>
            <td>${emp.ticketCount}</td>
            <td>${formatDate(emp.createdAt)}</td>
        </tr>
    `).join('');
}

// Load IT staff
function loadITStaff() {
    const staff = getStaff();
    const tbody = document.getElementById('staffTableBody');
    
    if (staff.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="text-muted"><i class="fas fa-user-cog fa-3x mb-3"></i><p>No IT staff members</p></div></td></tr>';
        return;
    }
    
    tbody.innerHTML = staff.map((member, index) => `
        <tr>
            <td><strong>${member.name}</strong></td>
            <td>${member.email}</td>
            <td><span class="badge bg-primary">${member.team}</span></td>
            <td><span class="status-badge ${member.status === 'Active' ? 'status-resolved' : 'status-closed'}">${member.status}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="toggleStaffStatus(${index})" title="${member.status === 'Active' ? 'Deactivate' : 'Activate'}">
                    <i class="fas fa-${member.status === 'Active' ? 'ban' : 'check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show add staff modal
function showAddStaffModal() {
    const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
    modal.show();
}

// Handle add staff
function handleAddStaff(e) {
    e.preventDefault();
    
    const name = document.getElementById('staffName').value;
    const email = document.getElementById('staffEmail').value;
    const team = document.getElementById('staffTeam').value;
    
    const staff = getStaff();
    
    // Check if email already exists
    if (staff.some(s => s.email === email)) {
        alert('An IT staff member with this email already exists.');
        return;
    }
    
    const newStaff = {
        name: name,
        email: email,
        team: team,
        status: 'Active',
        joinedAt: new Date().toISOString()
    };
    
    staff.push(newStaff);
    saveStaff(staff);
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
    modal.hide();
    document.getElementById('addStaffForm').reset();
    
    // Reload IT staff table
    loadITStaff();
    
    alert(`${name} has been added to ${team} successfully!`);
}

// Toggle staff status
function toggleStaffStatus(index) {
    const staff = getStaff();
    
    if (index < 0 || index >= staff.length) return;
    
    const member = staff[index];
    member.status = member.status === 'Active' ? 'Inactive' : 'Active';
    
    saveStaff(staff);
    loadITStaff();
    
    alert(`${member.name} has been ${member.status === 'Active' ? 'activated' : 'deactivated'}.`);
}

// Show change priority modal
function showChangePriorityModal(ticketId) {
    const tickets = getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) return;
    
    document.getElementById('priorityTicketId').value = ticketId;
    document.getElementById('priorityModalTitle').textContent = `Change Priority - ${ticketId}`;
    document.getElementById('newPriority').value = ticket.priority;
    
    const modal = new bootstrap.Modal(document.getElementById('changePriorityModal'));
    modal.show();
}

// Handle change priority
function handleChangePriority(e) {
    e.preventDefault();
    
    const ticketId = document.getElementById('priorityTicketId').value;
    const newPriority = document.getElementById('newPriority').value;
    
    const tickets = getTickets();
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex === -1) return;
    
    const oldPriority = tickets[ticketIndex].priority;
    tickets[ticketIndex].priority = newPriority;
    
    // Add to timeline
    tickets[ticketIndex].timeline.push({
        action: `Priority changed from ${oldPriority} to ${newPriority}`,
        by: `${user.name} (Admin)`,
        timestamp: new Date().toISOString()
    });
    
    saveTickets(tickets);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('changePriorityModal'));
    modal.hide();
    
    // Reload tickets
    loadAllTickets();
    loadDashboardData();
    
    alert(`Ticket ${ticketId} priority changed to ${newPriority}`);
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const allTickets = getTickets();
    
    // Apply current filter first
    let tickets = allTickets;
    if (currentTicketFilter !== 'all') {
        if (currentTicketFilter === 'Closed') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            tickets = allTickets.filter(t => {
                if (t.status !== 'Closed') return false;
                if (!t.closedAt) return true;
                const closedDate = new Date(t.closedAt);
                return closedDate >= sevenDaysAgo;
            });
        } else {
            tickets = allTickets.filter(t => t.status === currentTicketFilter);
        }
    }
    
    // Apply search filter
    const filtered = tickets.filter(ticket => 
        ticket.id.toLowerCase().includes(searchTerm) ||
        ticket.subject.toLowerCase().includes(searchTerm) ||
        ticket.category.toLowerCase().includes(searchTerm) ||
        ticket.status.toLowerCase().includes(searchTerm) ||
        (ticket.createdByName && ticket.createdByName.toLowerCase().includes(searchTerm))
    );
    
    const tbody = document.getElementById('allTicketsTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-5"><div class="text-muted">No tickets found</div></td></tr>';
        return;
    }
    
    // Sort by priority
    const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    filtered.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    tbody.innerHTML = filtered.map(ticket => `
        <tr>
            <td><strong>${ticket.id}</strong></td>
            <td>${ticket.subject}</td>
            <td><span class="badge bg-secondary">${ticket.category}</span></td>
            <td><span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></td>
            <td><span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span></td>
            <td>${ticket.createdByName || 'Unknown'}</td>
            <td>${ticket.assignedTo || '<span class="text-muted">Unassigned</span>'}</td>
            <td>${timeAgo(ticket.createdAt)}</td>
            <td>
                <div class="d-flex gap-2">
                    <a href="ticket-details.html?id=${ticket.id}" class="btn btn-sm btn-view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="btn btn-sm btn-primary-custom" onclick="showChangePriorityModal('${ticket.id}')" title="Change Priority">
                        <i class="fas fa-flag"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}