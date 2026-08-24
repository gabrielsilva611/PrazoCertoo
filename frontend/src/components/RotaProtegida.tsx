import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" replace />

  return children
}
