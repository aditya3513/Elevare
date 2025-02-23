import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { InitialAudioRecorder } from '../components/initial-audio-recorder'
import { useLearningSessionStore } from '../lib/session-ws'
import { useAudioWebSocketStore } from '../lib/audio-ws'
import { useNavigate } from '@tanstack/react-router'
import gsap from 'gsap'
import { useAudioChat } from '../hooks/use-audio-chat'
import { Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { VoiceIndicator } from '../components/voice-indicator'

import introEffect from '../assets/audio/intro-effect.mp3'
import introMessage from '../assets/audio/intro-message.mp3'

// API URLs
const API_URL = 'http://localhost:9000'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const [hasStarted, setHasStarted] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showVoiceWave, setShowVoiceWave] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { connect: connectSession } = useLearningSessionStore()
  const { connect: connectAudio } = useAudioWebSocketStore()
  const { hasMicrophonePermission, isRequestingPermission, requestMicrophonePermission } = useAudioChat()
  
  const effectAudioRef = useRef<HTMLAudioElement | null>(null)
  const messageAudioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const voiceIndicatorRef = useRef<HTMLDivElement>(null)

  // Create and animate grid lines
  useEffect(() => {
    if (!containerRef.current) return

    // Create minor vertical lines (more frequent)
    const minorVerticalLines = Array.from({ length: 40 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "absolute top-0 bottom-0 w-px bg-[#BFD2F4]/20 transform -translate-x-full"
      line.style.left = `${(i + 1) * (100 / 40)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create minor horizontal lines
    const minorHorizontalLines = Array.from({ length: 30 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "absolute left-0 right-0 h-px bg-[#BFD2F4]/20 transform -translate-y-full"
      line.style.top = `${(i + 1) * (100 / 30)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create major vertical lines
    const majorVerticalLines = Array.from({ length: 5 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "absolute top-0 bottom-0 w-px bg-[#BFD2F4]/40 transform -translate-x-full"
      line.style.left = `${(i + 1) * (100 / 5)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create major horizontal lines
    const majorHorizontalLines = Array.from({ length: 4 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "absolute left-0 right-0 h-px bg-[#BFD2F4]/40 transform -translate-y-full"
      line.style.top = `${(i + 1) * (100 / 4)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    const allLines = [
      ...minorVerticalLines,
      ...minorHorizontalLines,
      ...majorVerticalLines,
      ...majorHorizontalLines,
    ]

    // Set initial state
    gsap.set(allLines, {
      opacity: 0,
      scale: 0.95,
    })

    // Create timeline for entrance animation
    timelineRef.current = gsap.timeline({
      paused: true,
    })

    timelineRef.current
      .to(allLines, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: {
          each: 0.01,
          from: "random",
        },
        ease: "power3.out"
      })
      .to([...minorVerticalLines, ...majorVerticalLines], {
        x: "0%",
        duration: 1,
        ease: "power2.inOut",
        stagger: {
          each: 0.02,
          from: "edges",
        },
      }, "-=0.6")
      .to([...minorHorizontalLines, ...majorHorizontalLines], {
        y: "0%",
        duration: 1,
        ease: "power2.inOut",
        stagger: {
          each: 0.02,
          from: "center",
        },
      }, "<")

    // Cleanup
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
      gsap.killTweensOf(allLines)
      allLines.forEach(line => line.remove())
    }
  }, [])

  // Handle audio playback
  const playSequence = async () => {
    try {
      // Create audio elements if they don't exist
      if (!effectAudioRef.current || !messageAudioRef.current) {
        effectAudioRef.current = new Audio(introEffect)
        messageAudioRef.current = new Audio(introMessage)
      }

      // Reset state
      setShowAudioRecorder(false)
      
      // Setup message audio ended handler
      const handleMessageEnded = () => {
        setShowAudioRecorder(true)
      }
      
      if (messageAudioRef.current) {
        // Remove any existing listeners first
        messageAudioRef.current.removeEventListener('ended', handleMessageEnded)
        // Add the new listener
        messageAudioRef.current.addEventListener('ended', handleMessageEnded)
      }

      await effectAudioRef.current.play()
      
      // Start message audio and show voice wave 6 seconds into the intro effect
      setTimeout(() => {
        setShowVoiceWave(true)
        messageAudioRef.current?.play()
          .catch(err => console.error("Error playing message:", err))
      }, 4500)

      // Cleanup function to remove the event listener
      return () => {
        messageAudioRef.current?.removeEventListener('ended', handleMessageEnded)
      }
    } catch (err) {
      console.error("Error in playSequence:", err)
    }
  }

  // Initialize session
  const initializeSession = async () => {
    // If we don't have microphone permission, request it first
    if (!hasMicrophonePermission) {
      const granted = await requestMicrophonePermission()
      if (!granted) {
        setError('Microphone access is required to continue.')
        return
      }
    }

    setIsInitializing(true)
    setError(null)

    try {
      // Play audio immediately
      const cleanup = await playSequence()

      const response = await fetch(`${API_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        cleanup?.()
        throw new Error('Failed to create session')
      }

      const { session_id } = await response.json()

      // Start both WebSocket connections
      connectSession(session_id)
      connectAudio()
      
      // Start transition
      const tl = gsap.timeline({
        onComplete: () => {
          setHasStarted(true)
          
          // Start entrance animation after a shorter delay
          setTimeout(() => {
            if (timelineRef.current) {
              timelineRef.current.play()
            }
          }, 400)
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
      console.error('Failed to initialize session:', err)
      setError('Failed to start session. Please try again.')
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

  // Handle layout animation when audio recorder appears
  useEffect(() => {
    if (showAudioRecorder && voiceIndicatorRef.current) {
      gsap.to(voiceIndicatorRef.current, {
        y: -16, // Slightly less movement for tighter spacing
        duration: 0.7,
        ease: "power3.out"
      })
    }
  }, [showAudioRecorder])

  return (
    <>
      {/* Background and noise layers */}
      <div className="relative w-screen h-screen overflow-hidden">
        {/* Base background color */}
        <div className="bg-fade fixed inset-0 bg-[#f5f5f5]" />
        
        {/* Subtle noise overlay */}
        <div className="bg-fade fixed inset-0">
          <div className="absolute inset-0 mix-blend-soft-light opacity-[0.15]"
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' seed='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
               }} />
        </div>

        {/* Grid container */}
        <div ref={containerRef} className="relative w-full h-full" />

        {/* Voice Indicator Card */}
        {showVoiceWave && hasStarted && (
          <div className="fixed inset-0 flex items-center justify-center">
            <div 
              className="w-[500px] bg-white/60 dark:bg-black/40 backdrop-blur-2xl rounded-3xl p-10 
                        shadow-[0_8px_32px_rgba(34,117,243,0.1)] border border-[#2275F3]/10 
                        animate-in fade-in zoom-in-95 duration-700 ease-out"
            >
              <div className="w-full flex flex-col items-center">
                <div ref={voiceIndicatorRef} className="w-full transition-all duration-700">
                  <VoiceIndicator 
                    audioElement={messageAudioRef.current || undefined}
                    className="w-full h-24"
                  />
                </div>
                {showAudioRecorder && (
                  <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <InitialAudioRecorder 
                      onRecordingComplete={() => navigate({ to: '/session' })} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Initial content */}
        {!hasStarted && (
          <div className="fixed inset-0">
            {/* Outer grid */}
            <div className="grid-line absolute left-[8%] top-0 bottom-0 w-[2px] bg-[#BFD2F4]/40" />
            <div className="grid-line absolute right-[8%] top-0 bottom-0 w-[2px] bg-[#BFD2F4]/40" />
            <div className="grid-line absolute top-[8%] left-0 right-0 h-[2px] bg-[#BFD2F4]/40" />
            <div className="grid-line absolute bottom-[8%] left-0 right-0 h-[2px] bg-[#BFD2F4]/40" />

            {/* Button grid lines */}
            <div className="grid-line absolute left-[25%] top-0 bottom-0 w-[2px] bg-[#BFD2F4]/40" />
            <div className="grid-line absolute right-[25%] top-0 bottom-0 w-[2px] bg-[#BFD2F4]/40" />
            <div className="grid-line absolute top-[65%] left-0 right-0 h-[2px] bg-[#BFD2F4]/40" />
            <div className="grid-line absolute bottom-[25%] left-0 right-0 h-[2px] bg-[#BFD2F4]/40" />

            {/* Content container */}
            <div className="absolute inset-0 flex flex-col items-center">
              {/* Header and Microphone Permission Group */}
              <div className="content-fade absolute left-[25%] right-[25%] top-[25%] flex flex-col items-center space-y-12">
                {/* Header */}
                <h1 className="font-(family-name:--font-lora) text-[64px] md:text-[84px] text-[#2275F3] font-medium text-center leading-[1.15] tracking-[-0.02em]">
                  What sparks your<br className="hidden md:block" /> curiosity today?
                </h1>

                {/* Microphone Permission Status */}
                <div className="z-50 mic-fade flex h-8 items-center justify-between gap-3 bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full shadow-sm px-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${!hasMicrophonePermission 
                      ? 'bg-[#2275F3] shadow-[0_0_8px_rgba(34,117,243,0.5)]' 
                      : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                    }`} />
                    <span className="text-xs text-black/70 dark:text-zinc-400">
                      {!hasMicrophonePermission 
                        ? 'Microphone access required' 
                        : 'Microphone access enabled'
                      }
                    </span>
                  </div>
                  {!hasMicrophonePermission && (
                    <Button
                      onClick={requestMicrophonePermission}
                      variant="ghost"
                      className="h-6 min-w-[90px] px-2.5 text-xs hover:bg-black/5 dark:hover:bg-white/5 ml-2"
                      disabled={isRequestingPermission}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {isRequestingPermission && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        <span className="text-[#2275F3]">
                          {isRequestingPermission ? 'Requesting' : 'Enable Access'}
                        </span>
                      </div>
                    </Button>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="content-fade text-red-600 dark:text-red-400 text-sm mt-4">
                  {error}
                </div>
              )}
              
              <div className="button-fade absolute left-[25%] right-[25%] top-[65%] bottom-[25%] flex items-center justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full h-full">
                      <Button
                        onClick={initializeSession}
                        disabled={isInitializing || !hasMicrophonePermission}
                        className="w-full h-full bg-transparent hover:bg-[#BFD2F4]/20 transition-colors duration-200
                                disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-none shadow-none"
                        variant="ghost"
                      >
                        <span className="text-lg tracking-wide font-(family-name:--font-lora) font-medium text-[#2275F3] group-hover:text-[#2275F3]/80">
                          {isInitializing ? 'Starting...' : 'Let\'s Explore'}
                        </span>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!hasMicrophonePermission && !isInitializing && (
                    <TooltipContent side="top" className="bg-black/75 text-white border-none">
                      Enable microphone access to continue
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>

              {/* Error message */}
              {error && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[15%] text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Footer text */}
              <div className="footer-fade absolute bottom-[3%] left-1/2 -translate-x-1/2 text-[#2275F3]/60 text-sm">
                Made with ❤️ by Aditya Sharma, Nikita Dhotre, and Yousef Alsayid
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}