from agno.agent import Agent
from agno.workflow import Workflow, RunResponse, RunEvent
from agno.utils.log import logger
from src.agents import text_to_voice

class AudioGenerator(Workflow):

    audio_agent: Agent = text_to_voice.agent
    
    def run(self, text: str):
        try:
            logger.info("Audio Generation Started (Attempt 1)...")
            audio_response: text_to_voice.AudioFile = self.audio_agent.run(text).content
        except Exception:
            try:
                logger.info("Audio Generation Started (Attempt 2)...")
                audio_response: text_to_voice.AudioFile = self.audio_agent.run(text).content
            except Exception:
                logger.info("Audio Generation Failed")
        logger.info("Audio Generation Finished...")
        return RunResponse(event=RunEvent.run_response, content=audio_response.file_name)

        
        
    
        
