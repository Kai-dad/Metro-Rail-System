// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin email (hardcoded for redirect check)
const adminEmail = "admin@metrorail.com"; 

let isLogin = true;

// DOM Elements
const formTitle = document.getElementById("form-title");
const usernameField = document.getElementById("username-field");
const toggleLink = document.getElementById("toggle-link");
const submitBtn = document.getElementById("submit-btn");
const message = document.getElementById("message");
const authForm = document.getElementById("auth-form");

// Toggle between Login/Register
toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;

  if (isLogin) {
    formTitle.textContent = "Login";
    usernameField.style.display = "none";
    submitBtn.textContent = "Login";
    toggleLink.textContent = "Register";
    document.getElementById("toggle-text").firstChild.textContent = "Don't have an account? ";
  } else {
    formTitle.textContent = "Register";
    usernameField.style.display = "block";
    submitBtn.textContent = "Register";
    toggleLink.textContent = "Login";
    document.getElementById("toggle-text").firstChild.textContent = "Already have an account? ";
  }
});

// Handle Login / Register
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  message.textContent = "";
  message.style.color = "green";

  try {
    if (isLogin) {
      // 🔑 Login user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInEmail = userCredential.user.email;

      message.textContent = `Welcome back, ${loggedInEmail}`;

      // Redirect based on role
      if (loggedInEmail.toLowerCase() === adminEmail.toLowerCase()) {
        window.location.href = "ADMIN PAGE/index.html";
      } else {
        window.location.href = "index.html";
      }

    } else {
      // 📝 Register new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update displayName if provided
      if (username) {
        await updateProfile(user, { displayName: username });
      }

      // ✅ Save user info into Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: username || user.displayName || "",
        createdAt: serverTimestamp()
      });

      message.textContent = `Account created for ${user.email}`;
    }

    // Reset form after action
    authForm.reset();

  } catch (err) {
    message.style.color = "red";
    message.textContent = err.message;
  }
});
