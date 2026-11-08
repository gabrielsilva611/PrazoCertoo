import { useState } from 'react'
import { ApiError } from '../lib/api'

export interface DadosProduto {
  nome: string
  unidade: string
  categoriaId?: string | null
  precoCusto: number
  precoVenda: number
  estoqueMinimo: number
}

export function useSalvarProduto(
  salvar: (dados: DadosProduto) => Promise<unknown>,
  aoSucesso: () => void,
  mensagemErroPadrao: string,
) {
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function submeter(dados: DadosProduto) {
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
