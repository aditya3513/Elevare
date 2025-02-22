import asyncio
from src.config.logging_config import logger
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from src.api.controllers.sessions import create_session, get_session

router = APIRouter()

class SessionResponse(BaseModel):
    session_id: str

@router.post("/session", response_model=SessionResponse)
async def create_new_session():
    """Creates a new session and returns the session ID."""
    session_id = create_session()
    return SessionResponse(session_id=session_id)

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Handles WebSocket connections and requires a valid session ID."""
    session = get_session(session_id)
    if not session:
        await websocket.close(code=1008)  # Policy violation code
        return
    
    await websocket.accept()
    
    while True:
        try:
            data = await websocket.receive_text()
            # Echo the received message back to the client
            await websocket.send_text(f"Received: {data}")
        except WebSocketDisconnect:
            logger.info(f"Session {session_id} disconnected")
            break
        except Exception as e:
            logger.error(f"Error in session {session_id}: {e}")
            await asyncio.sleep(0.1)  # Prevent tight loop on error
