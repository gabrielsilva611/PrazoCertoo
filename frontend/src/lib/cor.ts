// Deriva o tom "hover" (mais escuro) a partir da cor de destaque escolhida
// pelo usuário, já que só guardamos uma cor — não duas.
export function escurecer(hex: string, fator: number): string {
  const num = Number.parseInt(hex.slice(1), 16)
  const r = Math.round(((num >> 16) & 0xff) * (1 - fator))
  const g = Math.round(((num >> 8) & 0xff) * (1 - fator))
  const b = Math.round((num & 0xff) * (1 - fator))
  return `#${[r, g, b].map((canal) => canal.toString(16).padStart(2, '0')).join('')}`
}

// A cor de destaque é escolhida livremente pelo usuário (RF de customização
// do tema) — sem isso, uma cor clara (ex: quase branco) deixa o texto branco
// fixo dos botões/ícones ilegível em cima dela. Fórmula de luminância
// percebida (ITU-R BT.601), suficiente pra decidir preto ou branco.
export function corTextoLegivel(hex: string): string {
  const num = Number.parseInt(hex.slice(1), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  const luminancia = 0.299 * r + 0.587 * g + 0.114 * b
  return luminancia > 150 ? '#111111' : '#ffffff'
}
