import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from './lib/api'

vi.mock('./lib/api', () => ({
  api: { post: vi.fn() },
}))

const envolver = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('começa sem usuário quando não há sessão salva', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: envolver })
    expect(result.current.usuario).toBeNull()
  })

  it('recupera o usuário salvo no localStorage ao montar', () => {
    const usuario = { id: '1', nome: 'Gabriel', email: 'g@teste.com', perfil: 'DONO', corDestaque: '#22c55e' }
    localStorage.setItem('usuario', JSON.stringify(usuario))

    const { result } = renderHook(() => useAuth(), { wrapper: envolver })

    expect(result.current.usuario).toEqual(usuario)
  })

  it('entrar salva token e usuário e atualiza o estado', async () => {
    const usuario = { id: '1', nome: 'Gabriel', email: 'g@teste.com', perfil: 'DONO', corDestaque: '#22c55e' }
    vi.mocked(api.post).mockResolvedValue({ token: 'tok123', usuario })

    const { result } = renderHook(() => useAuth(), { wrapper: envolver })

    await act(async () => {
      await result.current.entrar('g@teste.com', 'senha123')
    })

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'g@teste.com', senha: 'senha123' })
    expect(result.current.usuario).toEqual(usuario)
    expect(localStorage.getItem('token')).toBe('tok123')
    expect(JSON.parse(localStorage.getItem('usuario') ?? 'null')).toEqual(usuario)
  })

  it('sair limpa o token, o usuário e o estado', async () => {
    const usuario = { id: '1', nome: 'Gabriel', email: 'g@teste.com', perfil: 'DONO', corDestaque: '#22c55e' }
    vi.mocked(api.post).mockResolvedValue({ token: 'tok123', usuario })
    const { result } = renderHook(() => useAuth(), { wrapper: envolver })
    await act(async () => {
      await result.current.entrar('g@teste.com', 'senha123')
    })

    act(() => {
      result.current.sair()
    })

    expect(result.current.usuario).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('usuario')).toBeNull()
  })

  it('atualizarCorDestaque muda a cor do usuário atual e persiste', async () => {
    const usuario = { id: '1', nome: 'Gabriel', email: 'g@teste.com', perfil: 'DONO', corDestaque: '#22c55e' }
    vi.mocked(api.post).mockResolvedValue({ token: 'tok123', usuario })
    const { result } = renderHook(() => useAuth(), { wrapper: envolver })
    await act(async () => {
      await result.current.entrar('g@teste.com', 'senha123')
    })

    act(() => {
      result.current.atualizarCorDestaque('#ff0000')
    })

    expect(result.current.usuario?.corDestaque).toBe('#ff0000')
    expect(JSON.parse(localStorage.getItem('usuario') ?? 'null').corDestaque).toBe('#ff0000')
  })

  it('useAuth lança erro quando usado fora do AuthProvider', () => {
    const espiao = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow('useAuth precisa estar dentro de um AuthProvider.')
    espiao.mockRestore()
  })
})
