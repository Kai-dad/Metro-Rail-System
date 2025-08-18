// Initialize Firebase
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
const database = firebase.database();
const auth = firebase.auth();

// Reference to the train schedules in Firebase
const trainsRef = database.ref('trainSchedules');

// DOM elements
const scheduleTableBody = document.getElementById('scheduleTableBody');
const trainForm = document.getElementById('trainForm');
const addTrainBtn = document.getElementById('addTrainBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const trainFormContainer = document.getElementById('trainFormContainer');
const routeFilter = document.getElementById('routeFilter');

// Current editing state
let isEditing = false;
let currentEditId = null;

// Initialize the admin interface
function initAdminSchedule() {
  // Load all train schedules
  loadTrainSchedules();
  
  // Set up event listeners
  addTrainBtn.addEventListener('click', showAddTrainForm);
  cancelFormBtn.addEventListener('click', hideTrainForm);
  trainForm.addEventListener('submit', handleFormSubmit);
  routeFilter.addEventListener('change', filterSchedules);
  
  // Check auth state
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'login.html';
    }
  });
  
  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    });
  });
}

// Load train schedules from Firebase
function loadTrainSchedules() {
  trainsRef.on('value', (snapshot) => {
    const trains = snapshot.val() || {};
    renderTrainSchedules(trains);
  });
}

// Render train schedules to the table
function renderTrainSchedules(trains) {
  scheduleTableBody.innerHTML = '';
  
  Object.entries(trains).forEach(([id, train]) => {
    const routeInfo = getRouteInfo(train.route);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${train.trainNumber}</td>
      <td>${routeInfo.name}</td>
      <td>${train.departure}</td>
      <td>${train.arrival}</td>
      <td class="status-${train.status.toLowerCase().replace(' ', '-')}">${train.status}</td>
      <td class="actions">
        <button class="btn-edit" data-id="${id}"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" data-id="${id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    scheduleTableBody.appendChild(row);
  });
  
  // Add event listeners to edit/delete buttons
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trainId = e.currentTarget.dataset.id;
      editTrainSchedule(trainId);
    });
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trainId = e.currentTarget.dataset.id;
      deleteTrainSchedule(trainId);
    });
  });
}

// Get route info from the predefined routes
function getRouteInfo(routeKey) {
  const routes = {
    "saulsville-pretoria": {
      name: "Saulsville → Pretoria",
      price: "R5.50"
    },
    "pretoria-saulsville": {
      name: "Pretoria → Saulsville",
      price: "R5.50"
    },
    "dewildt-pretoria": {
      name: "De Wildt → Pretoria",
      price: "R6.80"
    },
    "pretoria-dewildt": {
      name: "Pretoria → De Wildt",
      price: "R7.20"
    }
  };
  
  return routes[routeKey] || { name: routeKey, price: "N/A" };
}

// Show add train form
function showAddTrainForm() {
  isEditing = false;
  currentEditId = null;
  trainForm.reset();
  document.getElementById('editTrainId').value = '';
  trainFormContainer.style.display = 'block';
}

// Hide train form
function hideTrainForm() {
  trainFormContainer.style.display = 'none';
}

// Handle form submission
function handleFormSubmit(e) {
  e.preventDefault();
  
  const trainData = {
    trainNumber: document.getElementById('trainNumber').value,
    route: document.getElementById('trainRoute').value,
    departure: document.getElementById('departureTime').value,
    arrival: document.getElementById('arrivalTime').value,
    status: document.getElementById('trainStatus').value
  };
  
  if (isEditing && currentEditId) {
    // Update existing train
    trainsRef.child(currentEditId).update(trainData)
      .then(() => {
        alert('Train schedule updated successfully!');
        hideTrainForm();
      })
      .catch(error => {
        alert('Error updating train: ' + error.message);
      });
  } else {
    // Add new train
    trainsRef.push(trainData)
      .then(() => {
        alert('Train schedule added successfully!');
        hideTrainForm();
      })
      .catch(error => {
        alert('Error adding train: ' + error.message);
      });
  }
}

// Edit train schedule
function editTrainSchedule(trainId) {
  trainsRef.child(trainId).once('value', (snapshot) => {
    const train = snapshot.val();
    if (train) {
      isEditing = true;
      currentEditId = trainId;
      
      document.getElementById('editTrainId').value = trainId;
      document.getElementById('trainNumber').value = train.trainNumber;
      document.getElementById('trainRoute').value = train.route;
      document.getElementById('departureTime').value = train.departure;
      document.getElementById('arrivalTime').value = train.arrival;
      document.getElementById('trainStatus').value = train.status;
      
      trainFormContainer.style.display = 'block';
    }
  });
}

// Delete train schedule
function deleteTrainSchedule(trainId) {
  if (confirm('Are you sure you want to delete this train schedule?')) {
    trainsRef.child(trainId).remove()
      .then(() => {
        alert('Train schedule deleted successfully!');
      })
      .catch(error => {
        alert('Error deleting train: ' + error.message);
      });
  }
}

// Filter schedules by route
function filterSchedules() {
  const selectedRoute = routeFilter.value;
  
  if (selectedRoute === 'all') {
    trainsRef.on('value', (snapshot) => {
      const trains = snapshot.val() || {};
      renderTrainSchedules(trains);
    });
  } else {
    trainsRef.orderByChild('route').equalTo(selectedRoute).on('value', (snapshot) => {
      const trains = snapshot.val() || {};
      renderTrainSchedules(trains);
    });
  }
}

// Initialize the admin interface when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminSchedule);

