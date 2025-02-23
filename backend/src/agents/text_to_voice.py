from agno.agent import Agent
from src.config.llm_config import llm_config_handler
from agno.tools.eleven_labs import ElevenLabsTools

# Create an Agent with the ElevenLabs tool
agent = Agent(
    model=llm_config_handler.get_groq_base_model(),
    tools=[
    ElevenLabsTools(
        voice_id="JBFqnCBsd6RMkjVDRZzb", 
        model_id="eleven_multilingual_v2", 
        target_directory="audio_generations"
    )
], name="Professor")