let homeMap, scheduleMap;
let originMarker, destMarker, routeLine;
let currentRouteIndex = 0;
let routeInterval;

const homeRoutes = [
  { origin: "Saulsville", destination: "Pretoria", price: "R5,50", originCoords: [-25.77000000, 28.054444], destCoords: [-25.7548, 28.1868], color: '#3498db' },
  { origin: "Pretoria", destination: "De Wildt", price: "R7,20", originCoords: [-25.7548, 28.1868], destCoords: [-25.61248, 27.91062], color: '#2ecc71' },
  { origin: "Pretoria", destination: "Saulsville", price: "R5,50", originCoords: [-25.7548, 28.1868], destCoords: [-25.77000000, 28.054444], color: '#3498db' },
  { origin: "De Wildt", destination: "Pretoria", price: "R6,80", originCoords: [-25.61248, 27.91062], destCoords: [-25.7548, 28.1868], color: '#2ecc71' }
];

const homeTrainSchedule = ["06:00","07:30","09:00","10:30","12:00","13:30","15:00","16:30","18:00","19:30","21:00","23:45"];

const routes = {
  "saulsville-pretoria": { name: "Saulsville → Pretoria", origin: "Saulsville", destination: "Pretoria", substations: [ { name: "Saulsville", stopTime: 2 }, { name: "Atteridgeville", travelTime: 5, stopTime: 2 }, { name: "Kalafong", travelTime: 5, stopTime: 2 }, { name: "Corona", travelTime: 5, stopTime: 2 }, { name: "Elandsfontein", travelTime: 5, stopTime: 2 }, { name: "Hercules", travelTime: 5, stopTime: 2 }, { name: "Pretoria-West", travelTime: 5, stopTime: 2 }, { name: "Pretoria", travelTime: 5 } ], price: "R5.50", originCoords: [-25.77000000, 28.054444], destCoords: [-25.7548, 28.1868], color: '#3498db' },
  "pretoria-saulsville": { name: "Pretoria → Saulsville", origin: "Pretoria", destination: "Saulsville", substations: [ { name: "Pretoria", stopTime: 2 }, { name: "Pretoria-West", travelTime: 5, stopTime: 2 }, { name: "Hercules", travelTime: 5, stopTime: 2 }, { name: "Elandsfontein", travelTime: 5, stopTime: 2 }, { name: "Corona", travelTime: 5, stopTime: 2 }, { name: "Kalafong", travelTime: 5, stopTime: 2 }, { name: "Atteridgeville", travelTime: 5, stopTime: 2 }, { name: "Saulsville", travelTime: 5 } ], price: "R5.50", originCoords: [-25.7548, 28.1868], destCoords: [-25.77000000, 28.054444], color: '#2ecc71' },
  "dewildt-pretoria": { name: "De Wildt → Pretoria", origin: "De Wildt", destination: "Pretoria", substations: [ { name: "De Wildt", stopTime: 2 }, { name: "Pretoria", travelTime: 35 } ], price: "R6.80", originCoords: [-25.61248, 27.91062], destCoords: [-25.7548, 28.1868], color: '#3498db' },
  "pretoria-dewildt": { name: "Pretoria → De Wildt", origin: "Pretoria", destination: "De Wildt", substations: [ { name: "Pretoria", stopTime: 2 }, { name: "De Wildt", travelTime: 35 } ], price: "R7.20", originCoords: [-25.7548, 28.1868], destCoords: [-25.61248, 27.91062], color: '#2ecc71' }
};

// ✅ Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB2gjql42QQAn6kEnuAlb-U8uO4veOf9kQ",
  authDomain: "metro-rail-2de9c.firebaseapp.com",
  projectId: "metro-rail-2de9c",
  storageBucket: "metro-rail-2de9c.firebasestorage.app",
  messagingSenderId: "1036516254492",
  appId: "1:1036516254492:web:a1d07b16233af9cecc90d9"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= Core Functions =================

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

// ================= Home Page =================

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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(homeMap);
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

function updateAll() { updateClock(); updateTrainCountdown(); }

// ================= Schedule Page =================

function initSchedulePage() {
  initScheduleMap();
  setupScheduleEvents();
  loadSchedulesFromFirestore();
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

function loadSchedulesFromFirestore() {
  const tbody = document.querySelector("#trainSchedule tbody");
  const routeSelect = document.getElementById("routeSelect");
  let schedules = [];
  db.collection("trainSchedules").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    schedules = snapshot.docs.map(doc => doc.data());
    renderSchedule(schedules, routeSelect.value);
  });
  routeSelect.addEventListener("change", () => renderSchedule(schedules, routeSelect.value));
}

