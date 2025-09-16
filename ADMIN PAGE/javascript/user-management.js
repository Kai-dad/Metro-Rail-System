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
const auth = firebase.auth();

// DOM elements
let usersTableBody, searchInput, refreshBtn, logoutBtn, connectionStatus;

// Store users data
let users = [];
let currentUser = null;

// Function to safely get DOM elements
function getDOMElements() {
  usersTableBody = document.getElementById('users-table-body');
  searchInput = document.getElementById('search-input');
  refreshBtn = document.getElementById('refresh-btn');
  logoutBtn = document.getElementById('logout-btn');
  connectionStatus = document.getElementById('connection-status');
  
  // Check if all elements exist
  if (!usersTableBody || !searchInput || !refreshBtn || !logoutBtn || !connectionStatus) {
    console.error('One or more DOM elements not found');
    return false;
  }
  
  return true;
}

// Function to show connection status
function showConnectionStatus(message, type = 'info') {
  if (connectionStatus) {
    connectionStatus.textContent = message;
    connectionStatus.className = `connection-status ${type}`;
  } else {
    console.log(`Connection Status (${type}): ${message}`);
  }
}

// Function to handle authentication state changes
function setupAuthStateListener() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      showConnectionStatus('✅ Authenticated. Loading users...', 'connected');
      fetchUsers();
    } else {
      // Not authenticated, redirect to login
      showConnectionStatus('🔒 Authentication required. Redirecting to login...', 'warning');
      setTimeout(() => {
        window.location.href = '../login.html';
      }, 2000);
    }
  });
}

// Function to fetch users from Firebase
async function fetchUsers() {
  try {
    if (usersTableBody) {
      usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">Loading users...</td></tr>';
    }
    
    const snapshot = await db.collection('users').get();
    users = [];
    
    if (snapshot.empty) {
      if (usersTableBody) {
        usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">No users found in the database.</td></tr>';
      }
      showConnectionStatus('✅ Connected. No users found in database.', 'connected');
      if (searchInput) searchInput.disabled = false;
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
    showConnectionStatus(`✅ Connected. Loaded ${users.length} users.`, 'connected');
    if (searchInput) searchInput.disabled = false;
  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (usersTableBody) {
      if (error.code === 'permission-denied') {
        usersTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="error">
              🔐 Firebase Permission Error: Unable to load users due to security rules.
              <br><br>
              Please add the following rules to your Firestore security rules:
              <pre>
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
match /users/{document} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
              </pre>
              <button class="retry-btn" onclick="fetchUsers()">Retry Connection</button>
            </td>
          </tr>
        `;
        showConnectionStatus('❌ Permission denied. Please check Firebase Security Rules.', 'error');
      } else if (error.code === 'unauthenticated') {
        showConnectionStatus('🔒 Authentication required. Please login again.', 'warning');
        setTimeout(() => {
          if (auth) auth.signOut();
          window.location.href = '../login.html';
        }, 2000);
      } else {
        usersTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="error">
              Error loading users: ${error.message}
              <br>
              <button class="retry-btn" onclick="fetchUsers()">Retry Connection</button>
            </td>
          </tr>
        `;
        showConnectionStatus('❌ Connection error: ' + error.message, 'error');
      }
    }
    
    if (searchInput) searchInput.disabled = true;
  }
}


// Function to render users in the table
function renderUsers(usersToRender) {
  if (!usersTableBody) return;
  
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
    } else if (user.metadata && user.metadata.creationTime) {
      try {
        createdAt = new Date(user.metadata.creationTime).toLocaleDateString();
      } catch (e) {
        console.error('Error formatting metadata date:', e);
      }
    }
    
    // Determine user status
    const isCurrentUser = currentUser && user.id === currentUser.uid;
    const statusBadge = isCurrentUser ? 
      '<span class="status-badge status-active">Current User</span>' : 
      '<span class="status-badge status-active">Active</span>';

    
    // Use displayName if available, otherwise fall back to email
    const displayName = user.displayName || user.email || 'N/A';
    const email = user.email || 'N/A';
    
    row.innerHTML = `
      <td class="user-id">${user.id.substring(0, 8)}...</td>
      <td>${email}</td>
      <td>${displayName}</td>
      <td>${createdAt}</td>
      <td>${statusBadge}</td>
    `;
    
    usersTableBody.appendChild(row);
  });
}

// Function to search users
function searchUsers() {
  if (!searchInput || !usersTableBody) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  
  if (!searchTerm) {
    renderUsers(users);
    return;
  }
  
  const filteredUsers = users.filter(user => {
    const displayName = (user.displayName || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const uid = (user.id || '').toLowerCase();
    
    return displayName.includes(searchTerm) || 
           email.includes(searchTerm) || 
           uid.includes(searchTerm);
  });
  
  renderUsers(filteredUsers);
}

// Function to handle logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    if (auth) {
      auth.signOut().then(() => {
        window.location.href = '../login.html';
      }).catch((error) => {
        console.error('Error signing out:', error);
        alert('Error signing out: ' + error.message);
      });
    } else {
      window.location.href = '../login.html';
    }
  }
}

// Initialize the application
function initApp() {
  // Get DOM elements safely
  if (!getDOMElements()) {
    console.error('Failed to initialize app: DOM elements not found');
    showConnectionStatus('❌ Error initializing application', 'error');
    return;
  }
  
  // Event listeners
  searchInput.addEventListener('input', searchUsers);
  refreshBtn.addEventListener('click', fetchUsers);
  logoutBtn.addEventListener('click', handleLogout);
  
  // Set up auth state listener
  setupAuthStateListener();
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions to global scope for retry button
window.fetchUsers = fetchUsers;
