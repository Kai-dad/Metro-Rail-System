// =============================================
// GLOBAL VARIABLES AND DATA
// =============================================

let homeMap, scheduleMap;
let originMarker, destMarker, routeLine;
let currentRouteIndex = 0;
let routeInterval;

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB2gjql42QQAn6kEnuAlb-U8uO4veOf9kQ",
  authDomain: "metro-rail-2de9c.firebaseapp.com",
  projectId: "metro-rail-2de9c",
  storageBucket: "metro-rail-2de9c.firebasestorage.app",
  messagingSenderId: "1036516254492",
  appId: "1:1036516254492:web:a1d07b16233af9cecc90d9"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

// Train schedule (populated from Firestore)
let trainSchedule = [];

// =============================================
// CORE FUNCTIONS
// =============================================

function init() {
  // Initialize Firebase data listener
  initFirebaseListener();
  
  // Set up event listeners
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '') || 'home';
    showPage(hash);
  });

  // Initial page load
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
}

function initFirebaseListener() {
  db.collection("trainSchedules").onSnapshot(
    (snapshot) => {
      console.log("Firestore data received:", snapshot.docs.length, "documents");
      trainSchedule = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Processing document:", data);
        trainSchedule.push({
          trainNumber: data.trainNumber,
          route: data.route,
          departure: data.departure,
          arrival: data.arrival,
          status: data.status || "On Time"
        });
      });
      
      // Update UI if on schedule page
      if (location.hash.includes('schedule')) {
        filterByRoute();
      }
    },
    (error) => {
      console.error("Firestore error:", error);
      // Display error to user
      const scheduleTable = document.getElementById('trainSchedule');
      if (scheduleTable) {
        scheduleTable.innerHTML = `
          <tr class="error">
            <td colspan="6">
              Failed to load schedule data. Please refresh the page.
              <br>Error: ${error.message}
            </td>
          </tr>
        `;
      }
    }
  );
}

// =============================================
// SCHEDULE PAGE FUNCTIONS (UPDATED)
// =============================================

function filterByRoute() {
  const routeSelect = document.getElementById('routeSelect');
  const selectedRoute = routeSelect ? routeSelect.value : 'all';
  const tbody = document.querySelector("#trainSchedule tbody");
  
  if (!tbody) {
    console.error("Schedule table body not found");
    return;
  }
  
  tbody.innerHTML = "";
  
  if (trainSchedule.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="loading">Loading schedule data...</td>
      </tr>
    `;
    return;
  }

  if (selectedRoute === "all") {
    trainSchedule.forEach(train => {
      if (!isTimePassed(train.departure) || train.status.includes("Delayed")) {
        const routeInfo = routes[train.route];
        if (routeInfo) {
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
  } else {
    const route = routes[selectedRoute];
    if (!route) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="error">Invalid route selected</td>
        </tr>
      `;
      return;
    }
    
    const routeTrains = trainSchedule.filter(train => 
      train.route === selectedRoute && 
      (!isTimePassed(train.departure) || train.status.includes("Delayed"))
    );
    
    if (routeTrains.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">No upcoming trains for this route</td>
        </tr>
      `;
      return;
    }
    
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

// =============================================
// HELPER FUNCTIONS
// =============================================

function isTimePassed(departureTime) {
  const now = new Date();
  const [hours, mins] = departureTime.split(':').map(Number);
  const departureDate = new Date();
  departureDate.setHours(hours, mins, 0, 0);
  return now >= departureDate;
}

function generateDetailedSchedule(route, departureTime) {
  const schedule = [];
  let currentTime = departureTime;
  
  for (let i = 0; i < route.substations.length; i++) {
    const station = route.substations[i];
    
    // Arrival time
    schedule.push({
      station: station.name,
      time: currentTime,
      action: "Arrival"
    });
    
    if (i < route.substations.length - 1 && station.stopTime) {
      currentTime = addMinutes(currentTime, station.stopTime);
      schedule.push({
        station: station.name,
        time: currentTime,
        action: "Departure"
      });
    }
    
    // Travel time to next station
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

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', init);
