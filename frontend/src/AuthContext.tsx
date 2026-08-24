import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from './lib/api'
import type { LoginResponse, Usuario } from './types'

interface AuthContextValue {
  usuario: Usuario | null
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function usuarioSalvo(): Usuario | null {
  const bruto = localStorage.getItem('usuario')
  return bruto ? (JSON.parse(bruto) as Usuario) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioSalvo)

  async function entrar(email: string, senha: string) {
    const resposta = await api.post<LoginResponse>('/auth/login', { email, senha })
    localStorage.setItem('token', resposta.token)
    localStorage.setItem('usuario', JSON.stringify(resposta.usuario))
    setUsuario(resposta.usuario)
  }

  function sair() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return <AuthContext.Provider value={{ usuario, entrar, sair }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de um AuthProvider.')
  return contexto
}
