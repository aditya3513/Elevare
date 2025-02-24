import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { GridBackground } from '../components/grid-background'
import { WelcomeScreen } from '../components/welcome-screen'
import { VoiceInteractionUI } from '../components/voice-interaction-ui'
import { useAudioSequence } from '../hooks/use-audio-sequence'
import { useSessionManager } from '../hooks/use-session-manager'
import { useLearningSessionStore } from '../lib/session-ws'
// import { useMicrophonePermission } from '../hooks/use-microphone-permission'
import confirmationMessage from '../assets/audio/confirmation-message.mp3'
import gsap from 'gsap'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const [hasStarted, setHasStarted] = useState(false)
  // const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showVoiceWave, setShowVoiceWave] = useState(false)
  const [showTextArea, setShowTextArea] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userInput, setUserInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deepResearchResponse, setDeepResearchResponse] = useState<string | null>(null)
  const [lessonResponse, setLessonResponse] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // const { hasMicrophonePermission, requestMicrophonePermission } = useMicrophonePermission()
  const { 
    isInitializing, 
    initializeSession, 
    planLessons, 
    sendInitialQuery,
    deepResearchStatus,
    lessonPlanStatus 
  } = useSessionManager()
  const { playSequence, stopSequence, messageAudioRef } = useAudioSequence({
    // onMessageEnd: () => setShowAudioRecorder(true),
    onVoiceWaveShow: () => setShowVoiceWave(true)
  })
  const response = useLearningSessionStore(state => state.response)
  const conversationState = useLearningSessionStore(state => state.conversationState)

  // Handle deep research updates
  useEffect(() => {
    if (deepResearchStatus) {
      setDeepResearchResponse(deepResearchStatus)
    }
  }, [deepResearchStatus])

  // Handle lesson plan updates
  useEffect(() => {
    if (lessonPlanStatus) {
      setLessonResponse(lessonPlanStatus)
      setIsSubmitting(false)
    }
  }, [lessonPlanStatus])

  // Handle response updates
  useEffect(() => {
    if (response && conversationState.status === 'received_response') {
      setLessonResponse(response)
      setIsSubmitting(false)
    }
  }, [response, conversationState])

  // Handle audio message end
  const handleAudioEnd = () => {
    setShowTextArea(true)
  }

  // Handle start button click
  const handleStart = async () => {
    // If we don't have microphone permission, request it first
    // if (!hasMicrophonePermission) {
    //   const granted = await requestMicrophonePermission()
    //   if (!granted) {
    //     setError('Microphone access is required to continue.')
    //     return
    //   }
    // }

    try {
      // Initialize the session
      await initializeSession()
      
      // Start the audio sequence
      await playSequence()
      
      // Start transition
      const tl = gsap.timeline({
        onComplete: () => {
          setHasStarted(true)
        }
      })

      // Exit animation sequence - slightly slower exit animations
      tl
        // First fade out the footer
        .to('.footer-fade', {
          opacity: 0,
          y: 10,
          duration: 0.6,
          ease: 'power2.inOut'
        })
        // Then fade out the main heading and microphone pill
        .to(['.mic-fade', 'h1'], {
          opacity: 0,
          y: -30,
          duration: 0.7,
          ease: 'power2.inOut'
        }, '-=0.3')
        // Then the button
        .to('.button-fade', {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.inOut'
        }, '-=0.4')
        // Then animate out grid lines with a nice stagger
        .to('.grid-line', {
          opacity: 0,
          scale: 1.1,
          duration: 0.8,
          ease: 'power2.inOut',
          stagger: {
            amount: 0.5,
            from: 'random'
          }
        }, '-=0.3')
        // Finally fade out the background
        .to('.bg-fade', {
          opacity: 0,
          duration: 0.7,
          ease: 'power2.inOut'
        }, '-=0.5')

    } catch (err) {
      console.error('Failed to start:', err)
      setError('Failed to start session. Please try again.')
      stopSequence()
    }
  }

  const handleSubmit = async (text: string) => {
    try {
      setIsSubmitting(true)
      setLessonResponse(null)
      setShowTextArea(false)
      setHasSubmitted(true)
      
      // Small pause before playing sound
      await new Promise(resolve => setTimeout(resolve, 300))

      // Play confirmation sound
      if (messageAudioRef.current) {
        messageAudioRef.current.src = confirmationMessage
        messageAudioRef.current.volume = 1
        await messageAudioRef.current.play()
        // Wait for the audio to finish
        await new Promise(resolve => {
          messageAudioRef.current?.addEventListener('ended', resolve, { once: true })
        })
      }

      // First send the initial query for deep research
      sendInitialQuery(text)
      
      // Then trigger lesson planning
      setTimeout(() => {
        planLessons(text)
      }, 1000) // Add a small delay between requests
      
      // Clear input after everything is done
      setUserInput('')
    } catch (error) {
      console.error('Failed to process message:', error)
      setIsSubmitting(false)
      setShowTextArea(true) // Show text area again only on error
      setError('Failed to process your request. Please try again.')
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background */}
      <GridBackground hasStarted={hasStarted} />

      {/* Voice Interaction UI */}
      {showVoiceWave && hasStarted && !hasSubmitted && (
        <VoiceInteractionUI 
          messageAudioRef={messageAudioRef}
          userInput={userInput}
          setUserInput={setUserInput}
          onSubmit={handleSubmit}
          showTextArea={showTextArea}
          onAudioEnd={handleAudioEnd}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Deep Research Response */}
      {deepResearchResponse && (
        <div className="absolute inset-x-0 top-1/4 -translate-y-1/2 max-w-2xl mx-auto px-4 py-6 space-y-4 bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Research Results</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{deepResearchResponse}</div>
          </div>
        </div>
      )}

      {/* Lesson Response */}
      {lessonResponse && (
        <div className="absolute inset-x-0 top-3/4 -translate-y-1/2 max-w-2xl mx-auto px-4 py-6 space-y-4 bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Lesson Plan</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{lessonResponse}</div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md border border-red-500/20 dark:border-red-500/10 rounded-full shadow-sm px-3 py-1.5 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Welcome Screen */}
      {!hasStarted && (
        <WelcomeScreen 
          isInitializing={isInitializing}
          onStart={handleStart}
        />
      )}
    </div>
  )
}