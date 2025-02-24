import { VoiceIndicator } from './voice-indicator'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
// import { InitialAudioRecorder } from './initial-audio-recorder'
// import { AudioResponseHandler } from './audio-response-handler'

interface VoiceInteractionUIProps {
  // showAudioRecorder: boolean
  messageAudioRef: React.RefObject<HTMLAudioElement | null>
  userInput: string
  setUserInput: (value: string) => void
  onSubmit: (text: string) => void
  showTextArea: boolean
  onAudioEnd: () => void
  isSubmitting: boolean
}

export function VoiceInteractionUI({ 
  messageAudioRef, 
  userInput, 
  setUserInput, 
  onSubmit,
  showTextArea,
  onAudioEnd
}: VoiceInteractionUIProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (userInput.trim()) {
      setIsSubmitting(true)
      onSubmit(userInput.trim())
    }
  }

  // Reset isSubmitting when showTextArea changes to true
  useEffect(() => {
    if (showTextArea) {
      setIsSubmitting(false)
    }
  }, [showTextArea])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value)
  }

  useEffect(() => {
    const audioElement = messageAudioRef.current
    if (audioElement) {
      audioElement.addEventListener('ended', onAudioEnd)
      return () => {
        audioElement.removeEventListener('ended', onAudioEnd)
      }
    }
  }, [messageAudioRef, onAudioEnd])

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: {
          duration: 0.8,
          ease: "easeInOut",
          when: "afterChildren",
          delay: 0.2
        }
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.div 
        className="w-full max-w-[500px] bg-white/60 dark:bg-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl 
                  p-6 sm:p-8 md:p-10 shadow-[0_8px_32px_rgba(34,117,243,0.1)] border border-[#2275F3]/10"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ 
          scale: 0.96,
          opacity: 0,
          transition: {
            duration: 0.6,
            ease: "easeInOut"
          }
        }}
        transition={{ 
          duration: 0.3,
          ease: "easeOut"
        }}
        layout="position"
      >
        <motion.div 
          className="w-full flex flex-col items-center" 
          layout="position"
          transition={{
            layout: { duration: 0.2, ease: "easeOut" }
          }}
        >
          <motion.div 
            className="w-full" 
            layout="position"
            transition={{
              layout: { duration: 0.3, ease: "easeOut" }
            }}
          >
            <VoiceIndicator 
              audioElement={messageAudioRef.current || undefined}
              className="w-full h-16 sm:h-20 md:h-24"
            />
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div 
                  key="processing"
                  className="mt-6 text-center font-medium text-base text-[#2275F3]/80 dark:text-[#2275F3]/90"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ 
                    duration: 0.4,
                    ease: "easeOut" 
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    Processing your message
                  </motion.span>
                </motion.div>
              ) : showTextArea ? (
                <motion.form 
                  key="form"
                  onSubmit={handleSubmit} 
                  className="w-full mt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                >
                  <motion.div 
                    className="flex flex-col gap-4"
                  >
                    <motion.textarea
                      value={userInput}
                      onChange={handleTextChange}
                      placeholder="Type your topic here..."
                      className="w-full h-24 px-4 py-2 bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-lg 
                                border border-[#2275F3]/20 focus:border-[#2275F3]/40 focus:outline-none 
                                transition-colors resize-none"
                      autoFocus
                    />
                    <motion.button
                      type="submit"
                      className="w-full px-4 py-2 bg-[#2275F3] text-white rounded-lg 
                                hover:bg-[#1b5cd3] transition-colors
                                disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!userInput.trim()}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      Start Learning
                    </motion.button>
                  </motion.div>
                </motion.form>
              ) : null}
            </AnimatePresence>
          </motion.div>
          {/* {showAudioRecorder && (
            <>
              <div className="w-full mt-4 sm:mt-6 md:mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <InitialAudioRecorder />
              </div>
              <div className="w-full mt-4">
                <AudioResponseHandler />
              </div>
            </>
          )} */}
        </motion.div>
      </motion.div>
    </motion.div>
  )
} 
