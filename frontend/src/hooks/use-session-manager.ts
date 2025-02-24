import { useState, useEffect } from 'react'
import { useLearningSessionStore, learningSessionService } from '../lib/session-ws'

// API URLs
const API_URL = 'http://localhost:9000'

interface UseSessionManagerReturn {
  isInitializing: boolean
  error: string | null
  initializeSession: () => Promise<void>
  lessonPlanStatus: string | null
  deepResearchStatus: string | null
  planLessons: (topic: string) => void
  sendInitialQuery: (topic: string) => void
}

export function useSessionManager(): UseSessionManagerReturn {
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonPlanStatus, setLessonPlanStatus] = useState<string | null>(null)
  const [deepResearchStatus, setDeepResearchStatus] = useState<string | null>(null)
  const { 
    connect: connectSession, 
    planLessons: planLessonsWs,
    sendInitialQuery: sendInitialQueryWs 
  } = useLearningSessionStore()

  useEffect(() => {
    // Setup event listeners for all events
    const handleLessonPlan = (data: string | null) => {
      if (data) {
        setLessonPlanStatus(data)
      }
    }

    const handleDeepResearch = (data: string | null) => {
      if (data) {
        setDeepResearchStatus(data)
      }
    }

    const handleError = (data: string | null) => {
      if (data) {
        setError(data)
      }
    }

    // Add event listeners
    learningSessionService.addEventListener('plan_lessons', handleLessonPlan)
    learningSessionService.addEventListener('study_guide', handleLessonPlan)
    learningSessionService.addEventListener('initial_query', handleDeepResearch)
    learningSessionService.addEventListener('deep_research', handleDeepResearch)
    learningSessionService.addEventListener('error', handleError)

    // Cleanup function
    return () => {
      learningSessionService.removeEventListener('plan_lessons', handleLessonPlan)
      learningSessionService.removeEventListener('study_guide', handleLessonPlan)
      learningSessionService.removeEventListener('initial_query', handleDeepResearch)
      learningSessionService.removeEventListener('deep_research', handleDeepResearch)
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
    lessonPlanStatus,
    deepResearchStatus,
    planLessons: planLessonsWs,
    sendInitialQuery: sendInitialQueryWs
  }
} 