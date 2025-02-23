import uuid
import time
import json
import asyncio
from src.config.llm_config import llm_config_handler
from src.config.logging_config import logger
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional
from src.api.workflows.session_manager import SessionManager
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import play

load_dotenv()
client = ElevenLabs()

router = APIRouter()

session_storage = llm_config_handler.get_workflow_storage("sessions")

class SessionRequest(BaseModel):
    topic: str

class SessionResponse(BaseModel):
    session_id: str

@router.post("/session", response_model=SessionResponse)
async def create_new_session(session_request: SessionRequest):
    """Creates a new session and returns the session ID."""
    session_id = str(uuid.uuid4())
    # init session
    session_handler = SessionManager(
        session_id=session_id,
        storage=session_storage

    )
    session_handler.session_state['is_validated'] = True
    return SessionResponse(
        session_id=session_handler.session_id
    )


@router.websocket("/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Handles WebSocket connections and requires a valid session ID."""
    session_handler = SessionManager(
        session_id=session_id,
        storage=session_storage

    )
    is_validated = session_handler.session_state.get("is_validated")
    # check if session is not initialized or missing topic, reject
    if not is_validated:
        await websocket.close(code=1008)  # Policy violation code
        return
    
    await websocket.accept()
    
    while True:
        try:
            raw_data = await websocket.receive_text()
            logger.info(f"Received from {session_id}: {raw_data}")

            # Attempt to parse JSON
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
                continue

            # Process message type
            if isinstance(data, dict) and "type" in data:
                message_type = data["type"].upper()

                if message_type == "SPEAK":
                    response = {"type": "RESPONSE", "message": "I am speaking"}
                else:
                    response = {"type": "ECHO", "message": f"Received: {data}"}
            else:
                response = {"error": "Invalid message format"}

            # Send structured JSON response
            await websocket.send_text(json.dumps(response))

        except WebSocketDisconnect:
            logger.info(f"Session {session_id} disconnected")
            break
        except Exception as e:
            logger.error(f"Error in session {session_id}: {e}")
            await asyncio.sleep(0.1)  # Prevent tight error loop