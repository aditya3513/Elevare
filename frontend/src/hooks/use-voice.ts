import { useEffect, useRef, useState } from 'react'

interface UseVoiceOptions {
  audioElement?: HTMLAudioElement
  fftSize?: number
}

// Global AudioContext instance
let sharedAudioContext: AudioContext | null = null

// Keep track of audio elements that already have sources
const audioSourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>()

export function useVoice({ 
  audioElement, 
  fftSize = 256 
}: UseVoiceOptions) {
  const [audioData, setAudioData] = useState<Float32Array | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyzerNodeRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!audioElement) return

    const cleanup = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (analyzerNodeRef.current) {
        try {
          analyzerNodeRef.current.disconnect()
        } catch (e) {
          console.error('Error disconnecting analyzer:', e)
        }
      }

      sourceNodeRef.current = null
      analyzerNodeRef.current = null
      setAudioData(null)
    }

    const setup = async () => {
      try {
        cleanup()

        // Get or create shared AudioContext
        if (!sharedAudioContext) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          sharedAudioContext = new AudioContextClass()
        }

        // Get or create source node
        let source = audioSourceMap.get(audioElement)
        if (!source) {
          source = sharedAudioContext.createMediaElementSource(audioElement)
          audioSourceMap.set(audioElement, source)
        }
        sourceNodeRef.current = source

        // Create analyzer node
        analyzerNodeRef.current = sharedAudioContext.createAnalyser()
        analyzerNodeRef.current.fftSize = fftSize

        // Connect nodes
        sourceNodeRef.current.connect(analyzerNodeRef.current)
        analyzerNodeRef.current.connect(sharedAudioContext.destination)

        // Setup data collection
        const bufferLength = analyzerNodeRef.current.frequencyBinCount
        const dataArray = new Float32Array(bufferLength)

        const collectData = () => {
          if (!analyzerNodeRef.current) return
          
          analyzerNodeRef.current.getFloatFrequencyData(dataArray)
          setAudioData(new Float32Array(dataArray))
          animationFrameRef.current = requestAnimationFrame(collectData)
        }

        // Ensure audio context is running
        if (sharedAudioContext.state === 'suspended') {
          await sharedAudioContext.resume()
        }

        // Start collecting data
        collectData()

      } catch (error) {
        console.error('Error setting up audio analyzer:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        cleanup()
      }
    }

    setup()
    return cleanup
  }, [audioElement, fftSize])

  return {
    audioData,
    error
  }
} 