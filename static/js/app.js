
// Main JavaScript file for Music U Scheduler

// Global variables
let currentUser = null;
let authToken = localStorage.getItem('token');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set up HTMX headers
    if (authToken) {
        document.body.addEventListener('htmx:configRequest', function(evt) {
            evt.detail.headers['Authorization'] = `Bearer ${authToken}`;
        });
    }

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Authentication functions
function login(email, password) {
    return fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'username': email,
            'password': password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            authToken = data.access_token;
            return data;
        } else {
            throw new Error('Login failed');
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    authToken = null;
    window.location.href = '/auth/login';
}

// API helper functions
function apiCall(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    return fetch(url, mergedOptions)
        .then(response => {
            if (response.status === 401) {
                logout();
                return;
            }
            return response.json();
        });
}

// User management functions
function createUser(userData) {
    return apiCall('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

function updateUser(userId, userData) {
    return apiCall(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
}

function deleteUser(userId) {
    return apiCall(`/admin/users/${userId}`, {
        method: 'DELETE'
    });
}

// Lesson management functions
function createLesson(lessonData) {
    return apiCall('/instructor/lessons', {
        method: 'POST',
        body: JSON.stringify(lessonData)
    });
}

function updateLesson(lessonId, lessonData) {
    return apiCall(`/instructor/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(lessonData)
    });
}

function deleteLesson(lessonId) {
    return apiCall(`/instructor/lessons/${lessonId}`, {
        method: 'DELETE'
    });
}

function markLessonCompleted(lessonId) {
    return apiCall(`/instructor/lessons/${lessonId}/complete`, {
        method: 'POST'
    });
}

// Utility functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector('.container-fluid') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

// Search and filter functions
function filterTable(tableId, searchValue, columnIndex = null) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        let shouldShow = false;

        if (columnIndex !== null) {
            const cell = row.getElementsByTagName('td')[columnIndex];
            if (cell && cell.textContent.toLowerCase().includes(searchValue.toLowerCase())) {
                shouldShow = true;
            }
        } else {
            const cells = row.getElementsByTagName('td');
            for (let j = 0; j < cells.length; j++) {
                if (cells[j].textContent.toLowerCase().includes(searchValue.toLowerCase())) {
                    shouldShow = true;
                    break;
                }
            }
        }

        row.style.display = shouldShow ? '' : 'none';
    }
}

// Calendar functions
function generateCalendar(year, month, containerId) {
    const container = document.getElementById(containerId);
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    let html = '<div class="calendar-grid">';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-header">${day}</div>`;
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        html += `<div class="calendar-day ${isToday ? 'today' : ''}" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}">
            <div class="day-number">${day}</div>
            <div class="day-lessons" id="lessons-${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}"></div>
        </div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

// Export functions for global use
window.MusicUScheduler = {
    login,
    logout,
    apiCall,
    createUser,
    updateUser,
    deleteUser,
    createLesson,
    updateLesson,
    deleteLesson,
    markLessonCompleted,
    showAlert,
    formatDate,
    formatTime,
    validateEmail,
    validatePassword,
    filterTable,
    generateCalendar
};
