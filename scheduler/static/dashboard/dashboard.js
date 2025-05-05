/**
 * Scheduler Dashboard
 * 
 * A simple dashboard for viewing and managing scheduled jobs.
 */

// API base URL
const API_BASE_URL = '';  // Empty string means same origin

// State
let jobs = [];
let dlqJobs = [];
let currentFilter = 'all';
let confirmCallback = null;
let currentTab = 'jobs'; // 'jobs' or 'dlq'

// DOM Elements
const jobsTab = document.getElementById('jobs-tab');
const dlqTab = document.getElementById('dlq-tab');
const jobsContent = document.getElementById('jobs-content');
const dlqContent = document.getElementById('dlq-content');
const jobsTableBody = document.getElementById('jobs-table-body');
const dlqTableBody = document.getElementById('dlq-table-body');
const statusFilter = document.getElementById('status-filter');
const refreshBtn = document.getElementById('refresh-btn');
const refreshDlqBtn = document.getElementById('refresh-dlq-btn');
const loadingIndicator = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const jobDetailsModal = document.getElementById('job-details-modal');
const jobDetailsContent = document.getElementById('job-details-content');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessageEl = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes');
const confirmNoBtn = document.getElementById('confirm-no');
const closeButtons = document.querySelectorAll('.close');

// Initialize the dashboard
function init() {
    // Set up tab event listeners
    jobsTab.addEventListener('click', () => switchTab('jobs'));
    dlqTab.addEventListener('click', () => switchTab('dlq'));
    
    // Set up other event listeners
    statusFilter.addEventListener('change', handleFilterChange);
    refreshBtn.addEventListener('click', fetchJobs);
    refreshDlqBtn.addEventListener('click', fetchDlqJobs);
    
    // Close modal buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            jobDetailsModal.style.display = 'none';
            confirmModal.style.display = 'none';
        });
    });
    
    // Confirm modal buttons
    confirmYesBtn.addEventListener('click', handleConfirmYes);
    confirmNoBtn.addEventListener('click', handleConfirmNo);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === jobDetailsModal) {
            jobDetailsModal.style.display = 'none';
        }
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
    
    // Initial data fetch
    fetchJobs();
}

// Switch between tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    jobsTab.classList.toggle('active', tab === 'jobs');
    dlqTab.classList.toggle('active', tab === 'dlq');
    
    // Update tab content
    jobsContent.classList.toggle('active', tab === 'jobs');
    dlqContent.classList.toggle('active', tab === 'dlq');
    
    // Fetch data for the selected tab if needed
    if (tab === 'jobs') {
        fetchJobs();
    } else if (tab === 'dlq') {
        fetchDlqJobs();
    }
}

