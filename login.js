import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyADfkLMNqakJ7oe_17JD7yHT2vsAWTmSfs",
  authDomain: "login-tester-bbcd4.firebaseapp.com",
  projectId: "login-tester-bbcd4",
  storageBucket: "login-tester-bbcd4.firebasestorage.app",
  messagingSenderId: "269641711240",
  appId: "1:269641711240:web:f7ceb8893f1c54d44fe93d"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


const adminEmail = "admin@metrorail.com"; 

let isLogin = true;

const formTitle = document.getElementById("form-title");
const usernameField = document.getElementById("username-field");
const toggleLink = document.getElementById("toggle-link");
const submitBtn = document.getElementById("submit-btn");
const message = document.getElementById("message");
const authForm = document.getElementById("auth-form");

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

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  message.textContent = "";
  message.style.color = "green";

  try {
    if (isLogin) {
     
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInEmail = userCredential.user.email;

      message.textContent = `Welcome back, ${loggedInEmail}`;

    
      if (loggedInEmail.toLowerCase() === adminEmail.toLowerCase()) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }

    } else {
     
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (username) {
        await updateProfile(userCredential.user, { displayName: username });
      }
      message.textContent = `Account created for ${userCredential.user.email}`;

    }
    authForm.reset();
  } catch (err) {
    message.style.color = "red";
    message.textContent = err.message;
  }
});



