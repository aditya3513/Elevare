from agno.agent import Agent
from agno.workflow import Workflow
from agno.utils.log import logger
from src.agents import text_to_voice
from src.agents import confirmation_message_generator

class SessionManager(Workflow):
    # create base voice agent for feedback
    audio_gen_agent: Agent = text_to_voice.agent
    confirmation_agent: Agent = confirmation_message_generator.agent

    def run(self):
        topic = self.session_state.get("topic")
        confirmation_msg = self._generate_confirmation_msg(topic)
        logger.info("generating audio")
        confirmation_audio = self._generate_confirmation_audio(confirmation_msg)
        return confirmation_audio
    
    def _generate_confirmation_msg(self, topic: str):
        confirmation_msg_response = self.confirmation_agent.run(f"Topic: {topic}")
        confirmation_msg = confirmation_msg_response.content
        return confirmation_msg
    
    def _generate_confirmation_audio(self, confirmation_msg):
        audio_resp = self.audio_gen_agent.run(confirmation_msg)
        return audio_resp.content
        
