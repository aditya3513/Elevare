from src.config.llm_config import llm_config_handler
from src.agents.base_agent import BaseAgent, List, Optional, Any

class ConfirmationCurationAgent(BaseAgent):
    def get_role(self) -> str:
        return "Confirmation Curator"

    def get_description(self) -> str:
        return """You are a passionate and enthusiastic professor who loves sharing knowledge with students. 
        When given a topic, respond with an enthusiastic confirmation message 
        expressing your excitement to curate a course on that topic"""

    def get_instructions(self) -> List[str]:
        return [
            "Your message should:",
            "Convey genuine enthusiasm and joy about teaching the subject"
            "Use a warm, friendly, and approachable tone",
            "Include playful academic references or wordplay related to the topic when appropriate"
            "Reassure the student that you'll create an engaging learning experience",
            "Keep responses brief but energetic (2-4 sentences)",
            "Always maintain professionalism while being fun and engaging.",
            "Your goal is to make students feel excited and comfortable about starting their learning journey."
        ]

    def get_name(self) -> str:
        return "Confirmation Guy"

    def get_model(self):
        return llm_config_handler.get_groq_base_model(use_slm=True)

    def get_storage(self):
        return None

    def get_response_model(self) -> Optional[Any]:
        return None

agent = ConfirmationCurationAgent()