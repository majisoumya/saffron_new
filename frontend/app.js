// If opened as a local file (C:/...), point to the backend. Otherwise use relative.
const API_BASE_URL = window.location.protocol === "file:" ? "http://127.0.0.1:8001" : "";

// Max expected values for gauge calculation
const MAX_TEMP = 50;
const MAX_HUM = 100;
const MAX_MOIST = 100;
const MAX_CO2 = 2000;
const MAX_LIGHT = 2000;

function updateGauge(gaugeClass, value, maxVal) {
    const fill = document.querySelector(`.${gaugeClass}`);
    if (!fill) return;

    const dasharray = fill.getTotalLength(); // 🔥 correct length

    value = Number(value);

    let percentage = value / maxVal;
    percentage = Math.max(0, Math.min(percentage, 1));

    const offset = dasharray * (1 - percentage);

    fill.style.strokeDasharray = dasharray;
    fill.style.strokeDashoffset = offset;
}

async function fetchSensorData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/sensors`);
        if (response.ok) {
            const data = await response.json();
            
            if (data && !data.error) {
                // Update text values
                document.getElementById('val-temp').innerText = data.temperature.toFixed(1);
                document.getElementById('val-hum').innerText = data.humidity.toFixed(1);
                document.getElementById('val-moist').innerText = data.moisture;
                document.getElementById('val-air').innerText = data.co2; // CO2 mapped to Air Quality Gauge
                document.getElementById('val-light').innerText = data.light;

                // Update Gauges visually
                updateGauge('temp-fill', data.temperature, MAX_TEMP);
                updateGauge('hum-fill', data.humidity, MAX_HUM);
                updateGauge('moist-fill', data.moisture, MAX_MOIST);
                updateGauge('air-fill', data.co2, MAX_CO2);
                updateGauge('light-fill', data.light, MAX_LIGHT);

                // Make the connection dot glow solidly
                const connectionDot = document.getElementById('connection-dot');
                if(connectionDot) connectionDot.classList.add('connected');
                const connectionStatus = document.getElementById('connection-status');
                if(connectionStatus) connectionStatus.innerText = "Live Data";
            } else {
                console.warn("No data in database yet:", data.error);
                
                // Clear the default values to show it's actually empty!
                document.getElementById('val-temp').innerText = "0.0";
                document.getElementById('val-hum').innerText = "0.0";
                document.getElementById('val-moist').innerText = "0";
                document.getElementById('val-air').innerText = "0"; 
                document.getElementById('val-light').innerText = "0";

                updateGauge('temp-fill', 0, MAX_TEMP);
                updateGauge('hum-fill', 0, MAX_HUM);
                updateGauge('moist-fill', 0, MAX_MOIST);
                updateGauge('air-fill', 0, MAX_CO2);
                updateGauge('light-fill', 0, MAX_LIGHT);

                const connectionStatus = document.getElementById('connection-status');
                if(connectionStatus) connectionStatus.innerText = "DB Empty. Turn on ESP32!";
            }
        }
    } catch (error) {
        console.error("Error fetching sensor data:", error);
        
        const connectionDot = document.getElementById('connection-dot');
        if(connectionDot) connectionDot.classList.remove('connected');
        const connectionStatus = document.getElementById('connection-status');
        if(connectionStatus) connectionStatus.innerText = "Reconnecting...";
    }
}

// Function to update actuators in the database
async function updateActuators(payload) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/actuators`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            console.error("Failed to update actuators on server");
        }
    } catch (error) {
        console.error("Error updating actuators:", error);
    }
}

