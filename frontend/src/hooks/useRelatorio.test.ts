import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api'
import { useRelatorio } from './useRelatorio'

const mockGet = vi.fn()
vi.mock('../lib/api', async () => {
  const real = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...real, api: { get: (...args: unknown[]) => mockGet(...args) } }
})

describe('useRelatorio', () => {
  it('não busca nada quando o caminho é null', () => {
    const { result } = renderHook(() => useRelatorio(null))

    expect(mockGet).not.toHaveBeenCalled()
    expect(result.current.carregando).toBe(false)
    expect(result.current.dados).toBeNull()
  })

  it('busca o caminho e preenche dados quando dá certo', async () => {
    mockGet.mockResolvedValue({ totalVendido: 100 })
    const { result } = renderHook(() => useRelatorio('/relatorios/vendas'))

    await waitFor(() => expect(result.current.dados).toEqual({ totalVendido: 100 }))
    expect(mockGet).toHaveBeenCalledWith('/relatorios/vendas')
    expect(result.current.carregando).toBe(false)
    expect(result.current.erro).toBeNull()
  })

  it('refaz a busca quando o caminho muda', async () => {
    mockGet.mockResolvedValue({})
    const { rerender } = renderHook(({ caminho }) => useRelatorio(caminho), {
      initialProps: { caminho: '/relatorios/vendas?inicio=a&fim=b' },
    })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))

    rerender({ caminho: '/relatorios/vendas?inicio=c&fim=d' })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2))
    expect(mockGet).toHaveBeenLastCalledWith('/relatorios/vendas?inicio=c&fim=d')
  })

  it('usa a mensagem da ApiError quando a busca falha', async () => {
    mockGet.mockRejectedValue(new ApiError('Sem permissão.', 403))
    const { result } = renderHook(() => useRelatorio('/relatorios/estoque'))

    await waitFor(() => expect(result.current.erro).toBe('Sem permissão.'))
    expect(result.current.dados).toBeNull()
  })
})
