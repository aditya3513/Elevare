import { useState, useEffect } from 'react'
import WavesurferPlayer from '@wavesurfer/react'
import type WaveSurfer from 'wavesurfer.js'
import { PlayIcon, PauseIcon } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface VoiceWaveProps {
  audioUrl: string
  height?: number
  waveColor?: string
  progressColor?: string
  cursorColor?: string
  barWidth?: number
  barGap?: number
  barRadius?: number
  className?: string
  autoplay?: boolean
  showControls?: boolean
}

export function VoiceWave({
  audioUrl,
  height = 80,
  waveColor = '#BFD2F4',
  progressColor = '#2275F3',
  cursorColor = '#2275F3',
  barWidth = 3,
  barGap = 4,
  barRadius = 4,
  className,
  autoplay = true,
  showControls = true,
}: VoiceWaveProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('00.00')
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)

  const handleTimeUpdate = (wavesurfer: WaveSurfer) => {
    const time = wavesurfer.getCurrentTime()
    const formatted = `${String(Math.floor(time)).padStart(2, '0')}.${String(
      Math.floor((time % 1) * 100)
    ).padStart(2, '0')}`
    setCurrentTime(formatted)
  }

  const handlePlay = () => {
    if (wavesurfer && !isPlaying) {
      wavesurfer.play().catch(() => {
        console.log('Error playing audio')
      })
    }
  }

  useEffect(() => {
    if (wavesurfer && autoplay) {
      handlePlay()
    }
  }, [audioUrl, autoplay, wavesurfer])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="h-[80px] w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
        <WavesurferPlayer
          height={height}
          waveColor={waveColor}
          progressColor={progressColor}
          cursorColor={cursorColor}
          barWidth={barWidth}
          barGap={barGap}
          barRadius={barRadius}
          url={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeupdate={handleTimeUpdate}
          onFinish={() => setIsPlaying(false)}
          onReady={(wavesurfer) => {
            if (wavesurfer) {
              setWavesurfer(wavesurfer)
            }
          }}
        />
      </div>
      {showControls && (
        <div className="flex items-center justify-center gap-4">
          <Button 
            onClick={() => wavesurfer?.playPause()} 
            size="icon" 
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isPlaying ? (
              <PauseIcon className="h-4 w-4 text-[#2275F3]" />
            ) : (
              <PlayIcon className="h-4 w-4 text-[#2275F3]" />
            )}
          </Button>
          <span className="font-mono text-sm text-[#2275F3]">{currentTime}</span>
        </div>
      )}
    </div>
  )
} 