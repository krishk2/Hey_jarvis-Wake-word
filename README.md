<div align="center">
  <h1>🎙️ Mysaa Web Wake Word Engine</h1>
  <p><i>A real-time, browser-based wake word detection application built with FastAPI and openWakeWord.</i></p>
</div>

---

## 🌟 Overview

This is the web-based inference engine for the **Mysaa Wake Word Assistant**. It streams live audio from the browser's microphone over WebSockets to a FastAPI server, which processes the audio using the highly optimized `openWakeWord` library running ONNX models.

When the target wake word (e.g., "Hey Jarvis") is detected, the server instantly sends a WebSocket event back to the frontend, which displays a beautiful glassmorphic UI alert.

## ✨ Key Features

* **Real-Time Streaming:** Seamlessly streams 16kHz audio from the browser to the backend using WebSockets.
* **Low Latency:** Uses `asyncio.to_thread` for non-blocking ONNX model inference.
* **Modern Interface:** A sleek, responsive, glassmorphic UI equipped with an animated listening orb.
* **Plug-and-Play Models:** Easily swap between different `openWakeWord` models.

## 📂 Structure

```text
webapp/
├── server.py             # FastAPI WebSocket server and ONNX inference logic
├── hey_jarvis_v0.1.onnx  # Pre-trained wake word ONNX model
├── requirements.txt      # Python dependencies
└── static/               
    ├── index.html        # Main glassmorphic frontend
    ├── styles.css        # Animations and CSS styling
    └── app.js            # Audio capture and WebSocket logic
```

## 🚀 Getting Started

### 1. Requirements

Ensure you have Python 3.8+ installed. Install the dependencies:
```bash
pip install -r requirements.txt
```
*(Dependencies generally include `fastapi`, `uvicorn`, `openwakeword`, and `numpy`)*

### 2. Running the Server

Start the FastAPI application via Uvicorn:
```bash
python server.py
```

### 3. Usage

1. Open your browser and navigate to `http://localhost:8000/static/index.html`
2. Click **Enable Microphone** to allow the browser to capture audio.
3. Speak the wake word (e.g., **"Hey Jarvis"**).
4. The frontend orb will react, and if the word is detected above the confidence threshold, a glassmorphic popup modal will appear!

## 🔧 Customization

* **Change the Wake Word:** To use a custom word like "Mysaa", generate a new ONNX model using `openWakeWord`'s text-to-wakeword generator. Swap the `.onnx` file and update `server.py` and `index.html`.
* **Threshold Adjustment:** If you're experiencing false positives, you can adjust the detection threshold in `server.py` (currently set to `> 0.5`).
