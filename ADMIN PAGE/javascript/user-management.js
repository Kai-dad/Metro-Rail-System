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
const addUserBtn = document.getElementById('add-user-btn');
const addUserModal = document.getElementById('add-user-modal');
const editUserModal = document.getElementById('edit-user-modal');
const addUserForm = document.getElementById('add-user-form');
const editUserForm = document.getElementById('edit-user-form');
const closeButtons = document.querySelectorAll('.close');
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
    
    // Test Firebase connection first
    await db.collection('test').doc('test').get();
    
    const snapshot = await db.collection('users').get();
    users = [];
    
    if (snapshot.empty) {
      usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">No users found in the database.</td></tr>';
      showConnectionStatus('Connected successfully, but no users found.', false);
      return;
    }
    
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
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
    
    row.innerHTML = `
      <td>${user.username || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.role || 'user'}</td>
      <td>${createdAt}</td>
      <td>
        <button class="edit" data-id="${user.id}">Edit</button>
        <button class="delete" data-id="${user.id}">Delete</button>
      </td>
    `;
    
    usersTableBody.appendChild(row);
  });
  
  // Add event listeners to edit and delete buttons
  document.querySelectorAll('.edit').forEach(button => {
    button.addEventListener('click', (e) => {
      const userId = e.target.getAttribute('data-id');
      openEditModal(userId);
    });
  });
  
  document.querySelectorAll('.delete').forEach(button => {
    button.addEventListener('click', (e) => {
      const userId = e.target.getAttribute('data-id');
      deleteUser(userId);
    });
  });
}

// Function to search users
function searchUsers() {
  const searchTerm = searchInput.value.toLowerCase();
  
  if (!searchTerm) {
    renderUsers(users);
    return;
  }
  
  const filteredUsers = users.filter(user => 
    (user.username && user.username.toLowerCase().includes(searchTerm)) ||
    (user.email && user.email.toLowerCase().includes(searchTerm))
  );
  
  renderUsers(filteredUsers);
}

// Function to open add user modal
function openAddModal() {
  addUserModal.style.display = 'block';
}

// Function to open edit user modal
function openEditModal(userId) {
  const user = users.find(u => u.id === userId);
  
  if (user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-username').value = user.username || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-role').value = user.role || 'user';
    
    editUserModal.style.display = 'block';
  }
}

// Function to close modals
function closeModals() {
  addUserModal.style.display = 'none';
  editUserModal.style.display = 'none';
}

// Function to add a new user
async function addUser(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  
  try {
    // In a real application, you would use Firebase Auth to create a user
    // This is a simplified version that adds to Firestore directly
    await db.collection('users').add({
      username,
      email,
      role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Reset form and close modal
    addUserForm.reset();
    closeModals();
    
    // Refresh users list
    fetchUsers();
    
    alert('User added successfully!');
  } catch (error) {
    console.error('Error adding user:', error);
    alert('Error adding user. Please try again.');
  }
}

// Function to edit a user
async function editUser(e) {
  e.preventDefault();
  
  const userId = document.getElementById('edit-user-id').value;
  const username = document.getElementById('edit-username').value;
  const email = document.getElementById('edit-email').value;
  const role = document.getElementById('edit-role').value;
  
  try {
    await db.collection('users').doc(userId).update({
      username,
      email,
      role,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Close modal
    closeModals();
    
    // Refresh users list
    fetchUsers();
    
    alert('User updated successfully!');
  } catch (error) {
    console.error('Error updating user:', error);
    alert('Error updating user. Please try again.');
  }
}

// Function to delete a user
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }
  
  try {
    await db.collection('users').doc(userId).delete();
    
    // Refresh users list
    fetchUsers();
    
    alert('User deleted successfully!');
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user. Please try again.');
  }
}

// Function to handle logout
function handleLogout() {
  // In a real application, you would sign out from Firebase Auth here
  alert('Logout functionality would be implemented here');
  // For now, just redirect to login page
  window.location.href = 'login.html';
}

// Event listeners
document.addEventListener('DOMContentLoaded', fetchUsers);
searchInput.addEventListener('input', searchUsers);
addUserBtn.addEventListener('click', openAddModal);
closeButtons.forEach(button => button.addEventListener('click', closeModals));
addUserForm.addEventListener('submit', addUser);
editUserForm.addEventListener('submit', editUser);
logoutBtn.addEventListener('click', handleLogout);

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
  if (e.target === addUserModal) {
    closeModals();
  }
  if (e.target === editUserModal) {
    closeModals();
  }
});

// Export functions to global scope for retry button
window.fetchUsers = fetchUsers;
