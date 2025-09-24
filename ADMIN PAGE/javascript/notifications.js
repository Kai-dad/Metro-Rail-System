document.addEventListener('DOMContentLoaded', function() {
  
  const notifications = [
    {
      id: 1,
      type: 'delay',
      title: 'Red Line Delay',
      message: '15-minute delay due to signal problems between Central and North Stations',
      lines: ['Red'],
      channels: ['app', 'display'],
      urgency: 'high',
      time: '2023-11-20T08:15:00',
      read: false
    },
    {
      id: 2,
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      message: 'Blue Line will be closed from 10PM to 2AM for track maintenance',
      lines: ['Blue'],
      channels: ['app', 'email', 'display'],
      urgency: 'normal',
      time: '2023-11-19T16:30:00',
      read: true
    },
    {
      id: 3,
      type: 'alert',
      title: 'Security Alert',
      message: 'Suspicious package reported at Downtown Station. Police investigating.',
      lines: ['Red', 'Green'],
      channels: ['app', 'sms'],
      urgency: 'critical',
      time: '2023-11-18T14:05:00',
      read: false
    }
  ];

  
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
          <span class="notification-channels">Sent via: ${notification.channels.join(', ')}</span>
          <button class="btn-small mark-read-btn" data-id="${notification.id}">
            ${notification.read ? 'Mark Unread' : 'Mark Read'}
          </button>
        </div>
      `;
      
      notificationsList.appendChild(notificationCard);
    });
    
    // mark-read buttons
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.getAttribute('data-id'));
        const notification = notifications.find(n => n.id === id);
        if (notification) {
          notification.read = !notification.read;
          renderNotifications(filterSelect.value);
        }
      });
    });
  }

  
  newNotificationBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
  });

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  });

  closeModalBtn2.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
  });

  
  addLineBtn.addEventListener('click', () => {
    const line = lineSelect.options[lineSelect.selectedIndex].text;
    const value = lineSelect.value;
    
    if (!document.querySelector(`.selected-train[data-value="${value}"]`)) {
      const lineElement = document.createElement('div');
      lineElement.className = 'selected-train';
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

  // Submission Form
  
  notificationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const selectedLineElements = document.querySelectorAll('.selected-train');
    const lines = Array.from(selectedLineElements).map(el => el.textContent.trim().replace('×', ''));
    
    const channels = Array.from(document.querySelectorAll('input[name="channels"]:checked'))
      .map(checkbox => checkbox.value);
    
    const urgency = document.querySelector('input[name="urgency"]:checked').value;
    
    const newNotification = {
      id: notifications.length + 1,
      type: document.getElementById('notification-type').value,
      title: document.getElementById('notification-title').value,
      message: document.getElementById('notification-message').value,
      lines,
      channels,
      urgency,
      time: new Date().toISOString(),
      read: false
    };
    
    notifications.unshift(newNotification);
    renderNotifications(filterSelect.value);
    
    
    notificationForm.reset();
    selectedLines.innerHTML = '';
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    
    
    alert('Notification sent successfully!');
  });

  
  filterSelect.addEventListener('change', () => {
    renderNotifications(filterSelect.value);
  });

  
  renderNotifications();

});






// In the admin page's notifications.js
document.getElementById('notification-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Get form values
  const type = document.getElementById('notification-type').value;
  const title = document.getElementById('notification-title').value;
  const message = document.getElementById('notification-message').value;
  const urgency = document.querySelector('input[name="urgency"]:checked').value;
  
  // Get selected lines
  const lines = Array.from(document.querySelectorAll('#selected-lines .line-tag'))
    .map(tag => tag.dataset.value);
  
  // Save to Firestore
  db.collection("notifications").add({
    type,
    title,
    message,
    lines,
    urgency,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert('Notification sent successfully!');
    // Close modal and reset form
    document.getElementById('notification-modal').style.display = 'none';
    document.getElementById('notification-form').reset();
  })
  .catch((error) => {
    console.error("Error sending notification: ", error);
    alert('Error sending notification. Please try again.');
  });
});