// Function to fetch growth prediction from the API
async function fetchGrowthPrediction() {
    const phaseSelector = document.getElementById('phase-selector');
    if (!phaseSelector) return;
    const phase = phaseSelector.value;
    
    const statusText = document.getElementById('ai-status-text');
    if (statusText) statusText.innerText = "Analyzing live telemetry...";
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/predict?phase=${phase}`);
        if (response.ok) {
            const data = await response.json();
            if (data && !data.error) {
                const growthRate = data.predicted_growth;
                document.getElementById('growth-pred-val').innerText = `${growthRate}`;
                
                const gaugePath = document.getElementById('ai-gauge-path');
                if (gaugePath) {
                    const maxDash = 126;
                    // Prevent pushing beyond 100 or below 0 visually
                    const clampedRate = Math.min(Math.max(growthRate, 0), 100);
                    const offset = maxDash - (maxDash * clampedRate / 100);
                    gaugePath.style.strokeDashoffset = offset;
                }
                
                if (statusText) {
                    if (growthRate >= 80) statusText.innerHTML = "Optimal trajectory. Sensor parameters ideal.";
                    else if (growthRate >= 50) statusText.innerHTML = "Moderate growth. Optimize environment for better yield.";
                    else statusText.innerHTML = "Growth restricted! Check ambient parameters.";
                }
            } else {
                handleAiError(statusText);
            }
        } else {
            handleAiError(statusText);
        }
    } catch (error) {
        console.error("Error fetching prediction data:", error);
        handleAiError(statusText);
    }
}

let growthChartInstance = null;

async function fetchGrowthHistory() {
    const phaseSelector = document.getElementById('phase-selector');
    const phase = phaseSelector ? phaseSelector.value : 'phase1';

    try {
        const response = await fetch(`${API_BASE_URL}/api/history?phase=${phase}`);
        if (response.ok) {
            const data = await response.json();
            if (data && !data.error && data.length > 0) {
                const labels = data.map(item => item.date);
                const actualData = data.map(item => item.actual);
                const predictedData = data.map(item => item.predicted);

                const ctx = document.getElementById('envChart');
                if (!ctx) return;

                if (growthChartInstance) {
                    growthChartInstance.data.labels = labels;
                    growthChartInstance.data.datasets[0].data = actualData;
                    growthChartInstance.data.datasets[1].data = predictedData;
                    growthChartInstance.update();
                } else {
                    growthChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: 'Actual',
                                    data: actualData,
                                    borderColor: '#65a30d',
                                    backgroundColor: '#65a30d',
                                    borderWidth: 2,
                                    pointBackgroundColor: '#65a30d',
                                    pointRadius: 4,
                                    tension: 0.3
                                },
                                {
                                    label: 'Predicted',
                                    data: predictedData,
                                    borderColor: '#0284c7',
                                    backgroundColor: '#0284c7',
                                    borderWidth: 2,
                                    borderDash: [5, 5],
                                    pointBackgroundColor: '#0284c7',
                                    pointRadius: 4,
                                    tension: 0.3
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    labels: {
                                        usePointStyle: true,
                                        boxWidth: 8
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: false,
                                    suggestedMin: Math.min(...actualData, ...predictedData) - 2,
                                    suggestedMax: Math.max(...actualData, ...predictedData) + 2,
                                    grid: {
                                        color: '#f1f5f9'
                                    }
                                },
                                x: {
                                    grid: {
                                        display: false
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error fetching growth history:", error);
    }
}

function handleAiError(statusText) {
    document.getElementById('growth-pred-val').innerText = `--%`;
    const gaugePath = document.getElementById('ai-gauge-path');
    if (gaugePath) gaugePath.style.strokeDashoffset = 126;
    if (statusText) statusText.innerText = "Sync failure. Retrying connectivity...";
}

// Global UI state
let isAutoMode = false;

// Theme Initialization and Toggle
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const icon = themeBtn ? themeBtn.querySelector('i') : null;
    
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        root.setAttribute('data-theme', 'light');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isLight = root.getAttribute('data-theme') === 'light';
            if (isLight) {
                root.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
                if (icon) {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            } else {
                root.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if (icon) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }
        });
    }
}

// Setup Event Listeners for UI Controls
function initActuatorControls() {
    const mistBtn = document.getElementById('btn-mist');
    const fanBtn = document.getElementById('btn-fan');
    const lightSlider = document.getElementById('light-slider');
    const modeToggle = document.getElementById('mode-toggle');
    const autoOverlay = document.getElementById('auto-overlay');

    // Helper to toggle a generic button
    const toggleButton = (btnElement, actuatorKey) => {
        if (isAutoMode) return; // Prevent manual change in auto mode
        
        const isCurrentlyOn = btnElement.classList.contains('on');
        const newState = !isCurrentlyOn;
        
        if (newState) {
            btnElement.classList.remove('off');
            btnElement.classList.add('on');
            btnElement.innerText = "ON";
        } else {
            btnElement.classList.remove('on');
            btnElement.classList.add('off');
            btnElement.innerText = "OFF";
        }
        
        // Send state to backend
        updateActuators({ [actuatorKey]: newState });
    };

    const uvBtn = document.getElementById('btn-uv');
    const exhaustBtn = document.getElementById('btn-exhaust');

    if (mistBtn) {
        mistBtn.addEventListener('click', () => toggleButton(mistBtn, 'mist_maker'));
    }

    if (fanBtn) {
        fanBtn.addEventListener('click', () => toggleButton(fanBtn, 'cooling_fan'));
    }

    if (uvBtn) {
        uvBtn.addEventListener('click', () => toggleButton(uvBtn, 'relay3'));
    }

    if (exhaustBtn) {
        exhaustBtn.addEventListener('click', () => toggleButton(exhaustBtn, 'relay4'));
    }

    if (lightSlider) {
        lightSlider.addEventListener('change', (e) => {
            if (isAutoMode) return;
            const val = parseInt(e.target.value);
            document.getElementById('light-val-display').innerText = `(${val})`;
            updateActuators({ grow_light_pwm: val });
        });
    }

    if (modeToggle) {
        modeToggle.addEventListener('change', (e) => {
            isAutoMode = !e.target.checked; // HTML says "MANUAL (off) ---- AUTO (checked)"
            
            if (isAutoMode) {
                if (autoOverlay) autoOverlay.classList.remove('hidden');
            } else {
                if (autoOverlay) autoOverlay.classList.add('hidden');
            }
            
            updateActuators({ auto_mode: isAutoMode });
        });
    }
}

// Fetch initial actuator states on page load
async function fetchActuators() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/actuators`);
        if (response.ok) {
            const data = await response.json();
            if (data && !data.error) {
                
                const mistBtn = document.getElementById('btn-mist');
                const fanBtn = document.getElementById('btn-fan');
                const uvBtn = document.getElementById('btn-uv');
                const exhaustBtn = document.getElementById('btn-exhaust');
                const lightSlider = document.getElementById('light-slider');
                const modeToggle = document.getElementById('mode-toggle');
                
                const setToggleState = (btn, isOn) => {
                    if(!btn) return;
                    if (isOn) {
                        btn.classList.remove('off');
                        btn.classList.add('on');
                        btn.innerText = "ON";
                    } else {
                        btn.classList.remove('on');
                        btn.classList.add('off');
                        btn.innerText = "OFF";
                    }
                };

                setToggleState(mistBtn, data.mist_maker);
                setToggleState(fanBtn, data.cooling_fan);
                setToggleState(uvBtn, data.relay3);
                setToggleState(exhaustBtn, data.relay4);

                if (lightSlider && data.grow_light_pwm !== undefined) {
                    lightSlider.value = data.grow_light_pwm;
                    document.getElementById('light-val-display').innerText = `(${data.grow_light_pwm})`;
                }

                if (modeToggle) {
                    modeToggle.checked = !data.auto_mode; 
                    isAutoMode = data.auto_mode;
                    const autoOverlay = document.getElementById('auto-overlay');
                    if (isAutoMode) {
                        if (autoOverlay) autoOverlay.classList.remove('hidden');
                    } else {
                        if (autoOverlay) autoOverlay.classList.add('hidden');
                    }
                }
            }
        }
    } catch(e) {
        console.error("Failed to load initial actuators", e);
    }
}

// Fetch data as soon as the window loads
window.onload = () => {
    initTheme();
    initActuatorControls();
    fetchActuators();
    
    fetchSensorData();
    fetchGrowthPrediction();
    fetchGrowthHistory();
    
    // Fetch new data every 3 seconds
    setInterval(() => {
        fetchSensorData();
        fetchGrowthPrediction();
    }, 3000);

    const phaseSelector = document.getElementById('phase-selector');
    if (phaseSelector) {
        // Load saved phase if available
        const savedPhase = localStorage.getItem('activePhase');
        if (savedPhase) {
            phaseSelector.value = savedPhase;
        }

        phaseSelector.addEventListener('change', (e) => {
            localStorage.setItem('activePhase', e.target.value);
            fetchGrowthPrediction();
            fetchGrowthHistory();
        });
    }
};
