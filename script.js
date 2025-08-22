// =============================================
// GLOBAL VARIABLES AND DATA
// =============================================

let homeMap, scheduleMap;
let originMarker, destMarker, routeLine;
let currentRouteIndex = 0;
let routeInterval;

// Home page route data (kept static)
const homeRoutes = [
  { origin: "Saulsville", destination: "Pretoria", price: "R5,50", originCoords: [-25.77000000, 28.054444], destCoords: [-25.7548, 28.1868], color: '#3498db' },
  { origin: "Pretoria", destination: "De Wildt", price: "R7,20", originCoords: [-25.7548, 28.1868], destCoords: [-25.61248, 27.91062], color: '#2ecc71' },
  { origin: "Pretoria", destination: "Saulsville", price: "R5,50", originCoords: [-25.7548, 28.1868], destCoords: [-25.77000000, 28.054444], color: '#3498db' },
  { origin: "De Wildt", destination: "Pretoria", price: "R6,80", originCoords: [-25.61248, 27.91062], destCoords: [-25.7548, 28.1868], color: '#2ecc71' }
];

// =====================
// Firebase Integration
// =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// =====================
// Train schedules (from Firestore)
// =====================
let trainSchedule = [];       // full schedule
let homeTrainSchedule = [];   // times only (for countdown)

async function loadSchedules() {
  try {
    const querySnapshot = await getDocs(collection(db, "trainSchedules"));
    trainSchedule = [];
    homeTrainSchedule = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      trainSchedule.push({
        trainNumber: data.trainNumber,
        route: data.route,
        departure: data.departure,
        arrival: data.arrival,
        status: data.status
      });
      homeTrainSchedule.push(data.departure);
    });

    homeTrainSchedule.sort();
    filterByRoute();
    updateAll();
  } catch (error) {
    console.error("Error loading schedules:", error);
  }
}

// Real-time updates (sync with admin changes)
onSnapshot(collection(db, "trainSchedules"), (snapshot) => {
  trainSchedule = [];
  homeTrainSchedule = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    trainSchedule.push(data);
    homeTrainSchedule.push(data.departure);
  });

  homeTrainSchedule.sort();
  filterByRoute();
  updateAll();
});

// =====================
// Static routes data (kept as is)
// =====================
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
      { name: "De Wildt", stopTime: 2 },
      { name: "Pretoria", travelTime: 35 }
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
      { name: "Pretoria", stopTime: 2 },
      { name: "De Wildt", travelTime: 35 }
    ],
    price: "R7.20",
    originCoords: [-25.7548, 28.1868],
    destCoords: [-25.61248, 27.91062],
    color: '#2ecc71'
  }
};
// =============================================
// INIT + PAGE HANDLING
// =============================================
function init() {
  // Set up event listeners
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '') || 'home';
    showPage(hash);
  });

  // Initial page load
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');

    if (pageId === 'home') {
      setTimeout(initRoutePage, 50);
    }
    if (pageId === 'schedule') {
      setTimeout(initSchedulePage, 50);
    }
    if (pageId === 'faq') {
      setTimeout(initFAQPage, 50);
    }
  } else {
    document.getElementById('home').classList.add('active');
    setTimeout(initRoutePage, 50);
  }
}

// =============================================
// HOME PAGE FUNCTIONS
// =============================================
function initRoutePage() {
  initHomeMap();
  updateAll();
  updateRoute();

  clearInterval(window.routeInterval);
  clearInterval(window.clockInterval);

  window.clockInterval = setInterval(updateAll, 1000);
  window.routeInterval = setInterval(updateRoute, 15000); // Change route every 15 seconds
}

