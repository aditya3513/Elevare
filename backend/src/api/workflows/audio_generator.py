import base64
from agno.utils.log import logger
from elevenlabs.client import ElevenLabs
from elevenlabs import play

client = ElevenLabs()
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

    def __encode_audio(self, audio_bytes):
        return base64.b64encode(audio_bytes).decode("utf-8")
    
    def __get_tts_body(self, text: str):
        return {
            "text": text,
            **self.__tts_config
        }
                
    
    def generate_audio(self, text: str, should_play: bool = False):
        try:
            tts_body = self.__get_tts_body(text)
            logger.info("Audio Generation Started (Attempt 1)...")
            audio = client.text_to_speech(**tts_body)
            logger.info("Audio Generation Finished...")
            if should_play:
                play(audio)
            return self.__encode_audio(audio)
        except Exception:
            logger.info("Audio Generation Failed")
            return None

        
        
    
        
