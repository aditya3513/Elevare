from agno.agent import Agent
from agno.workflow import Workflow
from agno.utils.log import logger
from src.agents import text_to_voice
from src.agents import confirmation_message_generator
from src.config.llm_config import llm_config_handler


class SessionManager(Workflow):
    # create base voice agent for feedback
    audio_gen_agent: Agent = text_to_voice.agent
    confirmation_agent: Agent = confirmation_message_generator.agent

    def run(self):
        topic = self.session_state.get("topic")
        confirmation_msg_response = self.confirmation_agent.run(f"Topic: {topic}")
        return confirmation_msg_response
