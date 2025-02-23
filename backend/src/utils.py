from fastapi import WebSocket
import json

async def stream_audio(websocket: WebSocket, full_audio):
    """Stream MP3 audio with a prefixed message type byte."""
    MESSAGE_TYPE = b'\x01'  # 0x01 = Audio
    await websocket.send(MESSAGE_TYPE + full_audio)

async def send_json_data(websocket: WebSocket, json_data):
    """Send JSON data with a prefixed message type byte."""
    MESSAGE_TYPE = b'\x02'  # 0x02 = JSON
    json_bytes = json.dumps(json_data).encode("utf-8")  # Convert JSON to bytes
    await websocket.send(MESSAGE_TYPE + json_bytes)  # Prefix type before sending

async def websocket_handler(websocket: WebSocket, _):
    """WebSocket handler for multiple message types."""
    async for message in websocket:
        if message == "request_audio":
            # Example: Simulated MP3 iterator
            def generate_audio_iterator():
                with open("sample.mp3", "rb") as f:
                    while chunk := f.read(1024):  # Read in 1KB chunks
                        yield chunk

            audio_iterator = generate_audio_iterator()
            await stream_audio(websocket, audio_iterator)

        elif message == "request_json":
            await send_json_data(websocket)
