import uuid
import base64
import json
import asyncio
from src.config.llm_config import llm_config_handler
from src.config.logging_config import logger
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Iterator
from agno.workflow import RunResponse
from src.api.workflows.session_manager import SessionManager
from src.api.workflows.study_guide_generator import StudyGuideGenerator
from src.api.workflows.lesson_generator import LessonGenerator
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from src.utils import send_json_data, stream_audio

load_dotenv()
client = ElevenLabs()

router = APIRouter()

session_storage = llm_config_handler.get_workflow_storage("lesson_gen")

class SessionRequest(BaseModel):
    topic: str

class SessionResponse(BaseModel):
    session_id: str

def read_audio_file(file_path: str):
    try:
        with open(file_path, "rb") as f:
            audio_bytes = f.read()
        return audio_bytes
    except Exception as e:
        logger.error(f"Audio file not readable at path {file_path}. Error: {e}")
        return None

@router.post("/session", response_model=SessionResponse)
async def create_new_session(session_request: SessionRequest):
    """Creates a new session and returns the session ID."""
    session_id = str(uuid.uuid4())
    # init session
    session_handler = SessionManager(
        session_id=session_id,
        storage=session_storage

    )
    session_handler.run()
    return SessionResponse(
        session_id=session_handler.session_id
    )


@router.websocket("/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Handles WebSocket connections and requires a valid session ID."""
    # is_validated = session_handler.session_state.get("is_validated")
    # check if session is not initialized or missing topic, reject
    # if not is_validated:
    #     await websocket.close(code=1008)  # Policy violation code
    #     return
    
    await websocket.accept()

    # if session is accepted then initialize lessons and study guide handler
    study_guide_handler = StudyGuideGenerator(
        session_id=session_id,
        storage=session_storage
    )

    # lesson_gen_handler = LessonGenerator(
    #     session_id=session_id,
    #     storage=session_storage
    # )
    
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

                if message_type == "PLAN_LESSONS":
                    topic = data["topic"]
                    study_guide_resp_iterator: Iterator[RunResponse] = study_guide_handler.run(topic=topic)
                    for response in study_guide_resp_iterator:
                        # You might want to serialize the response to JSON or format it as needed
                        if response.event == "AUDIO_FILE":
                            await websocket.send_text(json.dumps({
                                "type": "AUDIO_STREAM", 
                                "message": response.content
                            }))
                        
                        if response.event == "AUDIO_TRANSCRIPT":
                            await websocket.send_text(json.dumps({
                                "type": "AUDIO_TRANSCRIPT", 
                                "message": response.content
                            }))
                        
                        if response.event == "STUDY_GUIDE":
                            await websocket.send_text(json.dumps({
                                "type": "STUDY_GUIDE", 
                                "message": response.content
                            }))
                else:
                    response = {"type": "ECHO", "message": f"Received: {data}"}
            else:
                response = {"error": "Invalid message format"}

            # Send structured JSON response
            # await websocket.send_text(json.dumps(response))

        except WebSocketDisconnect:
            logger.info(f"Session {session_id} disconnected")
            break
        except Exception as e:
            logger.error(f"Error in session {session_id}: {e}")
            await asyncio.sleep(0.1)  # Prevent tight error loop