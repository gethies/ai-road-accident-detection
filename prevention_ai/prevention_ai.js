/**
 * AI Accident Prevention Module
 * Preventive AI engine analyzing feeds before accidents occur.
 */

class PreventionAI {
    constructor() {
        this.alerts = [];
        this.heatmapInstance = null;
        this.isActive = false;
        
        this.injectUI();
        this.startLoop();
    }

    injectUI() {
        // 1. Add Sidebar Menu Item
        const sidebarMenu = document.querySelector(".sidebar-menu ul");
        if (sidebarMenu) {
            const li = document.createElement("li");
            li.setAttribute("data-view", "prevention-view");
            li.innerHTML = `<i class="fa-solid fa-shield-halved"></i> <span>Prevention Hub</span>`;
            sidebarMenu.appendChild(li);
            
            // Add click listener (mocking the app.js router behavior)
            li.addEventListener("click", () => {
                if (typeof switchView === "function") switchView("prevention-view");
            });
        }

        // 2. Add View Section
        const contentBody = document.querySelector(".content-body");
        if (contentBody) {
            const section = document.createElement("section");
            section.id = "prevention-view";
            section.className = "view-section";
            
            section.innerHTML = `
                <div class="dashboard-header">
                    <h2><i class="fa-solid fa-shield-halved"></i> AI Accident Prevention Hub</h2>
                    <p>Proactive monitoring for dangerous driving behaviors to prevent crashes before they happen.</p>
                </div>
                
                <div class="dashboard-grid" style="grid-template-columns: 2fr 1fr;">
                    <!-- Live Feed Monitor -->
                    <div class="glass-panel" style="position: relative;">
                        <h3 class="panel-title"><i class="fa-solid fa-video"></i> Pre-Crash Behavioral Analysis</h3>
                        <div style="height: 350px; background: #000; border-radius: 8px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            <img id="prev-video" src="assets/pre_crash_analysis.png" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" alt="Pre-Crash Dashcam View">
                            <div id="prev-overlay" style="position: absolute; top: 20px; left: 20px; padding: 10px; background: rgba(220,38,38,0.8); color: white; border-radius: 6px; font-weight: bold; display: none;">
                                <i class="fa-solid fa-triangle-exclamation"></i> OVER-SPEEDING DETECTED
                            </div>
                        </div>
                    </div>

                    <!-- Live Alerts -->
                    <div class="glass-panel">
                        <h3 class="panel-title"><i class="fa-solid fa-bell"></i> Prevention Alerts</h3>
                        <div id="prev-alerts-list" style="height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                            <div style="color: #94a3b8; font-size: 0.85rem; text-align: center; margin-top: 20px;">System monitoring...</div>
                        </div>
                    </div>
                    
                    <!-- Risk Heatmap (Full width below) -->
                    <div class="glass-panel" style="grid-column: 1 / -1;">
                        <h3 class="panel-title"><i class="fa-solid fa-map-location-dot"></i> Predictive Risk Heatmap</h3>
                        <div id="prev-heatmap" style="height: 300px; background: url('assets/prevention_heatmap.png') center/cover; border-radius: 8px; position: relative;">
                            <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;"><i class="fa-solid fa-fire"></i> High Risk Zone (Live)</div>
                        </div>
                    </div>
                </div>
            `;
            
            contentBody.appendChild(section);
        }
    }

    startLoop() {
        const scenarios = [
            { type: "Wrong-way driving", category: "High Risk", color: "#f59e0b" },
            { type: "Over-speeding", category: "Warning", color: "#eab308" },
            { type: "Sudden lane changes", category: "Immediate Attention", color: "#ef4444" },
            { type: "Red-light jumping", category: "Immediate Attention", color: "#ef4444" },
            { type: "Unsafe overtaking", category: "Warning", color: "#eab308" }
        ];

        setInterval(() => {
            // Only trigger if we are actively viewing the prevention tab (optional, but good for UX)
            const view = document.getElementById("prevention-view");
            if (view && !view.classList.contains("active")) return;

            const randomEvent = scenarios[Math.floor(Math.random() * scenarios.length)];
            this.triggerAlert(randomEvent);
        }, 8000);
    }

    triggerAlert(event) {
        // UI Overlay
        const overlay = document.getElementById("prev-overlay");
        if (overlay) {
            overlay.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${event.type.toUpperCase()}`;
            overlay.style.background = event.color;
            overlay.style.display = "block";
            setTimeout(() => overlay.style.display = "none", 3000);
        }

        // List update
        const list = document.getElementById("prev-alerts-list");
        if (list) {
            // Remove placeholder if present
            if (list.innerHTML.includes("System monitoring")) list.innerHTML = "";

            const item = document.createElement("div");
            item.style.padding = "10px";
            item.style.background = "rgba(15, 23, 42, 0.6)";
            item.style.borderLeft = `4px solid ${event.color}`;
            item.style.borderRadius = "4px";
            item.innerHTML = `
                <div style="font-weight: bold; font-size: 0.85rem; color: white;">${event.type}</div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">
                    <span>${event.category}</span>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
            `;
            list.prepend(item);
            
            if (list.children.length > 6) {
                list.removeChild(list.lastChild);
            }
        }
    }
}

setTimeout(() => {
    window.preventionAI = new PreventionAI();
}, 500);
