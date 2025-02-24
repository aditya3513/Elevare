import io
import uuid
import json
from src.config.llm_config import llm_config_handler
from src.config.logging_config import logger
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Iterator
from agno.workflow import RunResponse
from src.api.workflows.session_manager import SessionManager
from src.api.workflows.lessons_plan_generator import LessonsPlanGenerator
from src.api.workflows.research_topic import DeepResearcher
from src.api.workflows.audio_generator import AudioGenerator
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
from src.utils import get_researcher, run_report_generation
from fastapi import HTTPException

load_dotenv()

router = APIRouter()


session_storage = llm_config_handler.get_workflow_storage("lesson_gen")

audio_gen_handler = AudioGenerator()


class SessionResponse(BaseModel):
    session_id: str


class AudiogenRequest(BaseModel):
    session_id: str


class AudioGenRequest(BaseModel):
    text: str


# async def cleanup_session_resources(
#     session_id: str,
#     deep_research_handler: DeepResearcher,
#     lessons_planning_handler: LessonsPlanGenerator,
# ):
#     """
#     Cleanup resources associated with a WebSocket session.

#     Args:
#         session_id: The ID of the session to cleanup
#         deep_research_handler: The DeepResearcher instance to cleanup
#         lessons_planning_handler: The LessonsPlanGenerator instance to cleanup
#     """
#     try:
#         # Clean up research handler resources
#         if deep_research_handler:
#             await deep_research_handler.cleanup()

#         # Clean up lessons planning handler resources
#         if lessons_planning_handler:
#             await lessons_planning_handler.cleanup()

#         logger.info(f"Successfully cleaned up resources for session {session_id}")
#     except Exception as e:
#         logger.error(f"Error during cleanup for session {session_id}: {e}")


@router.post("/session")
async def create_new_session():
    """Creates a new session and returns the session ID."""
    session_id = str(uuid.uuid4())
    # init session
    session_handler = SessionManager(session_id=session_id, storage=session_storage)
    session_handler.run()
    return SessionResponse(session_id=session_handler.session_id)


@router.post("/generate-audio")
async def generate_audio_endpoint(request: AudioGenRequest):
    """Generate audio from text and return as streaming response"""
    try:
        audio_bytes = audio_gen_handler.generate_audio(text=request.text)
        audio_stream = io.BytesIO(audio_bytes)
        return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment;filename=audio.mp3"},
        )
    except Exception as e:
        logger.error(f"Error generating audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate audio")


@router.websocket("/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Handles WebSocket connections and requires a valid session ID."""

    await websocket.accept()

    # if session is accepted then initialize lessons and study guide handler
    deep_research_handler = DeepResearcher(
        session_id=session_id, storage=session_storage
    )

    lessons_planning_handler = LessonsPlanGenerator(
        session_id=session_id, storage=session_storage
    )

    try:
        while True:
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

                if message_type == "RESEARCH_TOPIC":
                    topic = data["topic"]
                    researcher = get_researcher(query=topic)
                    report = await run_report_generation(researcher=researcher)
                    study_guide_resp_iterator: Iterator[RunResponse] = (
                        deep_research_handler.run(
                            topic=topic, researcher=researcher, report=report
                        )
                    )
                    for response in study_guide_resp_iterator:
                        # You might want to serialize the response to JSON or format it as needed
                        if response.event in deep_research_handler.custom_events:
                            await websocket.send_text(
                                json.dumps(
                                    {
                                        "type": response.event,
                                        "message": response.content,
                                    }
                                )
                            )

                elif message_type == "PLAN_LESSONS":
                    topic = data["topic"]
                    study_guide_resp_iterator: Iterator[RunResponse] = (
                        lessons_planning_handler.run()
                    )
                    for response in study_guide_resp_iterator:
                        # You might want to serialize the response to JSON or format it as needed
                        if response.event in lessons_planning_handler.custom_events:
                            await websocket.send_text(
                                json.dumps(
                                    {
                                        "type": response.event,
                                        "message": response.content,
                                    }
                                )
                            )
                else:
                    response = {"type": "ECHO", "message": f"Received: {data}"}

    except WebSocketDisconnect:
        logger.info(f"Session {session_id} disconnected")
        # await cleanup_session_resources(
        #     session_id, deep_research_handler, lessons_planning_handler
        # )
    except Exception as e:
        logger.error(f"Error in session {session_id}: {e}")
        # Ensure cleanup happens even on error
        # await cleanup_session_resources(
        #     session_id, deep_research_handler, lessons_planning_handler
        # )
