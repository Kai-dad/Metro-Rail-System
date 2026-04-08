# Metrorail | Automated Train Scheduling & Monitoring System

An end-to-end automated scheduling solution for Metrorail. This project replaces static timetables with a dynamic, logic-driven engine that provides real-time transit data, automated itinerary generation, and instant service alerts.

![Status](https://shields.io)
![Data](https://shields.io)
![Logic](https://shields.io)

## Project Objective
The primary aim was to develop a fully **Automated Scheduling System** that eliminates manual timetable management. By using time-propagation algorithms and real-time database listeners, the system ensures that every commuter has access to "living" data that adjusts to delays and service changes automatically.

## Automation & Intelligent Logic

### 1. Dynamic Itinerary Propagation
At the heart of the system is a **Recursive Time-Propagation Engine**. Rather than manually entering every stop time, the system:
*   Takes a single **Master Departure Time** from Firebase.
*   Automatically calculates arrival and departure times for every substation (e.g., Kalafong, Atteridgeville, Ga-Rankuwa).
*   Accounts for predefined **Travel Intervals** and **Station Dwell Times** to generate a complete, error-free itinerary.

### 2. Live Scheduling & Persistence
*   **Real-Time Sync:** Integrated with **Firebase Firestore**, the schedule updates instantly across all connected clients whenever a dispatcher modifies a train status.
*   **Temporal Filtering:** An automated cleanup logic hides trains that have already passed their final destination, ensuring the interface only displays relevant, upcoming trips.
*   **Service Recovery:** Automatically recalculates "Delayed" statuses to keep passengers informed of expected arrival times during disruptions.

### 3. Automated System Health Monitoring
*   The system includes a **Global Status Monitor** that parses incoming alerts. 
*   If critical notifications are detected, the system-wide status automatically shifts from `Operational` to `Service Disrupted`, providing immediate high-level awareness.

## Technical Stack

- **Backend:** Firebase (Firestore & Authentication) for live data persistence.
- **Engine:** JavaScript ES6+ (Time-propagation and logic triggers).
- **Mapping:** Leaflet.js for automated route visualization and station plotting.
- **Frontend:** Responsive HTML5/CSS3 with focus-mode layouts for heavy data.

## System Architecture

```text
├── index.html          # Modular view management
├── script.js           # The Logic Engine (Calculations, Firebase listeners, & Maps)
├── style.css           # Dynamic status-based styling
└── assets/             # Infrastructure and team data
