import json
from agno.agent import Agent
from agno.workflow import Workflow, RunResponse, RunEvent
from agno.utils.log import logger
from src.agents import study_guide_planner
from src.agents import confirmation_message_generator
from src.api.workflows.audio_generator import AudioGenerator
from typing import Iterator

AUDIO_FILES_BASE_PATH = "audio_generations"

class StudyGuideGenerator(Workflow):
    # create base voice agent for feedback
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
        # audio_gen_handler = AudioGenerator()
        if not self.session_state["session"].get("topic", None):
            self.session_state["session"]["topic"] = topic
        else:
            topic = self.session_state["session"].get("topic")
        
        if not self.session_state["session"].get("topic_confirmation_msg", None):
            confirmation_msg = self.__generate_confirmation_msg(f"""Generate a fiendly message acknowledging:
                - you are generating study plan for topic: {topic}.""")
            self.session_state["session"]["topic_confirmation_msg"] = confirmation_msg
        else:
            confirmation_msg = self.session_state["session"]["topic_confirmation_msg"]
        
        # if not self.session_state["session"].get("topic_confirmation_audio", None):
        #     topic_confirmation_audio = audio_gen_handler.generate_audio(confirmation_msg)
        #     self.session_state["session"]["topic_confirmation_audio"] = topic_confirmation_audio
        # else:
        #     topic_confirmation_audio = self.session_state["session"]["topic_confirmation_audio"]
        # send topic confirmation audio
        yield RunResponse(
            event="AUDIO_TRANSCRIPT",
            content=confirmation_msg
        )

        study_guide = self.__generate_study_guide(topic)
        
        yield RunResponse(
            event="STUDY_GUIDE",
            content=study_guide.dict()
        )

        study_guide_confirmation_msg = self.__generate_confirmation_msg(f"""Generate a fiendly message walking user through the study plan:
            - Study Plan: {study_guide}""")
        self.session_state["session"]["study_guide_confirmation_msg"] = study_guide_confirmation_msg
        yield RunResponse(
            event="AUDIO_TRANSCRIPT",
            content=study_guide_confirmation_msg
        )

        yield RunResponse(event=RunEvent.workflow_completed)
