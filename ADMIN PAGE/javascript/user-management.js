// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2gjql42QQAn6kEnuAlb-U8uO4veOf9kQ",
  authDomain: "metro-rail-2de9c.firebaseapp.com",
  projectId: "metro-rail-2de9c",
 // storageBucket: "metro-rail-2de9c.firebasestorage.app",
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

auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Save user to Firestore if not already there
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
      // Update last login time
      await userRef.update({
        lastSignInTime: new Date()
      });
    }
  }
});

// Function to fetch users from Firebase
// Function to fetch and live-listen to users from Firebase
async function fetchUsers() {
  try {
    if (usersTableBody) {
      usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading users...</td></tr>';
    }

    // Use Firestore snapshot listener for real-time updates
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
function renderUsers(usersToRender) {
  if (!usersTableBody) return;

  if (usersToRender.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">No users found.</td></tr>';
    return;
  }

  usersTableBody.innerHTML = '';

  usersToRender.forEach(user => {
    const row = document.createElement('tr');

    let createdAt = 'N/A';
    if (user.createdAt) {
      try {
        const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        createdAt = date.toLocaleDateString();
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }

    const isCurrentUser = currentUser && user.id === currentUser.uid;
    const statusBadge = isCurrentUser ? 
      '<span class="status-badge status-active">Current User</span>' : 
      '<span class="status-badge status-active">Active</span>';

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

async function checkAndDeleteUser(uid, email) {
  try {
    // Fetch user metadata
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
      if (diffDays > 3) { // consider inactive if no sign in for 30+ days
        inactive = true;
      }
    } else {
      inactive = true; // no lastSignIn info = inactive
    }

    if (inactive) {
      const confirmDelete = confirm(`User ${email} appears inactive. Do you want to delete this user?`);
      if (confirmDelete) {
        await db.collection('users').doc(uid).delete();
        alert(`User ${email} has been deleted.`);
        fetchUsers(); // refresh the table
      }
    } else {
      alert(`User ${email} is active.`);
    }
  } catch (error) {
    console.error('Error checking/deleting user:', error);
    alert('Error checking/deleting user: ' + error.message);
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


        
  