// Fetch jobs from the API
async function fetchJobs() {
    showLoading(true);
    hideError();
    
    try {
        let url = `${API_BASE_URL}/jobs`;
        
        // Add status filter if not 'all'
        if (currentFilter !== 'all') {
            url += `?status=${currentFilter}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        jobs = await response.json();
        renderJobsTable();
    } catch (error) {
        console.error('Error fetching jobs:', error);
        showError(`Failed to load jobs: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Render the jobs table
function renderJobsTable() {
    // Clear the table
    jobsTableBody.innerHTML = '';
    
    if (jobs.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center;">No jobs found</td>
        `;
        jobsTableBody.appendChild(row);
        return;
    }
    
    // Sort jobs by created_at (newest first)
    jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Add each job to the table
    jobs.forEach(job => {
        const row = document.createElement('tr');
        
        // Format the schedule info
        let scheduleInfo = '';
        if (job.schedule_type === 'cron') {
            scheduleInfo = `Cron: ${job.cron_expression}`;
        } else if (job.schedule_type === 'specific_time') {
            scheduleInfo = `Once: ${formatDate(job.specific_time)}`;
        } else if (job.schedule_type === 'recurring') {
            scheduleInfo = `Every ${job.interval_value} ${job.interval}(s)`;
        }
        
        row.innerHTML = `
            <td>${job.name}</td>
            <td>${job.type}</td>
            <td>${scheduleInfo}</td>
            <td>
                <span class="status-badge status-${job.status}">
                    ${job.status}
                </span>
            </td>
            <td>${job.next_run ? formatDate(job.next_run) : 'N/A'}</td>
            <td>${job.last_run ? formatDate(job.last_run) : 'Never'}</td>
            <td class="actions-cell">
                <button class="btn btn-success action-btn run-btn" data-id="${job.id}">Run Now</button>
                <button class="btn action-btn view-btn" data-id="${job.id}">View</button>
                ${job.status !== 'failed' ? `
                <button class="btn ${job.status === 'active' ? 'btn-warning' : 'btn-success'} action-btn toggle-btn" data-id="${job.id}" data-status="${job.status}">
                    ${job.status === 'active' ? 'Disable' : 'Enable'}
                </button>` : ''}
                <button class="btn btn-danger action-btn delete-btn" data-id="${job.id}">Delete</button>
            </td>
        `;
        
        // Add event listeners for action buttons
        jobsTableBody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    document.querySelectorAll('.run-btn').forEach(btn => {
        btn.addEventListener('click', handleRunJob);
    });
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', handleViewJob);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteJob);
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', handleToggleJobStatus);
    });
}

// Handle toggle job status button click
async function handleToggleJobStatus(event) {
    const jobId = event.target.dataset.id;
    const currentStatus = event.target.dataset.status;
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) return;
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = currentStatus === 'active' ? 'disable' : 'enable';
    
    showConfirmModal(
        `Are you sure you want to ${actionText} "${job.name}"?`,
        async () => {
            try {
                showLoading(true);
                
                const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Refresh the jobs list
                await fetchJobs();
                
                // Show success message
                alert(`Job "${job.name}" ${actionText}d successfully`);
            } catch (error) {
                console.error(`Error ${actionText}ing job:`, error);
                showError(`Failed to ${actionText} job: ${error.message}`);
            } finally {
                showLoading(false);
            }
        }
    );
}

// Handle filter change
function handleFilterChange() {
    currentFilter = statusFilter.value;
    fetchJobs();
}

// Handle run job button click
async function handleRunJob(event) {
    const jobId = event.target.dataset.id;
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) return;
    
    showConfirmModal(
        `Are you sure you want to run "${job.name}" now?`,
        async () => {
            try {
                showLoading(true);
                
                const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/run`, {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Refresh the jobs list
                await fetchJobs();
                
                // Show success message
                alert(`Job "${job.name}" triggered successfully`);
            } catch (error) {
                console.error('Error running job:', error);
                showError(`Failed to run job: ${error.message}`);
            } finally {
                showLoading(false);
            }
        }
    );
}

// Handle view job button click
function handleViewJob(event) {
    const jobId = event.target.dataset.id;
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) return;
    
    // Format job details for display
    let scheduleDetails = '';
    if (job.schedule_type === 'cron') {
        scheduleDetails = `<div class="job-detail">
            <span class="job-detail-label">Cron Expression:</span> ${job.cron_expression}
        </div>`;
    } else if (job.schedule_type === 'specific_time') {
        scheduleDetails = `<div class="job-detail">
            <span class="job-detail-label">Specific Time:</span> ${formatDate(job.specific_time)}
        </div>`;
    } else if (job.schedule_type === 'recurring') {
        scheduleDetails = `<div class="job-detail">
            <span class="job-detail-label">Interval:</span> Every ${job.interval_value} ${job.interval}(s)
        </div>`;
    }
    
    // Format payload as JSON
    const payloadJson = job.payload ? JSON.stringify(job.payload, null, 2) : 'None';
    
    // Build the details HTML
    jobDetailsContent.innerHTML = `
        <div class="job-detail">
            <span class="job-detail-label">ID:</span> ${job.id}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Name:</span> ${job.name}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Description:</span> ${job.description || 'None'}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Type:</span> ${job.type}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Target:</span> ${job.target}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Schedule Type:</span> ${job.schedule_type}
        </div>
        ${scheduleDetails}
        <div class="job-detail">
            <span class="job-detail-label">Status:</span> 
            <span class="status-badge status-${job.status}">${job.status}</span>
            ${job.status !== 'failed' ? `
            <button class="btn ${job.status === 'active' ? 'btn-warning' : 'btn-success'} action-btn toggle-btn" data-id="${job.id}" data-status="${job.status}" style="margin-left: 10px;">
                ${job.status === 'active' ? 'Disable' : 'Enable'}
            </button>` : ''}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Created:</span> ${formatDate(job.created_at)}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Last Updated:</span> ${formatDate(job.updated_at)}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Last Run:</span> ${job.last_run ? formatDate(job.last_run) : 'Never'}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Next Run:</span> ${job.next_run ? formatDate(job.next_run) : 'N/A'}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Error Message:</span> ${job.error_message || 'None'}
        </div>
        <div class="job-detail">
            <span class="job-detail-label">Payload:</span>
            <pre class="job-payload">${payloadJson}</pre>
        </div>
    `;
    
    // Show the modal
    jobDetailsModal.style.display = 'block';
    
    // Add event listener for the toggle button in the modal
    const modalToggleBtn = jobDetailsContent.querySelector('.toggle-btn');
    if (modalToggleBtn) {
        modalToggleBtn.addEventListener('click', (event) => {
            // Hide the modal before showing the confirmation
            jobDetailsModal.style.display = 'none';
            handleToggleJobStatus(event);
        });
    }
}

// Handle delete job button click
function handleDeleteJob(event) {
    const jobId = event.target.dataset.id;
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) return;
    
    showConfirmModal(
        `Are you sure you want to delete "${job.name}"?`,
        async () => {
            try {
                showLoading(true);
                
                const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Refresh the jobs list
                await fetchJobs();
                
                // Show success message
                alert(`Job "${job.name}" deleted successfully`);
            } catch (error) {
                console.error('Error deleting job:', error);
                showError(`Failed to delete job: ${error.message}`);
            } finally {
                showLoading(false);
            }
        }
    );
}

