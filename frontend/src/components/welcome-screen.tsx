import { useEffect } from 'react'
import gsap from 'gsap'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
// import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
// import { useMicrophonePermission } from '../hooks/use-microphone-permission'

interface WelcomeScreenProps {
  isInitializing: boolean
  onStart: () => void
}

export function WelcomeScreen({ isInitializing, onStart }: WelcomeScreenProps) {
  // const { hasMicrophonePermission, isRequestingPermission, requestMicrophonePermission } = useMicrophonePermission()

  // Add entrance animation for initial content
  useEffect(() => {
    const tl = gsap.timeline({
      defaults: {
        duration: 1,
        ease: "power3.out"
      }
    })

    // Initial state
    gsap.set(['.content-fade h1', '.mic-fade', '.button-fade', '.footer-fade'], {
      opacity: 0,
      y: 20
    })

    // Animate elements in sequence
    tl.to('.content-fade h1', {
      opacity: 1,
      y: 0,
      delay: 0.2
    })
    .to('.mic-fade', {
      opacity: 1,
      y: 0
    }, '-=0.6')
    .to('.button-fade', {
      opacity: 1,
      y: 0
    }, '-=0.6')
    .to('.footer-fade', {
      opacity: 1,
      y: 0
    }, '-=0.4')

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div className="fixed inset-0">
      {/* Outer grid */}
      <div className="grid-line absolute left-[5%] sm:left-[8%] top-0 bottom-0 w-[1px] sm:w-[2px] bg-[#BFD2F4]/40" />
      <div className="grid-line absolute right-[5%] sm:right-[8%] top-0 bottom-0 w-[1px] sm:w-[2px] bg-[#BFD2F4]/40" />
      <div className="grid-line absolute top-[5%] sm:top-[8%] left-0 right-0 h-[1px] sm:h-[2px] bg-[#BFD2F4]/40" />
      <div className="grid-line absolute bottom-[5%] sm:bottom-[8%] left-0 right-0 h-[1px] sm:h-[2px] bg-[#BFD2F4]/40" />

      {/* Button grid lines */}
      <div className="grid-line absolute left-[15%] sm:left-[20%] md:left-[25%] top-0 bottom-0 w-[1px] sm:w-[2px] bg-[#BFD2F4]/40" />
      <div className="grid-line absolute right-[15%] sm:right-[20%] md:right-[25%] top-0 bottom-0 w-[1px] sm:w-[2px] bg-[#BFD2F4]/40" />
      <div className="grid-line absolute top-[55%] sm:top-[60%] md:top-[65%] left-0 right-0 h-[1px] sm:h-[2px] bg-[#BFD2F4]/40" />
      <div className="grid-line absolute bottom-[15%] sm:bottom-[20%] md:bottom-[25%] left-0 right-0 h-[1px] sm:h-[2px] bg-[#BFD2F4]/40" />

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center">
        {/* Header and Microphone Permission Group */}
        <div className="content-fade absolute left-[15%] sm:left-[20%] md:left-[25%] right-[15%] sm:right-[20%] md:right-[25%] top-[15%] sm:top-[20%] md:top-[25%] flex flex-col items-center space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header */}
          <h1 
            className="font-(family-name:--font-lora) text-[#2275F3] font-medium text-center leading-[1.2] tracking-[-0.02em] w-full"
            style={{
              fontSize: 'clamp(32px, 5.5vw, 72px)',
              maxWidth: 'clamp(300px, 90%, 800px)'
            }}
          >
            What sparks your<br className="block" /> curiosity today?
          </h1>

          {/* Microphone Permission Status */}
          {/* <div className="z-50 mic-fade flex h-7 sm:h-8 items-center justify-between gap-2 bg-white/10 dark:bg-zinc-900/50 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full shadow-sm px-2.5 sm:px-3 w-fit">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${!hasMicrophonePermission 
                ? 'bg-[#2275F3] shadow-[0_0_8px_rgba(34,117,243,0.5)]' 
                : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
              }`} />
              <span className="text-[10px] sm:text-xs whitespace-nowrap text-black/70 dark:text-zinc-400">
                {!hasMicrophonePermission 
                  ? 'Microphone access required' 
                  : 'Microphone access enabled'
                }
              </span>
            </div>
            {!hasMicrophonePermission && (
              <Button
                onClick={requestMicrophonePermission}
                variant="ghost"
                className="h-5 sm:h-6 min-w-[70px] sm:min-w-[80px] px-1.5 sm:px-2 text-[10px] sm:text-xs hover:bg-black/5 dark:hover:bg-white/5 ml-1"
                disabled={isRequestingPermission}
              >
                <div className="flex items-center justify-center gap-1">
                  {isRequestingPermission && (
                    <Loader2 className="h-2 w-2 sm:h-2.5 sm:w-2.5 animate-spin" />
                  )}
                  <span className="text-[#2275F3] whitespace-nowrap">
                    {isRequestingPermission ? 'Requesting...' : 'Enable'}
                  </span>
                </div>
              </Button>
            )}
          </div> */}
        </div>
        
        {/* Button container */}
        <div className="button-fade absolute left-[15%] sm:left-[20%] md:left-[25%] right-[15%] sm:right-[20%] md:right-[25%] top-[55%] sm:top-[60%] md:top-[65%] bottom-[15%] sm:bottom-[20%] md:bottom-[25%] flex items-center justify-center">
          {/* <Tooltip>
            <TooltipTrigger asChild> */}
              <div className="w-full h-full">
                <Button
                  onClick={onStart}
                  // disabled={isInitializing || !hasMicrophonePermission}
                  className="w-full h-full bg-transparent hover:bg-[#BFD2F4]/20 transition-colors duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-none shadow-none"
                  variant="ghost"
                >
                  <span 
                    className="flex items-center gap-2 tracking-wide font-(family-name:--font-lora) font-medium text-[#2275F3] group-hover:text-[#2275F3]/80"
                    style={{
                      fontSize: 'clamp(16px, 2.5vw, 24px)'
                    }}
                  >
                    {isInitializing && (
                      <Loader2 
                        className="animate-spin"
                        style={{
                          width: 'clamp(16px, 2vw, 20px)',
                          height: 'auto'
                        }}
                      />
                    )}
                    {isInitializing ? 'Preparing...' : 'Let\'s Explore'}
                  </span>
                </Button>
              </div>
            {/* </TooltipTrigger>
            {!hasMicrophonePermission && !isInitializing && (
              <TooltipContent side="top" className="bg-black/75 text-white border-none text-xs sm:text-sm">
                Enable microphone access to continue
              </TooltipContent>
            )}
          </Tooltip> */}
        </div>

        {/* Footer text */}
        <div className="footer-fade absolute bottom-[3%] left-1/2 -translate-x-1/2 text-[#2275F3]/60 text-xs sm:text-sm px-4 text-center">
          Made with ❤️ by Aditya Sharma, Nikita Dhotre, and Yousef Alsayid
        </div>
      </div>
    </div>
  )
} 