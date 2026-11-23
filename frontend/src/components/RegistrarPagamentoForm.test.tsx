import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api'
import { RegistrarPagamentoForm } from './RegistrarPagamentoForm'

const mockPatch = vi.fn()
vi.mock('../lib/api', async () => {
  const real = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...real, api: { patch: (...args: unknown[]) => mockPatch(...args) } }
})

function renderizar(aoSucesso = vi.fn(), aoCancelar = vi.fn()) {
  return {
    aoSucesso,
    aoCancelar,
    ...render(
      <RegistrarPagamentoForm
        vendaId="venda-1"
        numero={1}
        saldoDevedor="100"
        aoSucesso={aoSucesso}
        aoCancelar={aoCancelar}
      />,
    ),
  }
}

describe('RegistrarPagamentoForm', () => {
  it('começa com o valor pago já preenchido com o saldo devedor atual', () => {
    renderizar()
    expect(screen.getByLabelText(/Valor pago agora/)).toHaveValue('100')
  })

  it('mostra o saldo devedor formatado em reais', () => {
    renderizar()
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument()
  })

  it('envia valorPago e percentualJuros pro endpoint certo', async () => {
    mockPatch.mockResolvedValue({ parcela: {} })
    const user = userEvent.setup()
    const { aoSucesso } = renderizar()

    const campoValor = screen.getByLabelText(/Valor pago agora/)
    await user.clear(campoValor)
    await user.type(campoValor, '40')
    await user.type(screen.getByLabelText(/Juros/), '5')
    await user.click(screen.getByRole('button', { name: 'Confirmar pagamento' }))

    expect(mockPatch).toHaveBeenCalledWith('/vendas/venda-1/parcelas/1/pagar', {
      valorPago: 40,
      percentualJuros: 5,
    })
    expect(aoSucesso).toHaveBeenCalled()
  })

  it('não envia percentualJuros quando o campo fica vazio', async () => {
    mockPatch.mockResolvedValue({ parcela: {} })
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Confirmar pagamento' }))

    expect(mockPatch).toHaveBeenCalledWith('/vendas/venda-1/parcelas/1/pagar', { valorPago: 100 })
  })

  it('mostra a mensagem da ApiError quando o pagamento falha', async () => {
    mockPatch.mockRejectedValue(new ApiError('Parcela já está paga.', 409))
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Confirmar pagamento' }))

    expect(await screen.findByText('Parcela já está paga.')).toBeInTheDocument()
  })

  it('chama aoCancelar ao clicar em Cancelar', async () => {
    const user = userEvent.setup()
    const { aoCancelar } = renderizar()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(aoCancelar).toHaveBeenCalled()
  })
})
