/**
 * Ambulance Route Optimization Module
 * Displays an optimized route on the map for dispatched ambulances.
 */

class RouteOptimizer {
    constructor() {
        this.routeLayer = null;
        this.ambulanceMarker = null;
        this.initHook();
        this.injectUI();
    }

    initHook() {
        const originalAlert = window.activateAlertConsole;
        window.activateAlertConsole = (severity, location, logId) => {
            if (originalAlert) originalAlert(severity, location, logId);
            this.optimizeRoute();
        };
    }

    injectUI() {
        // Find a place to inject the widget in the Analytics view map area
        const mapContainer = document.querySelector(".map-container") || document.getElementById("map")?.parentElement;
        
        if (mapContainer) {
            const routePanel = document.createElement("div");
            routePanel.id = "route-optimizer-panel";
            routePanel.style.position = "absolute";
            routePanel.style.top = "10px";
            routePanel.style.right = "10px";
            routePanel.style.zIndex = "1000";
            routePanel.style.padding = "15px";
            routePanel.style.background = "rgba(15, 23, 42, 0.9)";
            routePanel.style.backdropFilter = "blur(8px)";
            routePanel.style.border = "1px solid rgba(59, 130, 246, 0.5)";
            routePanel.style.borderRadius = "8px";
            routePanel.style.display = "none";
            routePanel.style.minWidth = "220px";
            routePanel.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3)";
            
            routePanel.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <i class="fa-solid fa-route" style="color: #3b82f6; margin-right: 8px;"></i>
                    <h4 style="color: white; margin: 0; font-size: 0.85rem;">Live Route Optimization</h4>
                </div>
                <div id="route-details-content" style="font-size: 0.75rem; color: #cbd5e1;">
                    Calculating fastest route...
                </div>
            `;
            
            mapContainer.style.position = "relative";
            mapContainer.appendChild(routePanel);
        }
    }

    optimizeRoute() {
        const panel = document.getElementById("route-optimizer-panel");
        if (panel) panel.style.display = "block";

        if (!window.mapInstance) return;
        const map = window.mapInstance;

        // Mock coordinates for an accident in Chennai and a nearby hospital
        const accidentLat = 13.0827;
        const accidentLng = 80.2707;
        const hospitalLat = 13.0620;
        const hospitalLng = 80.2500;

        // Clear existing route if any
        if (this.routeLayer) {
            map.removeLayer(this.routeLayer);
        }
        if (this.ambulanceMarker) {
            map.removeLayer(this.ambulanceMarker);
        }

        // Draw a simple polyline to simulate a route
        const latlngs = [
            [hospitalLat, hospitalLng],
            [13.0700, 80.2600],
            [13.0780, 80.2650],
            [accidentLat, accidentLng]
        ];

        this.routeLayer = L.polyline(latlngs, {color: '#3b82f6', weight: 4, dashArray: '5, 10', opacity: 0.8}).addTo(map);
        
        // Add Ambulance Marker
        const ambulanceIcon = L.divIcon({
            html: '<i class="fa-solid fa-truck-medical" style="color: #ef4444; font-size: 1.2rem; background: white; border-radius: 50%; padding: 4px; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></i>',
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        this.ambulanceMarker = L.marker([hospitalLat, hospitalLng], {icon: ambulanceIcon}).addTo(map);

        // Update UI
        const content = document.getElementById("route-details-content");
        if (content) {
            content.innerHTML = `
                <div style="margin-top: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Distance:</span> <strong style="color: white;">4.2 km</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>ETA:</span> <strong style="color: #ef4444;">8 mins</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Traffic:</span> <strong style="color: #f59e0b;">Moderate Delay</strong>
                    </div>
                    <div style="margin-top: 8px; color: #10b981; font-weight: 600;">
                        <i class="fa-solid fa-truck-fast"></i> Ambulance Dispatched
                    </div>
                </div>
            `;
        }

        // Animate marker (basic mock animation)
        let step = 0;
        const animate = setInterval(() => {
            step++;
            if (step >= latlngs.length) {
                clearInterval(animate);
                if (content) {
                    content.innerHTML = `<div style="color: #10b981; font-weight: 600; padding: 10px 0;"><i class="fa-solid fa-location-dot"></i> Arrived at Scene</div>`;
                }
                return;
            }
            this.ambulanceMarker.setLatLng(latlngs[step]);
        }, 3000);
    }
}

setTimeout(() => {
    window.routeOptimizer = new RouteOptimizer();
}, 500);
