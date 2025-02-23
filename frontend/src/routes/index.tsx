import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import GridAnimation from '../components/grid-animation'
import { Button } from '../components/ui/button'
import { AudioRecorder } from '../components/audio-recorder'
import { useLearningSessionStore } from '../lib/session-ws'
import { useNavigate } from '@tanstack/react-router'

// Import audio files
import introEffect from '../assets/audio/intro-effect.mp3'
import introMessage from '../assets/audio/intro-message.mp3'

// TODO: Replace with actual API URL
const API_URL = 'http://localhost:8000/api'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const [hasStarted, setHasStarted] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { connect, startSession, isConnected } = useLearningSessionStore()
  
  const effectAudioRef = useRef<HTMLAudioElement | null>(null)
  const messageAudioRef = useRef<HTMLAudioElement | null>(null)

  // Handle audio playback
  const playSequence = async () => {
    try {
      if (!effectAudioRef.current || !messageAudioRef.current) {
        effectAudioRef.current = new Audio(introEffect)
        messageAudioRef.current = new Audio(introMessage)
      }

      await effectAudioRef.current.play()
      
      effectAudioRef.current.onended = () => {
        messageAudioRef.current?.play()
          .catch(err => console.error("Error playing message:", err))
      }
    } catch (err) {
      console.error("Error in playSequence:", err)
    }
  }

  // Initialize session
  const initializeSession = async () => {
    setIsInitializing(true)
    setError(null)

    try {
      // Request new session from backend
      const response = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const { sessionId } = await response.json()

      // Start WebSocket connection with session ID
      connect(sessionId)
      setHasStarted(true)
      playSequence()
    } catch (err) {
      console.error('Failed to initialize session:', err)
      setError('Failed to start session. Please try again.')
      setHasStarted(false)
    } finally {
      setIsInitializing(false)
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (effectAudioRef.current) {
        effectAudioRef.current.pause()
        effectAudioRef.current.currentTime = 0
      }
      if (messageAudioRef.current) {
        messageAudioRef.current.pause()
        messageAudioRef.current.currentTime = 0
      }
    }
  }, [])

  // Handle grid animation completion
  useEffect(() => {
    if (hasStarted) {
      // Wait for grid animation to complete (2.5s based on grid-animation.tsx)
      const timer = setTimeout(() => {
        setShowAudioRecorder(true)
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [hasStarted])

  // Handle successful connection
  useEffect(() => {
    if (isConnected && hasStarted) {
      startSession()
    }
  }, [isConnected, hasStarted, startSession])

  if (!hasStarted) {
    return (
      <>
        <GridAnimation isActive={false} />
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-12 px-6">
          <h1 className="text-[44px] md:text-[56px] text-[#35312E] font-normal text-center leading-[1.2] max-w-[800px]">
            What sparks your<br className="hidden md:block" /> curiosity today?
          </h1>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <Button
            onClick={initializeSession}
            disabled={isInitializing}
            className="relative px-8 py-3 text-lg font-medium text-white 
                     bg-[#2C4975] hover:bg-[#243D64] 
                     shadow-[0_2px_4px_rgba(44,73,117,0.2)] 
                     hover:shadow-[0_4px_8px_rgba(44,73,117,0.3)] 
                     hover:translate-y-[-1px] 
                     active:translate-y-[1px]
                     active:shadow-[0_1px_2px_rgba(44,73,117,0.2)]
                     transition-all duration-200 rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInitializing ? 'Starting...' : 'Let\'s Explore'}
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <GridAnimation isActive={hasStarted} />
      {showAudioRecorder && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <AudioRecorder onRecordingComplete={() => navigate({ to: '/session' })} />
          </div>
        </div>
      )}
    </>
  )
}