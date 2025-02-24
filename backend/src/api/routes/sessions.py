import uuid
import json
from src.config.llm_config import llm_config_handler
from src.config.logging_config import logger
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from src.api.workflows.session_manager import SessionManager
from src.api.workflows.study_guide_generator import StudyGuideGenerator
from src.api.workflows.research_topic import DeepResearcher
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from src.utils import get_researcher, run_report_generation

load_dotenv()

router = APIRouter()

session_storage = llm_config_handler.get_workflow_storage("lesson_gen")

# Get the path to the assets directory
ASSETS_DIR = Path(__file__).parent.parent.parent / "assets"
CONFIRMATION_AUDIO = ASSETS_DIR / "confirmation_message.mp3"


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
async def create_new_session():
    """Creates a new session and returns the session ID."""
    session_id = str(uuid.uuid4())
    session_handler = SessionManager(session_id=session_id, storage=session_storage)
    session_handler.run()
    return SessionResponse(session_id=session_handler.session_id)


async def process_audio(audio_data: bytes, session_id: str) -> bytes:
    """Process the audio data and return the response audio"""
    try:
        # For now, we'll return the confirmation message audio
        logger.info(f"Processing audio for session {session_id}")

        if not CONFIRMATION_AUDIO.exists():
            logger.error(f"Confirmation audio file not found at {CONFIRMATION_AUDIO}")
            raise FileNotFoundError("Confirmation audio file not found")

        response_audio = read_audio_file(str(CONFIRMATION_AUDIO))
        if not response_audio:
            raise ValueError("Failed to read confirmation audio file")

        return response_audio

    except Exception as e:
        logger.error(f"Error processing audio for session {session_id}: {e}")
        raise


@router.websocket("/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Handles WebSocket connections and requires a valid session ID."""
    await websocket.accept()
    is_receiving_audio = False
    audio_chunks = []

    # if session is accepted then initialize lessons and study guide handler
    deep_research_handler = DeepResearcher(
        session_id=session_id,
        storage=session_storage
    )

    study_guide_handler = StudyGuideGenerator(
        session_id=session_id,
        storage=session_storage
    )

            # Handle text messages
            if message.get("type") == "text":
                try:
                    data = json.loads(message.get("text", "{}"))
                    logger.info(f"Received message from {session_id}: {data}")

                    if data.get("type") == "INITIAL_QUERY":
                        if data.get("message") == "AUDIO_START":
                            logger.info(
                                f"Starting audio reception for session {session_id}"
                            )
                            is_receiving_audio = True
                            audio_chunks = []
                            # Acknowledge start
                            await websocket.send_text(
                                json.dumps(
                                    {"type": "INITIAL_QUERY", "message": "AUDIO_START"}
                                )
                            )

                        elif data.get("message") == "AUDIO_END":
                            logger.info(
                                f"Completed audio reception for session {session_id}"
                            )
                            is_receiving_audio = False

                            if not audio_chunks:
                                raise ValueError("No audio data received")

                            # Process complete audio
                            complete_audio = b"".join(audio_chunks)
                            total_size = len(complete_audio)
                            logger.info(
                                f"Processing complete audio of size: {total_size} bytes"
                            )

                            try:
                                # Process the audio and get response
                                response_audio = await process_audio(
                                    complete_audio, session_id
                                )

                                # Send the response audio with content type
                                await websocket.send_bytes(
                                    response_audio, {"content-type": "audio/mpeg"}
                                )

                                # Clear the chunks
                                audio_chunks = []

                            except Exception as e:
                                logger.error(f"Error processing audio: {e}")
                                await websocket.send_text(
                                    json.dumps(
                                        {
                                            "type": "ERROR",
                                            "message": "Failed to process audio",
                                        }
                                    )
                                )

                    elif data.get("type") == "END":
                        logger.info(f"Session {session_id} ended by client")
                        break

                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received from {session_id}")
                    await websocket.send_text(
                        json.dumps(
                            {"type": "ERROR", "message": "Invalid message format"}
                        )
                    )

            # Handle binary data (audio chunks)
            elif message.get("type") == "bytes":
                if not is_receiving_audio:
                    logger.warning(
                        f"Received unexpected audio data for session {session_id}"
                    )
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "ERROR",
                                "message": "Received audio data without proper initialization",
                            }
                        )
                    )
                    continue

                audio_data = message.get("bytes")
                if not audio_data:
                    logger.warning(
                        f"Received empty audio chunk for session {session_id}"
                    )
                    continue

                logger.debug(f"Received audio chunk of size: {len(audio_data)} bytes")
                audio_chunks.append(audio_data)

    except WebSocketDisconnect:
        logger.info(f"Session {session_id} disconnected")
    except Exception as e:
        logger.error(f"Error in session {session_id}: {e}")
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

                if message_type == "RESEARCH_TOPIC":
                    topic = data["topic"]
                    researcher = get_researcher(query=topic)
                    report = await run_report_generation(researcher=researcher)
                    study_guide_resp_iterator: Iterator[RunResponse] = deep_research_handler.run(
                        topic=topic,
                        researcher=researcher,
                        report=report
                    )
                    for response in study_guide_resp_iterator:
                        # You might want to serialize the response to JSON or format it as needed
                        if response.event in deep_research_handler.custom_events:
                            await websocket.send_text(json.dumps({
                                "type": response.event,
                                "message": response.content
                            }))

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
