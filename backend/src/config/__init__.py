from dotenv import load_dotenv
from src.config.llm_config import LlmConfig
from elevenlabs.client import ElevenLabs

# load env vars
load_dotenv()

# setup basse llm config
llm_config = LlmConfig()

# Setup elevent labs client
eleven_labs_client = ElevenLabs()
