import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface GridBackgroundProps {
  hasStarted: boolean
  hasSubmitted?: boolean
}

export function GridBackground({ hasStarted, hasSubmitted = false }: GridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  // Create and animate grid lines
  useEffect(() => {
    if (!containerRef.current) return

    // Create minor vertical lines (more frequent)
    const minorVerticalLines = Array.from({ length: 40 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "grid-line absolute top-0 bottom-0 w-px bg-[#BFD2F4]/20 transform -translate-x-full"
      line.style.left = `${(i + 1) * (100 / 40)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create minor horizontal lines
    const minorHorizontalLines = Array.from({ length: 30 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "grid-line absolute left-0 right-0 h-px bg-[#BFD2F4]/20 transform -translate-y-full"
      line.style.top = `${(i + 1) * (100 / 30)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create major vertical lines
    const majorVerticalLines = Array.from({ length: 5 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "grid-line absolute top-0 bottom-0 w-px bg-[#BFD2F4]/40 transform -translate-x-full"
      line.style.left = `${(i + 1) * (100 / 5)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create major horizontal lines
    const majorHorizontalLines = Array.from({ length: 4 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "grid-line absolute left-0 right-0 h-px bg-[#BFD2F4]/40 transform -translate-y-full"
      line.style.top = `${(i + 1) * (100 / 4)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    const allLines = [
      ...minorVerticalLines,
      ...minorHorizontalLines,
      ...majorVerticalLines,
      ...majorHorizontalLines,
    ]

    // Set initial state
    gsap.set(allLines, {
      opacity: 0,
      scale: 0.95,
    })

    // Create timeline for entrance animation
    timelineRef.current = gsap.timeline({
      paused: true,
    })

    timelineRef.current
      .to(allLines, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: {
          each: 0.01,
          from: "random",
        },
        ease: "power3.out"
      })
      .to([...minorVerticalLines, ...majorVerticalLines], {
        x: "0%",
        duration: 1,
        ease: "power2.inOut",
        stagger: {
          each: 0.02,
          from: "edges",
        },
      }, "-=0.6")
      .to([...minorHorizontalLines, ...majorHorizontalLines], {
        y: "0%",
        duration: 1,
        ease: "power2.inOut",
        stagger: {
          each: 0.02,
          from: "center",
        },
      }, "<")

    // Start animation if hasStarted is true
    if (hasStarted && timelineRef.current) {
      setTimeout(() => {
        timelineRef.current?.play()
      }, 400)
    }

    // Cleanup
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
      gsap.killTweensOf(allLines)
      allLines.forEach(line => line.remove())
    }
  }, [hasStarted])

  // Separate effect for exit animation
  useEffect(() => {
    if (!hasSubmitted || !containerRef.current) return

    const allLines = containerRef.current.querySelectorAll('.grid-line')
    const exitTimeline = gsap.timeline()
    
    exitTimeline
      .to(allLines, {
        opacity: 0,
        scale: 1.1,
        duration: 1.2,
        ease: "power2.inOut",
        stagger: {
          amount: 0.8,
          from: "random"
        }
      })
      .to('.bg-fade', {
        opacity: 0,
        duration: 1,
        ease: "power2.inOut"
      }, "-=0.8")

  }, [hasSubmitted])

  return (
    <>
      {/* Base background color */}
      <div className="bg-fade fixed inset-0 bg-[#f5f5f5]" />
      
      {/* Subtle noise overlay */}
      <div className="bg-fade fixed inset-0">
        <div className="absolute inset-0 mix-blend-soft-light opacity-[0.15]"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' seed='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
             }} />
      </div>

      {/* Grid container */}
      <div ref={containerRef} className="relative w-full h-full" />
    </>
  )
} 