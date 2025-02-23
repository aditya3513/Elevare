import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Mic, MicOff, Square, RotateCcw, Loader2 } from 'lucide-react'
import { useAudioWebSocketStore } from '../lib/audio-ws'

interface InitialAudioRecorderProps {
  onRecordingComplete?: () => void
}

export function InitialAudioRecorder({ onRecordingComplete }: InitialAudioRecorderProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useAudioWebSocketStore()

  // Start recording automatically when component mounts
  useEffect(() => {
    startRecording()
  }, [startRecording])

  const handleStopRecording = () => {
    setIsProcessing(true)
    stopRecording()
    // Simulate waiting for processing - replace this with actual WebSocket confirmation
    setTimeout(() => {
      setIsProcessing(false)
      onRecordingComplete?.()
    }, 2000)
  }

  const handleRestart = () => {
    startRecording()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Here you would typically call some method to actually mute the audio stream
    // This would be implemented in your audio WebSocket store
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Recording status */}
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${
          isProcessing
            ? 'bg-[#2275F3] shadow-[0_0_12px_rgba(34,117,243,0.5)]'
            : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
        }`} />
        <span className="text-lg font-medium text-black/70 dark:text-zinc-400">
          {isProcessing 
            ? "Processing your question..." 
            : isMuted 
              ? "Microphone muted" 
              : "Recording your question..."}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Mute toggle */}
        <Button
          onClick={toggleMute}
          variant="outline"
          size="lg"
          disabled={isProcessing}
          className={`
            transition-all duration-200 
            ${isMuted 
              ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20' 
              : 'hover:bg-black/5 dark:hover:bg-white/5'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
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

        {/* Stop/Restart button */}
        {isRecording ? (
          <Button
            onClick={handleStopRecording}
            variant="outline"
            size="lg"
            disabled={isProcessing}
            className={`
              bg-[#2275F3]/10 hover:bg-[#2275F3]/20 border-[#2275F3]/20
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 text-[#2275F3] animate-spin" />
                  <span className="text-[#2275F3] font-medium">Processing</span>
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 text-[#2275F3]" />
                  <span className="text-[#2275F3] font-medium">Stop</span>
                </>
              )}
            </div>
          </Button>
        ) : (
          <Button
            onClick={handleRestart}
            variant="outline"
            size="lg"
            className="bg-[#2275F3]/10 hover:bg-[#2275F3]/20 border-[#2275F3]/20"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#2275F3]" />
              <span className="text-[#2275F3] font-medium">Start Over</span>
            </div>
          </Button>
        )}
      </div>
    </div>
  )
} 