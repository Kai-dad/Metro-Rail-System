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



/*about page javascript*/

// Team data
const teamMembers = [
    {
        name: "Frank Nkuna",
        position: "CEO",
        image: "images/image.jpg"
    },
    {
        name: "Oageng Mashaba",
        position: "Operations Director",
        image: "images/oagang.jpg"
    },
    {
        name: "Kagiso M",
        position: "Safety Manager",
        image: "images/kg.jpg"
    },
    {
        name: "Tshepo Sepataka",
        position: "Customer Service",
        image: "images/image.jpg"
    }
];

// Initialize page
function initAboutPage() {
    // Update date and year
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

    // Render team members
    function renderTeam() {
        const teamContainer = document.getElementById('teamMembers');
        teamContainer.innerHTML = teamMembers.map(member => `
            <div class="team-member">
                <img src="${member.image}" alt="${member.name}">
                <h3>${member.name}</h3>
                <p>${member.position}</p>
            </div>
        `).join('');
    }

    // Initialize functions
    updateDateTime();
    renderTeam();
    setInterval(updateDateTime, 6000);
}

// Start the page
document.addEventListener('DOMContentLoaded', initAboutPage);




// route map javascript


const trainSchedule = [
    "06:00", "07:30", "09:00", "10:30", 
    "12:00", "13:30", "15:00", "16:30", 
    "18:00", "19:30", "21:00", "23:45"
];


const routes = [
    { 
        origin: "Saulsville", 
        destination: "Pretoria", 
        price: "R5,50",
        originCoords: [-25.77000000, 28.054444],
        destCoords: [-25.7548, 28.1868]
    },
	
    { 
        origin: "Pretoria", 
        destination: "De Wildt", 
        price: "R7,20",
        originCoords: [-25.7548, 28.1868],
        destCoords: [-25.61248, 27.91062]
    },
	{ 
        origin: "Pretoria", 
        destination: "Saulsville", 
        price: "R5,50",
        originCoords: [-25.7548, 28.1868],
        destCoords: [-25.77000000, 28.054444]
    },
    { 
        origin: "De Wildt", 
        destination: "Pretoria", 
        price: "R6,80",
        originCoords: [-25.61248, 27.91062],
        destCoords: [-25.7548, 28.1868]
    }
];

let currentRouteIndex = 0;
let map;
let originMarker, destMarker;
let routeLine;


function initMap() {
    map = L.map('map').setView([-25.7479, 28.2293], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    updateMapRoute();
}


function updateMapRoute() {
    const route = routes[currentRouteIndex];
    
 
    if (originMarker) map.removeLayer(originMarker);
    if (destMarker) map.removeLayer(destMarker);
    if (routeLine) map.removeLayer(routeLine);
    
    
    originMarker = L.marker(route.originCoords)
        .addTo(map)
        .bindPopup(`Origin: ${route.origin}`);
    
    destMarker = L.marker(route.destCoords)
        .addTo(map)
        .bindPopup(`Destination: ${route.destination}`);
    
	 const lineColor = route.destination === "Pretoria" ? '#2ecc71': '#3498db';
	 
	 routeLine = L.polyline([route.originCoords, route.destCoords], {
        color: lineColor,
        weight: 3
    }).addTo(map);
    
    
    
    map.fitBounds([route.originCoords, route.destCoords]);
}


function updateRoute() {
    currentRouteIndex = (currentRouteIndex + 1) % routes.length;
    const route = routes[currentRouteIndex];
    
    document.getElementById('origin').textContent = route.origin;
    document.getElementById('destination').textContent = route.destination;
    document.getElementById('tripCost').textContent = route.price;
    
    updateMapRoute();
}


function updateClock() {
    const now = new Date();
    const dateOptions = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const compactTimeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    
    const currentDate = now.toLocaleDateString('en-US', dateOptions);
    let currentTime = now.toLocaleTimeString('en-US', timeOptions);
    let compactTime = now.toLocaleTimeString('en-US', compactTimeOptions);
    
    currentTime = currentTime.replace(/^24:/, '00:');
    compactTime = compactTime.replace(/^24:/, '00:');
    
    document.getElementById('currentDateTime').textContent = 
        `${currentDate}\n${currentTime}`;
    document.getElementById('currentDateTimeCompact').textContent = 
        `${currentDate}, ${compactTime}`;
    
    document.getElementById('currentYear').textContent = now.getFullYear();
}


function updateTrainCountdown() {
    const now = new Date();
    const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    let nextTrain = null;
    let secDiff = Infinity;
    
    
    for (const time of trainSchedule) {
        const [trainHours, trainMinutes] = time.split(':').map(Number);
        const trainTotalSeconds = trainHours * 3600 + trainMinutes * 60;
        let diff = trainTotalSeconds - currentTotalSeconds;
        
        if (diff > 0 && diff < secDiff) {
            secDiff = diff;
            nextTrain = time;
        }
    }
    
    const countdownElement = document.getElementById('countdown');
    
    if (nextTrain) {
		const hours = Math.floor(secDiff / 3600)
        const minutes = Math.floor((secDiff%3600) / 60);
        const seconds = secDiff % 60;
        
        if (secDiff <= 60) {
            countdownElement.textContent = `${seconds} seconds - Boarding now!`;
        } else if (secDiff <= 120) {
            countdownElement.textContent = "1 minute - Boarding soon!";
        } else if(secDiff >= 3600){
			countdownElement.textContent = `${hours} hours ${minutes} minutes (${nextTrain})`
		}

		  else {
            const [hours, mins] = nextTrain.split(':');
            const formattedTime = `${hours.padStart(2, '0')}:${mins}`;
            countdownElement.textContent = `${minutes} minutes (${formattedTime})`;
        }
    } else {
        const firstTrain = trainSchedule[0].split(':').map(Number);
        const firstTrainSeconds = firstTrain[0] * 3600 + firstTrain[1] * 60;
        const secondsUntilFirstTrain = (24 * 3600 - currentTotalSeconds) + firstTrainSeconds;
        
        if (secondsUntilFirstTrain < 12 * 3600) {
            const hours = Math.floor(secondsUntilFirstTrain / 3600);
            const minutes = Math.floor((secondsUntilFirstTrain % 3600) / 60);
            const formattedTime = `${firstTrain[0].toString().padStart(2, '0')}:${firstTrain[1].toString().padStart(2, '0')}`;
            countdownElement.textContent = `${hours}h ${minutes}m (${formattedTime} next day)`;
        } else {
            countdownElement.textContent = "No more trains today";
        }
    }
}


function updateAll() {
    updateClock();
    updateTrainCountdown();
}


function init() {

	// Load initial schedule
    loadScheduleFromFirestore();
  // Start listening for changes
    listenForScheduleChanges();
	
    initMap();
    updateAll();
    updateRoute();
    
    setInterval(updateAll, 1000);
    setInterval(updateRoute, 15000);
}

document.addEventListener('DOMContentLoaded', init);






