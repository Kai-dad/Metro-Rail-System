// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2gjql42QQAn6kEnuAlb-U8uO4veOf9kQ",
  authDomain: "metro-rail-2de9c.firebaseapp.com",
  projectId: "metro-rail-2de9c",
  storageBucket: "metro-rail-2de9c.firebasestorage.app",
  messagingSenderId: "1036516254492",
  appId: "1:1036516254492:web:a1d07b16233af9cecc90d9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const usersTableBody = document.getElementById('users-table-body');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');
const connectionStatus = document.getElementById('connection-status');

// Store users data
let users = [];

// Function to show connection status
function showConnectionStatus(message, isError = false) {
  connectionStatus.textContent = message;
  connectionStatus.className = isError ? 'connection-status error' : 'connection-status connected';
  
  // Hide status after 5 seconds unless it's an error
  if (!isError) {
    setTimeout(() => {
      connectionStatus.style.display = 'none';
    }, 5000);
  }
}

// Function to fetch users from Firebase
async function fetchUsers() {
  try {
    usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">Loading users...</td></tr>';
    
    const snapshot = await db.collection('users').get();
    users = [];
    
    if (snapshot.empty) {
      usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">No users found in the database.</td></tr>';
      showConnectionStatus('Connected successfully, but no users found.', false);
      return;
    }
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData
      });
    });
    
    renderUsers(users);
    showConnectionStatus('Connected successfully. Users loaded.', false);
  } catch (error) {
    console.error('Error fetching users:', error);
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="error">
          Error loading users. Please check your connection and try again.
          <br>
          <button class="retry-btn" onclick="fetchUsers()">Retry</button>
        </td>
      </tr>
    `;
    showConnectionStatus('Connection error: ' + error.message, true);
  }
}

// Function to render users in the table
function renderUsers(usersToRender) {
  if (usersToRender.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">No users found.</td></tr>';
    return;
  }
  
  usersTableBody.innerHTML = '';
  
  usersToRender.forEach(user => {
    const row = document.createElement('tr');
    
    // Format the date if available
    let createdAt = 'N/A';
    if (user.createdAt) {
      try {
        const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        createdAt = date.toLocaleDateString();
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }
    
    // Determine user status
    const isActive = user.status !== false; // Default to active if status is not set
    const statusBadge = isActive ? 
      '<span class="status-badge status-active">Active</span>' : 
      '<span class="status-badge status-inactive">Inactive</span>';
    
    // Use displayName if available, otherwise fall back to username or email
    const username = user.displayName || user.username || user.email.split('@')[0];
    
    row.innerHTML = `
      <td>${username}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.role || 'user'}</td>
      <td>${createdAt}</td>
      <td>${statusBadge}</td>
    `;
    
    usersTableBody.appendChild(row);
  });
}

// Function to search users
function searchUsers() {
  const searchTerm = searchInput.value.toLowerCase();
  
  if (!searchTerm) {
    renderUsers(users);
    return;
  }
  
  const filteredUsers = users.filter(user => {
    const username = (user.displayName || user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    
    return username.includes(searchTerm) || email.includes(searchTerm);
  });
  
  renderUsers(filteredUsers);
}

// Function to handle logout
function handleLogout() {
  // Simple logout without Firebase Auth
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'login.html';
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', fetchUsers);
searchInput.addEventListener('input', searchUsers);
refreshBtn.addEventListener('click', fetchUsers);
logoutBtn.addEventListener('click', handleLogout);

// Export functions to global scope for retry button
window.fetchUsers = fetchUsers;
