import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('mostra o título e o conteúdo', () => {
    render(
      <Modal titulo="Teste" onFechar={vi.fn()}>
        <p>Conteúdo do modal</p>
      </Modal>,
    )
    expect(screen.getByText('Teste')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo do modal')).toBeInTheDocument()
  })

  it('chama onFechar ao clicar no fundo (fora do conteúdo)', async () => {
    const onFechar = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal titulo="Teste" onFechar={onFechar}>
        <p>Conteúdo</p>
      </Modal>,
    )

    await user.click(screen.getByRole('dialog'))
    expect(onFechar).not.toHaveBeenCalled()

    const fundo = screen.getByRole('dialog').parentElement!
    await user.click(fundo)
    expect(onFechar).toHaveBeenCalled()
  })

  it('chama onFechar ao clicar no X', async () => {
    const onFechar = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal titulo="Teste" onFechar={onFechar}>
        <p>Conteúdo</p>
      </Modal>,
    )

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onFechar).toHaveBeenCalled()
  })

  it('clicar dentro do conteúdo não fecha o modal', async () => {
    const onFechar = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal titulo="Teste" onFechar={onFechar}>
        <p>Conteúdo</p>
      </Modal>,
    )

    await user.click(screen.getByText('Conteúdo'))
    expect(onFechar).not.toHaveBeenCalled()
  })
})
