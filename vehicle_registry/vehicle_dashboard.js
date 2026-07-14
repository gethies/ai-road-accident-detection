class VehicleRegistryDashboard {
    constructor() {
        this.database = [];
        this.lookupHistory = [];
        this.init();
    }

    async init() {
        await this.loadDatabase();
        this.injectUI();
        this.attachEventListeners();
        this.hookIntoDetectionSystem();
    }

    async loadDatabase() {
        try {
            const response = await fetch('vehicle_registry/vehicle_database.json');
            this.database = await response.json();
        } catch (error) {
            console.error("Error loading vehicle database:", error);
            this.database = [];
        }
    }

    injectUI() {
        // Find the right panel to inject our dashboard
        const rightPanel = document.querySelector(".panel-right");
        if (!rightPanel) {
            console.error("Right panel not found for Vehicle Registry injection.");
            return;
        }

        const dashboardHTML = `
            <div class="card glass-panel vehicle-registry-card" id="vehicle-registry-panel" style="margin-top: 15px; border-color: #3b82f6;">
                <div class="card-header border-bottom" style="border-bottom-color: rgba(59, 130, 246, 0.3);">
                    <h3><i class="fa-solid fa-id-card text-primary"></i> Vehicle Owner Identification (Demo)</h3>
                    <div style="display: flex; gap: 10px;">
                        <button id="vr-export-pdf" class="btn btn-secondary btn-sm"><i class="fa-solid fa-file-pdf"></i> Export PDF</button>
                    </div>
                </div>
                <div class="card-body" id="vr-report-content" style="background: rgba(15, 23, 42, 0.4); padding: 15px;">
                    
                    <!-- Search & Filter Controls -->
                    <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 200px;">
                            <div style="position: relative;">
                                <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 10px; color: #94a3b8;"></i>
                                <input type="text" id="vr-search-plate" placeholder="Enter Vehicle Number (e.g. TN22AB1234)" 
                                       style="width: 100%; padding: 8px 8px 8px 30px; background: rgba(0,0,0,0.4); border: 1px solid #334155; color: white; border-radius: 4px; text-transform: uppercase;">
                            </div>
                        </div>
                        <div style="flex: 0 0 150px;">
                            <input type="date" id="vr-filter-date" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.4); border: 1px solid #334155; color: white; border-radius: 4px;">
                        </div>
                        <button id="vr-search-btn" class="btn btn-primary"><i class="fa-solid fa-search"></i> Lookup</button>
                    </div>

                    <!-- Detection Confidence Indicator (Hidden by default) -->
                    <div id="vr-confidence-bar" style="display: none; margin-bottom: 15px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; border-left: 4px solid #10b981;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-size: 0.8rem; color: #cbd5e1;">ANPR Detection Confidence</span>
                            <span id="vr-confidence-score" style="font-weight: bold; color: #10b981;">98.5%</span>
                        </div>
                        <div style="width: 100%; background: #334155; height: 6px; border-radius: 3px; overflow: hidden;">
                            <div id="vr-confidence-fill" style="width: 98.5%; background: #10b981; height: 100%;"></div>
                        </div>
                    </div>

                    <!-- Owner Info Table -->
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
                            <thead>
                                <tr style="background: rgba(59, 130, 246, 0.1); border-bottom: 1px solid rgba(59, 130, 246, 0.3);">
                                    <th style="padding: 10px; color: #94a3b8;">Vehicle Number</th>
                                    <th style="padding: 10px; color: #94a3b8;">Owner Name</th>
                                    <th style="padding: 10px; color: #94a3b8;">Phone Number</th>
                                    <th style="padding: 10px; color: #94a3b8;">Address</th>
                                    <th style="padding: 10px; color: #94a3b8;">Type</th>
                                    <th style="padding: 10px; color: #94a3b8;">Emergency Contact</th>
                                    <th style="padding: 10px; color: #94a3b8;">Status</th>
                                </tr>
                            </thead>
                            <tbody id="vr-table-body">
                                <tr>
                                    <td colspan="7" style="padding: 15px; text-align: center; color: #64748b; font-style: italic;">
                                        Waiting for ANPR detection or manual lookup...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Action Area -->
                    <div id="vr-action-area" style="margin-top: 15px; display: none; text-align: right;">
                        <button id="vr-notify-btn" class="btn btn-danger">
                            <i class="fa-solid fa-bell"></i> Notify Emergency Contact
                        </button>
                    </div>

                    <!-- Lookup History -->
                    <div style="margin-top: 20px; border-top: 1px solid #334155; padding-top: 10px;">
                        <h4 style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 10px;"><i class="fa-solid fa-clock-rotate-left"></i> Recent Lookups</h4>
                        <ul id="vr-history-list" style="list-style: none; padding: 0; margin: 0; font-size: 0.75rem; color: #94a3b8; max-height: 80px; overflow-y: auto;">
                            <li>No history yet.</li>
                        </ul>
                    </div>

                </div>
            </div>
        `;

        // Append to right panel
        // Find the alerts panel and inject before it if it exists
        const alertsPanel = document.getElementById("alerts-panel");
        if (alertsPanel) {
            alertsPanel.insertAdjacentHTML('beforebegin', dashboardHTML);
        } else {
            rightPanel.insertAdjacentHTML('beforeend', dashboardHTML);
        }
    }

    attachEventListeners() {
        const searchBtn = document.getElementById("vr-search-btn");
        const searchInput = document.getElementById("vr-search-plate");
        const exportBtn = document.getElementById("vr-export-pdf");
        const notifyBtn = document.getElementById("vr-notify-btn");

        if (searchBtn) {
            searchBtn.addEventListener("click", () => {
                const plate = searchInput.value.trim().toUpperCase();
                if (plate) {
                    this.performLookup(plate, false);
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    const plate = searchInput.value.trim().toUpperCase();
                    if (plate) {
                        this.performLookup(plate, false);
                    }
                }
            });
        }

        if (notifyBtn) {
            notifyBtn.addEventListener("click", () => {
                const originalText = notifyBtn.innerHTML;
                notifyBtn.innerHTML = '<i class="fa-solid fa-check"></i> SMS Alert Sent!';
                notifyBtn.classList.remove('btn-danger');
                notifyBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    notifyBtn.innerHTML = originalText;
                    notifyBtn.classList.remove('btn-success');
                    notifyBtn.classList.add('btn-danger');
                }, 3000);
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                this.exportToPDF();
            });
        }
    }

    hookIntoDetectionSystem() {
        // Hook into the global activateAlertConsole function if it exists
        if (typeof window !== 'undefined') {
            const originalActivate = window.activateAlertConsole;
            
            window.activateAlertConsole = () => {
                // Call original
                if (typeof originalActivate === 'function') {
                    originalActivate();
                }
                
                // Trigger our ANPR simulation
                console.log("[Vehicle Registry] Accident detected, triggering ANPR simulation...");
                this.simulateAutomaticDetection();
            };
        }
    }

    simulateAutomaticDetection() {
        // Pick a random plate from the DB to simulate detection
        if (this.database.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.database.length);
        const selectedRecord = this.database[randomIndex];
        
        // Show confidence bar
        const confidenceBar = document.getElementById("vr-confidence-bar");
        const confidenceScore = document.getElementById("vr-confidence-score");
        const confidenceFill = document.getElementById("vr-confidence-fill");
        
        if (confidenceBar) {
            const randomConfidence = (85 + Math.random() * 14).toFixed(1); // 85% to 99%
            confidenceScore.textContent = \`\${randomConfidence}%\`;
            confidenceFill.style.width = \`\${randomConfidence}%\`;
            confidenceBar.style.display = 'block';
        }

        // Perform lookup
        this.performLookup(selectedRecord.plate, true);
    }

    performLookup(plateNumber, isAutomatic = false) {
        const tbody = document.getElementById("vr-table-body");
        const actionArea = document.getElementById("vr-action-area");
        
        if (!tbody) return;

        // Find record
        const record = this.database.find(v => v.plate === plateNumber);
        const timestamp = new Date().toLocaleTimeString();
        
        if (record) {
            // Found
            tbody.innerHTML = \`
                <tr style="background: rgba(16, 185, 129, 0.1);">
                    <td style="padding: 10px; font-weight: bold; color: white;">\${record.plate}</td>
                    <td style="padding: 10px; color: white;">\${record.owner}</td>
                    <td style="padding: 10px; color: #93c5fd;">\${record.phone}</td>
                    <td style="padding: 10px;">\${record.address}</td>
                    <td style="padding: 10px;">\${record.type}</td>
                    <td style="padding: 10px; color: #f87171; font-weight: bold;">\${record.emergencyContact}</td>
                    <td style="padding: 10px;">
                        <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">\${record.status}</span>
                    </td>
                </tr>
            \`;
            
            if (actionArea) actionArea.style.display = 'block';
            this.addToHistory(\`[\${timestamp}] \${isAutomatic ? 'AUTO-DETECT' : 'MANUAL'}: Found owner for \${plateNumber}\`);
        } else {
            // Not Found
            tbody.innerHTML = \`
                <tr style="background: rgba(239, 68, 68, 0.1);">
                    <td style="padding: 10px; font-weight: bold; color: white;">\${plateNumber}</td>
                    <td style="padding: 10px; color: #94a3b8;">Not Available</td>
                    <td style="padding: 10px; color: #94a3b8;">Not Available</td>
                    <td style="padding: 10px; color: #94a3b8;">Not Available</td>
                    <td style="padding: 10px; color: #94a3b8;">--</td>
                    <td style="padding: 10px; color: #94a3b8;">--</td>
                    <td style="padding: 10px;">
                        <span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">Record Not Found</span>
                    </td>
                </tr>
            \`;
            
            if (actionArea) actionArea.style.display = 'none';
            this.addToHistory(\`[\${timestamp}] \${isAutomatic ? 'AUTO-DETECT' : 'MANUAL'}: No record found for \${plateNumber}\`);
        }
    }

    addToHistory(message) {
        this.lookupHistory.unshift(message);
        if (this.lookupHistory.length > 5) {
            this.lookupHistory.pop();
        }
        
        const historyList = document.getElementById("vr-history-list");
        if (historyList) {
            historyList.innerHTML = this.lookupHistory.map(msg => \`<li style="margin-bottom: 4px;">\${msg}</li>\`).join('');
        }
    }

    exportToPDF() {
        if (typeof html2pdf === 'undefined') {
            alert("PDF export library is still loading. Please try again in a moment.");
            return;
        }

        const element = document.getElementById('vr-report-content');
        if (!element) return;
        
        // Clone element to avoid modifying the live DOM
        const clone = element.cloneNode(true);
        
        // Hide action buttons in the PDF
        const actionArea = clone.querySelector('#vr-action-area');
        if (actionArea) actionArea.style.display = 'none';
        
        // Hide search inputs
        const searchControls = clone.querySelector('div[style*="margin-bottom: 15px"]');
        if (searchControls) searchControls.style.display = 'none';

        // Add a title to the PDF
        const title = document.createElement('h2');
        title.style.color = 'black';
        title.textContent = 'Vehicle Owner Identification Report';
        clone.insertBefore(title, clone.firstChild);
        
        // Force background and colors for PDF readability
        clone.style.background = 'white';
        clone.style.color = 'black';
        const cells = clone.querySelectorAll('td, th, span');
        cells.forEach(c => {
            if (c.style) c.style.color = 'black';
        });

        const opt = {
            margin:       1,
            filename:     'Vehicle_Owner_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(clone).save();
    }
}

// Initialize
setTimeout(() => {
    window.vehicleRegistry = new VehicleRegistryDashboard();
}, 500);
