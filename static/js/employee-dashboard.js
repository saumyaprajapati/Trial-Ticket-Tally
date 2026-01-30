/* ==========================================================================
   Employee Dashboard JavaScript
   ========================================================================== */

// Check authentication on page load
if (!requireAuth()) {
    // Will redirect if not authenticated
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadTickets();
    setupEventListeners();
});

// Initialize dashboard
function initializeDashboard() {
    const user = getCurrentUser();
    if (!user || user.role !== 'employee') {
        alert('Access denied. This dashboard is for employees only.');
        redirectToDashboard();
        return;
    }
    
    // Set user name and avatar
    document.getElementById('userName').textContent = user.name;
    document.getElementById('welcomeMessage').textContent = `Welcome Back, ${user.name.split(' ')[0]}!`;
    
    // Set user avatar initials
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    
    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
}

// Setup event listeners
function setupEventListeners() {
    // Raise ticket form
    document.getElementById('raiseTicketForm').addEventListener('submit', handleRaiseTicket);
    
    // Search tickets
    document.getElementById('searchTickets').addEventListener('input', handleSearch);
}

// Get tickets from localStorage
function getTickets() {
    const ticketsStr = localStorage.getItem('ticket-tally-tickets');
    return ticketsStr ? JSON.parse(ticketsStr) : [];
}

// Save tickets to localStorage
function saveTickets(tickets) {
    localStorage.setItem('ticket-tally-tickets', JSON.stringify(tickets));
}

// Get user's tickets with proper filtering
function getUserTickets() {
    const user = getCurrentUser();
    const allTickets = getTickets();
    
    // Get tickets created by current user
    // Only exclude closed tickets older than 7 days for main dashboard view
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return allTickets.filter(ticket => {
        if (ticket.createdBy !== user.email) return false;
        
        // For closed tickets, only show if closed within last 7 days
        if (ticket.status === 'Closed' && ticket.closedAt) {
            const closedDate = new Date(ticket.closedAt);
            if (closedDate < sevenDaysAgo) return false;
        }
        
        return true;
    });
}

// Load and display tickets
function loadTickets() {
    const tickets = getUserTickets();
    
    // Update KPI cards - count by status
    updateKPIs(tickets);
    
    // Display tickets in table
    displayTickets(tickets);
}

// Update KPI cards
function updateKPIs(tickets) {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Open').length;
    const inProgress = tickets.filter(t => t.status === 'In Progress').length;
    const resolved = tickets.filter(t => t.status === 'Resolved').length;
    
    document.getElementById('totalTickets').textContent = total;
    document.getElementById('openTickets').textContent = open;
    document.getElementById('inProgressTickets').textContent = inProgress;
    document.getElementById('resolvedTickets').textContent = resolved;
}

// Display tickets in table
function displayTickets(tickets) {
    const tbody = document.getElementById('ticketsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (tickets.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort tickets by priority (Critical > High > Medium > Low) and then by date
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
            <td>${ticket.assignedTo || '<span class="text-muted">Unassigned</span>'}</td>
            <td>${timeAgo(ticket.createdAt)}</td>
            <td>
                <div class="d-flex gap-2">
                    <a href="ticket-details.html?id=${ticket.id}" class="btn btn-sm btn-view" title="View Full Details">
                        <i class="fas fa-eye"></i> View
                    </a>
                    <button class="btn btn-sm btn-download" onclick="downloadTicketPDF('${ticket.id}')" title="Download PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter tickets by status
function filterTickets(status) {
    const tickets = getUserTickets();
    let filtered;
    
    if (status === 'all') {
        // Show all active tickets (exclude closed)
        filtered = tickets.filter(t => t.status !== 'Closed');
    } else if (status === 'Closed') {
        // Show only closed tickets from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        filtered = tickets.filter(t => {
            if (t.status !== 'Closed') return false;
            if (!t.closedAt) return true;
            const closedDate = new Date(t.closedAt);
            return closedDate >= sevenDaysAgo;
        });
    } else {
        // Filter by specific status
        filtered = tickets.filter(t => t.status === status);
    }
    
    displayTickets(filtered);
    
    // Update active nav link
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    if (event && event.target) {
        const clickedLink = event.target.closest('.nav-link-item');
        if (clickedLink) {
            clickedLink.classList.add('active');
        }
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const tickets = getUserTickets();
    
    const filtered = tickets.filter(ticket => 
        ticket.id.toLowerCase().includes(searchTerm) ||
        ticket.subject.toLowerCase().includes(searchTerm) ||
        ticket.category.toLowerCase().includes(searchTerm) ||
        ticket.status.toLowerCase().includes(searchTerm)
    );
    
    displayTickets(filtered);
}

// Show raise ticket modal
function showRaiseTicketModal() {
    const modal = new bootstrap.Modal(document.getElementById('raiseTicketModal'));
    modal.show();
}

// Handle raise ticket form submission
function handleRaiseTicket(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    const subject = document.getElementById('ticketSubject').value;
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const description = document.getElementById('ticketDescription').value;
    
    // Create new ticket
    const newTicket = {
        id: generateTicketId(),
        subject: subject,
        category: category,
        priority: priority,
        description: description,
        status: 'Open',
        createdBy: user.email,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
        assignedTo: assignTicketToTeam(category),
        timeline: [
            {
                action: 'Ticket Created',
                by: user.name,
                timestamp: new Date().toISOString()
            }
        ]
    };
    
    // Save ticket
    const allTickets = getTickets();
    allTickets.push(newTicket);
    saveTickets(allTickets);
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('raiseTicketModal'));
    modal.hide();
    document.getElementById('raiseTicketForm').reset();
    
    // Reload tickets
    loadTickets();
    
    // Show success message
    alert(`Ticket ${newTicket.id} has been created successfully!`);
}

