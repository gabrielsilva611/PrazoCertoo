import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './lib/api'
import { escurecer } from './lib/cor'
import type { LoginResponse, Usuario } from './types'

interface AuthContextValue {
  usuario: Usuario | null
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => void
  atualizarCorDestaque: (corDestaque: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function usuarioSalvo(): Usuario | null {
  const bruto = localStorage.getItem('usuario')
  return bruto ? (JSON.parse(bruto) as Usuario) : null
}

function aplicarCorDestaque(corDestaque: string) {
  const raiz = document.documentElement.style
  raiz.setProperty('--color-brand-accent', corDestaque)
  raiz.setProperty('--color-brand-accent-hover', escurecer(corDestaque, 0.18))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioSalvo)

  useEffect(() => {
    if (usuario) aplicarCorDestaque(usuario.corDestaque)
  }, [usuario])

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

  function atualizarCorDestaque(corDestaque: string) {
    setUsuario((atual) => {
      if (!atual) return atual
      const novo = { ...atual, corDestaque }
      localStorage.setItem('usuario', JSON.stringify(novo))
      return novo
    })
  }

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair, atualizarCorDestaque }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de um AuthProvider.')
  return contexto
}
