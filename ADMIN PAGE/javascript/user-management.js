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

// Function to handle authentication state changes
function setupAuthStateListener() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      showConnectionStatus('✅ AUTHENTICATED - LOADING USERS...', 'connected');
      console.log('Current user:', user.email, user.uid);
      
      // Update current user's last sign-in
      await updateCurrentUserLastSignIn(user);
      
      // Fetch all users
      await fetchUsers();
    } else {
      showConnectionStatus('🔒 AUTHENTICATION REQUIRED - REDIRECTING...', 'warning');
      setTimeout(() => {
        window.location.href = '../login.html';
      }, 2000);
    }
  });
}

// Update only current user's last sign-in
async function updateCurrentUserLastSignIn(user) {
  try {
    const userRef = db.collection("users").doc(user.uid);
    const now = new Date();
    
    const userData = {
      email: user.email,
      displayName: user.displayName || user.email,
      lastSignInTime: now,
      isOnline: true
    };
    
    // Use set with merge to update or create the document
    await userRef.set(userData, { merge: true });
    console.log('Updated current user sign-in time');
  } catch (error) {
    console.error('Error updating current user:', error);
  }
}

// Function to fetch ALL users from Firebase
async function fetchUsers() {
  try {
    showConnectionStatus('🔄 LOADING USERS FROM DATABASE...', 'warning');
    
    if (usersTableBody) {
      usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">LOADING USERS...</td></tr>';
    }
    
    console.log('Starting to fetch users from Firestore...');
    
    const snapshot = await db.collection('users').get();
    users = [];
    
    console.log('Snapshot size:', snapshot.size);
    
    if (snapshot.empty) {
      console.log('No users found in database');
      if (usersTableBody) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">NO USERS FOUND IN DATABASE</td></tr>';
      }
      showConnectionStatus('✅ CONNECTED - NO USERS FOUND', 'connected');
      return;
    }
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      console.log('Found user:', doc.id, userData.email);
      users.push({
        id: doc.id,
        ...userData
      });
    });
    
    console.log(`Total users loaded: ${users.length}`);
    renderUsers(users);
    showConnectionStatus(`✅ LOADED ${users.length} USERS`, 'connected');
    
  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (usersTableBody) {
      let errorMessage = 'Unknown error occurred';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore security rules.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Authentication required. Please login again.';
        setTimeout(() => {
          window.location.href = '../login.html';
        }, 2000);
      } else {
        errorMessage = error.message;
      }
      
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="error">
            Error: ${errorMessage}
            <br><br>
            <button class="retry-btn" onclick="fetchUsers()">Retry</button>
          </td>
        </tr>
      `;
    }
    
    showConnectionStatus('❌ ERROR: ' + error.message, 'error');
  }
}

// Function to check if user is active
function isUserActive(user) {
  // Current user is always active
  if (currentUser && user.id === currentUser.uid) {
    return true;
  }
  
  // Check last sign-in time for other users
  if (!user.lastSignInTime) {
    return false;
  }
  
  try {
    const lastSignIn = user.lastSignInTime.toDate ? user.lastSignInTime.toDate() : new Date(user.lastSignInTime);
    const now = new Date();
    const diffDays = Math.floor((now - lastSignIn) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  } catch (e) {
    console.error('Error checking user activity:', e);
    return false;
  }
}

// Function to render users in the table
function renderUsers(usersToRender) {
  if (!usersTableBody) return;

  if (usersToRender.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">NO USERS FOUND</td></tr>';
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
        lastSignIn = date.toLocaleDateString();
      } catch (e) {
        console.error('Error formatting last sign-in:', e);
      }
    }

    // Determine status
    const isCurrentUser = currentUser && user.id === currentUser.uid;
    const isActive = isUserActive(user);
    
    let statusText = 'INACTIVE';
    let statusClass = 'inactive';
    
    if (isCurrentUser) {
      statusText = 'CURRENT USER';
      statusClass = 'current';
    } else if (isActive) {
      statusText = 'ACTIVE';
      statusClass = 'active';
    }

    const displayName = user.displayName || user.email || 'N/A';
    const email = user.email || 'N/A';

    row.innerHTML = `
      <td class="user-id">${user.id.substring(0, 8)}...</td>
      <td>${email}</td>
      <td>${displayName}</td>
      <td>${createdAt}</td>
      <td>${lastSignIn}</td>
      <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
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
    const searchableText = [
      user.displayName || '',
      user.email || '',
      user.id || ''
    ].join(' ').toLowerCase();
    
    return searchableText.includes(searchTerm);
  });
  
  renderUsers(filteredUsers);
}

async function checkAndDeleteUser(uid, email) {
  try {
    if (currentUser && uid === currentUser.uid) {
      alert('Cannot delete your own account');
      return;
    }

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      alert('User not found');
      return;
    }

    const userData = userDoc.data();
    const isActive = isUserActive(userData);

    if (!isActive) {
      if (confirm(`Delete inactive user: ${email}?`)) {
        await db.collection('users').doc(uid).delete();
        alert('User deleted');
        fetchUsers();
      }
    } else {
      alert('User is active - cannot delete');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
}

// Function to handle logout
function handleLogout() {
  if (confirm('Logout?')) {
    auth.signOut().then(() => {
      window.location.href = '../login.html';
    }).catch((error) => {
      console.error('Logout error:', error);
      alert('Logout error: ' + error.message);
    });
  }
}

// Initialize the application
function initApp() {
  if (!getDOMElements()) {
    showConnectionStatus('❌ ERROR INITIALIZING APPLICATION', 'error');
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

// Export functions to global scope
window.fetchUsers = fetchUsers;
window.checkAndDeleteUser = checkAndDeleteUser;
