import { useState, useEffect } from 'react'
import { useLearningSessionStore, learningSessionService } from '../lib/session-ws'

// API URLs
const API_URL = 'http://localhost:9000'

interface WhiteboardItem {
  type: string
  title?: string
  text?: string
  contents?: Array<{ type: string; text: string }>
  position: { x: number; y: number }
  size: { width: number; height: number }
}

interface ResearchContext {
  query: string
  summary: string
  key_findings: string[]
}

interface ResearchSource {
  title: string
  url: string
  snippet: string
}

interface ResearchImage {
  url: string
  alt: string
  source: string
}

interface UseSessionManagerReturn {
  isInitializing: boolean
  error: string | null
  initializeSession: () => Promise<void>
  researchTopicStatus: string | null
  planLessonsStatus: string | null
  audioTranscript: string | null
  whiteboardItems: WhiteboardItem[] | null
  researchContext: ResearchContext | null
  researchSources: ResearchSource[] | null
  researchImages: ResearchImage[] | null
  planLessons: (topic: string) => void
  researchTopic: (topic: string) => void
  isResearching: boolean
  isPlanning: boolean
}

export function useSessionManager(): UseSessionManagerReturn {
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [researchTopicStatus, setResearchTopicStatus] = useState<string | null>(null)
  const [planLessonsStatus, setPlanLessonsStatus] = useState<string | null>(null)
  const [audioTranscript, setAudioTranscript] = useState<string | null>(null)
  const [whiteboardItems, setWhiteboardItems] = useState<WhiteboardItem[] | null>(null)
  const [researchContext, setResearchContext] = useState<ResearchContext | null>(null)
  const [researchSources, setResearchSources] = useState<ResearchSource[] | null>(null)
  const [researchImages, setResearchImages] = useState<ResearchImage[] | null>(null)
  const conversationState = useLearningSessionStore(state => state.conversationState)

  // Compute loading states based on conversation state
  const isResearching = conversationState.status === 'researching'
  const isPlanning = conversationState.status === 'planning'

  const { 
    connect: connectSession, 
    planLessons: planLessonsWs,
    researchTopic: researchTopicWs
  } = useLearningSessionStore()

  useEffect(() => {
    // Setup event listeners for all events
    const handleLessonPlan = (data: string | null) => {
      if (data) {
        setPlanLessonsStatus(data)
      }
    }

    const handleResearchTopic = (data: string | null) => {
      if (data) {
        setResearchTopicStatus(data)
      }
    }

    const handleAudioTranscript = (data: string | null) => {
      if (data) {
        setAudioTranscript(data)
      }
    }

    const handleWhiteboardUpdate = (data: string | null) => {
      if (data) {
        try {
          const items = JSON.parse(data) as WhiteboardItem[]
          setWhiteboardItems(items)
        } catch (err) {
          console.error('Failed to parse whiteboard items:', err)
        }
      }
    }

    const handleResearchContext = (data: string | null) => {
      if (data) {
        try {
          const context = JSON.parse(data) as ResearchContext
          setResearchContext(context)
        } catch (err) {
          console.error('Failed to parse research context:', err)
        }
      }
    }

    const handleResearchSources = (data: string | null) => {
      if (data) {
        try {
          const sources = JSON.parse(data) as ResearchSource[]
          setResearchSources(sources)
        } catch (err) {
          console.error('Failed to parse research sources:', err)
        }
      }
    }

    const handleResearchImages = (data: string | null) => {
      if (data) {
        try {
          const images = JSON.parse(data) as ResearchImage[]
          setResearchImages(images)
        } catch (err) {
          console.error('Failed to parse research images:', err)
        }
      }
    }

    const handleError = (data: string | null) => {
      if (data) {
        setError(data)
      }
    }

    // Add event listeners
    learningSessionService.addEventListener('plan_lessons', handleLessonPlan)
    learningSessionService.addEventListener('research_topic', handleResearchTopic)
    learningSessionService.addEventListener('audio_transcript', handleAudioTranscript)
    learningSessionService.addEventListener('whiteboard_update', handleWhiteboardUpdate)
    learningSessionService.addEventListener('research_context', handleResearchContext)
    learningSessionService.addEventListener('research_sources', handleResearchSources)
    learningSessionService.addEventListener('research_images', handleResearchImages)
    learningSessionService.addEventListener('error', handleError)

    // Cleanup function
    return () => {
      learningSessionService.removeEventListener('plan_lessons', handleLessonPlan)
      learningSessionService.removeEventListener('research_topic', handleResearchTopic)
      learningSessionService.removeEventListener('audio_transcript', handleAudioTranscript)
      learningSessionService.removeEventListener('whiteboard_update', handleWhiteboardUpdate)
      learningSessionService.removeEventListener('research_context', handleResearchContext)
      learningSessionService.removeEventListener('research_sources', handleResearchSources)
      learningSessionService.removeEventListener('research_images', handleResearchImages)
      learningSessionService.removeEventListener('error', handleError)
    }
  }, [])

  const initializeSession = async () => {
    setIsInitializing(true)
    setError(null)

    try {
      // First attempt to create the session
      const response = await fetch(`${API_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const { session_id } = await response.json()

      // Start WebSocket connections
      connectSession(session_id)

    } catch (err) {
      console.error('Failed to initialize session:', err)
      setError('Failed to start session. Please try again.')
      setIsInitializing(false)
      throw err
    }
  }

  return {
    isInitializing,
    error,
    initializeSession,
    researchTopicStatus,
    planLessonsStatus,
    audioTranscript,
    whiteboardItems,
    researchContext,
    researchSources,
    researchImages,
    planLessons: planLessonsWs,
    researchTopic: researchTopicWs,
    isResearching,
    isPlanning
  }
} 