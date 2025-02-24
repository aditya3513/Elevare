import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Mic, MicOff, CheckCircle, Loader2 } from 'lucide-react'
import { useAudioRecorder } from '../hooks/use-audio-recorder'
import { useMicrophonePermission } from '../hooks/use-microphone-permission'
import { cn } from '../lib/utils'
import { useLearningSessionStore } from '../lib/session-ws'

export function InitialAudioRecorder() {
  const [isMuted, setIsMuted] = useState(false)
  
  const {
    hasMicrophonePermission,
    isRequestingPermission,
    requestMicrophonePermission,
  } = useMicrophonePermission()

  const { 
    conversationState, 
    sendInitialQuery, 
    setConversationState 
  } = useLearningSessionStore()

  const {
    startRecording,
    stopRecording,
    cleanup,
  } = useAudioRecorder()

  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Initialize recording when idle
  useEffect(() => {
    const initializeRecording = async () => {
      if (conversationState.status === 'idle' && !isMuted) {
        if (!hasMicrophonePermission) {
          const granted = await requestMicrophonePermission()
          if (!granted) return
        }
        console.log('Starting new recording')
        startRecording()
        setConversationState({ status: 'recording' })
      }
    }
    
    initializeRecording()
  }, [startRecording, hasMicrophonePermission, requestMicrophonePermission, conversationState.status, isMuted, setConversationState])

  const handleFinishRecording = async () => {
    try {
      console.log('Finishing recording')
      const audioBlob = await stopRecording()
      if (!audioBlob) {
        console.error('No audio data received from recording')
        return
      }

      console.log(`Recorded audio size: ${audioBlob.size} bytes`)
      try {
        sendInitialQuery(audioBlob)
      } finally {
        cleanup()
      }
    } catch (error) {
      console.error('Error processing recording:', error)
      setConversationState({ status: 'error', error: 'Failed to process recording' })
      cleanup()
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      console.log('Unmuting microphone')
      setIsMuted(false)
    } else {
      console.log('Muting microphone')
      stopRecording()
      setIsMuted(true)
      setConversationState({ status: 'idle' })
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const getStatusMessage = () => {
    if (isMuted) return "Microphone muted..."
    
    switch (conversationState.status) {
      case 'recording':
        return "Recording your question..."
      case 'sending':
        return "Sending your question..."
      case 'waiting_for_response':
        return "Waiting for response..."
      case 'received_response':
        return `Received response (${((conversationState.audioSize || 0) / 1024).toFixed(1)}KB)...`
      case 'playing_response':
        return "Playing response..."
      case 'error':
        return conversationState.error
      default:
        return "Ready to record..."
    }
  }

  const getStatusColor = () => {
    if (isMuted) return 'bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.5)]'
    
    switch (conversationState.status) {
      case 'recording':
        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'
      case 'sending':
      case 'waiting_for_response':
        return 'bg-[#2275F3] shadow-[0_0_8px_rgba(34,117,243,0.5)] animate-pulse'
      case 'received_response':
      case 'playing_response':
        return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
      case 'error':
        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
      default:
        return 'bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.5)]'
    }
  }

  if (!hasMicrophonePermission) {
    return (
      <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#2275F3] shadow-[0_0_8px_rgba(34,117,243,0.5)]" />
          <span className="text-base font-medium text-black/70 dark:text-zinc-400">
            Microphone access required
          </span>
        </div>
        <Button
          onClick={requestMicrophonePermission}
          variant="outline"
          size="lg"
          disabled={isRequestingPermission}
          className="bg-[#2275F3]/5 hover:bg-[#2275F3]/10 border-[#2275F3]/10"
        >
          <div className="flex items-center gap-2">
            {isRequestingPermission ? (
              <>
                <Loader2 className="h-4 w-4 text-[#2275F3] animate-spin" />
                <span className="text-[#2275F3] font-medium">Requesting Access</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 text-[#2275F3]" />
                <span className="text-[#2275F3] font-medium">Enable Microphone</span>
              </>
            )}
          </div>
        </Button>
      </div>
    )
  }

  const isProcessing = conversationState.status === 'sending' || 
                      conversationState.status === 'waiting_for_response' ||
                      conversationState.status === 'received_response' ||
                      conversationState.status === 'playing_response'

  return (
    <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Recording status */}
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", getStatusColor())} />
        <span className="text-base font-medium text-black/70 dark:text-zinc-400">
          {getStatusMessage()}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleMute}
          variant="outline"
          size="lg"
          disabled={isProcessing}
          className={cn(
            isMuted 
              ? "bg-red-500/5 hover:bg-red-500/10 border-red-500/10" 
              : "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2">
            {isMuted ? (
              <>
                <MicOff className="h-4 w-4 text-red-500" />
                <span className="text-red-500 font-medium">Unmute</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 text-black/70 dark:text-zinc-400" />
                <span className="text-black/70 dark:text-zinc-400 font-medium">Mute</span>
              </>
            )}
          </div>
        </Button>

        <Button
          onClick={handleFinishRecording}
          variant="outline"
          size="lg"
          disabled={conversationState.status !== 'recording' || isMuted || isProcessing}
          className={cn(
            "bg-[#2275F3]/5 hover:bg-[#2275F3]/10 border-[#2275F3]/10",
            (conversationState.status !== 'recording' || isMuted || isProcessing) && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 text-[#2275F3] animate-spin" />
                <span className="text-[#2275F3] font-medium">Processing</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-[#2275F3]" />
                <span className="text-[#2275F3] font-medium">Finish</span>
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  )
} 