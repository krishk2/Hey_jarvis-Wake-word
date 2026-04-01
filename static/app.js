let websocket;
let audioContext;
let audioWorkletNode;
let mediaStream;

const statusText = document.getElementById('status-text');
const micBtn = document.getElementById('mic-btn');
const orbContainer = document.querySelector('.orb-container');
const popupOverlay = document.getElementById('popup-overlay');
const closePopupBtn = document.getElementById('close-popup');

// Core Audio Processing: Convert browser audio to 16kHz PCM chunks
async function startMicrophone() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: 16000 // Request exactly 16kHz for OpenWakeWord
            } 
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(mediaStream);

        // We use a ScriptProcessorNode to chunk audio streams.
        // It's deprecated but still the most reliable cross-browser way without complex AudioWorklets
        const bufferSize = 1024; // Small buffer for low latency
        const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

        processor.onaudioprocess = (e) => {
            if (!websocket || websocket.readyState !== WebSocket.OPEN) return;

            // Extract exactly channel 0
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767) PCM format
            const int16Array = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
            }

            // Send binary raw audio chunk to Python Server
            websocket.send(int16Array.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        // Update UI
        micBtn.classList.add('hidden');
        orbContainer.classList.add('listening');
        statusText.innerText = "Listening closely...";

    } catch (err) {
        console.error('Error accessing mic:', err);
        statusText.innerText = "Microphone access denied.";
    }
}

// WebSocket Connection Management
function connectWebSocket() {
    // Determine the WS URL from current page URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/listen`;
    
    websocket = new WebSocket(wsUrl);
    websocket.binaryType = 'arraybuffer';

    websocket.onopen = () => {
        statusText.innerText = "Offline mode - Click button to enable microphone";
        console.log('WebSocket Connected to Python backend');
    };

    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'wakeword_detected') {
            console.log("Wake word detected! Score:", data.score);
            triggerPopup();
        }
    };

    websocket.onclose = () => {
        statusText.innerText = "Disconnected from server. Retrying...";
        if(orbContainer.classList.contains('listening')) {
            orbContainer.classList.remove('listening');
        }
        setTimeout(connectWebSocket, 3000); // Auto-reconnect
    };
}

function triggerPopup() {
    popupOverlay.classList.remove('hidden');
    orbContainer.classList.remove('listening'); // Pause visualizer
}

// UI Listeners
micBtn.addEventListener('click', () => {
    startMicrophone();
});

closePopupBtn.addEventListener('click', () => {
    popupOverlay.classList.add('hidden');
    // Resume visualizer
    if (mediaStream) {
        orbContainer.classList.add('listening');
    }
});

// Initialize connection on load
window.addEventListener('load', () => {
    connectWebSocket();
});
