from fastapi import WebSocket
import json


async def send_json_data(websocket: WebSocket, json_data):
    """Send JSON data with a prefixed message type byte."""
    MESSAGE_TYPE = b"\x02"  # 0x02 = JSON
    json_bytes = json.dumps(json_data).encode("utf-8")  # Convert JSON to bytes
    await websocket.send(MESSAGE_TYPE + json_bytes)  # Prefix type before sending


async def websocket_handler(websocket: WebSocket, _):
    """WebSocket handler for multiple message types."""
    async for message in websocket:
        if message == "request_json":
            await send_json_data(websocket)