function renderSchedule(schedules, selectedRoute) {
  const tbody = document.querySelector("#trainSchedule tbody");
  tbody.innerHTML = "";
  schedules.forEach(train => {
    if (selectedRoute === "all" || train.route === selectedRoute) {
      const routeInfo = routes[train.route];
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${train.trainNumber}</td>
        <td>${routeInfo ? routeInfo.name : train.route}</td>
        <td>${train.departure}</td>
        <td>${train.arrival}</td>
        <td class="status-${train.status.toLowerCase().replace(' ', '-')}">${train.status}</td>
        <td>${routeInfo ? routeInfo.price : (train.fare || "N/A")}</td>
      `;
      tbody.appendChild(row);
    }
  });
  updateMapForRoute(selectedRoute);
}

function updateMapForRoute(routeKey) {
  if (!scheduleMap) return;
  scheduleMap.eachLayer(layer => { if (layer instanceof L.Polyline) scheduleMap.removeLayer(layer); });
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
  if (routeSelect) routeSelect.addEventListener('change', () => {});
}

// ================= FAQ Page =================

const faqData = [ /* unchanged FAQ array */ 
  { question: "How do I purchase a Metrorail ticket?", answer: "You can purchase tickets at any Metrorail station ticket office or from authorized ticket vendors. We also offer mobile ticketing through our official app available on iOS and Android.", category: "ticketing" },
  { question: "What payment methods are accepted?", answer: "We accept cash, debit cards, credit cards (Visa, Mastercard), and mobile payment options like SnapScan. Some stations also accept transport vouchers.", category: "ticketing" },
  { question: "Are there discounts for students or seniors?", answer: "Yes, students with valid student IDs receive a 30% discount. Seniors (65+) receive a 50% discount on all fares. Proof of age or student status is required when purchasing discounted tickets.", category: "ticketing" },
  { question: "What safety measures are in place on Metrorail?", answer: "We have security personnel at major stations, CCTV surveillance, emergency call points on trains and platforms, and regular patrols by railway police. Please report any concerns to staff immediately.", category: "safety" },
  { question: "What should I do in an emergency?", answer: "Remain calm and follow instructions from staff. Use the emergency call points located on trains and platforms. In case of evacuation, move calmly to designated safe areas.", category: "safety" },
  { question: "How often do trains run?", answer: "Frequency varies by route and time of day. The Saulsville-Pretoria line runs every 90 minutes during peak hours (6-9am and 4-7pm) and every 2 hours off-peak. Check our schedule page for exact times.", category: "schedule" },
  { question: "What happens if my train is delayed?", answer: "We announce delays through station announcements and our mobile app. For delays over 30 minutes, you may use your ticket on the next available train. No refunds are given for delays.", category: "schedule" },
  { question: "Is Metrorail wheelchair accessible?", answer: "Most of our newer stations have wheelchair access, lifts, and designated spaces on trains. Please check our accessibility map or contact customer service for specific station information.", category: "accessibility" },
  { question: "Can I bring my bicycle on the train?", answer: "Folding bicycles are allowed at all times. Standard bicycles are permitted outside peak hours (9am-4pm and after 7pm) on designated carriages. A bicycle ticket is required (R15).", category: "accessibility" },
  { question: "What is the luggage policy?", answer: "You may bring up to 2 items of luggage not exceeding 25kg each or 1m in length. Luggage must not block aisles or doors. Oversized items may require special arrangement.", category: "ticketing" }
];

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
    faqAccordion.innerHTML = '<div class="no-results">No FAQs match your search...</div>';
    return;
  }
  filteredFAQs.forEach((faq) => {
    const faqItem = document.createElement('div');
    faqItem.className = 'faq-item';
    faqItem.innerHTML = `
      <div class="faq-question"><span>${faq.question} <span class="faq-category">${faq.category}</span></span><i class="fas fa-chevron-down"></i></div>
      <div class="faq-answer"><p>${faq.answer}</p></div>
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
      const category = btn.dataset.category;
      renderFAQs(category, searchInput.value.toLowerCase());
    });
  });
  searchButton.addEventListener('click', () => {
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;
    renderFAQs(activeCategory, searchInput.value.toLowerCase());
  });
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const activeCategory = document.querySelector('.category-btn.active').dataset.category;
      renderFAQs(activeCategory, searchInput.value.toLowerCase());
    }
  });
}

// ================= Slideshow =================

let slideIndex = 0;
function initSlideshow() { showSlides(); }
function showSlides() {
  const slides = document.getElementsByClassName("mySlides");
  const dots = document.getElementsByClassName("dot");
  for (let i = 0; i < slides.length; i++) slides[i].style.display = "none";
  slideIndex++;
  if (slideIndex > slides.length) slideIndex = 1;
  for (let i = 0; i < dots.length; i++) dots[i].className = dots[i].className.replace(" active", "");
  if (slides[slideIndex-1]) slides[slideIndex-1].style.display = "block";  
  if (dots[slideIndex-1]) dots[slideIndex-1].className += " active";
  setTimeout(showSlides, 5000);
}

// ================= Run App =================

document.addEventListener('DOMContentLoaded', init);
