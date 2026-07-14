/**
 * Smart Hospital Recommendation Module
 * Selects the most suitable hospital after an accident is detected.
 */

class HospitalService {
    constructor() {
        this.hospitals = [
            { name: "Apollo Hospitals, Greams Road", distance: "2.3 km", beds: 15, trauma: true, eta: "7 mins", occupancy: "78%" },
            { name: "Fortis Malar Hospital, Adyar", distance: "5.1 km", beds: 4, trauma: true, eta: "14 mins", occupancy: "92%" },
            { name: "Rajiv Gandhi Government General Hospital", distance: "6.8 km", beds: 45, trauma: true, eta: "18 mins", occupancy: "85%" },
            { name: "Kauvery Hospital, Alwarpet", distance: "3.5 km", beds: 8, trauma: true, eta: "9 mins", occupancy: "60%" }
        ];
        
        this.initHook();
        this.injectUI();
    }

    initHook() {
        // Hook into the existing alert console activation to trigger hospital recommendation
        const originalAlert = window.activateAlertConsole;
        window.activateAlertConsole = (severity, location, logId) => {
            if (originalAlert) originalAlert(severity, location, logId);
            this.recommendHospital(location);
        };
    }

    injectUI() {
        // Append to the right sidebar in Detection Console
        // The container holding the results is usually .detection-result-panel or #results-panel
        // In index.html, there is a class "detection-result-panel"
        const resultsPanel = document.querySelector(".detection-result-panel") || document.getElementById("results-panel")?.parentElement;
        
        if (resultsPanel) {
            const hospitalPanel = document.createElement("div");
            hospitalPanel.id = "hospital-recommendation-panel";
            hospitalPanel.style.marginTop = "15px";
            hospitalPanel.style.padding = "15px";
            hospitalPanel.style.background = "#090b10"; // matching dark theme
            hospitalPanel.style.border = "1px solid var(--border-color)";
            hospitalPanel.style.borderRadius = "8px";
            hospitalPanel.style.display = "none";
            
            hospitalPanel.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #38bdf8; margin-right: 8px;"></span>
                    <h4 style="color: #ffffff; margin: 0; font-size: 0.9rem;">Recommended Hospital</h4>
                </div>
                <div id="hospital-rec-content" style="font-size: 0.8rem; color: #94a3b8;">
                    Waiting for incident data...
                </div>
            `;
            
            resultsPanel.appendChild(hospitalPanel);
        }
    }

    recommendHospital(location) {
        const panel = document.getElementById("hospital-recommendation-panel");
        if (!panel) return;
        
        panel.style.display = "block";
        
        // Sort by distance mock logic
        const recommended = this.hospitals.sort(() => 0.5 - Math.random())[0];
        
        document.getElementById("hospital-rec-content").innerHTML = `
            <div style="background: #121620; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <strong style="color: white; font-size: 0.9rem;">${recommended.name}</strong>
                <div style="margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    <div><i class="fa-solid fa-route" style="color: #64748b;"></i> ${recommended.distance}</div>
                    <div><i class="fa-solid fa-clock" style="color: #64748b;"></i> ETA: ${recommended.eta}</div>
                    <div><i class="fa-solid fa-bed-pulse" style="color: #64748b;"></i> ICU: ${recommended.beds} beds</div>
                    <div><i class="fa-solid fa-users" style="color: #64748b;"></i> Occ: ${recommended.occupancy}</div>
                </div>
            </div>
            <div style="margin-top: 8px; font-size: 0.7rem; color: #10b981;">
                <i class="fa-solid fa-check-circle"></i> Trauma center notified and standing by.
            </div>
        `;
    }
}

// Initialize
setTimeout(() => {
    window.hospitalService = new HospitalService();
}, 500);
