from agno.agent import Agent
from agno.workflow import Workflow
from agno.utils.log import logger
from src.config.llm_config import llm_config_handler
from agno.tools.eleven_labs import ElevenLabsTools

class AudioGenerator(Workflow):
    # create base voice agent for feedback
    


    def run(self, topic: str):
        logger.info("Creating session")
        self._init_session(topic)

        logger.info("generating confirmation msg")
        confirmation_msg = self._generate_confirmation_msg(topic)
        logger.info("generating audio")
        confirmation_audio = self._generate_audio(confirmation_msg)
        return confirmation_audio
        

    def _init_voice_agent(self):
        self.audio_agent = Agent(
            model=llm_config_handler.get_groq_base_model(),
            tools=[
                ElevenLabsTools(
                    voice_id="21m00Tcm4TlvDq8ikWAM",
                    model_id="eleven_multilingual_v2",
                    target_directory="audio_generations",
                )
            ],
            description="You are an AI agent that can generate audio using the ElevenLabs API.",
            instructions=[
                "When the user asks you to generate audio, use the `generate_audio` tool to generate the audio.",
                "You'll generate the appropriate prompt to send to the tool to generate audio.",
                "You don't need to find the appropriate voice first, I already specified the voice to user."
                "Return the audio file name in your response. Don't convert it to markdown.",
                "The audio should be long and detailed.",
            ],
            markdown=True,
            debug_mode=True,
            show_tool_calls=True,
        )
    
        
