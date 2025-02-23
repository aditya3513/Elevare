"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

interface GridAnimationProps {
  isActive?: boolean
}

export default function GridAnimation({ isActive = false }: GridAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Create minor vertical lines (more frequent)
    const minorVerticalLines = Array.from({ length: 40 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "absolute top-0 bottom-0 w-px bg-[#BFD2F4]/20 transform -translate-x-full"
      line.style.left = `${(i + 1) * (100 / 40)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create minor horizontal lines
    const minorHorizontalLines = Array.from({ length: 30 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "absolute left-0 right-0 h-px bg-[#BFD2F4]/20 transform -translate-y-full"
      line.style.top = `${(i + 1) * (100 / 30)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create major vertical lines (every 8 minor lines)
    const majorVerticalLines = Array.from({ length: 5 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "absolute top-0 bottom-0 w-px bg-[#BFD2F4]/40 transform -translate-x-full"
      line.style.left = `${(i + 1) * (100 / 5)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create major horizontal lines
    const majorHorizontalLines = Array.from({ length: 4 }).map((_, i) => {
      const line = document.createElement("div")
      line.className = "absolute left-0 right-0 h-px bg-[#BFD2F4]/40 transform -translate-y-full"
      line.style.top = `${(i + 1) * (100 / 4)}%`
      containerRef.current?.appendChild(line)
      return line
    })

    // Create border lines
    const leftBorder = document.createElement("div")
    leftBorder.className = "absolute top-0 bottom-0 left-0 w-px bg-[#BFD2F4]/60 transform -translate-x-full"
    containerRef.current?.appendChild(leftBorder)

    const rightBorder = document.createElement("div")
    rightBorder.className = "absolute top-0 bottom-0 right-0 w-px bg-[#BFD2F4]/60 transform translate-x-full"
    containerRef.current?.appendChild(rightBorder)

    const allLines = [
      ...minorVerticalLines,
      ...minorHorizontalLines,
      ...majorVerticalLines,
      ...majorHorizontalLines,
      leftBorder,
      rightBorder,
    ]

    // Create main timeline
    timelineRef.current = gsap.timeline({
      defaults: {
        ease: "power2.inOut",
      },
      paused: true, // Start paused
    })

    // Phase 1: Initial fade in (0-2s)
    timelineRef.current.to(allLines, {
      opacity: 1,
      duration: 2,
      stagger: {
        each: 0.01,
        from: "random",
      },
    })

    // Phase 2: Build-up movement (0-2.5s)
    timelineRef.current.to(
      [...minorVerticalLines, ...majorVerticalLines, leftBorder, rightBorder],
      {
        x: "0%",
        duration: 2.5,
        ease: "power3.inOut",
        stagger: {
          each: 0.03,
          from: "random",
        },
      },
      0,
    )

    timelineRef.current.to(
      [...minorHorizontalLines, ...majorHorizontalLines],
      {
        y: "0%",
        duration: 2.5,
        ease: "power3.inOut",
        stagger: {
          each: 0.03,
          from: "random",
        },
      },
      0,
    )

    // Set initial state
    gsap.set(allLines, {
      opacity: 0,
    })

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
      gsap.killTweensOf([...allLines])
      allLines.forEach((line) => line.remove())
    }
  }, [])

  // Effect to handle isActive changes
  useEffect(() => {
    if (!timelineRef.current) return

    if (isActive) {
      timelineRef.current.play()
    } else {
      timelineRef.current.pause(0)
    }
  }, [isActive])

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF6ED] to-[#FFFAF5]" />

      {/* First noise layer - more subtle */}
      <div className="absolute inset-0 opacity-50 mix-blend-soft-light">
        <svg className="w-full h-full noise-svg-1">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" stitchTiles="stitch" numOctaves="2" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Second noise layer - more contrast */}
      <div className="absolute inset-0 opacity-25 mix-blend-overlay">
        <svg className="w-full h-full noise-svg-2">
          <filter id="noiseFilter2">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" stitchTiles="stitch" numOctaves="4" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter2)" />
        </svg>
      </div>

      {/* Main content container */}
      <div ref={containerRef} className="relative w-full h-full" />
    </div>
  )
}

