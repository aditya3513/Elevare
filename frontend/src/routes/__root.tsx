import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useLearningSessionStore } from '../lib/session-ws'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const navigate = useNavigate()
  const { isActive } = useLearningSessionStore()

  // Redirect to home if no active session when trying to access /session
  useEffect(() => {
    if (!isActive && window.location.pathname === '/session') {
      navigate({ to: '/' })
    }
  }, [isActive, navigate])

  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}