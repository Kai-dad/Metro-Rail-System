// =============================================
// GLOBAL VARIABLES AND DATA
// =============================================

let homeMap, scheduleMap;
let originMarker, destMarker, routeLine;
let currentRouteIndex = 0;
let routeInterval;

// Home page route data
const homeRoutes = [
  { 
    origin: "Saulsville", 
    destination: "Pretoria", 
    price: "R5,50", 
    originCoords: [-25.77000000, 28.054444], 
    destCoords: [-25.7548, 28.1868],
    color: '#3498db'
  },
  { 
    origin: "Pretoria", 
    destination: "De Wildt", 
    price: "R7,20", 
    originCoords: [-25.7548, 28.1868], 
    destCoords: [-25.61248, 27.91062],
    color: '#2ecc71'
  },
  { 
    origin: "Pretoria", 
    destination: "Saulsville", 
    price: "R5,50", 
    originCoords: [-25.7548, 28.1868], 
    destCoords: [-25.77000000, 28.054444],
    color: '#3498db'
  },
  { 
    origin: "De Wildt", 
    destination: "Pretoria", 
    price: "R6,80", 
    originCoords: [-25.61248, 27.91062], 
    destCoords: [-25.7548, 28.1868],
    color: '#2ecc71'
  }
];

// Home page train schedule
const homeTrainSchedule = [
  "06:00", "07:30", "09:00", "10:30", 
  "12:00", "13:30", "15:00", "16:30", 
  "18:00", "19:30", "21:00", "23:45"
];

// Schedule page data
const routes = {
  "saulsville-pretoria": {
    name: "Saulsville → Pretoria",
    origin: "Saulsville",
    destination: "Pretoria",
    price: "R5.50",
    originCoords: [-25.77000000, 28.054444],
    destCoords: [-25.7548, 28.1868],
    color: '#3498db'
  },
  "pretoria-saulsville": {
    name: "Pretoria → Saulsville",
    origin: "Pretoria",
    destination: "Saulsville",
    price: "R5.50",
    originCoords: [-25.7548, 28.1868],
    destCoords: [-25.77000000, 28.054444],
    color: '#2ecc71'
  },
  "dewildt-pretoria": {
    name: "De Wildt → Pretoria",
    origin: "De Wildt",
    destination: "Pretoria",
    price: "R6.80",
    originCoords: [-25.61248, 27.91062],
    destCoords: [-25.7548, 28.1868],
    color: '#3498db'
  },
  "pretoria-dewildt": {
    name: "Pretoria → De Wildt",
    origin: "Pretoria",
    destination: "De Wildt",
    price: "R7.20",
    originCoords: [-25.7548, 28.1868],
    destCoords: [-25.61248, 27.91062],
    color: '#2ecc71'
  }
};

