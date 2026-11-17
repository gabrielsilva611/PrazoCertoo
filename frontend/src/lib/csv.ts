// Escapa só quando precisa (contém vírgula, aspas ou quebra de linha) — CSV
// mais limpo de ler quando aberto direto num editor de texto.
function escaparCampo(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor)
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

export function paraCsv(colunas: string[], linhas: unknown[][]): string {
  const cabecalho = colunas.map(escaparCampo).join(',')
  const corpo = linhas.map((linha) => linha.map(escaparCampo).join(',')).join('\n')
  return `${cabecalho}\n${corpo}`
}

export function exportarCsv(nomeArquivo: string, colunas: string[], linhas: unknown[][]): void {
  const csv = paraCsv(colunas, linhas)
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()

  URL.revokeObjectURL(url)
}
