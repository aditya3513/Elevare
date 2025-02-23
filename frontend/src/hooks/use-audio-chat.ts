import { useCallback, useEffect, useState, useRef } from 'react'
import { useAudioWebSocketStore } from '../lib/audio-ws'

interface AudioChatState {
  hasMicrophonePermission: boolean
  isRequestingPermission: boolean
  audioLevel: number
  visualizationData: number[]
}

export const useAudioChat = () => {
  const {
    isConnected,
    isRecording,
    error,
    connect,
    disconnect,
    startRecording: startWebSocketRecording,
    stopRecording: stopWebSocketRecording,
  } = useAudioWebSocketStore()

  const [state, setState] = useState<AudioChatState>({
    hasMicrophonePermission: false,
    isRequestingPermission: false,
    audioLevel: 0,
    visualizationData: Array(50).fill(0),
  })

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)
  
  // Use a ref to track the animation frame for cleanup
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Cleanup function for visualization
  const cleanupVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (analyserNode) {
      analyserNode.disconnect()
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close()
    }
    setAudioContext(null)
    setAnalyserNode(null)
  }, [analyserNode, audioContext])

  // Check initial microphone permission
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        if (audioInputs.length > 0) {
          navigator.permissions.query({ name: 'microphone' as PermissionName })
            .then(permissionStatus => {
              setState(prev => ({
                ...prev,
                hasMicrophonePermission: permissionStatus.state === 'granted'
              }))

              permissionStatus.onchange = () => {
                setState(prev => ({
                  ...prev,
                  hasMicrophonePermission: permissionStatus.state === 'granted'
                }))
              }
            })
        }
      })
  }, [])

  // Setup audio context and analyser for visualization
  const setupAudioAnalyser = useCallback(async (stream: MediaStream) => {
    // Cleanup any existing audio context and analyser
    cleanupVisualization()

    const context = new AudioContext()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    source.connect(analyser)
    
    setAudioContext(context)
    setAnalyserNode(analyser)

    // Start visualization loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const updateVisualization = () => {
      if (analyser && context.state !== 'closed') {
        analyser.getByteFrequencyData(dataArray)
        
        // Calculate average audio level
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
        const normalizedLevel = average / 256

        // Create visualization data (50 points)
        const visualizationPoints = Array.from({ length: 50 }, (_, i) => {
          const dataIndex = Math.floor((i / 50) * dataArray.length)
          return dataArray[dataIndex] / 256
        })

        setState(prev => ({
          ...prev,
          audioLevel: normalizedLevel,
          visualizationData: visualizationPoints
        }))

        animationFrameRef.current = requestAnimationFrame(updateVisualization)
      }
    }
    updateVisualization()
  }, [cleanupVisualization])

  const requestMicrophonePermission = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRequestingPermission: true }))
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the test stream
      setState(prev => ({
        ...prev,
        hasMicrophonePermission: true,
        isRequestingPermission: false
      }))
      return true
    } catch (error) {
      console.error('Error requesting microphone permission:', error)
      setState(prev => ({
        ...prev,
        hasMicrophonePermission: false,
        isRequestingPermission: false
      }))
      return false
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!state.hasMicrophonePermission) {
      const granted = await requestMicrophonePermission()
      if (!granted) return
    }

    if (!isConnected) {
      connect()
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      await setupAudioAnalyser(stream)
      startWebSocketRecording()
    } catch (error) {
      console.error('Error starting recording:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to start recording'
      }))
    }
  }, [state.hasMicrophonePermission, isConnected, connect, startWebSocketRecording, setupAudioAnalyser])

  const stopRecording = useCallback(() => {
    stopWebSocketRecording()
    cleanupVisualization()
  }, [stopWebSocketRecording, cleanupVisualization])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording()
      }
      cleanupVisualization()
      disconnect()
    }
  }, [isRecording, disconnect, stopRecording, cleanupVisualization])

  return {
    ...state,
    isConnected,
    isRecording,
    error,
    startRecording,
    stopRecording,
    requestMicrophonePermission
  }
} 