import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './api'

function mockFetch(status: number, corpo: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(corpo),
  })
}

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('faz GET sem corpo e retorna os dados da resposta', async () => {
    global.fetch = mockFetch(200, { clientes: [] })

    const resultado = await api.get('/clientes')

    expect(resultado).toEqual({ clientes: [] })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/clientes',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    )
  })

  it('inclui o token salvo no localStorage no header Authorization', async () => {
    localStorage.setItem('token', 'abc123')
    global.fetch = mockFetch(200, {})

    await api.get('/clientes')

    const chamada = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(chamada.headers.Authorization).toBe('Bearer abc123')
  })

  it('não inclui Authorization quando não há token salvo', async () => {
    global.fetch = mockFetch(200, {})

    await api.get('/clientes')

    const chamada = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(chamada.headers.Authorization).toBeUndefined()
  })

  it('serializa o corpo em JSON no POST', async () => {
    global.fetch = mockFetch(201, { id: '1' })

    await api.post('/clientes', { nome: 'Fulano' })

    const chamada = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(chamada.method).toBe('POST')
    expect(chamada.body).toBe(JSON.stringify({ nome: 'Fulano' }))
  })

  it('retorna undefined em respostas 204 sem tentar ler o corpo', async () => {
    const jsonSpy = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({ status: 204, ok: true, json: jsonSpy })

    const resultado = await api.delete('/clientes/1')

    expect(resultado).toBeUndefined()
    expect(jsonSpy).not.toHaveBeenCalled()
  })

  it('lança ApiError com a mensagem e o status quando a resposta não é ok', async () => {
    global.fetch = mockFetch(401, { erro: 'E-mail ou senha incorretos.' })

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({
      message: 'E-mail ou senha incorretos.',
      status: 401,
    })
  })

  it('usa mensagem padrão quando a resposta de erro não traz "erro"', async () => {
    global.fetch = mockFetch(500, {})

    await expect(api.get('/clientes')).rejects.toBeInstanceOf(ApiError)
    await expect(api.get('/clientes')).rejects.toMatchObject({ message: 'Erro inesperado.' })
  })
})
