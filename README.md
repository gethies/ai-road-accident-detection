# SURE - Smart Urban Road Emergency Response System

**SURE** is an advanced AI-powered traffic safety platform designed specifically for Indian road conditions. It provides real-time accident detection, multi-agency dispatch coordination, and predictive analytics to minimize emergency response times and save lives.

## 🚀 Key Features

*   **Real-time Accident Detection:** Uses advanced computer vision (TensorFlow/OpenCV) to analyze CCTV camera feeds and identify collisions instantly.
*   **Multi-Agency Dispatch:** Automatically triggers alerts to nearby hospitals, ambulance services, and traffic police command centers.
*   **Vehicle Owner Identification (ANPR):** Automatically reads number plates during an incident and fetches the registered owner's details, emergency contacts, and insurance status.
*   **Predictive Risk Analytics (Prevention Hub):** Generates predictive heatmaps and pre-crash behavioral analysis to identify high-risk zones before accidents happen.
*   **Emergency Voice Assistant:** Integrated voice commands for hands-free operations in control rooms.
*   **Smart Routing:** Optimizes routes for emergency vehicles avoiding current traffic blockages.

## 🛠️ Technology Stack

*   **Frontend:** HTML5, CSS3 (Glassmorphism UI), JavaScript (Vanilla)
*   **Backend / AI:** Python, Flask, TensorFlow, OpenCV
*   **Mapping & Data Visualization:** Leaflet.js, Chart.js

## ⚙️ How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/gethies/ai-road-accident-detection.git
    cd ai-road-accident-detection
    ```
2.  **Start the Local Server:**
    Run the application using Python's built-in HTTP server:
    ```bash
    python -m http.server 5000
    ```
3.  **Access the Dashboard:**
    Open your web browser and navigate to `http://localhost:5000/`. 
    *(Note: Opening the `index.html` file directly via `file:///` will block some features like the Vehicle Registry database due to browser security restrictions).*

## 📖 Modules Overview

*   `vehicle_registry/`: Simulates an ANPR database lookup.
*   `prevention_ai/`: Visualizes AI predictive risk data and heatmaps.
*   `hospital_service/`: Connects to local trauma centers for bed availability.
*   `route_optimizer/`: Calculates the fastest emergency routes.
*   `weather_risk_engine/`: Assesses environmental risk factors.
*   `voice_assistant/`: Handles voice commands for the dashboard.
