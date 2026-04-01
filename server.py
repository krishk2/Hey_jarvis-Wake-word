import asyncio
import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from openwakeword.model import Model

app = FastAPI(title="Mysaa Wake Word Engine")

# Mount the static frontend files
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# Initialize openWakeWord Model
# NOTE: To use "mysaa" specifically, you will generate a custom model using openWakeWord's text-to-wakeword generator.
import os

try:
    print("Loading wake word engine (ONNX Version)...")
    oww_model = Model(wakeword_models=["hey_jarvis"], inference_framework="onnx") 
except Exception as e:
    print(f"Failed to load OpenWakeWord model: {e}")

@app.websocket("/listen")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected via WebSocket!")
    
    try:
        while True:
            # Receive binary audio chunks from the browser
            data = await websocket.receive_bytes()
            
            # Convert bytes to 16-bit PCM numpy array
            chunk = np.frombuffer(data, dtype=np.int16)
            
            # Run inference in a background thread to prevent blocking
            # The browser streams 16kHz audio, which openWakeWord perfectly expects
            prediction = await asyncio.to_thread(oww_model.predict, chunk)
            
            # Check scores
            for mdl in oww_model.prediction_buffer.keys():
                score = oww_model.prediction_buffer[mdl][-1]
                
                # If confidence threshold is met
                if score > 0.5:
                    print(f"WAKE WORD DETECTED! Model: {mdl}, Score: {score}")
                    
                    # Send alert to frontend
                    await websocket.send_json({"event": "wakeword_detected", "score": float(score)})
                    
                    # Reset prediction buffer to prevent rapid double-triggers
                    oww_model.reset()
                    
    except WebSocketDisconnect:
        print("Client disconnected.")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
