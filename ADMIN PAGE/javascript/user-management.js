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

// Function to update user's last sign-in time in Firestore
async function updateUserLastSignIn(user) {
  try {
    const userRef = db.collection("users").doc(user.uid);
    const doc = await userRef.get();

    const now = new Date();
    
    if (!doc.exists) {
      // Create new user document if it doesn't exist
      await userRef.set({
        email: user.email,
        displayName: user.displayName || user.email,
        createdAt: now,
        lastSignInTime: now,
        isOnline: true
      });
      console.log('New user document created for:', user.email);
    } else {
      // Update existing user document with new sign-in time
      await userRef.update({
        lastSignInTime: now,
        isOnline: true
      });
      console.log('User sign-in time updated for:', user.email);
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
      showConnectionStatus('✅ AUTHENTICATED - UPDATING USER STATUS...', 'connected');
      
      // Update the user's last sign-in time immediately
      await updateUserLastSignIn(user);
      
      // Then fetch all users
      fetchUsers();
    } else {
      // Not authenticated, redirect to login
      showConnectionStatus('🔒 AUTHENTICATION REQUIRED - REDIRECTING TO LOGIN...', 'warning');
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
      usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">LOADING USERS...</td></tr>';
    }
    
    const snapshot = await db.collection('users').orderBy('lastSignInTime', 'desc').get();
    users = [];
    
    if (snapshot.empty) {
      if (usersTableBody) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">NO USERS FOUND IN DATABASE</td></tr>';
      }
      showConnectionStatus('✅ CONNECTED - NO USERS FOUND', 'connected');
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
    showConnectionStatus(`✅ CONNECTED - LOADED ${users.length} USERS`, 'connected');
    if (searchInput) searchInput.disabled = false;
  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (usersTableBody) {
      if (error.code === 'permission-denied') {
        usersTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="error">
              🔐 FIREBASE PERMISSION ERROR: UNABLE TO LOAD USERS DUE TO SECURITY RULES
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
              <button class="retry-btn" onclick="fetchUsers()">RETRY CONNECTION</button>
            </td>
          </tr>
        `;
        showConnectionStatus('❌ PERMISSION DENIED - CHECK FIREBASE RULES', 'error');
      } else if (error.code === 'unauthenticated') {
        showConnectionStatus('🔒 AUTHENTICATION REQUIRED - PLEASE LOGIN AGAIN', 'warning');
        setTimeout(() => {
          if (auth) auth.signOut();
          window.location.href = '../login.html';
        }, 2000);
      } else {
        usersTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="error">
              ERROR LOADING USERS: ${error.message}
              <br>
              <button class="retry-btn" onclick="fetchUsers()">RETRY CONNECTION</button>
            </td>
          </tr>
        `;
        showConnectionStatus('❌ CONNECTION ERROR: ' + error.message, 'error');
      }
    }
    
    if (searchInput) searchInput.disabled = true;
  }
}

// Function to check if user is active
function isUserActive(user) {
  // If this is the currently logged-in user, they are definitely active
  if (currentUser && user.id === currentUser.uid) {
    return true;
  }
  
  // For other users, check last sign-in time (within last 30 days)
  if (!user.lastSignInTime) {
    return false;
  }
  
  try {
    const lastSignIn = user.lastSignInTime.toDate ? user.lastSignInTime.toDate() : new Date(user.lastSignInTime);
    const now = new Date();
    const diffDays = Math.floor((now - lastSignIn) / (1000 * 60 * 60 * 24));
    const isActive = diffDays <= 30;
    
    console.log(`User ${user.email}: lastSignIn=${lastSignIn}, diffDays=${diffDays}, active=${isActive}`);
    return isActive;
  } catch (e) {
    console.error('Error checking user activity:', e, user);
    return false;
  }
}

// Function to get user status text and type
function getUserStatus(user) {
  const isCurrentUser = currentUser && user.id === currentUser.uid;
  const isActive = isUserActive(user);
  
  if (isCurrentUser) {
    return { text: 'CURRENT USER', type: 'current' };
  } else if (isActive) {
    return { text: 'ACTIVE', type: 'active' };
  } else {
    return { text: 'INACTIVE', type: 'inactive' };
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

    let createdAt = 'N/A';
    if (user.createdAt) {
      try {
        const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        createdAt = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        });
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }

    let lastSignIn = 'Never';
    if (user.lastSignInTime) {
      try {
        const date = user.lastSignInTime.toDate ? user.lastSignInTime.toDate() : new Date(user.lastSignInTime);
        lastSignIn = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        console.error('Error formatting last sign-in date:', e);
      }
    }

    const status = getUserStatus(user);
    const statusBadge = `<span class="status-badge status-${status.type}">${status.text}</span>`;

    const displayName = user.displayName || user.email || 'N/A';
    const email = user.email || 'N/A';

    row.innerHTML = `
      <td class="user-id">${user.id.substring(0, 10)}...</td>
      <td><strong>${email}</strong></td>
      <td>${displayName}</td>
      <td>${createdAt}</td>
      <td>${lastSignIn}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="check-btn" onclick="checkAndDeleteUser('${user.id}', '${email}')">
          CHECK / DELETE
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
    // Prevent deleting current user
    if (currentUser && uid === currentUser.uid) {
      alert('CANNOT DELETE YOUR OWN ACCOUNT WHILE LOGGED IN');
      return;
    }

    // Fetch user metadata
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      alert(`USER ${email} NOT FOUND IN DATABASE`);
      return;
    }

    const userData = userDoc.data();
    const isActive = isUserActive(userData);

    if (!isActive) {
      const confirmDelete = confirm(`USER ${email} IS INACTIVE. DELETE THIS USER?`);
      if (confirmDelete) {
        await db.collection('users').doc(uid).delete();
        alert(`USER ${email} DELETED SUCCESSFULLY`);
        fetchUsers(); // refresh the table
      }
    } else {
      alert(`USER ${email} IS ACTIVE - CANNOT DELETE ACTIVE USERS`);
    }
  } catch (error) {
    console.error('Error checking/deleting user:', error);
    alert('ERROR: ' + error.message);
  }
}

// Function to handle logout
function handleLogout() {
  if (confirm('CONFIRM LOGOUT?')) {
    if (auth) {
      // Update user status to offline before signing out
      if (currentUser) {
        db.collection("users").doc(currentUser.uid).update({
          isOnline: false,
          lastSignOutTime: new Date()
        }).catch(error => {
          console.error('Error updating logout status:', error);
        });
      }
      
      auth.signOut().then(() => {
        window.location.href = '../login.html';
      }).catch((error) => {
        console.error('Error signing out:', error);
        alert('LOGOUT ERROR: ' + error.message);
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

// Export functions to global scope for retry button
window.fetchUsers = fetchUsers;
window.checkAndDeleteUser = checkAndDeleteUser;
window.handleLogout = handleLogout;
