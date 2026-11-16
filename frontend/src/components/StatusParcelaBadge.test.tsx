import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusParcelaBadge } from './StatusParcelaBadge'

describe('StatusParcelaBadge', () => {
  it.each([
    ['ATRASADO', 'Atrasado'],
    ['PENDENTE', 'Pendente'],
    ['PAGO', 'Pago'],
  ] as const)('mostra o rótulo correto para %s', (status, rotulo) => {
    render(<StatusParcelaBadge status={status} />)
    expect(screen.getByText(rotulo)).toBeInTheDocument()
  })
})