// Intelligent ticket assignment based on category
function assignTicketToTeam(category) {
    const teams = {
        'Software Issue': 'Software Team',
        'Hardware Issue': 'Hardware Team',
        'Network Issue': 'Network Team',
        'Email Issue': 'Software Team'
    };
    
    return teams[category] || 'IT Support';
}

// View ticket details
function viewTicket(ticketId) {
    const tickets = getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
        alert('Ticket not found');
        return;
    }
    
    const modalBody = document.getElementById('viewTicketBody');
    document.getElementById('viewTicketTitle').textContent = `Ticket ${ticket.id}`;
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <strong>Subject:</strong>
                <p>${ticket.subject}</p>
            </div>
            <div class="col-md-6 mb-3">
                <strong>Category:</strong>
                <p><span class="badge bg-secondary">${ticket.category}</span></p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <strong>Priority:</strong>
                <p><span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></p>
            </div>
            <div class="col-md-6 mb-3">
                <strong>Status:</strong>
                <p><span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span></p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <strong>Assigned To:</strong>
                <p>${ticket.assignedTo || 'Unassigned'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <strong>Created:</strong>
                <p>${formatDate(ticket.createdAt)} at ${formatTime(ticket.createdAt)}</p>
            </div>
        </div>
        <div class="mb-3">
            <strong>Description:</strong>
            <p style="white-space: pre-wrap;">${ticket.description}</p>
        </div>
        <div class="mb-3">
            <strong>Timeline:</strong>
            <div class="timeline mt-3">
                ${ticket.timeline.map(event => `
                    <div class="timeline-item mb-3 p-3" style="background: var(--surface-elevated); border-left: 3px solid var(--primary-500); border-radius: var(--radius-md);">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <strong>${event.action}</strong>
                                <p class="mb-0 text-muted small">by ${event.by}</p>
                            </div>
                            <small class="text-muted">${timeAgo(event.timestamp)}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('viewTicketModal'));
    modal.show();
}

// Download ticket as PDF (simulated)
function downloadTicketPDF(ticketId) {
    const tickets = getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
        alert('Ticket not found');
        return;
    }
    
    // Simulate PDF generation
    alert(`Generating PDF for ticket ${ticketId}...\n\nIn a production environment, this would download a PDF file containing:\n\n` +
          `- Ticket ID: ${ticket.id}\n` +
          `- Subject: ${ticket.subject}\n` +
          `- Category: ${ticket.category}\n` +
          `- Priority: ${ticket.priority}\n` +
          `- Status: ${ticket.status}\n` +
          `- Created: ${formatDate(ticket.createdAt)}\n` +
          `- Description: ${ticket.description}\n\n` +
          `PDF download functionality would be implemented using libraries like jsPDF or server-side PDF generation.`);
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Initialize sample tickets if none exist (for demo purposes)
function initializeSampleTickets() {
    const tickets = getTickets();
    const user = getCurrentUser();
    
    if (tickets.length === 0 && user) {
        const sampleTickets = [
            {
                id: generateTicketId(),
                subject: 'Email client not syncing',
                category: 'Email Issue',
                priority: 'Medium',
                description: 'My email client has stopped syncing since this morning. Unable to send or receive new emails.',
                status: 'In Progress',
                createdBy: user.email,
                createdByName: user.name,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                assignedTo: 'Software Team',
                timeline: [
                    {
                        action: 'Ticket Created',
                        by: user.name,
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        action: 'Status changed to In Progress',
                        by: 'John Smith (IT Staff)',
                        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                id: generateTicketId(),
                subject: 'Monitor display issues',
                category: 'Hardware Issue',
                priority: 'High',
                description: 'Second monitor keeps flickering and showing artifacts. Issue started after recent power outage.',
                status: 'Open',
                createdBy: user.email,
                createdByName: user.name,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                assignedTo: 'Hardware Team',
                timeline: [
                    {
                        action: 'Ticket Created',
                        by: user.name,
                        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
                    }
                ]
            }
        ];
        
        saveTickets(sampleTickets);
    }
}

// Initialize sample tickets when page loads
initializeSampleTickets();