function initHomeMap() {
  if (!document.getElementById('map')) {
    console.error("Home map container not found");
    return;
  }

  if (!homeMap) {
    homeMap = L.map('map').setView([-25.7479, 28.2293], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(homeMap);

    homeMap.scrollWheelZoom.disable();
    
    document.getElementById('map').addEventListener('mouseenter', function() {
      homeMap.scrollWheelZoom.enable();
    });
    
    document.getElementById('map').addEventListener('mouseleave', function() {
      homeMap.scrollWheelZoom.disable();
    });
  }

  updateMapRoute();
}

function updateMapRoute() {
  if (!homeMap) return;

  const route = homeRoutes[currentRouteIndex];

  // Clear previous elements
  if (originMarker) homeMap.removeLayer(originMarker);
  if (destMarker) homeMap.removeLayer(destMarker);
  if (routeLine) homeMap.removeLayer(routeLine);

  // Add new markers
  originMarker = L.marker(route.originCoords)
    .addTo(homeMap)
    .bindPopup(`Origin: ${route.origin}`);
  
  destMarker = L.marker(route.destCoords)
    .addTo(homeMap)
    .bindPopup(`Destination: ${route.destination}`);

  // Add new route line
  routeLine = L.polyline([route.originCoords, route.destCoords], {
    color: route.color,
    weight: 4,
    opacity: 0.7
  }).addTo(homeMap);

  // Fit bounds to show both points
  homeMap.fitBounds([route.originCoords, route.destCoords], {
    padding: [50, 50]
  });
}

function updateRoute() {
  currentRouteIndex = (currentRouteIndex + 1) % homeRoutes.length;
  const route = homeRoutes[currentRouteIndex];
  
  // Update DOM elements
  const originEl = document.getElementById('origin');
  const destEl = document.getElementById('destination');
  const costEl = document.getElementById('tripCost');

  if (originEl) originEl.textContent = route.origin;
  if (destEl) destEl.textContent = route.destination;
  if (costEl) costEl.textContent = route.price;

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

  const dateTimeEl = document.getElementById('currentDateTime');
  const dateTimeCompactEl = document.getElementById('currentDateTimeCompact');
  const yearEl = document.getElementById('currentYear');

  if (dateTimeEl) dateTimeEl.textContent = `${currentDate} ${currentTime}`;
  if (dateTimeCompactEl) dateTimeCompactEl.textContent = `${currentDate}, ${compactTime}`;
  if (yearEl) yearEl.textContent = now.getFullYear();
}

function updateTrainCountdown() {
  const now = new Date();
  const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let nextTrain = null;
  let secDiff = Infinity;

  for (const time of homeTrainSchedule) {
    const [trainHours, trainMinutes] = time.split(':').map(Number);
    const trainTotalSeconds = trainHours * 3600 + trainMinutes * 60;
    let diff = trainTotalSeconds - currentTotalSeconds;

    if (diff > 0 && diff < secDiff) {
      secDiff = diff;
      nextTrain = time;
    }
  }

  const countdownElement = document.getElementById('countdown');
  if (!countdownElement) return;

  if (nextTrain) {
    const hours = Math.floor(secDiff / 3600);
    const minutes = Math.floor((secDiff % 3600) / 60);
    const seconds = secDiff % 60;

    if (secDiff <= 60) {
      countdownElement.textContent = `${seconds} seconds - Boarding now!`;
    } else if (secDiff <= 120) {
      countdownElement.textContent = "1 minute - Boarding soon!";
    } else if (secDiff >= 3600) {
      countdownElement.textContent = `${hours} hours ${minutes} minutes (${nextTrain})`;
    } else {
      countdownElement.textContent = `${minutes} minutes (${nextTrain})`;
    }
  } else {
    const firstTrain = homeTrainSchedule[0]?.split(':').map(Number);
    if (!firstTrain) return;
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
// =============================================
// SCHEDULE PAGE FUNCTIONS
// =============================================
function initSchedulePage() {
  initScheduleMap();
  filterByRoute();
  setupScheduleEvents();
  
  // Initial update
  setTimeout(simulateRealTimeUpdates, 1000);
  setInterval(simulateRealTimeUpdates, 25000);
}

function initScheduleMap() {
  if (!document.getElementById('scheduleMap')) return;
  
  scheduleMap = L.map('scheduleMap').setView([-25.7479, 28.2293], 12);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(scheduleMap);
  
  showAllRoutes();
}

function showAllRoutes() {
  Object.values(routes).forEach(route => {
    L.polyline([route.originCoords, route.destCoords], {
      color: route.color,
      weight: 3,
      opacity: 0.7
    }).addTo(scheduleMap);
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
          <td>${routeInfo ? routeInfo.price : "-"}</td>
        `;
        tbody.appendChild(row);
      }
    });
  } else {
    const route = routes[selectedRoute];
    const routeTrains = trainSchedule.filter(train => 
      train.route === selectedRoute && 
      (!isTimePassed(train.departure) || train.status.includes("Delayed"))
    );
    
    routeTrains.forEach(train => {
      const headerRow = document.createElement("tr");
      headerRow.className = "train-header";
      headerRow.innerHTML = `
        <td colspan="6">
          <strong>Train ${train.trainNumber}</strong> - Departure: ${train.departure} | 
          Arrival: ${train.arrival} | Status: <span class="status-${train.status.toLowerCase().replace(' ', '-')}">${train.status}</span>
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
  scheduleMap.eachLayer(layer => {
    if (layer instanceof L.Polyline) scheduleMap.removeLayer(layer);
  });
  
  if (routeKey === "all") {
    showAllRoutes();
  } else if (routes[routeKey]) {
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

function simulateRealTimeUpdates() {
  trainSchedule = trainSchedule.filter(train => 
    !isTimePassed(train.departure) || train.status.includes("Delayed")
  );

  const upcomingTrains = trainSchedule.filter(train => !isTimePassed(train.departure));
  
  if (upcomingTrains.length > 0) {
    const randomIndex = Math.floor(Math.random() * upcomingTrains.length);
    const randomTrain = upcomingTrains[randomIndex];
    const randomAction = Math.random();
    
    if (randomAction < 0.6) {
      document.getElementById('realTimeUpdate').textContent = `Train ${randomTrain.trainNumber} is running on schedule`;
      document.getElementById('passengerAlert').textContent = "No delays expected";
      document.getElementById('safetyAlert').textContent = "All systems operational";
    } else if (randomAction < 0.9) {
      const delayMinutes = Math.floor(Math.random() * 30) + 5;
      randomTrain.status = `Delayed by ${delayMinutes} min`;
      const [hours, mins] = randomTrain.departure.split(':').map(Number);
      const departureDate = new Date();
      departureDate.setHours(hours, mins + delayMinutes, 0, 0);
      const newDeparture = `${String(departureDate.getHours()).padStart(2, '0')}:${String(departureDate.getMinutes()).padStart(2, '0')}`;
      randomTrain.departure = newDeparture;
      document.getElementById('realTimeUpdate').textContent = `Train ${randomTrain.trainNumber} is delayed by ${delayMinutes} minutes. New departure: ${newDeparture}`;
      document.getElementById('passengerAlert').textContent = `Expect delays on ${routes[randomTrain.route].name} route`;
      document.getElementById('safetyAlert').textContent = "Delay due to operational requirements";
    } else {
      randomTrain.status = "Cancelled";
      const indexToRemove = trainSchedule.findIndex(t => t.trainNumber === randomTrain.trainNumber);
      if (indexToRemove !== -1) trainSchedule.splice(indexToRemove, 1);
      document.getElementById('realTimeUpdate').textContent = `Train ${randomTrain.trainNumber} has been cancelled`;
      document.getElementById('passengerAlert').textContent = `Please seek alternative transportation for ${routes[randomTrain.route].name} route`;
      document.getElementById('safetyAlert').textContent = "Service suspended due to safety inspection";
    }
  } else {
    document.getElementById('realTimeUpdate').textContent = "No schedule changes for upcoming trains";
    document.getElementById('passengerAlert').textContent = "All trains running as scheduled";
    document.getElementById('safetyAlert').textContent = "All systems operational";
  }
  filterByRoute();
}

// =============================================
// FAQ FUNCTIONS
// =============================================
function initFAQPage() {
  renderFAQs();
  setupFAQEvents();
  updateDateTime();
}

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
    faqAccordion.innerHTML = '<div class="no-results">No FAQs match your search. Try different keywords or contact our support team.</div>';
    return;
  }
  
  filteredFAQs.forEach(faq => {
    const faqItem = document.createElement('div');
    faqItem.className = 'faq-item';
    faqItem.innerHTML = `
      <div class="faq-question">
        <span>${faq.question} <span class="faq-category">${faq.category}</span></span>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-answer">
        <p>${faq.answer}</p>
      </div>
    `;
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
  
  searchButton.addEventListener('click', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;
    renderFAQs(activeCategory, searchTerm);
  });
  
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const searchTerm = searchInput.value.toLowerCase();
      const activeCategory = document.querySelector('.category-btn.active').dataset.category;
      renderFAQs(activeCategory, searchTerm);
    }
  });
}

function updateDateTime() {
  const now = new Date();
  const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
  const el = document.getElementById('currentDateTime');
  if (el) el.textContent = now.toLocaleDateString('en-US', options);
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = now.getFullYear();
}

// =============================================
// SLIDESHOW + INIT
// =============================================
let slideIndex = 0;
showSlides();
function showSlides() {
  let slides = document.getElementsByClassName("slide");
  for (let i = 0; i < slides.length; i++) slides[i].style.display = "none";
  slideIndex++;
  if (slideIndex > slides.length) slideIndex = 1;
  slides[slideIndex - 1].style.display = "block";
  setTimeout(showSlides, 5000);
}

// =============================================
// INIT APP
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  init();
  loadSchedules();
});
