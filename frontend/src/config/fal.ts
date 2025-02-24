import { fal } from "@fal-ai/client";

// Initialize fal client configuration
export const initializeFalClient = () => {
  const apiKey = process.env.FAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('FAL API key is not configured');
  }

  fal.config({
    credentials: apiKey,
  });
};

export const FAL_MODELS = {
  WHISPER: "fal-ai/whisper",
} as const;

export interface WhisperResponse {
  text: string;
  language: string;
  segments: Array<{
    id: number;
    text: string;
    start: number;
    end: number;
    tokens: number[];
  }>;
}

// Type for the Whisper endpoint
export interface WhisperEndpoint {
  input: {
    audio_url: string;
  };
  response: WhisperResponse;
} 