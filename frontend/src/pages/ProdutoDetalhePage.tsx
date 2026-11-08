import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { FormField, estiloInput } from '../components/FormField'
import { MovimentacaoBadge } from '../components/MovimentacaoBadge'
import { api, ApiError } from '../lib/api'
import type { MovimentacaoEstoque, Produto, TipoMovimentacao } from '../types'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function ProdutoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const [produto, setProduto] = useState<Produto | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [tipo, setTipo] = useState<TipoMovimentacao>('ENTRADA')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [registrando, setRegistrando] = useState(false)

  function carregar() {
    Promise.all([
      api.get<{ produto: Produto }>(`/produtos/${id}`),
      api.get<{ movimentacoes: MovimentacaoEstoque[] }>(`/produtos/${id}/movimentacoes`),
    ])
      .then(([resProduto, resMovimentacoes]) => {
        setProduto(resProduto.produto)
        setMovimentacoes(resMovimentacoes.movimentacoes)
        setErro(null)
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o produto.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

  async function aoRegistrar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setRegistrando(true)
    try {
      await api.post(`/produtos/${id}/movimentacoes`, {
        tipo,
        quantidade: Number(quantidade),
        motivo: motivo || undefined,
      })
      setQuantidade('')
      setMotivo('')
      carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível registrar a movimentação.')
    } finally {
      setRegistrando(false)
    }
  }

  if (carregando) {
    return (
      <AppLayout>
        <p className="text-sm text-brand-muted">Carregando...</p>
      </AppLayout>
    )
  }

  if (!produto) {
    return (
      <AppLayout>
        <p className="text-sm text-red-400">{erro ?? 'Produto não encontrado.'}</p>
        <Link to="/produtos" className="mt-4 inline-block text-sm text-brand-accent hover:underline">
          ← Voltar para Produtos
        </Link>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Link to="/produtos" className="text-sm text-brand-muted hover:text-brand-text">
        ← Produtos
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {produto.nome} <span className="text-sm font-normal text-brand-muted">{produto.unidade}</span>
          </h1>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard rotulo="Saldo atual" valor={String(produto.saldoAtual)} />
        <StatCard rotulo="Estoque mínimo" valor={String(produto.estoqueMinimo)} />
        <StatCard rotulo="Preço de venda" valor={formatoMoeda.format(Number(produto.precoVenda))} />
        <StatCard rotulo="Capital imobilizado" valor={formatoMoeda.format(produto.capitalImobilizado)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={aoRegistrar}
          className="flex h-fit flex-col gap-4 rounded-lg border border-brand-border bg-brand-surface/40 p-4"
        >
          <h2 className="text-sm font-medium">Registrar movimentação</h2>

          <FormField rotulo="Tipo" id="tipo" obrigatorio>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoMovimentacao)}
              className={estiloInput}
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </FormField>

          <FormField rotulo="Quantidade" id="quantidade" obrigatorio>
            <input
              id="quantidade"
              required
              type="number"
              min={tipo === 'AJUSTE' ? undefined : 1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder={tipo === 'AJUSTE' ? 'Pode ser negativo, ex: -2' : undefined}
              className={estiloInput}
            />
          </FormField>

          <FormField rotulo="Motivo" id="motivo">
            <input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Opcional, exceto se deixar o saldo negativo"
              className={estiloInput}
            />
          </FormField>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={registrando}
            className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
          >
            {registrando ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <div className="overflow-x-auto rounded-lg border border-brand-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Saldo</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-muted">
                    Nenhuma movimentação registrada ainda.
                  </td>
                </tr>
              )}
              {movimentacoes.map((movimentacao) => (
                <tr key={movimentacao.id} className="border-t border-brand-border">
                  <td className="px-4 py-3 text-brand-muted">
                    {formatoDataHora.format(new Date(movimentacao.criadoEm))}
                  </td>
                  <td className="px-4 py-3">
                    <MovimentacaoBadge tipo={movimentacao.tipo} />
                  </td>
                  <td className="px-4 py-3">{movimentacao.quantidade}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {movimentacao.saldoAnterior} → {movimentacao.saldoPosterior}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{movimentacao.motivo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}

function StatCard({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface/40 p-4">
      <p className="text-xs uppercase tracking-wide text-brand-muted">{rotulo}</p>
      <p className="mt-1 text-xl font-semibold">{valor}</p>
    </div>
  )
}
