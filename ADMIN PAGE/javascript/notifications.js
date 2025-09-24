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

document.addEventListener('DOMContentLoaded', function() {
  const notificationsList = document.querySelector('.notifications-list');
  const filterSelect = document.getElementById('notification-filter');
  const modal = document.getElementById('notification-modal');
  const newNotificationBtn = document.getElementById('new-notification-btn');
  const closeModalBtn = document.querySelector('.close-modal');
  const closeModalBtn2 = document.querySelector('.close-modal-btn');
  const notificationForm = document.getElementById('notification-form');
  const addLineBtn = document.getElementById('add-line-btn');
  const lineSelect = document.getElementById('line-select');
  const selectedLinesDiv = document.getElementById('selected-lines');

  let notifications = [];
  let selectedLines = [];

  // Load notifications from Firebase
  function loadNotificationsFromFirebase() {
    db.collection("notifications")
      .orderBy("timestamp", "desc")
      .get()
      .then((querySnapshot) => {
        notifications = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            type: data.type || 'delay',
            title: data.title || 'No Title',
            message: data.message || 'No Message',
            lines: data.lines || [],
            channels: data.channels || ['app'],
            urgency: data.urgency || 'normal',
            time: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
            read: false
          });
        });
        renderNotifications(filterSelect.value);
      })
      .catch((error) => {
        console.error("Error loading notifications: ", error);
        // Fallback to sample data if Firebase fails
        loadSampleNotifications();
      });
  }

  // Sample data fallback
  function loadSampleNotifications() {
    notifications = [
      {
        id: 1,
        type: 'delay',
        title: 'Red Line Delay',
        message: '15-minute delay due to signal problems between Central and North Stations',
        lines: ['red'],
        channels: ['app', 'display'],
        urgency: 'high',
        time: new Date().toISOString(),
        read: false
      }
    ];
    renderNotifications(filterSelect.value);
  }

  // Render notifications
  function renderNotifications(filter = 'all') {
    notificationsList.innerHTML = '';
    
    let filteredNotifications = [...notifications];
    
    if (filter === 'unread') {
      filteredNotifications = notifications.filter(n => !n.read);
    } else if (filter === 'urgent') {
      filteredNotifications = notifications.filter(n => n.urgency === 'high' || n.urgency === 'critical');
    } else if (filter === 'scheduled') {
      filteredNotifications = notifications.filter(n => n.type === 'maintenance');
    }
    
    if (filteredNotifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="empty-state">
          <h3>No notifications found</h3>
          <p>There are no notifications matching your criteria</p>
        </div>
      `;
      return;
    }
    
    filteredNotifications.forEach(notification => {
      const notificationCard = document.createElement('div');
      notificationCard.className = `notification-card ${notification.urgency}`;
      
      const badgeClass = notification.type;
      const formattedTime = new Date(notification.time).toLocaleString();
      
      notificationCard.innerHTML = `
        <div class="notification-header">
          <span class="notification-badge ${badgeClass}">${notification.type.toUpperCase()}</span>
          <span class="notification-time">${formattedTime}</span>
        </div>
        <h3>${notification.title}</h3>
        <p>${notification.message}</p>
        <div class="notification-footer">
          <span class="notification-lines">Lines: ${notification.lines.join(', ')}</span>
          <span class="notification-channels">Urgency: ${notification.urgency}</span>
          <button class="btn-small mark-read-btn" data-id="${notification.id}">
            ${notification.read ? 'Mark Unread' : 'Mark Read'}
          </button>
        </div>
      `;
      
      notificationsList.appendChild(notificationCard);
    });
    
    // Add event listeners to mark-read buttons
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        const notification = notifications.find(n => n.id === id);
        if (notification) {
          notification.read = !notification.read;
          renderNotifications(filterSelect.value);
        }
      });
    });
  }

  // Modal Controls
  newNotificationBtn.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    resetForm();
  });

  closeModalBtn2.addEventListener('click', () => {
    modal.style.display = 'none';
    resetForm();
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      resetForm();
    }
  });

  // Add Line Functionality
  addLineBtn.addEventListener('click', () => {
    const selectedLine = lineSelect.value;
    if (selectedLine && !selectedLines.includes(selectedLine)) {
      selectedLines.push(selectedLine);
      updateSelectedLinesDisplay();
    }
  });

  function updateSelectedLinesDisplay() {
    selectedLinesDiv.innerHTML = '';
    selectedLines.forEach(line => {
      const lineTag = document.createElement('div');
      lineTag.className = 'line-tag';
      lineTag.innerHTML = `
        ${line.charAt(0).toUpperCase() + line.slice(1)} Line
        <span class="remove-line" data-line="${line}">×</span>
      `;
      selectedLinesDiv.appendChild(lineTag);
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-line').forEach(button => {
      button.addEventListener('click', (e) => {
        const lineToRemove = e.target.getAttribute('data-line');
        selectedLines = selectedLines.filter(line => line !== lineToRemove);
        updateSelectedLinesDisplay();
      });
    });
  }

  // Reset form function
  function resetForm() {
    notificationForm.reset();
    selectedLines = [];
    selectedLinesDiv.innerHTML = '';
  }

  // SINGLE Form Submission Handler - This is the correct one
  notificationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const type = document.getElementById('notification-type').value;
    const title = document.getElementById('notification-title').value;
    const message = document.getElementById('notification-message').value;
    const urgency = document.querySelector('input[name="urgency"]:checked').value;
    
    // Get selected channels
    const channelCheckboxes = document.querySelectorAll('input[name="channels"]:checked');
    const channels = Array.from(channelCheckboxes).map(cb => cb.value);
    
    // If no lines selected, assume all lines are affected
    const linesToSend = selectedLines.length > 0 ? selectedLines : ['red', 'blue', 'green'];

    console.log('Sending to Firebase:', { type, title, message, urgency, lines: linesToSend, channels });

    // Save to Firestore
    db.collection("notifications").add({
      type: type,
      title: title,
      message: message,
      lines: linesToSend,
      channels: channels,
      urgency: urgency,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    })
    .then((docRef) => {
      console.log("Notification sent with ID: ", docRef.id);
      alert('Notification sent successfully to Firebase!');
      
      // Close modal and reset form
      modal.style.display = 'none';
      resetForm();
      
      // Reload notifications from Firebase to show the new one
      loadNotificationsFromFirebase();
    })
    .catch((error) => {
      console.error("Error sending notification: ", error);
      alert('Error sending notification. Please check console for details.');
    });
  });

  // Filter change
  filterSelect.addEventListener('change', () => {
    renderNotifications(filterSelect.value);
  });

  // Initial load
  loadNotificationsFromFirebase();
});
