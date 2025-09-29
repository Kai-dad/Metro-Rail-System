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


function setupAuthStateListener() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      showConnectionStatus('✅ Authenticated. Loading users...', 'connected');
      updateUserLastSignIn(user.uid); // Update current user's sign-in time
      fetchUsers();
    } else {
      showConnectionStatus('🔒 Authentication required. Redirecting to login...', 'warning');
      setTimeout(() => {
        window.location.href = '../login.html';
      }, 2000);
    }
  });
}

// Update user's last sign-in time
async function updateUserLastSignIn(uid) {
  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.set({
      lastSignInTime: new Date(),
      status: 'active'
    }, { merge: true }); 
    console.log(`Updated lastSignInTime for user ${uid}`);
  } catch (error) {
    console.error('Error updating last sign-in time:', error);
  }
}

// Fix missing last signIn tyme for all users
async function fixUserSignInTimes() {
  try {
    const snapshot = await db.collection('users').get();
    const updates = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      
      if (!userData.lastSignInTime || isInvalidDate(userData.lastSignInTime)) {
        const fixTime = userData.createdAt && !isInvalidDate(userData.createdAt) 
          ? userData.createdAt 
          : new Date();
        
        updates.push(
          db.collection('users').doc(doc.id).set({
            lastSignInTime: fixTime
          }, { merge: true })
        );
      }
    });
    
    await Promise.all(updates);
    console.log(`Fixed sign-in times for ${updates.length} users`);
  } catch (error) {
    console.error('Error fixing sign-in times:', error);
  }
}

// Check if a date is invalid 
function isInvalidDate(timestamp) {
  try {
    const date = convertTimestampToDate(timestamp);
    if (!date) return true;
    
    const now = new Date();
    // If date is more than 1 day in the future, consider it invalid
    return date > new Date(now.getTime() + (24 * 60 * 60 * 1000));
  } catch (e) {
    return true;
  }
}

// this our Converts Firestore timestamp to Date
function convertTimestampToDate(timestamp) {
  if (!timestamp) return null;
  
  try {
    if (timestamp.toDate) {
      return timestamp.toDate();
    } else if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    } else if (timestamp instanceof Date) {
      return timestamp;
    } else {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
  } catch (e) {
    console.error('Error converting timestamp:', e, timestamp);
    return null;
  }
}

// Real-time fetching our users
async function fetchUsers() {
  try {
    if (usersTableBody) {
      usersTableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading users...</td></tr>';
    }
    await fixUserSignInTimes();

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

      console.log('Fetched users with timestamps:', users.map(u => ({
        email: u.email,
        lastSignInTime: u.lastSignInTime,
        createdAt: u.createdAt
      })));
      
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
        const date = convertTimestampToDate(user.createdAt);
        if (date && !isInvalidDate(date)) {
          createdAt = date.toLocaleDateString();
        }
      } catch (e) {
        console.error('Error formatting creation date:', e);
      }
    }

    // Status logic 
    let statusBadge = '';
    const isCurrentUser = currentUser && user.id === currentUser.uid;

    if (isCurrentUser) {
      statusBadge = '<span class="status-badge status-current">Current User</span>';
    } else {
      // Get last sign-in date
      let lastSignInDate = null;
      if (user.lastSignInTime) {
        lastSignInDate = convertTimestampToDate(user.lastSignInTime);
      }
      
      // If no lastSignInTime, try using createdAt
      if (!lastSignInDate && user.createdAt) {
        lastSignInDate = convertTimestampToDate(user.createdAt);
      }

      // Determine status based on available data
      if (lastSignInDate && !isInvalidDate(lastSignInDate)) {
        const now = new Date();
        const diffTime = Math.abs(now - lastSignInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`User ${user.email}: ${diffDays} days since last activity`);
        
        if (diffDays <= 30) {
          statusBadge = '<span class="status-badge status-active">Active</span>';
        } else {
          statusBadge = '<span class="status-badge status-inactive">Inactive</span>';
        }
      } else {
        statusBadge = '<span class="status-badge status-active">Active</span>';
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
        <button class="update-btn" onclick="updateUserSignInTime('${user.id}', '${email}')" style="margin-left: 5px; background-color: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
          Update Sign-in
        </button>
      </td>
    `;

    usersTableBody.appendChild(row);
  });
}

// Manual function to update a user's sign-in time
async function updateUserSignInTime(uid, email) {
  try {
    await updateUserLastSignIn(uid);
    alert(`Updated sign-in time for ${email} to current time.`);
    fetchUsers(); // Refresh the list
  } catch (error) {
    console.error('Error updating sign-in time:', error);
    alert('Error updating sign-in time: ' + error.message);
  }
}

// 4 Searching users
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
    let lastSignInDate = null;
    
    if (userData.lastSignInTime) {
      lastSignInDate = convertTimestampToDate(userData.lastSignInTime);
    }

    let inactive = true;
    if (lastSignInDate && !isInvalidDate(lastSignInDate)) {
      const now = new Date();
      const diffTime = Math.abs(now - lastSignInDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 30) {
        inactive = false;
      }
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

document.addEventListener('DOMContentLoaded', initApp);

// Export functions to global scope
window.fetchUsers = fetchUsers;
window.checkAndDeleteUser = checkAndDeleteUser;
window.searchUsers = searchUsers;
window.renderUsers = renderUsers;
window.updateUserSignInTime = updateUserSignInTime;
