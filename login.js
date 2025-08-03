document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const optionsContainer = document.querySelector('.login-options');
    const formsContainer = document.querySelector('.login-forms');
    const userLoginCard = document.getElementById('userLoginCard');
    const adminLoginCard = document.getElementById('adminLoginCard');
    const registerCard = document.getElementById('registerCard');
    const userLoginForm = document.getElementById('userLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const registerForm = document.getElementById('registerForm');
    const backButtons = document.querySelectorAll('.back-to-options');
    const switchToLogin = document.querySelector('.switch-to-login');

    // Show login options
    function showOptions() {
        optionsContainer.style.display = 'grid';
        formsContainer.style.display = 'none';
    }

    // Show specific form
    function showForm(form) {
        optionsContainer.style.display = 'none';
        formsContainer.style.display = 'block';
        document.querySelectorAll('.login-form').forEach(f => f.style.display = 'none');
        form.style.display = 'block';
    }

    // Event Listeners for option cards
    userLoginCard.addEventListener('click', function() {
        showForm(userLoginForm);
    });

    adminLoginCard.addEventListener('click', function() {
        showForm(adminLoginForm);
    });

    registerCard.addEventListener('click', function() {
        showForm(registerForm);
    });

    // Back to options buttons
    backButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            showOptions();
        });
    });

    // Switch to login from register
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            showForm(userLoginForm);
        });
    }

    // User login form submission
    userLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('user-username').value;
        const password = document.getElementById('user-password').value;
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            alert('Login successful!');
            window.location.href = 'index.html';
        } else {
            alert('Invalid username or password');
        }
    });

    // Admin login form submission
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        // In a real app, this would check against server-side admin credentials
        if (username === 'admin' && password === 'metrorail123') {
            localStorage.setItem('adminAuth', 'true');
            alert('Admin login successful!');
            window.location.href = 'admin.html';
        } else {
            alert('Invalid admin credentials');
        }
    });

    // Registration form submission
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;
        
        // Validation
        if (password !== confirm) {
            alert('Passwords do not match');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.some(u => u.username === username)) {
            alert('Username already exists');
            return;
        }
        
        if (users.some(u => u.email === email)) {
            alert('Email already registered');
            return;
        }
        
        // Create new user
        users.push({
            name,
            email,
            username,
            password
        });
        
        localStorage.setItem('users', JSON.stringify(users));
        alert('Registration successful! Please login.');
        showForm(userLoginForm);
        registerForm.reset();
    });

    // Initialize date/time display
    function updateDateTime() {
        const now = new Date();
        const options = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
        document.getElementById('currentYear').textContent = now.getFullYear();
    }
    
    updateDateTime();
});