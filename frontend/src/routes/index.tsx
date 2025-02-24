import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { GridBackground } from '../components/grid-background'
import { WelcomeScreen } from '../components/welcome-screen'
import { VoiceInteractionUI } from '../components/voice-interaction-ui'
import { useAudioSequence } from '../hooks/use-audio-sequence'
import { useSessionManager } from '../hooks/use-session-manager'
import { useLearningSessionStore } from '../lib/session-ws'
// import { useMicrophonePermission } from '../hooks/use-microphone-permission'
import { TextLoop } from '@/components/motion/text-loop'
import { motion } from 'motion/react'
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
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // const { hasMicrophonePermission, requestMicrophonePermission } = useMicrophonePermission()
  const { 
    isInitializing, 
    initializeSession, 
    planLessons,
    researchTopic,
    audioTranscript,
    whiteboardItems,
    researchContext,
    researchSources,
    researchImages,
    isResearching,
    isPlanning
  } = useSessionManager()
  const { playSequence, stopSequence, messageAudioRef } = useAudioSequence({
    // onMessageEnd: () => setShowAudioRecorder(true),
    onVoiceWaveShow: () => setShowVoiceWave(true)
  })
  const response = useLearningSessionStore(state => state.response)
  const conversationState = useLearningSessionStore(state => state.conversationState)

  // Handle audio transcript updates
  useEffect(() => {
    if (audioTranscript) {
      // Play the audio transcript or show it as text
      console.log('New audio transcript:', audioTranscript)
    }
  }, [audioTranscript])

  // Handle response updates
  useEffect(() => {
    if (response && conversationState.status === 'received_response') {
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
      setShowTextArea(false)
      
      // Small pause before playing sound
      await new Promise(resolve => setTimeout(resolve, 300))

      // Play confirmation sound
      if (messageAudioRef.current) {
        messageAudioRef.current.src = confirmationMessage
        messageAudioRef.current.volume = 1
        try {
          await messageAudioRef.current.play()
          // Wait for the audio to finish
          await new Promise((resolve, reject) => {
            const audio = messageAudioRef.current
            if (!audio) return reject(new Error('Audio element not found'))
            audio.addEventListener('ended', resolve, { once: true })
            audio.addEventListener('error', reject, { once: true })
          })
          
          // Only transition UI and start backend calls after audio finishes
          setHasSubmitted(true)
          
          // Only start research and lesson planning after audio finishes
          researchTopic(text)
          
          // Add delay before lesson planning
          setTimeout(() => {
            planLessons(text)
          }, 1000) // Add a small delay between requests
          
          // Clear input after everything is done
          setUserInput('')
        } catch (error) {
          console.error('Error playing confirmation sound:', error)
          // Continue with the requests even if audio fails
          setHasSubmitted(true)
          researchTopic(text)
          setTimeout(() => {
            planLessons(text)
          }, 1000)
          setUserInput('')
        }
      } else {
        // If no audio ref, just proceed with the requests
        setHasSubmitted(true)
        researchTopic(text)
        setTimeout(() => {
          planLessons(text)
        }, 1000)
        setUserInput('')
      }
    } catch (error) {
      console.error('Failed to process message:', error)
      setIsSubmitting(false)
      setShowTextArea(true) // Show text area again only on error
      setError('Failed to process your request. Please try again.')
    }
  }

  // Define research and planning steps
  const researchSteps = [
    'Analyzing research context',
    'Gathering sources',
    'Processing visual content',
    'Synthesizing information',
    'Building knowledge base'
  ]

  const planningSteps = [
    'Preparing lesson structure',
    'Organizing content',
    'Creating visualizations',
    'Optimizing flow',
    'Finalizing materials'
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background */}
      <GridBackground hasStarted={hasStarted} hasSubmitted={hasSubmitted} />

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

      {/* Research Content */}
      {hasSubmitted && (
        <div className="absolute inset-0 overflow-auto py-8 px-4">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Research Context */}
            {researchContext && (
              <div className="bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Research Summary</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h4 className="text-zinc-700 dark:text-zinc-300">{researchContext.query}</h4>
                  <p>{researchContext.summary}</p>
                  <ul>
                    {(researchContext.key_findings || []).map((finding, i) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Research Sources */}
            {researchSources && (researchSources.length > 0) && (
              <div className="bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Sources</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(researchSources || []).map((source, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-md">
                      <h4 className="font-medium text-zinc-700 dark:text-zinc-300">{source.title}</h4>
                      <a href={source.url} className="text-sm text-blue-500 hover:text-blue-400 break-all" target="_blank" rel="noopener noreferrer">
                        {source.url}
                      </a>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{source.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research Images */}
            {researchImages && (researchImages.length > 0) && (
              <div className="bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Related Images</h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {(researchImages || []).map((image, i) => (
                    <div key={i} className="relative aspect-video">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="absolute inset-0 w-full h-full object-cover rounded-md"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-xs text-white">
                        {image.source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Whiteboard */}
            {whiteboardItems && (whiteboardItems.length > 0) && (
              <div className="bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md rounded-lg shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Lesson Visualization</h3>
                <div className="relative min-h-[600px] bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                  {(whiteboardItems || []).map((item, i) => (
                    <div
                      key={i}
                      className="absolute bg-white/90 dark:bg-zinc-900/90 rounded-lg shadow-sm p-4"
                      style={{
                        left: item.position.x,
                        top: item.position.y,
                        width: item.size.width,
                        height: item.size.height
                      }}
                    >
                      {item.title && <h4 className="font-medium mb-2">{item.title}</h4>}
                      {item.text && <p className="text-sm">{item.text}</p>}
                      {item.contents && (
                        <div className="space-y-2 mt-2">
                          {(item.contents || []).map((content, j) => (
                            <div key={j} className={`text-sm ${content.type === 'sticky' ? 'bg-yellow-100/50 dark:bg-yellow-900/20 p-2 rounded' : ''}`}>
                              {content.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thinking State */}
      {(isResearching || isPlanning) && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.6, 
            ease: "easeInOut",
            delay: 1.4 // Delay until grid animation completes
          }}
        >
          <motion.div 
            className="w-full max-w-[800px]"
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8,
              ease: "easeOut"
            }}
            layout="position"
          >
            <motion.div 
              className="text-center font-medium text-[#2275F3]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.8,
                ease: "easeOut"
              }}
            >
              <motion.span
                className="font-(family-name:--font-lora) text-[#2275F3] font-medium text-center leading-[1.2] tracking-[-0.02em] block"
                style={{
                  fontSize: 'clamp(32px, 5vw, 64px)',
                }}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <TextLoop interval={3}>
                  {isResearching 
                    ? researchSteps.map((step) => (
                        <span key={step}>{step}</span>
                      ))
                    : planningSteps.map((step) => (
                        <span key={step}>{step}</span>
                      ))
                  }
                </TextLoop>
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Audio Transcript */}
      {audioTranscript && !isResearching && !isPlanning && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-xl w-full mx-4 z-50">
          <div className="bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md rounded-full shadow-lg px-6 py-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-sm text-center text-zinc-700 dark:text-zinc-300">{audioTranscript}</p>
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