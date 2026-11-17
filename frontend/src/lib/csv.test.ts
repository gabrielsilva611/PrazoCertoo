import { describe, expect, it } from 'vitest'
import { paraCsv } from './csv'

describe('paraCsv', () => {
  it('monta cabeçalho e linhas separados por vírgula', () => {
    const csv = paraCsv(['Nome', 'Valor'], [['Ana', 100], ['Bruno', 200]])
    expect(csv).toBe('Nome,Valor\nAna,100\nBruno,200')
  })

  it('coloca entre aspas um campo que contém vírgula', () => {
    const csv = paraCsv(['Nome'], [['Silva, Ana']])
    expect(csv).toBe('Nome\n"Silva, Ana"')
  })

  it('escapa aspas duplas dobrando-as', () => {
    const csv = paraCsv(['Mensagem'], [['Ela disse "oi"']])
    expect(csv).toBe('Mensagem\n"Ela disse ""oi"""')
  })

  it('trata null e undefined como campo vazio', () => {
    const csv = paraCsv(['A', 'B'], [[null, undefined]])
    expect(csv).toBe('A,B\n,')
  })
})
