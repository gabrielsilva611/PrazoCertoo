import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppLayout } from './AppLayout'

const mockUseAuth = vi.fn()
vi.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderizar(usuario: { nome: string; perfil: string }) {
  mockUseAuth.mockReturnValue({ usuario, sair: mockSair })
  return render(
    <MemoryRouter>
      <AppLayout>
        <p>Conteúdo da página</p>
      </AppLayout>
    </MemoryRouter>,
  )
}

const mockSair = vi.fn()

describe('AppLayout', () => {
  it('renderiza os filhos, o nome e o perfil do usuário', () => {
    renderizar({ nome: 'Gabriel', perfil: 'DONO' })
    expect(screen.getByText('Conteúdo da página')).toBeInTheDocument()
    expect(screen.getByText('Gabriel')).toBeInTheDocument()
    expect(screen.getByText('DONO')).toBeInTheDocument()
  })

  it('mostra os itens exclusivos do Dono quando o perfil é DONO', () => {
    renderizar({ nome: 'Gabriel', perfil: 'DONO' })
    expect(screen.getByText('Inventário')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('esconde os itens exclusivos do Dono para outros perfis', () => {
    renderizar({ nome: 'Funcionário', perfil: 'FUNCIONARIO' })
    expect(screen.queryByText('Inventário')).not.toBeInTheDocument()
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument()
  })

  it('chama sair ao clicar no botão Sair', async () => {
    renderizar({ nome: 'Gabriel', perfil: 'DONO' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }))
    expect(mockSair).toHaveBeenCalled()
  })
})
