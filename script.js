// === Firebase Setup ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";








// Replace with your Firebase config
const firebaseConfig = {
   apiKey: "AIzaSyB2gjql42QQAn6kEnuAlb-U8uO4veOf9kQ",
  authDomain: "metro-rail-2de9c.firebaseapp.com",
  projectId: "metro-rail-2de9c",
  storageBucket: "metro-rail-2de9c.firebasestorage.app",
  messagingSenderId: "1036516254492",
  appId: "1:1036516254492:web:a1d07b16233af9cecc90d9"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Init Firebase
let homeMap, scheduleMap;
let originMarker, destMarker, routeLine;
let currentRouteIndex = 0;
let routeInterval;




// ===================== PROTECT NOTIFICATIONS =====================
function protectNotifications() {
  const notifLink = document.querySelector('a[href="#notifications"]');

  if (!notifLink) return;

  notifLink.addEventListener("click", (e) => {
    e.preventDefault();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        showPage("notifications"); // logged in → show notifications
      } else {
        alert("You must log in to view Notifications.");
        window.location.href = "login.html";
      }
    });
  });
}

protectNotifications();












const homeRoutes = [
  { origin: "Saulsville", destination: "Pretoria", price: "R5,50", originCoords: [-25.77000000, 28.054444], destCoords: [-25.7548, 28.1868], color: '#3498db' },
  { origin: "Pretoria", destination: "De Wildt", price: "R7,20", originCoords: [-25.7548, 28.1868], destCoords: [-25.61248, 27.91062], color: '#2ecc71' },
  { origin: "Pretoria", destination: "Saulsville", price: "R5,50", originCoords: [-25.7548, 28.1868], destCoords: [-25.77000000, 28.054444], color: '#3498db' },
  { origin: "De Wildt", destination: "Pretoria", price: "R6,80", originCoords: [-25.61248, 27.91062], destCoords: [-25.7548, 28.1868], color: '#2ecc71' }
];

const homeTrainSchedule = [
  "06:00", "07:30", "09:00", "10:30", 
  "12:00", "13:30", "15:00", "16:30", 
  "18:00", "19:30", "21:00", "23:45"
];

const routes = {
  "saulsville-pretoria": {
    name: "Saulsville → Pretoria",
    origin: "Saulsville",
    destination: "Pretoria",
    substations: [
      { name: "Saulsville", stopTime: 2 },
      { name: "Atteridgeville", travelTime: 5, stopTime: 2 },
      { name: "Kalafong", travelTime: 5, stopTime: 2 },
      { name: "Corona", travelTime: 5, stopTime: 2 },
      { name: "Elandsfontein", travelTime: 5, stopTime: 2 },
      { name: "Hercules", travelTime: 5, stopTime: 2 },
      { name: "Pretoria-West", travelTime: 5, stopTime: 2 },
      { name: "Pretoria", travelTime: 5 }
    ],
    price: "R5.50",
    originCoords: [-25.77000000, 28.054444],
    destCoords: [-25.7548, 28.1868],
    color: '#3498db'
  },
  "pretoria-saulsville": {
    name: "Pretoria → Saulsville",
    origin: "Pretoria",
    destination: "Saulsville",
    substations: [
      { name: "Pretoria", stopTime: 2 },
      { name: "Pretoria-West", travelTime: 5, stopTime: 2 },
      { name: "Hercules", travelTime: 5, stopTime: 2 },
      { name: "Elandsfontein", travelTime: 5, stopTime: 2 },
      { name: "Corona", travelTime: 5, stopTime: 2 },
      { name: "Kalafong", travelTime: 5, stopTime: 2 },
      { name: "Atteridgeville", travelTime: 5, stopTime: 2 },
      { name: "Saulsville", travelTime: 5 }
    ],
    price: "R5.50",
    originCoords: [-25.7548, 28.1868],
    destCoords: [-25.77000000, 28.054444],
    color: '#2ecc71'
  },
  "dewildt-pretoria": {
    name: "De Wildt → Pretoria",
    origin: "De Wildt",
    destination: "Pretoria",
    substations: [
      { name: "Saulsville", stopTime: 2 },
      { name: "Atteridgeville", travelTime: 5, stopTime: 2 },
      { name: "Kalafong", travelTime: 5, stopTime: 2 },
      { name: "Corona", travelTime: 5, stopTime: 2 },
      { name: "Elandsfontein", travelTime: 5, stopTime: 2 },
      { name: "Hercules", travelTime: 5, stopTime: 2 },
      { name: "Pretoria-West", travelTime: 5, stopTime: 2 },
      { name: "Pretoria", travelTime: 5 }
    ],
    price: "R6.80",
    originCoords: [-25.61248, 27.91062],
    destCoords: [-25.7548, 28.1868],
    color: '#3498db'
  },
  "pretoria-dewildt": {
    name: "Pretoria → De Wildt",
    origin: "Pretoria",
    destination: "De Wildt",
     substations: [
      { name: "Saulsville", stopTime: 2 },
      { name: "Atteridgeville", travelTime: 5, stopTime: 2 },
      { name: "Kalafong", travelTime: 5, stopTime: 2 },
      { name: "Corona", travelTime: 5, stopTime: 2 },
      { name: "Elandsfontein", travelTime: 5, stopTime: 2 },
      { name: "Hercules", travelTime: 5, stopTime: 2 },
      { name: "Pretoria-West", travelTime: 5, stopTime: 2 },
      { name: "Pretoria", travelTime: 5 }
    ],
    price: "R7.20",
    originCoords: [-25.7548, 28.1868],
    destCoords: [-25.61248, 27.91062],
    color: '#2ecc71'
  }
};

