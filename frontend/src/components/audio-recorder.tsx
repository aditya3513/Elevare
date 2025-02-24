import { useMicrophonePermission } from '../hooks/use-microphone-permission'
import { useAudioRecorder } from '../hooks/use-audio-recorder'
import { useSpeechConversion } from '../hooks/use-speech-conversion'
import { Button } from './ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'

interface AudioRecorderProps {
  isInitialQuery?: boolean
  onRecordingComplete?: (text: string) => void
}

export function AudioRecorder({ isInitialQuery = false, onRecordingComplete }: AudioRecorderProps) {
  const {
    hasMicrophonePermission,
    isRequestingPermission,
    requestMicrophonePermission,
  } = useMicrophonePermission()

  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useAudioRecorder()

  const {
    convertSpeechToText,
    convertTextToSpeech,
  } = useSpeechConversion()

  const handleStartRecording = async () => {
    if (!hasMicrophonePermission) {
      const granted = await requestMicrophonePermission()
      if (!granted) return
    }
    startRecording()
  }

  const handleStopRecording = async () => {
    try {
      const audioBlob = await stopRecording()
      if (!audioBlob) return

      const text = await convertSpeechToText(audioBlob)
      await convertTextToSpeech(text) // Play back the transcribed text
      onRecordingComplete?.(text)
    } catch (error) {
      console.error('Error processing recording:', error)
    }
  }

  const containerClasses = "z-50 flex h-8 items-center justify-between gap-3 bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full shadow-sm px-4 animate-in fade-in slide-in-from-bottom-4 duration-700"

  if (!hasMicrophonePermission) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#2275F3] shadow-[0_0_8px_rgba(34,117,243,0.5)]" />
          <span className="text-xs text-black/70 dark:text-zinc-400">Microphone access required</span>
        </div>
        <Button
          onClick={requestMicrophonePermission}
          variant="ghost"
          className="h-6 min-w-[90px] px-2.5 text-xs hover:bg-black/5 dark:hover:bg-white/5"
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
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${
          isRecording 
            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'
            : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
        }`} />
        <span className="text-xs text-black/70 dark:text-zinc-400">
          {isRecording 
            ? 'Recording...' 
            : isInitialQuery 
              ? "What would you like to learn about?"
              : "Click microphone to start"
          }
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          variant="ghost"
          className="h-6 min-w-[90px] px-2.5 text-xs hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div className="flex items-center justify-center gap-1.5">
            {isRecording ? (
              <>
                <Square className="h-3 w-3 text-red-500" />
                <span className="text-red-500">Stop</span>
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 text-[#2275F3]" />
                <span className="text-[#2275F3]">Record</span>
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  )
} 