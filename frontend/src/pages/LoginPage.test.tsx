import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api'
import { LoginPage } from './LoginPage'

const mockEntrar = vi.fn()
const mockNavegar = vi.fn()

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ entrar: mockEntrar }),
}))

vi.mock('react-router-dom', async () => {
  const real = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...real, useNavigate: () => mockNavegar }
})

function renderizar() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('chama entrar com e-mail e senha digitados e navega ao sucesso', async () => {
    mockEntrar.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderizar()

    await user.type(screen.getByLabelText('E-mail'), 'gabriel@teste.com')
    await user.type(screen.getByLabelText('Senha'), 'minhasenha')
    await user.click(screen.getByRole('button', { name: 'Entrar no sistema' }))

    expect(mockEntrar).toHaveBeenCalledWith('gabriel@teste.com', 'minhasenha')
    expect(mockNavegar).toHaveBeenCalledWith('/')
  })

  it('mostra a mensagem da ApiError quando o login falha', async () => {
    mockEntrar.mockRejectedValue(new ApiError('E-mail ou senha incorretos.', 401))
    const user = userEvent.setup()
    renderizar()

    await user.type(screen.getByLabelText('E-mail'), 'gabriel@teste.com')
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar no sistema' }))

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
    expect(mockNavegar).not.toHaveBeenCalled()
  })

  it('mostra mensagem genérica quando o erro não é uma ApiError', async () => {
    mockEntrar.mockRejectedValue(new Error('falha de rede'))
    const user = userEvent.setup()
    renderizar()

    await user.type(screen.getByLabelText('E-mail'), 'gabriel@teste.com')
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar no sistema' }))

    expect(await screen.findByText('Não foi possível entrar. Tente novamente.')).toBeInTheDocument()
  })
})
