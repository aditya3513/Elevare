import { useEffect, useRef } from 'react'
import { useLearningSessionStore } from '../lib/session-ws'
import { VoiceIndicator } from './voice-indicator'

export function AudioResponseHandler() {
  const responseAudioRef = useRef<HTMLAudioElement | null>(null)
  const { 
    conversationState, 
    audioResponse, 
    setConversationState 
  } = useLearningSessionStore()

  // Handle audio response playback
  useEffect(() => {
    if (audioResponse && conversationState.status === 'received_response') {
      console.log('Preparing to play audio response')
      
      // Create audio URL from blob
      const audioUrl = URL.createObjectURL(audioResponse)
      
      // Create new audio element if it doesn't exist
      if (!responseAudioRef.current) {
        responseAudioRef.current = new Audio()
        
        // Add event listeners for debugging
        responseAudioRef.current.addEventListener('loadeddata', () => {
          console.log('Audio response loaded and ready to play')
        })
        
        responseAudioRef.current.addEventListener('play', () => {
          console.log('Audio response started playing')
        })
        
        responseAudioRef.current.addEventListener('error', (e) => {
          console.error('Audio response error:', e)
        })
      }

      // Set the source and load the audio
      responseAudioRef.current.src = audioUrl
      
      // Set up ended handler
      const handleEnded = () => {
        console.log('Audio response finished playing')
        setConversationState({ status: 'idle' })
      }
      
      responseAudioRef.current.addEventListener('ended', handleEnded)

      // Start playing after a short delay to ensure loading
      setTimeout(() => {
        if (responseAudioRef.current) {
          responseAudioRef.current.play()
            .then(() => {
              setConversationState({ status: 'playing_response' })
            })
            .catch(err => {
              console.error("Error playing response:", err)
              setConversationState({ 
                status: 'error', 
                error: 'Failed to play audio response' 
              })
            })
        }
      }, 100)

      // Cleanup
      return () => {
        if (responseAudioRef.current) {
          responseAudioRef.current.removeEventListener('ended', handleEnded)
          responseAudioRef.current.pause()
          responseAudioRef.current.currentTime = 0
          responseAudioRef.current.src = ''
        }
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioResponse, conversationState.status, setConversationState])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (responseAudioRef.current) {
        responseAudioRef.current.pause()
        responseAudioRef.current.currentTime = 0
        responseAudioRef.current.src = ''
      }
    }
  }, [])

  if (conversationState.status !== 'playing_response' && 
      conversationState.status !== 'received_response') {
    return null
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <VoiceIndicator 
        audioElement={responseAudioRef.current || undefined}
        className="w-full h-16"
      />
      <div className="mt-2 text-center text-sm text-black/70 dark:text-zinc-400">
        {conversationState.status === 'received_response' && 
          `Received response (${((conversationState.audioSize || 0) / 1024).toFixed(1)}KB)`}
        {conversationState.status === 'playing_response' && 'Playing response...'}
      </div>
    </div>
  )
} 