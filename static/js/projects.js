/* ==========================================================================
   Projects Management JavaScript
   Complete project tracking, team assignment, and deadline management
   ========================================================================== */

// Check authentication - Admin only
if (!requireAuth()) {
    // Will redirect if not authenticated
}

const currentUser = getCurrentUser();
if (!currentUser || currentUser.role !== 'admin') {
    alert('Access denied. Administrator privileges required.');
    window.location.href = 'admin-dashboard.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeProjectsPage();
    loadProjects();
    setupEventListeners();
    initializeSampleProjects(); // Create sample data if needed
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('addProjectForm').addEventListener('submit', handleAddProject);
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('projectStartDate').value = today;
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    document.getElementById('projectDeadline').value = nextMonth.toISOString().split('T')[0];
}

// Initialize page
function initializeProjectsPage() {
    // Page is ready
}

// Get projects from localStorage
function getProjects() {
    const projectsStr = localStorage.getItem('ticket-tally-projects');
    return projectsStr ? JSON.parse(projectsStr) : [];
}

// Save projects to localStorage
function saveProjects(projects) {
    localStorage.setItem('ticket-tally-projects', JSON.stringify(projects));
}

// Load and display projects
function loadProjects() {
    const projects = getProjects();
    updateStatistics(projects);
    displayProjects(projects);
}

// Update statistics
function updateStatistics(projects) {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'Active').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    
    // Calculate deadline this week
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = projects.filter(p => {
        if (p.status === 'Completed') return false;
        const deadline = new Date(p.deadline);
        return deadline >= today && deadline <= weekFromNow;
    }).length;
    
    document.getElementById('totalProjects').textContent = total;
    document.getElementById('activeProjects').textContent = active;
    document.getElementById('completedProjects').textContent = completed;
    document.getElementById('upcomingDeadlines').textContent = upcoming;
}

// Display projects
function displayProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (projects.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort by deadline (closest first)
    projects.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    grid.innerHTML = projects.map(project => createProjectCard(project)).join('');
}

