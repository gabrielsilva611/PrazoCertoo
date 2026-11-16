import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScoreBadge } from './ScoreBadge'

describe('ScoreBadge', () => {
  it.each([
    ['BOM_PAGADOR', 'Bom Pagador'],
    ['IRREGULAR', 'Irregular'],
    ['INADIMPLENTE', 'Inadimplente'],
  ] as const)('mostra o rótulo correto para %s', (score, rotulo) => {
    render(<ScoreBadge score={score} />)
    expect(screen.getByText(rotulo)).toBeInTheDocument()
  })
})
