import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RotaProtegida } from './RotaProtegida'

const mockUseAuth = vi.fn()
vi.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderizar(usuario: object | null) {
  mockUseAuth.mockReturnValue({ usuario })

  return render(
    <MemoryRouter initialEntries={['/protegida']}>
      <Routes>
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route
          path="/protegida"
          element={
            <RotaProtegida>
              <p>Conteúdo protegido</p>
            </RotaProtegida>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RotaProtegida', () => {
  it('renderiza o conteúdo quando há um usuário autenticado', () => {
    renderizar({ id: '1', nome: 'Gabriel' })
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })

  it('redireciona para /login quando não há usuário autenticado', () => {
    renderizar(null)
    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })
})
