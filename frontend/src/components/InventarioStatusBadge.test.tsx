import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InventarioStatusBadge } from './InventarioStatusBadge'

describe('InventarioStatusBadge', () => {
  it.each([
    ['ABERTO', 'Em contagem'],
    ['CONCLUIDO', 'Concluído'],
  ] as const)('mostra o rótulo correto para %s', (status, rotulo) => {
    render(<InventarioStatusBadge status={status} />)
    expect(screen.getByText(rotulo)).toBeInTheDocument()
  })
})
