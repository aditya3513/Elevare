from agno.agent import Agent
from src.agents import text_to_voice
from src.agents import confirmation_message_generator
from agno.workflow import Workflow
from agno.utils.log import logger

class LessonGenerator(Workflow):
    # create base voice agent for feedback
    audio_gen_agent: Agent = text_to_voice.agent
    confirmation_agent: Agent = confirmation_message_generator.agent

    def run(self, topic: str):
        logger.info("Creating session")
        self._init_session(topic)

        logger.info("generating confirmation msg")
        confirmation_msg = self._generate_confirmation_msg(topic)
        logger.info("generating audio")
        confirmation_audio = self._generate_audio(confirmation_msg)
        return confirmation_audio
        

    def _get_session_state(self):
        return self.session_state.get("session", None)
    
    def _init_session(self, topic: str):
        self.session_state["session"] = {
            "topic": topic,
            "is_initialized": True
        }
    
    def _generate_confirmation_msg(self, topic: str):
        confirmation_msg_response = self.confirmation_agent.run(f"Topic: {topic}")
        confirmation_msg = confirmation_msg_response.content
        self.session_state["session"]["confirmation_msg"] = confirmation_msg
        return confirmation_msg
    
    def _generate_audio(self, text: str):
        audio_resp = self.audio_gen_agent.run(text)
        return audio_resp.response_audio
        