// ========== FIRESTORE TRAIN SCHEDULE ========== //
let trainSchedule = [];

// Load train schedules from Firestore in real-time
function loadTrainSchedules() {
  const schedulesRef = collection(db, "trainSchedules");

  onSnapshot(schedulesRef, (snapshot) => {
    trainSchedule = snapshot.docs.map(doc => doc.data());
    filterByRoute(); // refresh table with Firestore data
  });
}

// === Rest of your original code (unchanged) === //

const faqData = [ {
    question: "How do I purchase a Metrorail ticket?",
    answer: "You can purchase tickets at any Metrorail station ticket office or from authorized ticket vendors. We also offer mobile ticketing through our official app available on iOS and Android.",
    category: "ticketing"
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept cash, debit cards, credit cards (Visa, Mastercard), and mobile payment options like SnapScan. Some stations also accept transport vouchers.",
    category: "ticketing"
  },
  {
    question: "Are there discounts for students or seniors?",
    answer: "Yes, students with valid student IDs receive a 30% discount. Seniors (65+) receive a 50% discount on all fares. Proof of age or student status is required when purchasing discounted tickets.",
    category: "ticketing"
  },
  {
    question: "What safety measures are in place on Metrorail?",
    answer: "We have security personnel at major stations, CCTV surveillance, emergency call points on trains and platforms, and regular patrols by railway police. Please report any concerns to staff immediately.",
    category: "safety"
  },
  {
    question: "What should I do in an emergency?",
    answer: "Remain calm and follow instructions from staff. Use the emergency call points located on trains and platforms. In case of evacuation, move calmly to designated safe areas.",
    category: "safety"
  },
  {
    question: "How often do trains run?",
    answer: "Frequency varies by route and time of day. The Saulsville-Pretoria line runs every 90 minutes during peak hours (6-9am and 4-7pm) and every 2 hours off-peak. Check our schedule page for exact times.",
    category: "schedule"
  },
  {
    question: "What happens if my train is delayed?",
    answer: "We announce delays through station announcements and our mobile app. For delays over 30 minutes, you may use your ticket on the next available train. No refunds are given for delays.",
    category: "schedule"
  },
  {
    question: "Is Metrorail wheelchair accessible?",
    answer: "Most of our newer stations have wheelchair access, lifts, and designated spaces on trains. Please check our accessibility map or contact customer service for specific station information.",
    category: "accessibility"
  },
  {
    question: "Can I bring my bicycle on the train?",
    answer: "Folding bicycles are allowed at all times. Standard bicycles are permitted outside peak hours (9am-4pm and after 7pm) on designated carriages. A bicycle ticket is required (R15).",
    category: "accessibility"
  },
  {
    question: "What is the luggage policy?",
    answer: "You may bring up to 2 items of luggage not exceeding 25kg each or 1m in length. Luggage must not block aisles or doors. Oversized items may require special arrangement.",
    category: "ticketing"
  }
];

