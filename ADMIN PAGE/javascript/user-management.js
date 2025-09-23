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
  }
}

// Function to update user's last sign-in time
async function updateUserSignInTime(user) {
  try {
    const userRef = db.collection("users").doc(user.uid);
    const now = new Date();
    
    const userData = {
      email: user.email,
      displayName: user.displayName || user.email,
      lastSignInTime: now,
      updatedAt: now
    };
    
    // Check if user document exists
    const doc = await userRef.get();
    if (!doc.exists) {
      // Create new user with createdAt
      userData.createdAt = now;
      await userRef.set(userData);
      console.log('New user created:', user.email);
    } else {
      // Update existing user
      await userRef.update(userData);
      console.log('User sign-in time updated:', user.email);
    }
  } catch (error) {
    console.error('Error updating user sign-in time:', error);
  }
}

// Function to handle authentication state changes
function setupAuthStateListener() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      showConnectionStatus('✅ Authenticated. Updating sign-in time...', 'connected');
      
      // Update the user's sign-in time
      await updateUserSignInTime(user);
      
      // Then fetch all users
      fetchUsers();
    } else {
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
      usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading users...</td></tr>';
    }
    
    console.log('Fetching users from Firestore...');
    const snapshot = await db.collection('users').get();
    users = [];
    
    if (snapshot.empty) {
      if (usersTableBody) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">No users found in the database.</td></tr>';
      }
      showConnectionStatus('✅ Connected. No users found in database.', 'connected');
      return;
    }
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      console.log('User data:', doc.id, userData.email, userData.lastSignInTime);
      users.push({
        id: doc.id,
        ...userData
      });
    });
    
    renderUsers(users);
    showConnectionStatus(`✅ Connected. Loaded ${users.length} users.`, 'connected');
    
  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (usersTableBody) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="error">
            Error loading users: ${error.message}
            <br>
            <button class="retry-btn" onclick="fetchUsers()">Retry Connection</button>
          </td>
        </tr>
      `;
    }
    
    showConnectionStatus('❌ Connection error: ' + error.message, 'error');
  }
}

// Function to check if user is active (signed in within last 30 days)
function isUserActive(user) {
  console.log('Checking user activity:', user.email, user.lastSignInTime);
  
  if (!user.lastSignInTime) {
    console.log('No lastSignInTime found for user:', user.email);
    return false;
  }
  
  try {
    // Convert Firestore timestamp to Date object
    const lastSignIn = user.lastSignInTime.toDate ? user.lastSignInTime.toDate() : new Date(user.lastSignInTime);
    const now = new Date();
    const diffTime = now - lastSignIn;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`User ${user.email}: lastSignIn=${lastSignIn}, diffDays=${diffDays}, active=${diffDays <= 30}`);
    
    return diffDays <= 30;
  } catch (e) {
    console.error('Error checking user activity:', e, user);
    return false;
  }
}

// Function to render users in the table
function renderUsers(usersToRender) {
  if (!usersTableBody) return;

  if (usersToRender.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">No users found.</td></tr>';
    return;
  }

  usersTableBody.innerHTML = '';

  usersToRender.forEach(user => {
    const row = document.createElement('tr');

    // Format dates
    let createdAt = 'N/A';
    if (user.createdAt) {
      try {
        const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        createdAt = date.toLocaleDateString();
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }

    let lastSignIn = 'Never';
    if (user.lastSignInTime) {
      try {
        const date = user.lastSignInTime.toDate ? user.lastSignInTime.toDate() : new Date(user.lastSignInTime);
        lastSignIn = date.toLocaleString();
      } catch (e) {
        console.error('Error formatting last sign-in:', e);
      }
    }

    // Determine user status
    const isCurrentUser = currentUser && user.id === currentUser.uid;
    const isActive = isUserActive(user);
    
    let statusBadge = '';
    if (isCurrentUser) {
      statusBadge = '<span class="status-badge status-current">Current User</span>';
    } else if (isActive) {
      statusBadge = '<span class="status-badge status-active">Active</span>';
    } else {
      statusBadge = '<span class="status-badge status-inactive">Inactive</span>';
    }

    const displayName = user.displayName || user.email || 'N/A';
    const email = user.email || 'N/A';

    row.innerHTML = `
      <td class="user-id">${user.id.substring(0, 8)}...</td>
      <td>${email}</td>
      <td>${displayName}</td>
      <td>${createdAt}</td>
      <td>${lastSignIn}</td>
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

async function checkAndDeleteUser(uid, email) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      alert(`User ${email} not found in the database.`);
      return;
    }

    const userData = userDoc.data();
    const isActive = isUserActive(userData);

    if (!isActive) {
      const confirmDelete = confirm(`User ${email} appears inactive. Do you want to delete this user?`);
      if (confirmDelete) {
        await db.collection('users').doc(uid).delete();
        alert(`User ${email} has been deleted.`);
        fetchUsers();
      }
    } else {
      alert(`User ${email} is active.`);
    }
  } catch (error) {
    console.error('Error checking/deleting user:', error);
    alert('Error checking/deleting user: ' + error.message);
  }
}

// Function to handle logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    auth.signOut().then(() => {
      window.location.href = '../login.html';
    }).catch((error) => {
      console.error('Error signing out:', error);
      alert('Error signing out: ' + error.message);
    });
  }
}

// Initialize the application
function initApp() {
  if (!getDOMElements()) {
    showConnectionStatus('❌ Error initializing application', 'error');
    return;
  }
  
  searchInput.addEventListener('input', searchUsers);
  refreshBtn.addEventListener('click', fetchUsers);
  logoutBtn.addEventListener('click', handleLogout);
  
  setupAuthStateListener();
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

window.fetchUsers = fetchUsers;
window.checkAndDeleteUser = checkAndDeleteUser;
