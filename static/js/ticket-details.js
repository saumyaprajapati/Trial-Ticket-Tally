/* ==========================================================================
   Ticket Details Page - Complete Implementation
   Real-time updates, Comments, Timeline, Activity Log
   ========================================================================== */

// Get ticket ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('id');

// Auto-refresh interval (5 seconds)
let refreshInterval;

// Current user
const currentUser = getCurrentUser();

// Check authentication
if (!requireAuth()) {
    // Will redirect if not authenticated
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    if (!ticketId) {
        alert('No ticket ID provided');
        goBack();
        return;
    }
    
    loadTicketDetails();
    setupEventListeners();
    startAutoRefresh();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('commentForm').addEventListener('submit', handleAddComment);
}

// Load ticket details
function loadTicketDetails() {
    const tickets = getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
        alert('Ticket not found');
        goBack();
        return;
    }
    
    // Update page title
    document.title = `${ticket.id} - ${ticket.subject} | Ticket-Tally`;
    
    // Populate header
    document.getElementById('ticketTitle').textContent = ticket.subject;
    document.getElementById('ticketId').textContent = ticket.id;
    
    // Status badge
    document.getElementById('ticketStatus').innerHTML = 
        `<span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>`;
    
    // Priority badge
    document.getElementById('ticketPriority').innerHTML = 
        `<span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>`;
    
    // Category
    document.getElementById('ticketCategory').innerHTML = 
        `<span class="badge bg-secondary">${ticket.category}</span>`;
    
    // Populate details
    document.getElementById('detailSubject').textContent = ticket.subject;
    document.getElementById('detailDescription').textContent = ticket.description;
    document.getElementById('detailCreatedBy').textContent = ticket.createdByName || 'Unknown';
    document.getElementById('detailAssignedTo').textContent = ticket.assignedTo || 'Unassigned';
    document.getElementById('detailCreatedDate').textContent = formatFullDate(ticket.createdAt);
    document.getElementById('detailUpdatedDate').textContent = formatFullDate(ticket.updatedAt || ticket.createdAt);
    
    // Calculate and display stats
    updateStats(ticket);
    
    // Render timeline
    renderTimeline(ticket);
    
    // Render comments
    renderComments(ticket);
    
    // Render recent activity
    renderRecentActivity(ticket);
}

// Update stats
function updateStats(ticket) {
    // Calculate ticket age
    const createdDate = new Date(ticket.createdAt);
    const now = new Date();
    const ageInHours = Math.floor((now - createdDate) / (1000 * 60 * 60));
    const ageInDays = Math.floor(ageInHours / 24);
    
    let ageText;
    if (ageInDays > 0) {
        ageText = `${ageInDays} day${ageInDays !== 1 ? 's' : ''}`;
    } else {
        ageText = `${ageInHours} hour${ageInHours !== 1 ? 's' : ''}`;
    }
    
    document.getElementById('ticketAge').textContent = ageText;
    
    // Comment count
    const commentCount = (ticket.comments || []).length;
    document.getElementById('commentCount').textContent = commentCount;
    
    // Update count (timeline events)
    const updateCount = (ticket.timeline || []).length;
    document.getElementById('updateCount').textContent = updateCount;
    
    // SLA Status
    const slaHours = {
        'Critical': 4,
        'High': 8,
        'Medium': 24,
        'Low': 48
    };
    
    const maxHours = slaHours[ticket.priority] || 24;
    const slaBreached = ageInHours > maxHours && ticket.status !== 'Resolved' && ticket.status !== 'Closed';
    
    let slaHtml;
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        slaHtml = '<span class="sla-indicator success"><i class="fas fa-check-circle"></i> Completed</span>';
    } else if (slaBreached) {
        slaHtml = '<span class="sla-indicator danger"><i class="fas fa-exclamation-triangle"></i> Breached</span>';
    } else if (ageInHours > maxHours * 0.8) {
        slaHtml = '<span class="sla-indicator warning"><i class="fas fa-clock"></i> Approaching</span>';
    } else {
        slaHtml = '<span class="sla-indicator success"><i class="fas fa-check"></i> On Track</span>';
    }
    
    document.getElementById('slaStatus').innerHTML = slaHtml;
}

