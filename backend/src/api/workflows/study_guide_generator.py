from agno.agent import Agent
from agno.workflow import Workflow, RunResponse, RunEvent
from agno.utils.log import logger
from src.agents import text_to_voice
from src.agents import confirmation_message_generator

AUDIO_FILES_BASE_PATH = "audio_generations"

class StudyGuideGenerator(Workflow):
    # create base voice agent for feedback
    audio_agent: Agent = text_to_voice.agent
    confirmation_agent: Agent = confirmation_message_generator.agent

    def __generate_audio(self, text: str) -> text_to_voice.AudioFile:
        try:
            logger.info("Audio Generation Started (Attempt 1)...")
            audio_response: text_to_voice.AudioFile = self.audio_agent.run(text).content
            logger.info("Audio Generation Finished...")
            return f"{AUDIO_FILES_BASE_PATH}/{audio_response.file_name}"
        except Exception:
            try:
                logger.info("Audio Generation Started (Attempt 2)...")
                audio_response: text_to_voice.AudioFile = self.audio_agent.run(text).content
                logger.info("Audio Generation Finished...")
                return f"{AUDIO_FILES_BASE_PATH}/{audio_response.file_name}"
            except Exception:
                logger.info("Audio Generation Failed")
                return None
    
    def __generate_confirmation_msg(self, topic: str) -> str:
        try:
            logger.info("Confirmation Msg Generation Started (Attempt 1)...")
            confirmation_msg_response = self.confirmation_agent.run(topic)
            logger.info("Confirmation Msg Generation Finished...")
            return confirmation_msg_response.content
        except Exception:
            try:
                logger.info("Confirmation Msg Generation Started (Attempt 2)...")
                confirmation_msg_response = self.confirmation_agent.run(topic)
                logger.info("Confirmation Msg Generation Finished...")
                return confirmation_msg_response.content
            except Exception:
                logger.info("Confirmation Msg Generation Failed")
                return None

    def run(self, topic: str):
        self.session_state["topic"] = topic
        confirmation_msg = self.__generate_confirmation_msg(topic)
        self.session_state["topic_confirmation_msg"] = confirmation_msg
        topic_confirmation_audio_file_path = self.__generate_audio(confirmation_msg)
        self.session_state["topic_confirmation_audio"] = topic_confirmation_audio_file_path

        return RunResponse(event=RunEvent.run_completed, content=topic_confirmation_audio_file_path)