// Show confirmation modal
function showConfirmModal(message, callback) {
    confirmMessageEl.textContent = message;
    confirmCallback = callback;
    confirmModal.style.display = 'block';
}

// Handle confirm yes button click
function handleConfirmYes() {
    confirmModal.style.display = 'none';
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
}

// Handle confirm no button click
function handleConfirmNo() {
    confirmModal.style.display = 'none';
    confirmCallback = null;
}

// Show/hide loading indicator
function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('default', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

// Fetch jobs from the DLQ
async function fetchDlqJobs() {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${API_BASE_URL}/dlq`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        dlqJobs = await response.json();
        renderDlqTable();
    } catch (error) {
        console.error('Error fetching DLQ jobs:', error);
        showError(`Failed to load DLQ jobs: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Render the DLQ table
function renderDlqTable() {
    // Clear the table
    dlqTableBody.innerHTML = '';
    
    if (dlqJobs.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" style="text-align: center;">No jobs in the Dead Letter Queue</td>
        `;
        dlqTableBody.appendChild(row);
        return;
    }
    
    // Sort jobs by updated_at (newest first)
    dlqJobs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    // Add each job to the table
    dlqJobs.forEach(job => {
        const row = document.createElement('tr');
        
        // Format the schedule info
        let scheduleInfo = '';
        if (job.schedule_type === 'cron') {
            scheduleInfo = `Cron: ${job.cron_expression}`;
        } else if (job.schedule_type === 'specific_time') {
            scheduleInfo = `Once: ${formatDate(job.specific_time)}`;
        } else if (job.schedule_type === 'recurring') {
            scheduleInfo = `Every ${job.interval_value} ${job.interval}(s)`;
        }
        
        row.innerHTML = `
            <td>${job.name}</td>
            <td>${job.type}</td>
            <td>${scheduleInfo}</td>
            <td>${formatDate(job.updated_at)}</td>
            <td class="error-cell">${job.error_message || 'None'}</td>
            <td class="actions-cell">
                <button class="btn btn-success action-btn reactivate-btn" data-id="${job.id}">Reactivate</button>
                <button class="btn action-btn view-btn" data-id="${job.id}">View</button>
                <button class="btn btn-warning action-btn complete-btn" data-id="${job.id}">Complete</button>
                <button class="btn btn-danger action-btn delete-btn" data-id="${job.id}">Delete</button>
            </td>
        `;
        
        dlqTableBody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    document.querySelectorAll('#dlq-table .view-btn').forEach(btn => {
        btn.addEventListener('click', handleViewDlqJob);
    });
    
    document.querySelectorAll('#dlq-table .delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteDlqJob);
    });
    
    document.querySelectorAll('#dlq-table .reactivate-btn').forEach(btn => {
        btn.addEventListener('click', handleReactivateDlqJob);
    });
    
    document.querySelectorAll('#dlq-table .complete-btn').forEach(btn => {
        btn.addEventListener('click', handleCompleteDlqJob);
    });
}

// Handle view DLQ job button click
function handleViewDlqJob(event) {
    const jobId = event.target.dataset.id;
    const job = dlqJobs.find(j => j.id === jobId);
    
    if (!job) return;
    
    // Use the same view function as regular jobs
    handleViewJob(event, job);
}

// Handle delete DLQ job button click
function handleDeleteDlqJob(event) {
    const jobId = event.target.dataset.id;
    const job = dlqJobs.find(j => j.id === jobId);
    
    if (!job) return;
    
    showConfirmModal(
        `Are you sure you want to delete "${job.name}" from the DLQ?`,
        async () => {
            try {
                showLoading(true);
                
                const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Refresh the DLQ jobs list
                await fetchDlqJobs();
                
                // Show success message
                alert(`Job "${job.name}" deleted successfully`);
            } catch (error) {
                console.error('Error deleting job:', error);
                showError(`Failed to delete job: ${error.message}`);
            } finally {
                showLoading(false);
            }
        }
    );
}

// Handle reactivate DLQ job button click
function handleReactivateDlqJob(event) {
    const jobId = event.target.dataset.id;
    const job = dlqJobs.find(j => j.id === jobId);
    
    if (!job) return;
    
    showConfirmModal(
        `Are you sure you want to reactivate "${job.name}"?`,
        async () => {
            try {
                showLoading(true);
                
                const response = await fetch(`${API_BASE_URL}/dlq/${jobId}/reactivate`, {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Refresh the DLQ jobs list
                await fetchDlqJobs();
                
                // Show success message
                alert(`Job "${job.name}" reactivated successfully`);
            } catch (error) {
                console.error('Error reactivating job:', error);
                showError(`Failed to reactivate job: ${error.message}`);
            } finally {
                showLoading(false);
            }
        }
    );
}

// Handle complete DLQ job button click
function handleCompleteDlqJob(event) {
    const jobId = event.target.dataset.id;
    const job = dlqJobs.find(j => j.id === jobId);
    
    if (!job) return;
    
    showConfirmModal(
        `Are you sure you want to mark "${job.name}" as completed without running it?`,
        async () => {
            try {
                showLoading(true);
                
                const response = await fetch(`${API_BASE_URL}/dlq/${jobId}/complete`, {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Refresh the DLQ jobs list
                await fetchDlqJobs();
                
                // Show success message
                alert(`Job "${job.name}" marked as completed successfully`);
            } catch (error) {
                console.error('Error completing job:', error);
                showError(`Failed to complete job: ${error.message}`);
            } finally {
                showLoading(false);
            }
        }
    );
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
