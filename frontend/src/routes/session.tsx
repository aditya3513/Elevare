import { createFileRoute } from '@tanstack/react-router'
import { Tldraw } from 'tldraw'
import { AudioRecorder } from '../components/audio-recorder'
import 'tldraw/tldraw.css'

export const Route = createFileRoute('/session')({
  component: Session,
})

function Session() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-black/95 p-3">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
        <AudioRecorder />
      </div>
      <div 
        className="relative h-full rounded-xl overflow-hidden border bg-white/50 dark:bg-[rgba(18,18,18,0.5)] border-black/[0.03] dark:border-white/[0.03] backdrop-blur-sm"
      >
        <Tldraw
          inferDarkMode
          options={{ maxPages: 1 }}
          onMount={(editor) => {
            editor.updateInstanceState({ isReadonly: true, isGridMode: true })
          }}
        />
      </div>
    </div>
  )
} 