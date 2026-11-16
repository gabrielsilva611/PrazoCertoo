import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api'
import { CadastroSimplesPage } from './CadastroSimplesPage'

const mockUseAuth = vi.fn()
vi.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockDelete = vi.fn()
vi.mock('../lib/api', async () => {
  const real = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...real,
    api: {
      get: (...args: unknown[]) => mockGet(...args),
      post: (...args: unknown[]) => mockPost(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  }
})

function renderizar(perfil: 'DONO' | 'FUNCIONARIO' = 'DONO') {
  mockUseAuth.mockReturnValue({ usuario: { nome: 'Gabriel', perfil } })
  return render(
    <MemoryRouter>
      <CadastroSimplesPage
        recurso="categorias"
        plural="categorias"
        titulo="Categorias"
        singular="categoria"
        genero="a"
        campoSecundario={{ chave: 'descricao', rotulo: 'Descrição', placeholder: 'Opcional' }}
      />
    </MemoryRouter>,
  )
}

describe('CadastroSimplesPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra "Carregando..." enquanto busca a lista', () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('lista os itens retornados pela API', async () => {
    mockGet.mockResolvedValue({ categorias: [{ id: '1', nome: 'Bebidas', descricao: 'Refrigerantes' }] })
    renderizar()

    expect(await screen.findByText('Bebidas')).toBeInTheDocument()
    expect(screen.getByText('Refrigerantes')).toBeInTheDocument()
    expect(screen.getByText('1 cadastrados')).toBeInTheDocument()
  })

  it('mostra mensagem de vazio quando não há itens', async () => {
    mockGet.mockResolvedValue({ categorias: [] })
    renderizar()

    expect(await screen.findByText('Nenhuma categoria cadastrada.')).toBeInTheDocument()
  })

  it('mostra erro quando a busca falha', async () => {
    mockGet.mockRejectedValue(new ApiError('Sem permissão.', 403))
    renderizar()

    expect(await screen.findByText('Sem permissão.')).toBeInTheDocument()
  })

  it('cadastra um novo item e recarrega a lista', async () => {
    mockGet.mockResolvedValueOnce({ categorias: [] }).mockResolvedValueOnce({
      categorias: [{ id: '2', nome: 'Limpeza' }],
    })
    mockPost.mockResolvedValue({})
    const user = userEvent.setup()
    renderizar()

    await screen.findByText('Nenhuma categoria cadastrada.')
    await user.type(screen.getByLabelText(/Nome da categoria/), 'Limpeza')
    await user.click(screen.getByRole('button', { name: '+ Adicionar' }))

    expect(mockPost).toHaveBeenCalledWith('/categorias', { nome: 'Limpeza' })
    expect(await screen.findByText('Limpeza')).toBeInTheDocument()
  })

  it('exclui um item quando o usuário é DONO', async () => {
    mockGet.mockResolvedValueOnce({ categorias: [{ id: '1', nome: 'Bebidas' }] }).mockResolvedValueOnce({
      categorias: [],
    })
    mockDelete.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderizar('DONO')

    await screen.findByText('Bebidas')
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(mockDelete).toHaveBeenCalledWith('/categorias/1')
    await waitFor(() => expect(screen.queryByText('Bebidas')).not.toBeInTheDocument())
  })

  it('não mostra botão de excluir para perfil FUNCIONARIO', async () => {
    mockGet.mockResolvedValue({ categorias: [{ id: '1', nome: 'Bebidas' }] })
    renderizar('FUNCIONARIO')

    await screen.findByText('Bebidas')
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
  })
})
