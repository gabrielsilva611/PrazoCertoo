import { useEffect, useMemo, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { api, ApiError } from '../lib/api'
import type { Categoria, Produto } from '../types'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<{ produtos: Produto[] }>('/produtos'),
      api.get<{ categorias: Categoria[] }>('/categorias'),
    ])
      .then(([resProdutos, resCategorias]) => {
        setProdutos(resProdutos.produtos)
        setCategorias(resCategorias.categorias)
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os produtos.'))
      .finally(() => setCarregando(false))
  }, [])

  const nomeCategoria = useMemo(() => {
    const mapa = new Map(categorias.map((c) => [c.id, c.nome]))
    return (categoriaId: string | null) => (categoriaId ? mapa.get(categoriaId) ?? '—' : '—')
  }, [categorias])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return produtos
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo))
  }, [produtos, busca])

  const totalAbaixoDoMinimo = produtos.filter((p) => p.saldoAtual < p.estoqueMinimo).length
  const capitalImobilizadoTotal = produtos.reduce((soma, p) => soma + p.capitalImobilizado, 0)

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Produtos</h1>
          <p className="text-sm text-brand-muted">{produtos.length} produtos cadastrados</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard rotulo="Total de produtos" valor={String(produtos.length)} />
        <StatCard rotulo="Abaixo do estoque mínimo" valor={String(totalAbaixoDoMinimo)} />
        <StatCard rotulo="Capital imobilizado" valor={formatoMoeda.format(capitalImobilizadoTotal)} />
      </div>

      <input
        type="text"
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mt-6 w-full max-w-sm rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm outline-none focus:border-brand-accent"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Preço de venda</th>
              <th className="px-4 py-3 font-medium">Capital imobilizado</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-brand-muted">
                  Carregando...
                </td>
              </tr>
            )}

            {!carregando && erro && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-400">
                  {erro}
                </td>
              </tr>
            )}

            {!carregando && !erro && filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-brand-muted">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}

            {filtrados.map((produto) => {
              const abaixoDoMinimo = produto.saldoAtual < produto.estoqueMinimo
              return (
                <tr key={produto.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">
                    {produto.nome}
                    <span className="ml-2 text-xs text-brand-muted">{produto.unidade}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{nomeCategoria(produto.categoriaId)}</td>
                  <td className="px-4 py-3">
                    <span className={abaixoDoMinimo ? 'font-medium text-red-400' : ''}>
                      {produto.saldoAtual}
                    </span>
                    {abaixoDoMinimo && (
                      <span className="ml-2 rounded-full bg-red-400/15 px-2 py-0.5 text-xs text-red-400">
                        abaixo do mínimo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatoMoeda.format(Number(produto.precoVenda))}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {formatoMoeda.format(produto.capitalImobilizado)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}

function StatCard({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface/40 p-4">
      <p className="text-xs uppercase tracking-wide text-brand-muted">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
    </div>
  )
}
