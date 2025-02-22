import { createFileRoute } from '@tanstack/react-router'
import { Tldraw, TLComponents } from 'tldraw'
import { Mic, Square, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { cn } from '@/lib/utils'
import 'tldraw/tldraw.css'

export const Route = createFileRoute('/')({
  component: Index,
})

function AiChatTopZone({ 
  isListening, 
  isSpeaking, 
  onMicToggle, 
  onStop 
}: { 
  isListening: boolean
  isSpeaking: boolean
  onMicToggle: () => void
  onStop: () => void 
}) {
  return (
    <div className="flex items-center justify-center w-full py-2">
      <div className="flex items-center justify-between w-[320px] h-9 px-4 bg-zinc-900/95 backdrop-blur-sm border border-zinc-800/40 rounded-full shadow-lg">
        {/* Speaking indicator */}
        <div className={cn(
          "flex items-center gap-2 text-sm text-zinc-300",
          isSpeaking ? "opacity-100" : "opacity-0",
          "transition-opacity duration-200"
        )}>
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>AI is speaking...</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Microphone button */}
          <Button
            onClick={onMicToggle}
            variant={isListening ? "destructive" : "secondary"}
            size="sm"
            className={cn(
              "h-7 w-7 rounded-full",
              isListening && "bg-red-500/90 hover:bg-red-500/80"
            )}
          >
            <Mic className="w-4 h-4" />
          </Button>

          {/* Stop button */}
          <Button
            onClick={onStop}
            variant="outline"
            size="sm"
            className="h-7 w-7 rounded-full border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-600"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Index() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleMicToggle = () => {
    setIsListening(!isListening)
    // Add your microphone logic here
  }

  const handleStop = () => {
    setIsListening(false)
    setIsSpeaking(false)
    // Add your stop logic here
  }

  const components: TLComponents = {
    TopPanel: () => (
      <AiChatTopZone
        isListening={isListening}
        isSpeaking={isSpeaking}
        onMicToggle={handleMicToggle}
        onStop={handleStop}
      />
    ),
  }

  return (
    <div className="fixed inset-0">
      <Tldraw
        components={components}
        inferDarkMode
        options={{ maxPages: 1 }}
        onMount={(editor) => {
          editor.updateInstanceState({ isReadonly: true, isGridMode: true })
        }}
      />
    </div>
  )
}