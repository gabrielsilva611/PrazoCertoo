import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from './FormField'

describe('FormField', () => {
  it('renderiza o rótulo e associa ao id informado', () => {
    render(
      <FormField rotulo="Nome" id="nome">
        <input id="nome" />
      </FormField>,
    )
    expect(screen.getByText('Nome').closest('label')).toHaveAttribute('for', 'nome')
  })

  it('renderiza os filhos recebidos', () => {
    render(
      <FormField rotulo="Nome" id="nome">
        <input id="nome" placeholder="Digite o nome" />
      </FormField>,
    )
    expect(screen.getByPlaceholderText('Digite o nome')).toBeInTheDocument()
  })

  it('mostra o asterisco de obrigatório quando obrigatorio é true', () => {
    render(
      <FormField rotulo="Nome" id="nome" obrigatorio>
        <input id="nome" />
      </FormField>,
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('não mostra o asterisco quando obrigatorio é omitido', () => {
    render(
      <FormField rotulo="Nome" id="nome">
        <input id="nome" />
      </FormField>,
    )
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})
