import { useCallback, useEffect, useState } from 'react'

export const useAudioChat = () => {
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  // Check initial microphone permission
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        if (audioInputs.length > 0) {
          navigator.permissions.query({ name: 'microphone' as PermissionName })
            .then(permissionStatus => {
              setHasMicrophonePermission(permissionStatus.state === 'granted')

              permissionStatus.onchange = () => {
                setHasMicrophonePermission(permissionStatus.state === 'granted')
              }
            })
        }
      })
  }, [])

  const requestMicrophonePermission = useCallback(async () => {
    try {
      setIsRequestingPermission(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      })
      stream.getTracks().forEach(track => track.stop()) // Stop the test stream
      setHasMicrophonePermission(true)
      return true
    } catch (error) {
      console.error('Error requesting microphone permission:', error)
      setHasMicrophonePermission(false)
      return false
    } finally {
      setIsRequestingPermission(false)
    }
  }, [])

  return {
    hasMicrophonePermission,
    isRequestingPermission,
    requestMicrophonePermission,
  }
} 