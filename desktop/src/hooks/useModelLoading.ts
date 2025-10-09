import { useEffect, useState } from 'react'

interface ModelLoadingState {
  modelsReady: boolean
  isChecking: boolean
}

/**
 * Custom hook to check if backend models are loaded and ready
 * Listens to model loading progress and updates state accordingly
 */
export function useModelLoading(): ModelLoadingState {
  const [modelsReady, setModelsReady] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if models are ready
    const checkModelsReady = async () => {
      try {
        if (window.electronAPI && 'models' in window.electronAPI) {
          const ready = await window.electronAPI.models.isReady()
          setModelsReady(ready || false)
          setIsChecking(false)
        } else {
          setModelsReady(false)
          setIsChecking(false)
        }
      } catch (error) {
        console.error('Failed to check models readiness:', error)
        // If check fails, assume not ready and show loading screen
        setModelsReady(false)
        setIsChecking(false)
      }
    }

    // Initial check
    checkModelsReady()

    // Listen for model loading progress to update readiness state
    let removeListener: (() => void) | undefined
    if (window.electronAPI && 'models' in window.electronAPI) {
      removeListener = window.electronAPI.models.onLoadingProgress(() => {
        // After any progress update, recheck readiness
        checkModelsReady()
      })
    }

    return () => {
      removeListener?.()
    }
  }, [])

  return { modelsReady, isChecking }
}
