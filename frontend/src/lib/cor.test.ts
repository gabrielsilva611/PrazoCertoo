import { describe, expect, it } from 'vitest'
import { corTextoLegivel, escurecer } from './cor'

describe('escurecer', () => {
  it('escurece cada canal RGB proporcionalmente ao fator', () => {
    expect(escurecer('#22c55e', 0)).toBe('#22c55e')
  })

  it('aplica 50% de escurecimento corretamente', () => {
    expect(escurecer('#ffffff', 0.5)).toBe('#808080')
  })

  it('nunca produz valores negativos (preto permanece preto)', () => {
    expect(escurecer('#000000', 0.5)).toBe('#000000')
  })

  it('preenche cada canal com dois dígitos hexadecimais', () => {
    const resultado = escurecer('#0a0a0a', 0.1)
    expect(resultado).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('corTextoLegivel', () => {
  it('escolhe texto escuro para cores claras', () => {
    expect(corTextoLegivel('#fcfcfc')).toBe('#111111')
  })

  it('escolhe texto branco para cores escuras', () => {
    expect(corTextoLegivel('#19121f')).toBe('#ffffff')
  })

  it('escolhe texto branco pro roxo padrão do sistema', () => {
    expect(corTextoLegivel('#7c3aed')).toBe('#ffffff')
  })
})
