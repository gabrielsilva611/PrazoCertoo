// Deriva o tom "hover" (mais escuro) a partir da cor de destaque escolhida
// pelo usuário, já que só guardamos uma cor — não duas.
export function escurecer(hex: string, fator: number): string {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.round(((num >> 16) & 0xff) * (1 - fator))
  const g = Math.round(((num >> 8) & 0xff) * (1 - fator))
  const b = Math.round((num & 0xff) * (1 - fator))
  return `#${[r, g, b].map((canal) => canal.toString(16).padStart(2, '0')).join('')}`
}
