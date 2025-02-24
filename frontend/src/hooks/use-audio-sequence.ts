import { useRef, useCallback } from 'react'
import introEffect from '../assets/audio/intro-effect.mp3'
import introMessage from '../assets/audio/intro-message.mp3'

interface UseAudioSequenceProps {
  onMessageEnd?: () => void
  onVoiceWaveShow?: () => void
}

export function useAudioSequence({ onMessageEnd, onVoiceWaveShow }: UseAudioSequenceProps = {}) {
  const effectAudioRef = useRef<HTMLAudioElement | null>(null)
  const messageAudioRef = useRef<HTMLAudioElement | null>(null)

  const playSequence = useCallback(async () => {
    try {
      // Create audio elements if they don't exist
      if (!effectAudioRef.current || !messageAudioRef.current) {
        effectAudioRef.current = new Audio(introEffect)
        messageAudioRef.current = new Audio(introMessage)
      }
      
      // Setup message audio ended handler
      if (messageAudioRef.current && onMessageEnd) {
        // Remove any existing listeners first
        messageAudioRef.current.removeEventListener('ended', onMessageEnd)
        // Add the new listener
        messageAudioRef.current.addEventListener('ended', onMessageEnd)
      }

      await effectAudioRef.current.play()
      
      // Start message audio and show voice wave 6 seconds into the intro effect
      setTimeout(() => {
        onVoiceWaveShow?.()
        messageAudioRef.current?.play()
          .catch(err => console.error("Error playing message:", err))
      }, 4500)

      // Return cleanup function
      return () => {
        if (messageAudioRef.current && onMessageEnd) {
          messageAudioRef.current.removeEventListener('ended', onMessageEnd)
        }
      }
    } catch (err) {
      console.error("Error in playSequence:", err)
      throw err
    }
  }, [onMessageEnd, onVoiceWaveShow])

  const stopSequence = useCallback(() => {
    if (effectAudioRef.current) {
      effectAudioRef.current.pause()
      effectAudioRef.current.currentTime = 0
    }
    if (messageAudioRef.current) {
      messageAudioRef.current.pause()
      messageAudioRef.current.currentTime = 0
    }
  }, [])

  return {
    playSequence,
    stopSequence,
    messageAudioRef
  }
} 