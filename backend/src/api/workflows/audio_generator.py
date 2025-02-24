import os
from dotenv import load_dotenv
from agno.utils.log import logger
from elevenlabs.client import ElevenLabs
from typing import Iterator

load_dotenv()
client = ElevenLabs(
    api_key=os.getenv("ELEVEN_LABS_API_KEY")
)
class AudioGenerator():
    def __init__(self, 
                 voice_id: str = "JBFqnCBsd6RMkjVDRZzb",
                 model_id: str = "eleven_multilingual_v2",
                 output_format: str = "mp3_44100_128"
                ):
        self.__tts_config = {
            "voice_id": voice_id,
            "model_id": model_id,
            "output_format": output_format
        }
        self.eleven_labs_client = client

   
    def __get_tts_body(self, text: str):
        return {
            "text": text,
            **self.__tts_config
        }
                
    
    def generate_audio(self, text: str):
        try:
            tts_body = self.__get_tts_body(text)
            logger.info("Audio Generation Started...")
            audio = self.eleven_labs_client.text_to_speech.convert(**tts_body)
            logger.info("Audio Generation Finished...")
            if isinstance(audio, Iterator):
                audio = b"".join(audio)
            return audio
        except Exception as e:
            logger.info(f"Audio Generation Failed, Error: {e}")
            return None

        
        
    
        