// Create project card HTML
function createProjectCard(project) {
    const statusClass = project.status.toLowerCase().replace(' ', '-');
    const deadlineBadge = getDeadlineBadge(project.deadline, project.status);
    const teamMembers = project.team || [];
    const progress = project.progress || 0;
    
    return `
        <div class="project-card status-${statusClass}">
            <div class="project-header">
                <div>
                    <h3 class="project-title">${project.name}</h3>
                    <span class="project-status ${statusClass}">${project.status}</span>
                </div>
            </div>
            
            <p class="project-description">${project.description}</p>
            
            <div class="project-meta">
                <div class="meta-item">
                    <div class="meta-icon">
                        <i class="fas fa-calendar"></i>
                    </div>
                    <div>
                        <span class="meta-label">Start:</span>
                        <span class="meta-value">${formatDate(project.startDate)}</span>
                    </div>
                </div>
                
                <div class="meta-item">
                    <div class="meta-icon">
                        <i class="fas fa-flag-checkered"></i>
                    </div>
                    <div>
                        <span class="meta-label">Deadline:</span>
                        ${deadlineBadge}
                    </div>
                </div>
                
                <div class="meta-item">
                    <div class="meta-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div>
                        <span class="meta-label">Priority:</span>
                        <span class="priority-badge priority-${project.priority.toLowerCase()}">${project.priority}</span>
                    </div>
                </div>
            </div>
            
            <div class="team-members">
                ${teamMembers.slice(0, 5).map(member => {
                    const initials = member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
                    return `<div class="member-avatar" title="${member.name || member.email}">${initials}</div>`;
                }).join('')}
                ${teamMembers.length > 5 ? `<div class="member-avatar">+${teamMembers.length - 5}</div>` : ''}
                ${teamMembers.length === 0 ? '<span class="text-muted small">No team assigned</span>' : ''}
            </div>
            
            <div class="progress-section">
                <div class="progress-label">
                    <span>Progress</span>
                    <span><strong>${progress}%</strong></span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            
            <div class="project-actions">
                <button class="btn btn-sm btn-primary-custom flex-fill" onclick="viewProject('${project.id}')">
                    <i class="fas fa-eye me-1"></i>View Details
                </button>
                <button class="btn btn-sm btn-outline-custom" onclick="editProject('${project.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProject('${project.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Get deadline badge with urgency indicator
function getDeadlineBadge(deadline, status) {
    if (status === 'Completed') {
        return `<span class="deadline-badge normal">Completed</span>`;
    }
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    let badgeClass = 'normal';
    let text = formatDate(deadline);
    
    if (daysUntil < 0) {
        badgeClass = 'urgent';
        text = `Overdue by ${Math.abs(daysUntil)} days`;
    } else if (daysUntil === 0) {
        badgeClass = 'urgent';
        text = 'Due Today!';
    } else if (daysUntil <= 3) {
        badgeClass = 'urgent';
        text = `${daysUntil} days left`;
    } else if (daysUntil <= 7) {
        badgeClass = 'soon';
        text = `${daysUntil} days left`;
    }
    
    return `<span class="deadline-badge ${badgeClass}"><i class="fas fa-clock me-1"></i>${text}</span>`;
}

// Filter projects by status
function filterProjects(status) {
    const projects = getProjects();
    const filtered = status === 'all' ? projects : projects.filter(p => p.status === status);
    
    displayProjects(filtered);
    
    // Update active tab
    document.querySelectorAll('#projectFilterTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    if (event && event.target) {
        event.target.closest('.nav-link').classList.add('active');
    }
}

// Show add project modal
function showAddProjectModal() {
    const modal = new bootstrap.Modal(document.getElementById('addProjectModal'));
    modal.show();
}

// Handle add project
function handleAddProject(e) {
    e.preventDefault();
    
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;
    const status = document.getElementById('projectStatus').value;
    const priority = document.getElementById('projectPriority').value;
    const startDate = document.getElementById('projectStartDate').value;
    const deadline = document.getElementById('projectDeadline').value;
    const teamEmails = document.getElementById('projectTeam').value;
    
    // Parse team members
    const team = teamEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email)
        .map(email => ({
            email: email,
            name: getUserNameByEmail(email) || email
        }));
    
    // Create new project
    const newProject = {
        id: generateProjectId(),
        name: name,
        description: description,
        status: status,
        priority: priority,
        startDate: startDate,
        deadline: deadline,
        team: team,
        progress: status === 'Completed' ? 100 : 0,
        createdBy: currentUser.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Save project
    const projects = getProjects();
    projects.push(newProject);
    saveProjects(projects);
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
    modal.hide();
    document.getElementById('addProjectForm').reset();
    
    // Reload projects
    loadProjects();
    
    alert(`Project "${name}" created successfully!`);
}

// View project details
function viewProject(projectId) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
        alert('Project not found');
        return;
    }
    
    const modalBody = document.getElementById('viewProjectBody');
    document.getElementById('viewProjectTitle').textContent = project.name;
    
    const teamMembers = project.team || [];
    const deadlineBadge = getDeadlineBadge(project.deadline, project.status);
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <div class="mb-4">
                    <h6 class="text-muted text-uppercase mb-2">Description</h6>
                    <p style="white-space: pre-wrap;">${project.description}</p>
                </div>
                
                <div class="mb-4">
                    <h6 class="text-muted text-uppercase mb-3">Team Members (${teamMembers.length})</h6>
                    ${teamMembers.length > 0 ? `
                        <div class="row g-3">
                            ${teamMembers.map(member => `
                                <div class="col-md-6">
                                    <div class="d-flex align-items-center gap-3 p-3" style="background: var(--surface-elevated); border-radius: var(--radius-md);">
                                        <div class="member-avatar" style="width: 3rem; height: 3rem; font-size: 1.125rem;">
                                            ${member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <div class="fw-bold">${member.name || 'Unknown'}</div>
                                            <div class="text-muted small">${member.email}</div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-muted">No team members assigned</p>'}
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card-custom mb-3">
                    <h6 class="text-muted text-uppercase mb-3">Project Info</h6>
                    
                    <div class="mb-3">
                        <small class="text-muted">Status</small>
                        <div class="mt-1">
                            <span class="project-status ${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">Priority</small>
                        <div class="mt-1">
                            <span class="priority-badge priority-${project.priority.toLowerCase()}">${project.priority}</span>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">Progress</small>
                        <div class="mt-2">
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${project.progress}%"></div>
                            </div>
                            <div class="text-end mt-1"><strong>${project.progress}%</strong></div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">Start Date</small>
                        <div class="mt-1 fw-bold">${formatDate(project.startDate)}</div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">Deadline</small>
                        <div class="mt-1">${deadlineBadge}</div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">Created</small>
                        <div class="mt-1 text-muted small">${formatDate(project.createdAt)}</div>
                    </div>
                </div>
                
                <div class="d-grid gap-2">
                    <button class="btn btn-primary-custom" onclick="editProject('${project.id}')">
                        <i class="fas fa-edit me-2"></i>Edit Project
                    </button>
                    <button class="btn btn-outline-custom" onclick="updateProgress('${project.id}')">
                        <i class="fas fa-tasks me-2"></i>Update Progress
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('viewProjectModal'));
    modal.show();
}

// Edit project
function editProject(projectId) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    // Close view modal if open
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewProjectModal'));
    if (viewModal) viewModal.hide();
    
    // Populate form
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description;
    document.getElementById('projectStatus').value = project.status;
    document.getElementById('projectPriority').value = project.priority;
    document.getElementById('projectStartDate').value = project.startDate;
    document.getElementById('projectDeadline').value = project.deadline;
    document.getElementById('projectTeam').value = project.team.map(m => m.email).join(', ');
    
    // Change form to edit mode
    const form = document.getElementById('addProjectForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        
        // Update project
        project.name = document.getElementById('projectName').value;
        project.description = document.getElementById('projectDescription').value;
        project.status = document.getElementById('projectStatus').value;
        project.priority = document.getElementById('projectPriority').value;
        project.startDate = document.getElementById('projectStartDate').value;
        project.deadline = document.getElementById('projectDeadline').value;
        
        const teamEmails = document.getElementById('projectTeam').value;
        project.team = teamEmails
            .split(',')
            .map(email => email.trim())
            .filter(email => email)
            .map(email => ({
                email: email,
                name: getUserNameByEmail(email) || email
            }));
        
        project.updatedAt = new Date().toISOString();
        
        if (project.status === 'Completed' && project.progress < 100) {
            project.progress = 100;
        }
        
        saveProjects(projects);
        
        // Reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
        modal.hide();
        form.reset();
        form.onsubmit = handleAddProject;
        
        loadProjects();
        alert('Project updated successfully!');
    };
    
    // Show modal
    document.querySelector('#addProjectModal .modal-title').innerHTML = '<i class="fas fa-edit me-2"></i>Edit Project';
    const modal = new bootstrap.Modal(document.getElementById('addProjectModal'));
    modal.show();
    
    // Reset title when modal closes
    document.getElementById('addProjectModal').addEventListener('hidden.bs.modal', function() {
        document.querySelector('#addProjectModal .modal-title').innerHTML = '<i class="fas fa-plus-circle me-2"></i>Create New Project';
        form.onsubmit = handleAddProject;
    }, { once: true });
}

// Update progress
function updateProgress(projectId) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    const newProgress = prompt(`Enter progress percentage for "${project.name}" (0-100):`, project.progress);
    
    if (newProgress !== null) {
        const progress = parseInt(newProgress);
        if (!isNaN(progress) && progress >= 0 && progress <= 100) {
            project.progress = progress;
            project.updatedAt = new Date().toISOString();
            
            if (progress === 100 && project.status !== 'Completed') {
                if (confirm('Progress is 100%. Mark project as Completed?')) {
                    project.status = 'Completed';
                }
            }
            
            saveProjects(projects);
            loadProjects();
            
            // Refresh view modal if open
            const viewModal = document.getElementById('viewProjectModal');
            if (viewModal.classList.contains('show')) {
                viewProject(projectId);
            }
        } else {
            alert('Please enter a valid number between 0 and 100');
        }
    }
}

// Delete project
function deleteProject(projectId) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    if (confirm(`Are you sure you want to delete project "${project.name}"?\n\nThis action cannot be undone.`)) {
        const index = projects.findIndex(p => p.id === projectId);
        projects.splice(index, 1);
        saveProjects(projects);
        loadProjects();
        alert('Project deleted successfully');
    }
}

// Go back to dashboard
function goBackToDashboard() {
    window.location.href = 'admin-dashboard.html';
}

// Get user name by email
function getUserNameByEmail(email) {
    // Try to find in tickets
    const tickets = localStorage.getItem('ticket-tally-tickets');
    if (tickets) {
        const ticketList = JSON.parse(tickets);
        for (const ticket of ticketList) {
            if (ticket.createdBy === email) {
                return ticket.createdByName;
            }
        }
    }
    
    // Check current user
    if (currentUser.email === email) {
        return currentUser.name;
    }
    
    return null;
}

// Generate project ID
function generateProjectId() {
    return 'PRJ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Initialize sample projects if none exist
function initializeSampleProjects() {
    const projects = getProjects();
    
    if (projects.length === 0) {
        const sampleProjects = [
            {
                id: generateProjectId(),
                name: 'IT Infrastructure Upgrade',
                description: 'Upgrade server infrastructure and implement cloud migration strategy for improved performance and scalability.',
                status: 'Active',
                priority: 'High',
                startDate: '2026-01-15',
                deadline: '2026-03-31',
                team: [
                    { email: 'itstaff@demo.com', name: 'John Smith' },
                    { email: 'employee@demo.com', name: 'Sarah Johnson' }
                ],
                progress: 45,
                createdBy: currentUser.email,
                createdAt: new Date('2026-01-15').toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateProjectId(),
                name: 'Employee Portal Development',
                description: 'Build a new self-service employee portal with improved UX and mobile responsiveness.',
                status: 'Active',
                priority: 'Medium',
                startDate: '2026-01-20',
                deadline: '2026-04-15',
                team: [
                    { email: 'employee@demo.com', name: 'Sarah Johnson' }
                ],
                progress: 30,
                createdBy: currentUser.email,
                createdAt: new Date('2026-01-20').toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateProjectId(),
                name: 'Security Audit 2026',
                description: 'Comprehensive security audit and penetration testing of all systems and applications.',
                status: 'Planning',
                priority: 'Critical',
                startDate: '2026-02-01',
                deadline: '2026-02-28',
                team: [
                    { email: 'itstaff@demo.com', name: 'John Smith' }
                ],
                progress: 10,
                createdBy: currentUser.email,
                createdAt: new Date('2026-01-25').toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        saveProjects(sampleProjects);
    }
}