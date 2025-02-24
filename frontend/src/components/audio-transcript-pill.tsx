import { useEffect, useRef } from 'react'
import { VoiceIndicator } from './voice-indicator'
import { motion } from 'motion/react'

interface AudioTranscriptPillProps {
  transcript: string
  onAudioEnd?: () => void
}

export function AudioTranscriptPill({ transcript, onAudioEnd }: AudioTranscriptPillProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchAndPlayAudio = async () => {
      try {
        // Create a MediaSource instance
        const mediaSource = new MediaSource()
        const audioUrl = URL.createObjectURL(mediaSource)

        // Create audio element if it doesn't exist
        if (!audioRef.current) {
          audioRef.current = new Audio()
        }

        // Set up MediaSource
        mediaSource.addEventListener('sourceopen', async () => {
          try {
            // Create source buffer for MP3 audio
            const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
            
            // Fetch the audio stream
            const response = await fetch('/api/generate-audio', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text: transcript }),
            })

            if (!response.ok) {
              throw new Error('Failed to generate audio')
            }

            // Get the reader from the response body stream
            const reader = response.body!.getReader()
            
            // Read the stream
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              // Wait for the source buffer to be ready
              if (sourceBuffer.updating) {
                await new Promise(resolve => {
                  sourceBuffer.addEventListener('updateend', resolve, { once: true })
                })
              }

              // Append the chunk to the source buffer
              sourceBuffer.appendBuffer(value)
            }

            // Close the media source when all chunks are appended
            if (!sourceBuffer.updating) {
              mediaSource.endOfStream()
            } else {
              sourceBuffer.addEventListener('updateend', () => {
                mediaSource.endOfStream()
              }, { once: true })
            }

          } catch (error) {
            console.error('Error processing audio stream:', error)
            mediaSource.endOfStream('decode')
          }
        })

        // Set up audio element
        audioRef.current.src = audioUrl
        audioRef.current.addEventListener('ended', () => {
          onAudioEnd?.()
          URL.revokeObjectURL(audioUrl)
        }, { once: true })

        // Start playing
        await audioRef.current.play()

      } catch (error) {
        console.error('Error playing audio:', error)
      }
    }

    if (transcript) {
      fetchAndPlayAudio()
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [transcript, onAudioEnd])

  return (
    <motion.div 
      className="fixed top-4 left-1/2 -translate-x-1/2 max-w-xl w-full mx-4 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md rounded-full shadow-lg px-6 py-3">
        <div className="flex flex-col gap-2">
          <VoiceIndicator 
            audioElement={audioRef.current || undefined}
            className="w-full h-8"
          />
          <p className="text-sm text-center text-zinc-700 dark:text-zinc-300">
            {transcript}
          </p>
        </div>
      </div>
    </motion.div>
  )
} 