function init() {
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '') || 'home';
    showPage(hash);
  });
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');
    if (pageId === 'home') setTimeout(initRoutePage, 50);
    if (pageId === 'schedule') setTimeout(initSchedulePage, 50);
    if (pageId === 'faq') setTimeout(initFAQPage, 50);
  } else {
    document.getElementById('home').classList.add('active');
    setTimeout(initRoutePage, 50);
  }
}

function initRoutePage() {
  initHomeMap();
  updateAll();
  updateRoute();
  clearInterval(window.routeInterval);
  clearInterval(window.clockInterval);
  window.clockInterval = setInterval(updateAll, 1000);
  window.routeInterval = setInterval(updateRoute, 15000); 
}

function initHomeMap() {
  if (!document.getElementById('map')) return;
  if (!homeMap) {
    homeMap = L.map('map').setView([-25.7479, 28.2293], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(homeMap);
    homeMap.scrollWheelZoom.disable();
    document.getElementById('map').addEventListener('mouseenter', () => homeMap.scrollWheelZoom.enable());
    document.getElementById('map').addEventListener('mouseleave', () => homeMap.scrollWheelZoom.disable());
  }
  updateMapRoute();
}

function updateMapRoute() {
  if (!homeMap) return;
  const route = homeRoutes[currentRouteIndex];
  if (originMarker) homeMap.removeLayer(originMarker);
  if (destMarker) homeMap.removeLayer(destMarker);
  if (routeLine) homeMap.removeLayer(routeLine);
  originMarker = L.marker(route.originCoords).addTo(homeMap).bindPopup(`Origin: ${route.origin}`);
  destMarker = L.marker(route.destCoords).addTo(homeMap).bindPopup(`Destination: ${route.destination}`);
  routeLine = L.polyline([route.originCoords, route.destCoords], { color: route.color, weight: 4, opacity: 0.7 }).addTo(homeMap);
  homeMap.fitBounds([route.originCoords, route.destCoords], { padding: [50, 50] });
}

function updateRoute() {
  currentRouteIndex = (currentRouteIndex + 1) % homeRoutes.length;
  const route = homeRoutes[currentRouteIndex];
  document.getElementById('origin').textContent = route.origin;
  document.getElementById('destination').textContent = route.destination;
  document.getElementById('tripCost').textContent = route.price;
  updateMapRoute();
}

function updateClock() {
  const now = new Date();
  const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const compactTimeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
  const currentDate = now.toLocaleDateString('en-US', dateOptions);
  let currentTime = now.toLocaleTimeString('en-US', timeOptions);
  let compactTime = now.toLocaleTimeString('en-US', compactTimeOptions);
  currentTime = currentTime.replace(/^24:/, '00:');
  compactTime = compactTime.replace(/^24:/, '00:');
  document.getElementById('currentDateTime').textContent = `${currentDate} ${currentTime}`;
  document.getElementById('currentDateTimeCompact').textContent = `${currentDate}, ${compactTime}`;
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = now.getFullYear();
}

function updateTrainCountdown() {
  const now = new Date();
  const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let nextTrain = null, secDiff = Infinity;
  for (const time of homeTrainSchedule) {
    const [trainHours, trainMinutes] = time.split(':').map(Number);
    const trainTotalSeconds = trainHours * 3600 + trainMinutes * 60;
    let diff = trainTotalSeconds - currentTotalSeconds;
    if (diff > 0 && diff < secDiff) { secDiff = diff; nextTrain = time; }
  }
  const countdownElement = document.getElementById('countdown');
  if (!countdownElement) return;
  if (nextTrain) {
    const hours = Math.floor(secDiff / 3600);
    const minutes = Math.floor((secDiff % 3600) / 60);
    const seconds = secDiff % 60;
    if (secDiff <= 60) countdownElement.textContent = `${seconds} seconds - Boarding now!`;
    else if (secDiff <= 120) countdownElement.textContent = "1 minute - Boarding soon!";
    else if (secDiff >= 3600) countdownElement.textContent = `${hours} hours ${minutes} minutes (${nextTrain})`;
    else countdownElement.textContent = `${minutes} minutes (${nextTrain})`;
  } else {
    const firstTrain = homeTrainSchedule[0].split(':').map(Number);
    const firstTrainSeconds = firstTrain[0] * 3600 + firstTrain[1] * 60;
    const secondsUntilFirstTrain = (24 * 3600 - currentTotalSeconds) + firstTrainSeconds;
    const hours = Math.floor(secondsUntilFirstTrain / 3600);
    const minutes = Math.floor((secondsUntilFirstTrain % 3600) / 60);
    const formattedTime = `${firstTrain[0].toString().padStart(2, '0')}:${firstTrain[1].toString().padStart(2, '0')}`;
    countdownElement.textContent = `${hours}h ${minutes}m (${formattedTime} next day)`;
  }
}

function updateAll() {
  updateClock();
  updateTrainCountdown();
}

function initSchedulePage() {
  initScheduleMap();
  setupScheduleEvents();
  loadTrainSchedules(); // 🔥 Load from Firestore instead of static array
}

function initScheduleMap() {
  if (!document.getElementById('scheduleMap')) return;
  scheduleMap = L.map('scheduleMap').setView([-25.7479, 28.2293], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(scheduleMap);
  showAllRoutes();
}

function showAllRoutes() {
  Object.values(routes).forEach(route => {
    L.polyline([route.originCoords, route.destCoords], { color: route.color, weight: 3, opacity: 0.7 }).addTo(scheduleMap);
  });
  const allCoords = Object.values(routes).flatMap(route => [route.originCoords, route.destCoords]);
  scheduleMap.fitBounds(allCoords);
}

function isTimePassed(departureTime) {
  const now = new Date();
  const [hours, mins] = departureTime.split(':').map(Number);
  const departureDate = new Date();
  departureDate.setHours(hours, mins, 0, 0);
  return now >= departureDate;
}

function filterByRoute() {
  const routeSelect = document.getElementById('routeSelect');
  const selectedRoute = routeSelect ? routeSelect.value : 'all';
  const tbody = document.querySelector("#trainSchedule tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (selectedRoute === "all") {
    trainSchedule.forEach(train => {
      if (!isTimePassed(train.departure) || train.status.includes("Delayed")) {
        const routeInfo = routes[train.route];
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${train.trainNumber}</td>
          <td>${routeInfo ? routeInfo.name : train.route}</td>
          <td>${train.departure}</td>
          <td>${train.arrival}</td>
          <td class="status-${train.status.toLowerCase().replace(' ', '-')}">${train.status}</td>
          <td>${routeInfo ? routeInfo.price : ""}</td>
        `;
        tbody.appendChild(row);
      }
    });
  } else {
    const route = routes[selectedRoute];
    const routeTrains = trainSchedule.filter(train => train.route === selectedRoute && (!isTimePassed(train.departure) || train.status.includes("Delayed")));
    routeTrains.forEach(train => {
      const headerRow = document.createElement("tr");
      headerRow.className = "train-header";
      headerRow.innerHTML = `
        <td colspan="6">
          <strong>Train ${train.trainNumber}</strong> - Departure: ${train.departure} | Arrival: ${train.arrival} | Status: <span class="status-${train.status.toLowerCase().replace(' ', '-')}">${train.status}</span>
        </td>
      `;
      tbody.appendChild(headerRow);
      const detailedSchedule = generateDetailedSchedule(route, train.departure);
      detailedSchedule.forEach(stop => {
        const row = document.createElement("tr");
        row.className = "substation-schedule";
        row.innerHTML = `
          <td></td>
          <td>${stop.station}</td>
          <td>${stop.time}</td>
          <td>${stop.action}</td>
          <td></td>
          <td></td>
        `;
        tbody.appendChild(row);
      });
    });
  }
  updateMapForRoute(selectedRoute);
}

function generateDetailedSchedule(route, departureTime) {
  const schedule = [];
  let currentTime = departureTime;
  for (let i = 0; i < route.substations.length; i++) {
    const station = route.substations[i];
    schedule.push({ station: station.name, time: currentTime, action: "Arrival" });
    if (i < route.substations.length - 1 && station.stopTime) {
      currentTime = addMinutes(currentTime, station.stopTime);
      schedule.push({ station: station.name, time: currentTime, action: "Departure" });
    }
    if (i < route.substations.length - 1 && route.substations[i+1].travelTime) {
      currentTime = addMinutes(currentTime, route.substations[i+1].travelTime);
    }
  }
  return schedule;
}

function addMinutes(timeString, minutes) {
  const [hours, mins] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function updateMapForRoute(routeKey) {
  if (!scheduleMap) return;
  scheduleMap.eachLayer(layer => { if (layer instanceof L.Polyline) scheduleMap.removeLayer(layer); });
  if (routeKey === "all") showAllRoutes();
  else if (routes[routeKey]) {
    const route = routes[routeKey];
    L.polyline([route.originCoords, route.destCoords], { color: route.color, weight: 4, opacity: 0.9 }).addTo(scheduleMap);
    L.marker(route.originCoords).addTo(scheduleMap).bindPopup(`Origin: ${route.origin}`);
    L.marker(route.destCoords).addTo(scheduleMap).bindPopup(`Destination: ${route.destination}`);
    scheduleMap.fitBounds([route.originCoords, route.destCoords]);
  }
}

function setupScheduleEvents() {
  const routeSelect = document.getElementById('routeSelect');
  if (routeSelect) routeSelect.addEventListener('change', filterByRoute);
}

function initFAQPage() { renderFAQs(); setupFAQEvents(); updateDateTime(); }

function renderFAQs(category = 'all', searchTerm = '') {
  const faqAccordion = document.getElementById('faqAccordion');
  if (!faqAccordion) return;
  faqAccordion.innerHTML = '';
  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = category === 'all' || faq.category === category;
    const matchesSearch = searchTerm === '' || faq.question.toLowerCase().includes(searchTerm) || faq.answer.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
  if (filteredFAQs.length === 0) {
    faqAccordion.innerHTML = '<div class="no-results">No FAQs match your search.</div>';
    return;
  }
  filteredFAQs.forEach((faq) => {
    const faqItem = document.createElement('div');
    faqItem.className = 'faq-item';
    faqItem.innerHTML = `<div class="faq-question"><span>${faq.question} <span class="faq-category">${faq.category}</span></span><i class="fas fa-chevron-down"></i></div><div class="faq-answer"><p>${faq.answer}</p></div>`;
    faqItem.addEventListener('click', () => faqItem.classList.toggle('active'));
    faqAccordion.appendChild(faqItem);
  });
}

function setupFAQEvents() {
  const categoryBtns = document.querySelectorAll('.category-btn');
  const searchInput = document.getElementById('faqSearch');
  const searchButton = document.getElementById('searchButton');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFAQs(btn.dataset.category, searchInput.value.toLowerCase());
    });
  });
  searchButton.addEventListener('click', () => renderFAQs(document.querySelector('.category-btn.active').dataset.category, searchInput.value.toLowerCase()));
  searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') renderFAQs(document.querySelector('.category-btn.active').dataset.category, searchInput.value.toLowerCase()); });
}

function updateDateTime() {
  const now = new Date();
  const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
  const el = document.getElementById('currentDateTime');
  if (el) el.textContent = now.toLocaleDateString('en-US', options);
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = now.getFullYear();
}

let slideIndex = 0;
showSlides();
function showSlides() {
  let slides = document.getElementsByClassName("slide");
  for (let i = 0; i < slides.length; i++) slides[i].style.display = "none";
  slideIndex++; if (slideIndex > slides.length) slideIndex = 1;
  slides[slideIndex - 1].style.display = "block";
  setTimeout(showSlides, 5000);
}

document.addEventListener('DOMContentLoaded', init);

/* javascript for notifications */

    
    // DOM elements
    const notificationsList = document.getElementById('notifications-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const systemStatus = document.getElementById('system-status');
    
    let currentFilter = 'all';
    let notifications = [];
    
    // Format timestamp to readable date
    function formatDate(timestamp) {
      if (!timestamp) return 'Date not available';
      
      const date = timestamp.toDate();
      return date.toLocaleString();
    }
    
    // Determine system status based on notifications
    function updateSystemStatus() {
      const criticalNotifications = notifications.filter(notif => 
        notif.urgency === 'critical' && 
        new Date(notif.timestamp.toDate()) > new Date(Date.now() - 24*60*60*1000) // Last 24 hours
      );
      
      if (criticalNotifications.length > 0) {
        systemStatus.textContent = 'Service Disrupted';
        systemStatus.className = 'status-badge status-disrupted';
      } else if (notifications.some(notif => 
        notif.urgency === 'high' && 
        new Date(notif.timestamp.toDate()) > new Date(Date.now() - 24*60*60*1000)
      )) {
        systemStatus.textContent = 'Delays Expected';
        systemStatus.className = 'status-badge status-delayed';
      } else {
        systemStatus.textContent = 'System Operational';
        systemStatus.className = 'status-badge status-operational';
      }
    }
    
    // Render notifications based on current filter
    function renderNotifications() {
      let filteredNotifications = notifications;
      
      if (currentFilter !== 'all') {
        filteredNotifications = notifications.filter(notif => notif.type === currentFilter);
      }
      
      // Sort by timestamp (newest first)
      filteredNotifications.sort((a, b) => b.timestamp - a.timestamp);
      
      if (filteredNotifications.length === 0) {
        notificationsList.innerHTML = `
          <div class="no-notifications">
            <h3>No notifications found</h3>
            <p>There are currently no ${currentFilter !== 'all' ? currentFilter : ''} notifications.</p>
          </div>
        `;
        return;
      }
      
      notificationsList.innerHTML = filteredNotifications.map(notif => {
        const urgencyClass = notif.urgency === 'critical' ? 'critical' : 
                            notif.urgency === 'high' ? 'high' : '';
        
        // Create line badges
        const lineBadges = notif.lines ? notif.lines.map(line => 
          `<span class="line-badge line-${line}">${line.charAt(0).toUpperCase() + line.slice(1)} Line</span>`
        ).join(' ') : '';
        
        return `
          <div class="notification-card ${urgencyClass}">
            <div class="notification-header">
              <div class="notification-title">${notif.title}</div>
              <div class="notification-time">${formatDate(notif.timestamp)}</div>
            </div>
            <div class="notification-content">
              <p>${notif.message}</p>
            </div>
            <div class="notification-meta">
              ${lineBadges ? `<div>Affected lines: ${lineBadges}</div>` : ''}
              <div>Priority: <span class="status-badge ${urgencyClass}">${notif.urgency}</span></div>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Fetch notifications from Firestore
    function fetchNotifications() {
      notificationsList.innerHTML = '<div class="loading">Loading notifications...</div>';
      
      db.collection("notifications")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get()
        .then((querySnapshot) => {
          notifications = [];
          querySnapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() });
          });
          
          updateSystemStatus();
          renderNotifications();
        })
        .catch((error) => {
          console.error("Error getting notifications: ", error);
          notificationsList.innerHTML = `
            <div class="no-notifications">
              <h3>Error loading notifications</h3>
              <p>Please try again later.</p>
            </div>
          `;
        });
    }
    
    // Set up event listeners
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderNotifications();
      });
    });
    
    refreshBtn.addEventListener('click', fetchNotifications);
    
    // Set up real-time listener for new notifications
    db.collection("notifications")
      .orderBy("timestamp", "desc")
      .limit(10)
      .onSnapshot((querySnapshot) => {
        // Only refetch if we're not already loading
        if (!notificationsList.innerHTML.includes('Loading')) {
          fetchNotifications();
        }
      });
    
    // Initial fetch
    fetchNotifications();

