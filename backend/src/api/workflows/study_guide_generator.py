import json
from agno.agent import Agent
from agno.workflow import Workflow, RunResponse, RunEvent
from agno.utils.log import logger
from src.agents import study_guide_planner
from src.agents import text_to_voice
from src.agents import confirmation_message_generator
from typing import Iterator

AUDIO_FILES_BASE_PATH = "audio_generations"

class StudyGuideGenerator(Workflow):
    # create base voice agent for feedback
    audio_agent: Agent = text_to_voice.agent
    confirmation_agent: Agent = confirmation_message_generator.agent
    study_guide_agent: Agent = study_guide_planner.agent

    def __generate_study_guide(self, topic: str) -> study_guide_planner.StudyGuide:
        try:
            logger.info("Study Guide Generation Started (Attempt 1)...")
            study_guide: study_guide_planner.StudyGuide = self.study_guide_agent.run(topic).content
            logger.info("Study Guide Generation Finished...")
            return study_guide
        except Exception:
            try:
                logger.info("Study Guide Generation Started (Attempt 2)...")
                study_guide: study_guide_planner.StudyGuide = self.study_guide_agent.run(topic).content
                logger.info("Study Guide Generation Finished...")
                return study_guide
            except Exception:
                logger.info("Study Guide Generation Failed")
                return None

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

    def run(self, topic: str) -> Iterator[RunResponse]:
        if not self.session_state.get("topic", None):
            self.session_state["topic"] = topic
        else:
            topic = self.session_state.get("topic")
        
        if not self.session_state.get("topic_confirmation_msg", None):
            confirmation_msg = self.__generate_confirmation_msg(f"""Generate a fiendly message acknowledging:
                - you are generating study plan for topic: {topic}.""")
            self.session_state["topic_confirmation_msg"] = confirmation_msg
        else:
            confirmation_msg = self.session_state["topic_confirmation_msg"]
        
        if not self.session_state.get("topic_confirmation_audio", None):
            topic_confirmation_audio_file_path = self.__generate_audio(confirmation_msg)
            self.session_state["topic_confirmation_audio"] = topic_confirmation_audio_file_path
        else:
            topic_confirmation_audio_file_path = self.session_state["topic_confirmation_audio"]
        # send topic confirmation audio
        yield RunResponse(
            event="AUDIO_FILE",
            content=topic_confirmation_audio_file_path
        )

        if not self.session_state.get("study_guide", None):
            # Generate study guide
            study_guide = self.__generate_study_guide(topic)
            self.session_state["study_guide"] = study_guide.model_dump_json()
        else:
            study_guide = self.session_state["study_guide"]
        
        yield RunResponse(
            event="STUDY_GUIDE",
            content=study_guide
        )

        study_guide_confirmation_msg = self.__generate_confirmation_msg(f"""Generate a fiendly message walking user through the study plan:
            - Study Plan: {study_guide}""")
        self.session_state["study_guide_confirmation_msg"] = study_guide_confirmation_msg
        study_guide_confirmation_audio_file_path = self.__generate_audio(study_guide_confirmation_msg)
        self.session_state["study_guide_confirmation_audio"] = study_guide_confirmation_audio_file_path
        yield RunResponse(
            event="AUDIO_FILE",
            content=study_guide_confirmation_audio_file_path
        )

        yield RunResponse(event=RunEvent.workflow_completed)