// Render timeline
function renderTimeline(ticket) {
    const container = document.getElementById('timelineContainer');
    const timeline = ticket.timeline || [];
    
    if (timeline.length === 0) {
        container.innerHTML = '<p class="text-muted">No activity yet</p>';
        return;
    }
    
    // Sort timeline by timestamp (newest first)
    const sortedTimeline = [...timeline].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    container.innerHTML = `
        <div class="timeline-line"></div>
        ${sortedTimeline.map((event, index) => {
            const eventType = getEventType(event.action);
            return `
                <div class="timeline-event ${eventType}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <div>
                                <div class="timeline-action">${event.action}</div>
                                <div class="timeline-user">by ${event.by}</div>
                            </div>
                            <div class="timeline-time">
                                ${formatFullDate(event.timestamp)}
                            </div>
                        </div>
                        ${event.note ? `<div class="timeline-description">${event.note}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

// Get event type for styling
function getEventType(action) {
    if (action.includes('created') || action.includes('Created')) return 'created';
    if (action.includes('Resolved') || action.includes('resolved')) return 'resolved';
    if (action.includes('comment') || action.includes('Comment')) return 'commented';
    return 'updated';
}

// Render comments
function renderComments(ticket) {
    const container = document.getElementById('commentsList');
    const comments = ticket.comments || [];
    
    if (comments.length === 0) {
        container.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
        return;
    }
    
    // Sort comments by timestamp (newest first)
    const sortedComments = [...comments].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    container.innerHTML = sortedComments.map(comment => {
        const initials = comment.author.split(' ').map(n => n[0]).join('').toUpperCase();
        return `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="comment-avatar">${initials}</div>
                        <div>
                            <div class="comment-author-name">${comment.author}</div>
                            <div class="comment-time">${timeAgo(comment.timestamp)}</div>
                        </div>
                    </div>
                </div>
                <div class="comment-body">${comment.text}</div>
            </div>
        `;
    }).join('');
}

// Render recent activity
function renderRecentActivity(ticket) {
    const container = document.getElementById('recentActivity');
    const timeline = ticket.timeline || [];
    
    // Get last 5 activities
    const recent = [...timeline]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-muted small">No recent activity</p>';
        return;
    }
    
    container.innerHTML = recent.map(event => `
        <div class="activity-item mb-3 p-2" style="background: var(--surface-elevated); border-radius: var(--radius-md);">
            <div class="small">
                <strong>${event.action}</strong>
                <div class="text-muted">${timeAgo(event.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

// Handle add comment
function handleAddComment(e) {
    e.preventDefault();
    
    const commentText = document.getElementById('commentText').value.trim();
    if (!commentText) return;
    
    const tickets = getTickets();
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex === -1) {
        alert('Ticket not found');
        return;
    }
    
    // Initialize comments array if it doesn't exist
    if (!tickets[ticketIndex].comments) {
        tickets[ticketIndex].comments = [];
    }
    
    // Add comment
    const newComment = {
        id: generateCommentId(),
        author: currentUser.name,
        authorEmail: currentUser.email,
        text: commentText,
        timestamp: new Date().toISOString()
    };
    
    tickets[ticketIndex].comments.push(newComment);
    
    // Add to timeline
    tickets[ticketIndex].timeline.push({
        action: 'Comment added',
        by: currentUser.name,
        timestamp: new Date().toISOString(),
        note: commentText.substring(0, 100) + (commentText.length > 100 ? '...' : '')
    });
    
    // Update timestamp
    tickets[ticketIndex].updatedAt = new Date().toISOString();
    
    // Save tickets
    saveTickets(tickets);
    
    // Clear form
    document.getElementById('commentText').value = '';
    
    // Reload details
    loadTicketDetails();
    
    // Show success feedback
    showSyncStatus('Comment posted successfully', 'success');
}

// Generate comment ID
function generateCommentId() {
    return 'CMT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Start auto-refresh
function startAutoRefresh() {
    // Refresh every 5 seconds
    refreshInterval = setInterval(() => {
        refreshTicketData();
    }, 5000);
}

// Refresh ticket data
function refreshTicketData() {
    showSyncStatus('Syncing...', 'syncing');
    
    // Simulate network delay
    setTimeout(() => {
        loadTicketDetails();
        showSyncStatus('Updated', 'success');
    }, 300);
}

// Show sync status
function showSyncStatus(message, type) {
    const indicator = document.getElementById('syncStatus');
    
    indicator.className = 'refresh-indicator';
    if (type === 'syncing') {
        indicator.classList.add('syncing');
    }
    
    indicator.innerHTML = `
        <i class="fas fa-${type === 'syncing' ? 'sync-alt fa-spin' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Reset to default after 2 seconds
    if (type !== 'syncing') {
        setTimeout(() => {
            indicator.innerHTML = `
                <i class="fas fa-sync-alt"></i>
                <span>Auto-updating</span>
            `;
            indicator.className = 'refresh-indicator';
        }, 2000);
    }
}

// Download PDF (enhanced simulation)
function downloadPDF() {
    const tickets = getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) return;
    
    // Create PDF content preview
    const pdfContent = `
    ═══════════════════════════════════════════
              TICKET-TALLY SUPPORT TICKET
    ═══════════════════════════════════════════
    
    Ticket ID: ${ticket.id}
    Status: ${ticket.status}
    Priority: ${ticket.priority}
    Category: ${ticket.category}
    
    ───────────────────────────────────────────
    TICKET DETAILS
    ───────────────────────────────────────────
    
    Subject: ${ticket.subject}
    
    Description:
    ${ticket.description}
    
    Created By: ${ticket.createdByName}
    Assigned To: ${ticket.assignedTo || 'Unassigned'}
    Created Date: ${formatFullDate(ticket.createdAt)}
    Last Updated: ${formatFullDate(ticket.updatedAt || ticket.createdAt)}
    
    ───────────────────────────────────────────
    TIMELINE & ACTIVITY LOG
    ───────────────────────────────────────────
    
    ${(ticket.timeline || []).map(event => 
        `[${formatFullDate(event.timestamp)}]
    ${event.action} by ${event.by}
    ${event.note ? '    Note: ' + event.note : ''}`
    ).join('\n\n')}
    
    ───────────────────────────────────────────
    COMMENTS (${(ticket.comments || []).length})
    ───────────────────────────────────────────
    
    ${(ticket.comments || []).map(comment => 
        `[${formatFullDate(comment.timestamp)}] ${comment.author}:
    ${comment.text}`
    ).join('\n\n')}
    
    ═══════════════════════════════════════════
    Generated on: ${formatFullDate(new Date().toISOString())}
    Ticket-Tally | Enterprise IT Service Desk
    ═══════════════════════════════════════════
    `;
    
    // Show PDF preview in alert (in production, this would generate actual PDF)
    alert('PDF DOWNLOAD PREVIEW\n\n' + 
          'In a production environment, this would download a formatted PDF file.\n\n' +
          'Preview of content:\n\n' + 
          pdfContent.substring(0, 500) + '\n\n...[truncated]...\n\n' +
          'Click OK to simulate download.');
    
    console.log('Full PDF Content:', pdfContent);
}

// Print ticket
function printTicket() {
    window.print();
}

// Go back to dashboard
function goBack() {
    // Stop auto-refresh
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Determine which dashboard to return to
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

// Format full date with time
function formatFullDate(dateString) {
    const date = new Date(dateString);
    const dateOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', dateOptions);
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

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});