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
  const selectedLines = document.getElementById('selected-lines');

  // Function to render notifications from a given array
  function renderNotifications(data, filter = 'all') {
    notificationsList.innerHTML = '';
    
    let filteredNotifications = [...data];
    
    if (filter === 'unread') {
      filteredNotifications = data.filter(n => !n.read);
    } else if (filter === 'urgent') {
      filteredNotifications = data.filter(n => n.urgency === 'high' || n.urgency === 'critical');
    } else if (filter === 'scheduled') {
      filteredNotifications = data.filter(n => n.type === 'maintenance');
    }
    
    if (filteredNotifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="empty-state">
          <img src="icons/bell-off.svg" class="empty-icon" alt="No notifications">
          <h3>No notifications found</h3>
          <p>There are no notifications matching your criteria</p>
        </div>
      `;
      return;
    }
    
    filteredNotifications.forEach(notification => {
      const notificationCard = document.createElement('div');
      notificationCard.className = `notification-card ${notification.urgency === 'critical' ? 'urgent' :
                                   notification.type === 'maintenance' ? 'scheduled' : ''}`;
      
      const badgeClass = {
        delay: 'delay',
        cancellation: 'cancellation',
        alert: 'alert',
        maintenance: 'maintenance'
      }[notification.type];
      
      const formattedTime = notification.timestamp ? new Date(notification.timestamp.toDate()).toLocaleString() : 'N/A';
      
      notificationCard.innerHTML = `
        <div class="notification-header">
          <span class="notification-badge ${badgeClass}">${notification.type.toUpperCase()}</span>
          <span class="notification-time">${formattedTime}</span>
        </div>
        <h3>${notification.title}</h3>
        <p>${notification.message}</p>
        <div class="notification-footer">
          <span class="notification-lines">Lines: ${notification.lines.join(', ')}</span>
          <span class="notification-channels">Sent via: ${notification.channels.join(', ')}</span>
          <button class="btn-small mark-read-btn" data-id="${notification.id}">
            ${notification.read ? 'Mark Unread' : 'Mark Read'}
          </button>
        </div>
      `;
      
      notificationsList.appendChild(notificationCard);
    });
    
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        db.collection("notifications").doc(id).update({
          read: !btn.innerText.includes('Unread')
        }).then(() => {
          console.log("Document successfully updated!");
        }).catch((error) => {
          console.error("Error updating document: ", error);
        });
      });
    });
  }

  // Real-time listener for Firestore collection
  db.collection("notifications").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    renderNotifications(notifications, filterSelect.value);
  }, (error) => {
    console.error("Error fetching notifications: ", error);
  });

  // Event listeners for modal and form
  newNotificationBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
  });

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    notificationForm.reset();
    selectedLines.innerHTML = '';
  });

  closeModalBtn2.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    notificationForm.reset();
    selectedLines.innerHTML = '';
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      notificationForm.reset();
      selectedLines.innerHTML = '';
    }
  });

  // Add line to form
  addLineBtn.addEventListener('click', () => {
    const line = lineSelect.options[lineSelect.selectedIndex].text;
    const value = lineSelect.value;
    
    if (!document.querySelector(`.selected-item[data-value="${value}"]`)) {
      const lineElement = document.createElement('div');
      lineElement.className = 'selected-item line-tag';
      lineElement.setAttribute('data-value', value);
      lineElement.innerHTML = `
        ${line}
        <button type="button" class="remove-line-btn">&times;</button>
      `;
      selectedLines.appendChild(lineElement);
      
      lineElement.querySelector('.remove-line-btn').addEventListener('click', () => {
        lineElement.remove();
      });
    }
  });

  // Form submission to Firebase
  notificationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const selectedLineElements = document.querySelectorAll('.selected-item');
    const lines = Array.from(selectedLineElements).map(el => el.getAttribute('data-value'));
    
    const channels = Array.from(document.querySelectorAll('input[name="channels"]:checked'))
      .map(checkbox => checkbox.value);
    
    const urgency = document.querySelector('input[name="urgency"]:checked').value;
    
    db.collection("notifications").add({
      type: document.getElementById('notification-type').value,
      title: document.getElementById('notification-title').value,
      message: document.getElementById('notification-message').value,
      lines,
      channels,
      urgency,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    })
    .then(() => {
      alert('Notification sent successfully!');
      notificationForm.reset();
      selectedLines.innerHTML = '';
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    })
    .catch((error) => {
      console.error("Error sending notification: ", error);
      alert('Error sending notification. Please try again.');
    });
  });

  // Filter change listener
  filterSelect.addEventListener('change', () => {
    // The onSnapshot listener handles rendering automatically when data changes,
    // so we just need to re-render with the new filter.
    // We can fetch data again or use a local cache if we had one.
    db.collection("notifications").orderBy("timestamp", "desc").get().then((querySnapshot) => {
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      renderNotifications(notifications, filterSelect.value);
    });
  });
});

