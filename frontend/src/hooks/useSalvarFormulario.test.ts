import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api'
import { useSalvarFormulario } from './useSalvarFormulario'

describe('useSalvarFormulario', () => {
  it('começa sem erro e sem estar salvando', () => {
    const { result } = renderHook(() => useSalvarFormulario(vi.fn(), vi.fn(), 'Erro padrão.'))

    expect(result.current.erro).toBeNull()
    expect(result.current.salvando).toBe(false)
  })

  it('chama salvar e aoSucesso quando a submissão dá certo', async () => {
    const salvar = vi.fn().mockResolvedValue(undefined)
    const aoSucesso = vi.fn()
    const { result } = renderHook(() => useSalvarFormulario(salvar, aoSucesso, 'Erro padrão.'))

    await act(async () => {
      await result.current.submeter({ nome: 'Teste' })
    })

    expect(salvar).toHaveBeenCalledWith({ nome: 'Teste' })
    expect(aoSucesso).toHaveBeenCalled()
    expect(result.current.erro).toBeNull()
    expect(result.current.salvando).toBe(false)
  })

  it('marca salvando como true durante a submissão', async () => {
    let resolver: () => void = () => {}
    const salvar = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolver = resolve
        }),
    )
    const { result } = renderHook(() => useSalvarFormulario(salvar, vi.fn(), 'Erro padrão.'))

    act(() => {
      result.current.submeter({})
    })

    await waitFor(() => expect(result.current.salvando).toBe(true))

    await act(async () => {
      resolver()
    })

    expect(result.current.salvando).toBe(false)
  })

  it('usa a mensagem da ApiError quando o erro é dela', async () => {
    const salvar = vi.fn().mockRejectedValue(new ApiError('E-mail já cadastrado.', 409))
    const { result } = renderHook(() => useSalvarFormulario(salvar, vi.fn(), 'Erro padrão.'))

    await act(async () => {
      await result.current.submeter({})
    })

    expect(result.current.erro).toBe('E-mail já cadastrado.')
    expect(result.current.salvando).toBe(false)
  })

  it('usa a mensagem padrão quando o erro não é uma ApiError', async () => {
    const salvar = vi.fn().mockRejectedValue(new Error('falha de rede'))
    const { result } = renderHook(() => useSalvarFormulario(salvar, vi.fn(), 'Erro padrão.'))

    await act(async () => {
      await result.current.submeter({})
    })

    expect(result.current.erro).toBe('Erro padrão.')
  })

  it('não chama aoSucesso quando a submissão falha', async () => {
    const aoSucesso = vi.fn()
    const salvar = vi.fn().mockRejectedValue(new Error('falha'))
    const { result } = renderHook(() => useSalvarFormulario(salvar, aoSucesso, 'Erro padrão.'))

    await act(async () => {
      await result.current.submeter({})
    })

    expect(aoSucesso).not.toHaveBeenCalled()
  })
})