// Schedule page train data
const trainSchedule = [
  { trainNumber: "SP101", route: "saulsville-pretoria", departure: "06:00", arrival: "06:30", status: "On Time" },
  { trainNumber: "SP103", route: "saulsville-pretoria", departure: "09:00", arrival: "09:30", status: "On Time" },
  { trainNumber: "SP105", route: "saulsville-pretoria", departure: "12:00", arrival: "12:30", status: "On Time" },
  { trainNumber: "SP107", route: "saulsville-pretoria", departure: "15:00", arrival: "15:30", status: "On Time" },
  { trainNumber: "SP109", route: "saulsville-pretoria", departure: "18:00", arrival: "18:30", status: "On Time" },
  { trainNumber: "PS102", route: "pretoria-saulsville", departure: "07:30", arrival: "08:00", status: "On Time" },
  { trainNumber: "PS104", route: "pretoria-saulsville", departure: "10:30", arrival: "11:00", status: "On Time" },
  { trainNumber: "PS106", route: "pretoria-saulsville", departure: "13:30", arrival: "14:00", status: "On Time" },
  { trainNumber: "PS108", route: "pretoria-saulsville", departure: "16:30", arrival: "17:00", status: "On Time" },
  { trainNumber: "PS110", route: "pretoria-saulsville", departure: "19:30", arrival: "20:00", status: "On Time" },
  { trainNumber: "DP111", route: "dewildt-pretoria", departure: "06:15", arrival: "06:50", status: "On Time" },
  { trainNumber: "DP113", route: "dewildt-pretoria", departure: "09:15", arrival: "09:50", status: "On Time" },
  { trainNumber: "DP115", route: "dewildt-pretoria", departure: "12:15", arrival: "12:50", status: "On Time" },
  { trainNumber: "DP117", route: "dewildt-pretoria", departure: "15:15", arrival: "15:50", status: "On Time" },
  { trainNumber: "DP119", route: "dewildt-pretoria", departure: "16:15", arrival: "16:50", status: "On Time" },
  { trainNumber: "PD112", route: "pretoria-dewildt", departure: "07:45", arrival: "08:20", status: "On Time" },
  { trainNumber: "PD114", route: "pretoria-dewildt", departure: "10:45", arrival: "11:20", status: "On Time" },
  { trainNumber: "PD116", route: "pretoria-dewildt", departure: "13:45", arrival: "14:20", status: "On Time" },
  { trainNumber: "PD118", route: "pretoria-dewildt", departure: "16:45", arrival: "17:20", status: "On Time" },
  { trainNumber: "PD120", route: "pretoria-dewildt", departure: "19:45", arrival: "20:20", status: "On Time" }
];

