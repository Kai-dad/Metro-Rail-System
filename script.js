// =============================================
// GLOBAL VARIABLES AND DATA
// =============================================

let homeMap;
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

// =============================
// PLACE NEW SCHEDULE CODE BELOW
/* -------------------- FIREBASE (modular v9) -------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";


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


const scheduleDocRef = doc(db, 'schedules', 'pretoria-saulsville');


function renderSchedule(data) {
  const table = document.getElementById('schedule-table');
  if (!table) return;

  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  
  const headerCells = ['<th>Train No.</th>'].concat(
    (data.trainNumbers || []).map(n => `<th>${n}</th>`)
  ).join('');
  thead.innerHTML = `<tr>${headerCells}</tr>`;

  
  tbody.innerHTML = (data.rows || []).map(row => {
    const times = row.times || [];
    const cells = ['<td>' + escapeHtml(row.station || '') + '</td>']
      .concat(times.map(t => `<td>${escapeHtml(t || '')}</td>`));
    return `<tr>${cells.join('')}</tr>`;
  }).join('');
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


async function loadScheduleFromFirestore() {
  try {
    const snap = await getDoc(scheduleDocRef);
    if (snap.exists()) {
      renderSchedule(snap.data());
      console.log('Schedule loaded from Firestore');
    } else {
      console.warn('No schedule found in Firestore.');
    }
  } catch (err) {
    console.error('Error loading schedule:', err);
  }
}

function listenForScheduleChanges() {
  onSnapshot(scheduleDocRef, (snap) => {
    if (snap.exists()) {
      renderSchedule(snap.data());
      console.log('Schedule updated from Firestore');
    }
  }, (err) => {
    console.error('Realtime listener error:', err);
  });
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');
  } else {
    // fallback 404
    document.getElementById('home').classList.add('active');
  }
}


window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
});


window.addEventListener('load', () => {
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
});



/* Javascript for scheduling page */

function filterRows() {
  const query = document.getElementById("search").value.toLowerCase();
  const rows = document.querySelectorAll("#schedule-table tbody tr");

  rows.forEach(row => {
    const station = row.cells[0].textContent.toLowerCase();
    row.style.display = station.includes(query) ? "" : "none";
  });
}



// =============================


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
    if (pageId === 'faq') {
      setTimeout(initFAQPage, 50);
    }
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

//AUDREY JS
let slideIndex = 0;
showSlides();

function showSlides() {
  let slides = document.getElementsByClassName("slide");

  
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



document.addEventListener('DOMContentLoaded', init);
