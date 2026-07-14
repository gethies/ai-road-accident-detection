/**
 * Voice Emergency Assistant Module
 * AI voice assistant for emergency response announcements.
 */

class VoiceAssistant {
    constructor() {
        this.synth = window.speechSynthesis;
        this.isMuted = true; // Default muted so it doesn't scare the user on load
        this.language = "en-US";
        
        this.initHook();
        this.injectUI();
    }

    injectUI() {
        const headerActions = document.querySelector(".header-actions");
        if (headerActions) {
            const voiceWidget = document.createElement("div");
            voiceWidget.id = "voice-assistant-widget";
            voiceWidget.style.display = "flex";
            voiceWidget.style.alignItems = "center";
            voiceWidget.style.gap = "8px";
            voiceWidget.style.marginRight = "15px";
            voiceWidget.style.cursor = "pointer";
            
            voiceWidget.innerHTML = `
                <button id="va-mute-btn" class="btn btn-secondary btn-sm" style="border-radius: 20px; padding: 4px 10px; font-size: 0.75rem;">
                    <i class="fa-solid fa-volume-xmark"></i> Voice Off
                </button>
                <select id="va-lang-select" style="background: #1e293b; color: white; border: 1px solid #334155; border-radius: 4px; font-size: 0.7rem; padding: 2px 4px;">
                    <option value="en-US">English</option>
                    <option value="ta-IN">Tamil (ta-IN)</option>
                </select>
            `;
            
            headerActions.prepend(voiceWidget);
            
            document.getElementById("va-mute-btn").addEventListener("click", (e) => {
                this.isMuted = !this.isMuted;
                const btn = e.currentTarget;
                if (this.isMuted) {
                    btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Voice Off';
                    btn.style.background = "#334155";
                    this.synth.cancel();
                } else {
                    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Voice On';
                    btn.style.background = "#10b981";
                    this.speak("Voice assistant activated.");
                }
            });
            
            document.getElementById("va-lang-select").addEventListener("change", (e) => {
                this.language = e.target.value;
                if (!this.isMuted) this.speak("Language changed.");
            });
        }
    }

    initHook() {
        const originalAlert = window.activateAlertConsole;
        window.activateAlertConsole = (severity, location, logId) => {
            if (originalAlert) originalAlert(severity, location, logId);
            
            if (!this.isMuted) {
                // Queue the announcements
                this.speak(`Accident detected near ${location}.`);
                setTimeout(() => this.speak(`Severity classified as ${severity}.`), 2000);
                setTimeout(() => this.speak(`Nearest hospital selected. Ambulance dispatched successfully.`), 4000);
            }
        };
    }

    speak(text) {
        if (this.isMuted) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.language;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Basic Tamil mock translation if selected
        if (this.language === "ta-IN") {
            if (text.includes("Accident detected")) utterance.text = "விபத்து கண்டறியப்பட்டுள்ளது.";
            if (text.includes("Severity")) utterance.text = "தீவிர நிலை அறிவிக்கப்பட்டுள்ளது.";
            if (text.includes("hospital")) utterance.text = "ஆம்புலன்ஸ் அனுப்பப்பட்டுள்ளது.";
        }
        
        this.synth.speak(utterance);
    }
}

setTimeout(() => {
    window.voiceAssistant = new VoiceAssistant();
}, 500);
