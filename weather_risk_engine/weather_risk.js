/**
 * Weather-Aware Risk Prediction Module
 * Calculates a predictive risk score based on environmental conditions.
 */

class WeatherRiskEngine {
    constructor() {
        this.riskFactors = {
            rain: "Moderate",
            fog: "Low Visibility",
            wetness: "High",
            wind: "15 km/h"
        };
        
        this.injectUI();
        this.startEngine();
    }

    injectUI() {
        // Find the top header to inject weather status
        const headerActions = document.querySelector(".header-actions");
        
        if (headerActions) {
            const weatherWidget = document.createElement("div");
            weatherWidget.id = "weather-risk-widget";
            weatherWidget.style.display = "flex";
            weatherWidget.style.alignItems = "center";
            weatherWidget.style.gap = "8px";
            weatherWidget.style.padding = "5px 12px";
            weatherWidget.style.background = "rgba(220, 38, 38, 0.1)"; // Default to red tint for high risk
            weatherWidget.style.border = "1px solid rgba(220, 38, 38, 0.3)";
            weatherWidget.style.borderRadius = "20px";
            weatherWidget.style.marginRight = "15px";
            
            weatherWidget.innerHTML = `
                <i class="fa-solid fa-cloud-showers-heavy" style="color: #ef4444;"></i>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.6rem; color: #cbd5e1; text-transform: uppercase; font-weight: 600; line-height: 1;">Weather Risk</span>
                    <strong id="weather-risk-score" style="font-size: 0.8rem; color: #ef4444; line-height: 1.2;">78% (HIGH)</strong>
                </div>
            `;
            
            // Insert before the system clock
            const clock = document.getElementById("system-clock");
            if (clock) {
                headerActions.insertBefore(weatherWidget, clock);
            } else {
                headerActions.prepend(weatherWidget);
            }
        }
    }

    startEngine() {
        // Randomly fluctuate risk score every 10 seconds for demo
        setInterval(() => {
            const score = Math.floor(70 + Math.random() * 20); // 70 to 90
            let category = "HIGH";
            let color = "#ef4444";
            
            if (score > 85) {
                category = "CRITICAL";
                color = "#b91c1c";
            }
            
            const scoreEl = document.getElementById("weather-risk-score");
            const widget = document.getElementById("weather-risk-widget");
            if (scoreEl && widget) {
                scoreEl.textContent = `${score}% (${category})`;
                scoreEl.style.color = color;
                widget.style.background = `rgba(${color === '#ef4444' ? '220, 38, 38' : '185, 28, 28'}, 0.1)`;
                widget.style.border = `1px solid rgba(${color === '#ef4444' ? '220, 38, 38' : '185, 28, 28'}, 0.3)`;
            }
        }, 10000);
    }
}

setTimeout(() => {
    window.weatherRiskEngine = new WeatherRiskEngine();
}, 500);
