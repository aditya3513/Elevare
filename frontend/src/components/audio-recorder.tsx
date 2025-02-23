import { useAudioChat } from '../hooks/use-audio-chat'
import { Button } from './ui/button'
import { Mic, Square, AlertCircle, Loader2 } from 'lucide-react'

interface AudioRecorderProps {
  onRecordingComplete?: () => void
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const {
    isConnected,
    isRecording,
    hasMicrophonePermission,
    isRequestingPermission,
    startRecording,
    stopRecording,
    requestMicrophonePermission,
  } = useAudioChat()

  const handleStopRecording = () => {
    stopRecording()
    onRecordingComplete?.()
  }

  const containerClasses = "z-50 flex items-center justify-between gap-3 bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full shadow-sm px-4 py-2"

  if (!hasMicrophonePermission) {
    return (
      <div className={containerClasses}>
        <span className="text-xs text-black/70 dark:text-zinc-400">Enable microphone access</span>
        <Button
          onClick={requestMicrophonePermission}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5"
          disabled={isRequestingPermission}
        >
          {isRequestingPermission ? (
            <Loader2 className="h-4 w-4 animate-spin text-black/70 dark:text-zinc-400" />
          ) : (
            <Mic className="h-4 w-4 text-black/70 dark:text-zinc-400" />
          )}
        </Button>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
          <span className="text-xs text-red-600 dark:text-red-400">Connecting to server...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      {/* Status */}
      {isRecording ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 h-3 bg-blue-500/80 dark:bg-blue-400 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400">Recording...</span>
        </div>
      ) : (
        <span className="text-xs text-black/70 dark:text-zinc-400">Click microphone to start</span>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={isRecording ? handleStopRecording : startRecording}
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className={`h-8 w-8 transition-colors ${
            isRecording 
              ? "bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30" 
              : "hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <Mic className={`h-4 w-4 ${
            isRecording 
              ? "text-red-600 dark:text-red-400" 
              : "text-black/70 dark:text-zinc-400"
          }`} />
        </Button>

        {isRecording && (
          <Button
            onClick={handleStopRecording}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Square className="h-4 w-4 text-black/70 dark:text-zinc-400" />
          </Button>
        )}
      </div>
    </div>
  )
} 