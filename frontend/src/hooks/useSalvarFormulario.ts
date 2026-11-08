import { useState } from 'react'
import { ApiError } from '../lib/api'

export function useSalvarFormulario<T>(
  salvar: (dados: T) => Promise<unknown>,
  aoSucesso: () => void,
  mensagemErroPadrao: string,
) {
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function submeter(dados: T) {
    setErro(null)
    setSalvando(true)
    try {
      await salvar(dados)
      aoSucesso()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : mensagemErroPadrao)
    } finally {
      setSalvando(false)
    }
  }

  return { erro, salvando, submeter }
}
