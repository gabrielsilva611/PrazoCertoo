import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api'
import { ConfiguracoesPage } from './ConfiguracoesPage'

const mockAtualizarCorDestaque = vi.fn()
const usuario = { id: '1', nome: 'Gabriel', email: 'g@teste.com', perfil: 'DONO', corDestaque: '#22c55e' }

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ usuario, atualizarCorDestaque: mockAtualizarCorDestaque }),
}))

const mockPut = vi.fn()
vi.mock('../lib/api', async () => {
  const real = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...real, api: { put: (...args: unknown[]) => mockPut(...args) } }
})

function renderizar() {
  return render(
    <MemoryRouter>
      <ConfiguracoesPage />
    </MemoryRouter>,
  )
}

describe('ConfiguracoesPage', () => {
  it('começa com a cor de destaque atual do usuário', () => {
    renderizar()
    expect(screen.getByPlaceholderText('#22c55e')).toHaveValue('#22c55e')
  })

  it('salva a nova cor e mostra mensagem de sucesso', async () => {
    mockPut.mockResolvedValue({ corDestaque: '#ff0000' })
    const user = userEvent.setup()
    renderizar()

    const input = screen.getByPlaceholderText('#22c55e')
    await user.clear(input)
    await user.type(input, '#ff0000')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(mockPut).toHaveBeenCalledWith('/configuracoes', { corDestaque: '#ff0000' })
    expect(await screen.findByText('Cor atualizada com sucesso.')).toBeInTheDocument()
    expect(mockAtualizarCorDestaque).toHaveBeenCalledWith('#ff0000')
  })

  it('mostra erro da ApiError quando salvar falha', async () => {
    mockPut.mockRejectedValue(new ApiError('Cor inválida.', 400))
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Cor inválida.')).toBeInTheDocument()
  })
})