// FAQ data
const faqData = [
  {
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

// =============================================
// CORE FUNCTIONS
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
// HOME PAGE (ROUTE MAP) FUNCTIONS
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

// =============================================
// SCHEDULE PAGE FUNCTIONS
// =============================================

function initSchedulePage() {
  initScheduleMap();
  filterByRoute();
  setupScheduleEvents();
  simulateRealTimeUpdates();
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
  
  trainSchedule.forEach(train => {
    if (!isTimePassed(train.departure) || train.status.includes("Delayed")) {
      if (selectedRoute === "all" || train.route === selectedRoute) {
        const routeInfo = routes[train.route];
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${train.trainNumber}</td>
          <td>${routeInfo.name}</td>
          <td>${train.departure}</td>
          <td>${train.arrival}</td>
          <td class="status-${train.status.toLowerCase().replace(' ', '-')}">${train.status}</td>
          <td>${routeInfo.price}</td>
        `;
        tbody.appendChild(row);
      }
    }
  });
  
  updateMapForRoute(selectedRoute);
}

function updateMapForRoute(routeKey) {
  if (!scheduleMap) return;
  
  // Clear all existing route lines
  scheduleMap.eachLayer(layer => {
    if (layer instanceof L.Polyline) {
      scheduleMap.removeLayer(layer);
    }
  });
  
  if (routeKey === "all") {
    showAllRoutes();
  } else if (routes[routeKey]) {
    const route = routes[routeKey];
    
    // Add the selected route line
    L.polyline([route.originCoords, route.destCoords], {
      color: route.color,
      weight: 4,
      opacity: 0.9
    }).addTo(scheduleMap);
    
    // Add markers for origin and destination
    L.marker(route.originCoords).addTo(scheduleMap)
      .bindPopup(`Origin: ${route.origin}`);
    L.marker(route.destCoords).addTo(scheduleMap)
      .bindPopup(`Destination: ${route.destination}`);
    
    // Fit map to show the selected route
    scheduleMap.fitBounds([route.originCoords, route.destCoords]);
  }
}

function setupScheduleEvents() {
  const routeSelect = document.getElementById('routeSelect');
  if (routeSelect) {
    routeSelect.addEventListener('change', filterByRoute);
  }
}

function simulateRealTimeUpdates() {
  // First remove any trains that have departed (and aren't delayed)
  trainSchedule = trainSchedule.filter(train => 
    !isTimePassed(train.departure) || train.status.includes("Delayed")
  );

  // Get only trains that haven't departed yet for status changes
  const upcomingTrains = trainSchedule.filter(train => !isTimePassed(train.departure));
  
  if (upcomingTrains.length > 0) {
    const randomIndex = Math.floor(Math.random() * upcomingTrains.length);
    const randomTrain = upcomingTrains[randomIndex];
    const randomAction = Math.random();
    
    if (randomAction < 0.6) { // 60% chance for on time
      // No change needed
      document.getElementById('realTimeUpdate').textContent = `Train ${randomTrain.trainNumber} is running on schedule`;
      document.getElementById('passengerAlert').textContent = "No delays expected";
      document.getElementById('safetyAlert').textContent = "All systems operational";
    } 
    else if (randomAction < 0.9) { // 30% chance for delay
      const delayMinutes = Math.floor(Math.random() * 30) + 5;
      randomTrain.status = `Delayed by ${delayMinutes} min`;
      
      // Calculate new departure time
      const [hours, mins] = randomTrain.departure.split(':').map(Number);
      const departureDate = new Date();
      departureDate.setHours(hours, mins + delayMinutes, 0, 0);
      
      const newDeparture = `${String(departureDate.getHours()).padStart(2, '0')}:${String(departureDate.getMinutes()).padStart(2, '0')}`;
      randomTrain.departure = newDeparture;
      
      document.getElementById('realTimeUpdate').textContent = `Train ${randomTrain.trainNumber} is delayed by ${delayMinutes} minutes. New departure: ${newDeparture}`;
      document.getElementById('passengerAlert').textContent = `Expect delays on ${routes[randomTrain.route].name} route`;
      document.getElementById('safetyAlert').textContent = "Delay due to operational requirements";
    } 
    else { // 10% chance for cancellation
      randomTrain.status = "Cancelled";
      // Remove from schedule
      const indexToRemove = trainSchedule.findIndex(t => t.trainNumber === randomTrain.trainNumber);
      if (indexToRemove !== -1) {
        trainSchedule.splice(indexToRemove, 1);
      }
      
      document.getElementById('realTimeUpdate').textContent = `Train ${randomTrain.trainNumber} has been cancelled`;
      document.getElementById('passengerAlert').textContent = `Please seek alternative transportation for ${routes[randomTrain.route].name} route`;
      document.getElementById('safetyAlert').textContent = "Service suspended due to safety inspection";
    }
  } else {
    // No upcoming trains to modify
    document.getElementById('realTimeUpdate').textContent = "No schedule changes for upcoming trains";
    document.getElementById('passengerAlert').textContent = "All trains running as scheduled";
    document.getElementById('safetyAlert').textContent = "All systems operational";
  }
  
  // Update the displayed schedule
  filterByRoute();
}

// =============================================
// FAQ PAGE FUNCTIONS
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
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm) || 
      faq.answer.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
  
  if (filteredFAQs.length === 0) {
    faqAccordion.innerHTML = '<div class="no-results">No FAQs match your search. Try different keywords or contact our support team.</div>';
    return;
  }
  
  filteredFAQs.forEach((faq, index) => {
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
    
    faqItem.addEventListener('click', () => {
      faqItem.classList.toggle('active');
    });
    
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

// =============================================
// UTILITY FUNCTIONS
// =============================================

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
  
  const el = document.getElementById('currentDateTime');
  if (el) el.textContent = now.toLocaleDateString('en-US', options);
  
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = now.getFullYear();
}

function filterRows() {
  const query = document.getElementById("search").value.toLowerCase();
  const rows = document.querySelectorAll("#schedule-table tbody tr");

  rows.forEach(row => {
    const station = row.cells[0].textContent.toLowerCase();
    row.style.display = station.includes(query) ? "" : "none";
  });
}

//AUDREY JS
let slideIndex = 0;
showSlides();

function showSlides() {
  let slides = document.getElementsByClassName("slide");

  // Hide all slides
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  // Move to the next slide
  slideIndex++;
  if (slideIndex > slides.length) { slideIndex = 1 }

  // Show current slide
  slides[slideIndex - 1].style.display = "block";

  // Change image every 5 seconds
  setTimeout(showSlides, 5000);
}

// =============================================
// INITIALIZE APPLICATION
// =============================================

document.addEventListener('DOMContentLoaded', init);
