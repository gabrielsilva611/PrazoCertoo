const BASE_URL = '/api'

export class ApiError extends Error {
  status: number

  constructor(mensagem: string, status: number) {
    super(mensagem)
    this.status = status
  }
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')

  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opcoes.headers,
    },
  })

  if (resposta.status === 204) return undefined as T

  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new ApiError(dados.erro ?? 'Erro inesperado.', resposta.status)
  }

  return dados as T
}

export const api = {
  get: <T>(caminho: string) => requisitar<T>(caminho),
  post: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>(caminho, { method: 'POST', body: JSON.stringify(corpo) }),
  put: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>(caminho, { method: 'PUT', body: JSON.stringify(corpo) }),
  patch: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>(caminho, { method: 'PATCH', body: JSON.stringify(corpo) }),
}
