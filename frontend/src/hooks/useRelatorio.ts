import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'

// As 3 seções de Relatórios (vendas, inadimplência, estoque) buscam dados do
// mesmo jeito — isso existe só pra não repetir esse useEffect+estado 3 vezes.
export function useRelatorio<T>(caminho: string | null) {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(Boolean(caminho))
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!caminho) return
    setCarregando(true)
    setErro(null)
    api
      .get<T>(caminho)
      .then(setDados)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o relatório.'))
      .finally(() => setCarregando(false))
  }, [caminho])

  return { dados, carregando, erro }
}
