import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MovimentacaoBadge } from './MovimentacaoBadge'

describe('MovimentacaoBadge', () => {
  it.each([
    ['ENTRADA', 'Entrada'],
    ['SAIDA', 'Saída'],
    ['AJUSTE', 'Ajuste'],
    ['INVENTARIO', 'Inventário'],
  ] as const)('mostra o rótulo correto para %s', (tipo, rotulo) => {
    render(<MovimentacaoBadge tipo={tipo} />)
    expect(screen.getByText(rotulo)).toBeInTheDocument()
  })
})
