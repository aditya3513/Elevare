import { useEffect, useRef } from 'react'
import { useVoice } from '../hooks/use-voice'

interface VoiceIndicatorProps {
  audioElement?: HTMLAudioElement
  className?: string
}

export function VoiceIndicator({ 
  audioElement,
  className = ''
}: VoiceIndicatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prevValuesRef = useRef<number[]>([])
  const { audioData, error } = useVoice({ 
    audioElement,
    fftSize: 32
  })

  useEffect(() => {
    if (!audioData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size based on display size
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr)
    
    // Clear the canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Take just the middle portion of the frequency data
    const centerStart = Math.floor(audioData.length * 0.25)
    const centerEnd = Math.floor(audioData.length * 0.75)
    const centerData = audioData.slice(centerStart, centerEnd)
    
    // Initialize previous values if needed
    if (!prevValuesRef.current.length) {
      prevValuesRef.current = new Array(centerData.length).fill(0)
    }

    // Setup dimensions
    const totalWidth = rect.width * 0.8 // Spread out more
    const startX = (rect.width - totalWidth) / 2
    const spacing = totalWidth / (centerData.length - 1)
    const baseRadius = 4 // Smaller base size
    const maxRadiusIncrease = 6 // Less growth to prevent overlap
    
    centerData.forEach((value, i) => {
      // Normalize and smooth the value with more range
      const normalizedValue = Math.min(Math.max((value + 140) / 70, 0), 1)
      prevValuesRef.current[i] = prevValuesRef.current[i] * 0.8 + normalizedValue * 0.2
      
      // Calculate dot position and size
      const x = startX + (i * spacing)
      const y = rect.height / 2
      const currentRadius = baseRadius + (prevValuesRef.current[i] * maxRadiusIncrease)
      
      // Draw subtle glow first (underneath)
      ctx.beginPath()
      ctx.arc(x, y, currentRadius * 1.4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(34, 117, 243, ${0.05 + (prevValuesRef.current[i] * 0.1)})`
      ctx.fill()

      // Draw main dot
      ctx.beginPath()
      ctx.arc(x, y, currentRadius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(34, 117, 243, ${0.25 + (prevValuesRef.current[i] * 0.35)})`
      ctx.fill()
    })
  }, [audioData])

  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>
  }

  return (
    <canvas 
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
} 