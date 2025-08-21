const defaultSettings = {
  general: {
    systemName: "Metrorail Admin System",
    timezone: "(UTC+00:00) London",
    dateFormat: "DD/MM/YYYY",
    autoUpdates: true
  },
  security: {
    sessionTimeout: 30,
    loginAttempts: 5,
    passwordExpiry: 90,
    passwordRequirements: [
      { selector: '#security input[type="checkbox"]:nth-child(1)', value: true },
      { selector: '#security input[type="checkbox"]:nth-child(2)', value: true },
      { selector: '#security input[type="checkbox"]:nth-child(3)', value: true },
      { selector: '#security input[type="checkbox"]:nth-child(4)', value: false }
    ]
  },
  notifications: {
    checkboxes: [
      { selector: '#notifications input[type="checkbox"]:nth-child(1)', value: true },
      { selector: '#notifications input[type="checkbox"]:nth-child(2)', value: true },
      { selector: '#notifications input[type="checkbox"]:nth-child(3)', value: false },
      { selector: '#notifications input[type="checkbox"]:nth-child(4)', value: true }
    ],
    alertEmail: "alerts@metrorail.example.com",
    notificationSound: "Default"
  }
};


function openTab(tabId) {

  const tabContents = document.getElementsByClassName('tab-content');
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove('active');
  }
  
  const tabButtons = document.getElementsByClassName('tab-btn');
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove('active');
  }
  
  // Show the selected tab content and mark button as active
  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
}


function resetForm(tabId) {
  if (!confirm('Are you sure you want to reset these settings to defaults?')) {
    return;
  }

  const defaults = defaultSettings[tabId];
  
  switch(tabId) {
    case 'general':
      document.getElementById('system-name').value = defaults.systemName;
      document.getElementById('timezone').value = defaults.timezone;
      document.getElementById('date-format').value = defaults.dateFormat;
      document.getElementById('auto-updates').checked = defaults.autoUpdates;
      // Trigger change event to update toggle UI
      document.getElementById('auto-updates').dispatchEvent(new Event('change'));
      break;
      
    case 'security':
      document.getElementById('session-timeout').value = defaults.sessionTimeout;
      document.getElementById('login-attempts').value = defaults.loginAttempts;
      document.getElementById('password-expiry').value = defaults.passwordExpiry;
      

      const securityCheckboxes = document.querySelectorAll('#security input[type="checkbox"]');
      defaults.passwordRequirements.forEach((req, index) => {
        securityCheckboxes[index].checked = req.value;
      });
      break;
      
    case 'notifications':
      // Reset all checkboxes in notifications tab
      const notificationCheckboxes = document.querySelectorAll('#notifications input[type="checkbox"]');
      defaults.checkboxes.forEach((checkbox, index) => {
        notificationCheckboxes[index].checked = checkbox.value;
      });
      
      document.getElementById('alert-email').value = defaults.alertEmail;
      document.getElementById('notification-sound').value = defaults.notificationSound;
      break;
  }
  
  showToast(`${tabId.charAt(0).toUpperCase() + tabId.slice(1)} settings reset to defaults`);
}

function showToast(message) {

  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
  // Form submission handlers
  document.querySelectorAll('.settings-form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      showToast('Settings saved successfully!');
    });
  });

  document.querySelectorAll('.btn-secondary').forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.closest('.tab-content').id;
      resetForm(tabId);
    });
  });
  

  if (!document.querySelector('.tab-content.active')) {
    document.querySelector('.tab-btn').click();
  }
});

function saveSetting(key, value) {
  console.log(`Saving ${key}: ${value}`);
}
