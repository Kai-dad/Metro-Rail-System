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
const manageTrainsBtn = document.getElementById('manageTrainsBtn');
const actionModal = document.getElementById('actionModal');
const closeModalBtn = document.querySelector('.close-modal');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addTrainForm = document.getElementById('addTrainForm');
const delayTrainForm = document.getElementById('delayTrainForm');
const cancelTrainForm = document.getElementById('cancelTrainForm');
const trainToDelaySelect = document.getElementById('trainToDelay');
const trainToCancelSelect = document.getElementById('trainToCancel');
const scheduleTableBody = document.getElementById('scheduleTableBody');
const routeFilter = document.getElementById('routeFilter');

// Initialize admin panel
function initAdminPanel() {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      setupEventListeners();
      loadTrainSchedules();
    }
  });
}

// Set up event listeners
function setupEventListeners() {
  // Modal controls
  manageTrainsBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  
  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Form submissions
  addTrainForm.addEventListener('submit', handleAddTrain);
  delayTrainForm.addEventListener('submit', handleDelayTrain);
  cancelTrainForm.addEventListener('submit', handleCancelTrain);
  
  // Route filter
  routeFilter.addEventListener('change', loadTrainSchedules);
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => window.location.href = 'login.html');
  });
}

// Modal functions
function openModal() {
  actionModal.style.display = 'flex';
  loadActiveTrains();
}

function closeModal() {
  actionModal.style.display = 'none';
}

// Tab switching
function switchTab(tabName) {
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Load active trains for delay/cancel dropdowns
function loadActiveTrains() {
  db.collection('trainSchedules')
    .where('status', '==', 'On Time')
    .get()
    .then(querySnapshot => {
      trainToDelaySelect.innerHTML = '<option value="">-- Select Train --</option>';
      trainToCancelSelect.innerHTML = '<option value="">-- Select Train --</option>';
      
      querySnapshot.forEach(doc => {
        const train = doc.data();
        const option = `<option value="${doc.id}">
          ${train.trainNumber} (${train.route}) - Dep: ${train.departure}
        </option>`;
        
        trainToDelaySelect.innerHTML += option;
        trainToCancelSelect.innerHTML += option;
      });
    });
}

// Load all train schedules for table
function loadTrainSchedules() {
  let query = db.collection('trainSchedules');
  
  if (routeFilter.value !== 'all') {
    query = query.where('route', '==', routeFilter.value);
  }
  
  query.orderBy('departure').onSnapshot(snapshot => {
    scheduleTableBody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const train = doc.data();
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${train.trainNumber}</td>
        <td>${formatRouteName(train.route)}</td>
        <td>${train.departure}</td>
        <td>${train.arrival}</td>
        <td class="status-${train.status.replace(' ', '-')}">${train.status}</td>
        <td class="actions">
          <button class="btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
        </td>
      `;
      
      scheduleTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const trainId = e.currentTarget.dataset.id;
        editTrain(trainId);
      });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const trainId = e.currentTarget.dataset.id;
        deleteTrain(trainId);
      });
    });
  });
}

// Format route name for display
function formatRouteName(routeKey) {
  const routeNames = {
    'saulsville-pretoria': 'Saulsville → Pretoria',
    'pretoria-saulsville': 'Pretoria → Saulsville',
    'dewildt-pretoria': 'De Wildt → Pretoria',
    'pretoria-dewildt': 'Pretoria → De Wildt'
  };
  return routeNames[routeKey] || routeKey;
}

// Add new train
function handleAddTrain(e) {
  e.preventDefault();
  
  const trainData = {
    trainNumber: addTrainForm.trainNumber.value.trim(),
    route: addTrainForm.trainRoute.value,
    departure: addTrainForm.departureTime.value,
    arrival: addTrainForm.arrivalTime.value,
    status: 'On Time',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('trainSchedules').add(trainData)
    .then(() => {
      alert('Train added successfully!');
      addTrainForm.reset();
      closeModal();
    })
    .catch(error => {
      alert('Error adding train: ' + error.message);
    });
}

// Delay a train
function handleDelayTrain(e) {
  e.preventDefault();
  
  const trainId = delayTrainForm.trainToDelay.value;
  const minutes = parseInt(delayTrainForm.delayMinutes.value);
  const reason = delayTrainForm.delayReason.value.trim();
  
  if (!trainId) {
    alert('Please select a train to delay');
    return;
  }
  
  const trainRef = db.collection('trainSchedules').doc(trainId);
  
  db.runTransaction(transaction => {
    return transaction.get(trainRef).then(doc => {
      if (!doc.exists) {
        throw new Error('Train not found');
      }
      
      const train = doc.data();
      const newDeparture = addMinutes(train.departure, minutes);
      
      transaction.update(trainRef, {
        departure: newDeparture,
        status: `Delayed by ${minutes} min`,
        delayReason: reason || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
  })
  .then(() => {
    alert('Train delayed successfully');
    delayTrainForm.reset();
    closeModal();
  })
  .catch(error => {
    alert('Error delaying train: ' + error.message);
  });
}

// Cancel a train
function handleCancelTrain(e) {
  e.preventDefault();
  
  const trainId = cancelTrainForm.trainToCancel.value;
  const reason = cancelTrainForm.cancelReason.value.trim();
  
  if (!trainId) {
    alert('Please select a train to cancel');
    return;
  }
  
  if (!confirm('Are you sure you want to cancel this train?')) {
    return;
  }
  
  db.collection('trainSchedules').doc(trainId).update({
    status: 'Cancelled',
    cancellationReason: reason || null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert('Train cancelled successfully');
    cancelTrainForm.reset();
    closeModal();
  })
  .catch(error => {
    alert('Error cancelling train: ' + error.message);
  });
}

// Edit train (opens modal with train data)
function editTrain(trainId) {
  db.collection('trainSchedules').doc(trainId).get()
    .then(doc => {
      if (doc.exists) {
        const train = doc.data();
        addTrainForm.trainNumber.value = train.trainNumber;
        addTrainForm.trainRoute.value = train.route;
        addTrainForm.departureTime.value = train.departure;
        addTrainForm.arrivalTime.value = train.arrival;
        document.getElementById('editTrainId').value = doc.id;
        switchTab('add');
        openModal();
      }
    });
}

// Delete train
function deleteTrain(trainId) {
  if (confirm('Are you sure you want to delete this train schedule?')) {
    db.collection('trainSchedules').doc(trainId).delete()
      .then(() => {
        alert('Train schedule deleted successfully');
      })
      .catch(error => {
        alert('Error deleting train: ' + error.message);
      });
  }
}

// Helper function to add minutes to time string
function addMinutes(timeString, minutes) {
  const [hours, mins] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Initialize the admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPanel);
