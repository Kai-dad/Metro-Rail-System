// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2gjql42QQAn6kEnuAlb-U8uO4veOf9kQ",
  authDomain: "metro-rail-2de9c.firebaseapp.com",
  projectId: "metro-rail-2de9c",
  storageBucket: "metro-rail-2de9c.appspot.com",
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

// Authentication listener
function setupAuthStateListener() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      showConnectionStatus('✅ Authenticated. Loading users...', 'connected');
      fetchUsers();
    } else {
      showConnectionStatus('🔒 Authentication required. Redirecting to login...', 'warning');
      setTimeout(() => {
        window.location.href = '../login.html';
      }, 2000);
    }
  });
}

// Save or update user in Firestore on login
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userRef = db.collection("users").doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        email: user.email,
        displayName: user.displayName || "",
        createdAt: new Date(),
        lastSignInTime: new Date()
      });
    } else {
      await userRef.update({
        lastSignInTime: new Date()
      });
    }
  }
});

// Real-time fetch users
async function fetchUsers() {
  try {
    if (usersTableBody) {
      usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading users...</td></tr>';
    }

    db.collection('users').onSnapshot(snapshot => {
      users = [];

      if (snapshot.empty) {
        if (usersTableBody) {
          usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">No users found in the database.</td></tr>';
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
    }, error => {
      console.error('Error fetching users:', error);
      showConnectionStatus('❌ Connection error: ' + error.message, 'error');
      if (searchInput) searchInput.disabled = true;
    });

  } catch (error) {
    console.error('Error setting up real-time users listener:', error);
    showConnectionStatus('❌ Error: ' + error.message, 'error');
  }
}

// Render users
function renderUsers(usersToRender) {
  if (!usersTableBody) return;

  if (usersToRender.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">No users found.</td></tr>';
    return;
  }

  usersTableBody.innerHTML = '';

  usersToRender.forEach(user => {
    const row = document.createElement('tr');

    // Format creation date
    let createdAt = 'N/A';
    if (user.createdAt) {
      try {
        const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        createdAt = date.toLocaleDateString();
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }

    // Status logic
    let statusBadge = '<span class="status-badge status-active">Active</span>';
    const isCurrentUser = currentUser && user.id === currentUser.uid;

    if (isCurrentUser) {
      statusBadge = '<span class="status-badge status-current">Current User</span>';
    } else {
      let inactive = false;
      if (user.lastSignInTime) {
        const lastSignIn = new Date(user.lastSignInTime);
        const now = new Date();
        const diffDays = Math.floor((now - lastSignIn) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) inactive = true;
      } else {
        inactive = true; // never signed in
      }

      if (inactive) {
        statusBadge = '<span class="status-badge status-inactive">Inactive</span>';
      }
    }

    const displayName = user.displayName || user.email || 'N/A';
    const email = user.email || 'N/A';

    row.innerHTML = `
      <td class="user-id">${user.id.substring(0, 8)}...</td>
      <td>${email}</td>
      <td>${displayName}</td>
      <td>${createdAt}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="check-btn" onclick="checkAndDeleteUser('${user.id}', '${email}')">
          Check / Delete
        </button>
      </td>
    `;

    usersTableBody.appendChild(row);
  });
}

// Search users
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

// Check and delete user
async function checkAndDeleteUser(uid, email) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      alert(`User ${email} not found in the database.`);
      return;
    }

    const userData = userDoc.data();
    const lastSignIn = userData.lastSignInTime ? new Date(userData.lastSignInTime) : null;
    const now = new Date();
    let inactive = false;

    if (lastSignIn) {
      const diffDays = Math.floor((now - lastSignIn) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) inactive = true;
    } else {
      inactive = true;
    }

    if (inactive) {
      const confirmDelete = confirm(`User ${email} appears inactive. Do you want to delete this user?`);
      if (confirmDelete) {
        await db.collection('users').doc(uid).delete();
        alert(`User ${email} has been deleted.`);
      }
    } else {
      alert(`User ${email} is active.`);
    }
  } catch (error) {
    console.error('Error checking/deleting user:', error);
    alert('Error checking/deleting user: ' + error.message);
  }
}

// Logout
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

// Initialize app
function initApp() {
  if (!getDOMElements()) {
    console.error('Failed to initialize app: DOM elements not found');
    showConnectionStatus('❌ Error initializing application', 'error');
    return;
  }

  searchInput.addEventListener('input', searchUsers);
  refreshBtn.addEventListener('click', fetchUsers);
  logoutBtn.addEventListener('click', handleLogout);

  setupAuthStateListener();
}

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions to global scope
window.fetchUsers = fetchUsers;
