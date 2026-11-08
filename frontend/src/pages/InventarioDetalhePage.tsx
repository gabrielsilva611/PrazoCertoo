import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { FormField, estiloInput } from '../components/FormField'
import { InventarioStatusBadge } from '../components/InventarioStatusBadge'
import { api, ApiError } from '../lib/api'
import type { InventarioDetalhe, Produto } from '../types'

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function InventarioDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const [inventario, setInventario] = useState<InventarioDetalhe | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [produtoId, setProdutoId] = useState('')
  const [saldoFisico, setSaldoFisico] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [registrando, setRegistrando] = useState(false)
  const [concluindo, setConcluindo] = useState(false)

  function carregar() {
    Promise.all([
      api.get<{ inventario: InventarioDetalhe }>(`/inventarios/${id}`),
      api.get<{ produtos: Produto[] }>('/produtos'),
    ])
      .then(([resInventario, resProdutos]) => {
        setInventario(resInventario.inventario)
        setProdutos(resProdutos.produtos)
        setErro(null)
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o inventário.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

  const produtoSelecionado = produtos.find((p) => p.id === produtoId)
  const diferencaPrevia =
    produtoSelecionado && saldoFisico !== '' ? Number(saldoFisico) - produtoSelecionado.saldoAtual : null

  async function aoRegistrar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setRegistrando(true)
    try {
      await api.put(`/inventarios/${id}/itens`, {
        produtoId,
        saldoFisico: Number(saldoFisico),
        justificativa: justificativa || undefined,
      })
      setProdutoId('')
      setSaldoFisico('')
      setJustificativa('')
      carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível registrar a contagem.')
    } finally {
      setRegistrando(false)
    }
  }

  async function aoConcluir() {
    if (!window.confirm('Concluir este inventário? As divergências encontradas serão aplicadas ao estoque.')) {
      return
    }
    setErro(null)
    setConcluindo(true)
    try {
      await api.patch(`/inventarios/${id}/concluir`)
      carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível concluir o inventário.')
    } finally {
      setConcluindo(false)
    }
  }

  if (carregando) {
    return (
      <AppLayout>
        <p className="text-sm text-brand-muted">Carregando...</p>
      </AppLayout>
    )
  }

  if (!inventario) {
    return (
      <AppLayout>
        <p className="text-sm text-red-400">{erro ?? 'Inventário não encontrado.'}</p>
        <Link to="/inventario" className="mt-4 inline-block text-sm text-brand-accent hover:underline">
          ← Voltar para Inventário
        </Link>
      </AppLayout>
    )
  }

  const emAberto = inventario.status === 'ABERTO'

  return (
    <AppLayout>
      <Link to="/inventario" className="text-sm text-brand-muted hover:text-brand-text">
        ← Inventário
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Inventário de {formatoDataHora.format(new Date(inventario.iniciadoEm))}
          </h1>
          <div className="mt-1.5">
            <InventarioStatusBadge status={inventario.status} />
          </div>
        </div>
        {emAberto && (
          <button
            onClick={aoConcluir}
            disabled={concluindo || inventario.itens.length === 0}
            className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
          >
            {concluindo ? 'Concluindo...' : 'Concluir inventário'}
          </button>
        )}
      </div>

      {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

      <div className={emAberto ? 'mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]' : 'mt-8'}>
        {emAberto && (
          <form
            onSubmit={aoRegistrar}
            className="flex h-fit flex-col gap-4 rounded-lg border border-brand-border bg-brand-surface/40 p-4"
          >
            <h2 className="text-sm font-medium">Registrar contagem</h2>

            <FormField rotulo="Produto" id="produtoId" obrigatorio>
              <select
                id="produtoId"
                required
                value={produtoId}
                onChange={(e) => setProdutoId(e.target.value)}
                className={estiloInput}
              >
                <option value="">Selecione...</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            </FormField>

            {produtoSelecionado && (
              <p className="text-xs text-brand-muted">Saldo no sistema: {produtoSelecionado.saldoAtual}</p>
            )}

            <FormField rotulo="Saldo contado fisicamente" id="saldoFisico" obrigatorio>
              <input
                id="saldoFisico"
                required
                type="number"
                min={0}
                value={saldoFisico}
                onChange={(e) => setSaldoFisico(e.target.value)}
                className={estiloInput}
              />
            </FormField>

            {diferencaPrevia !== null && diferencaPrevia !== 0 && (
              <p className="text-xs text-amber-400">
                Diferença de {diferencaPrevia > 0 ? '+' : ''}
                {diferencaPrevia} em relação ao sistema — informe a justificativa abaixo.
              </p>
            )}

            <FormField rotulo="Justificativa" id="justificativa">
              <input
                id="justificativa"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Opcional, exceto se houver divergência com o sistema"
                className={estiloInput}
              />
            </FormField>

            <button
              type="submit"
              disabled={registrando}
              className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
            >
              {registrando ? 'Registrando...' : 'Registrar contagem'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-brand-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Sistema</th>
                <th className="px-4 py-3 font-medium">Físico</th>
                <th className="px-4 py-3 font-medium">Diferença</th>
                <th className="px-4 py-3 font-medium">Justificativa</th>
              </tr>
            </thead>
            <tbody>
              {inventario.itens.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-muted">
                    Nenhum item contado ainda.
                  </td>
                </tr>
              )}
              {inventario.itens.map((item) => (
                <tr key={item.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">
                    {item.produto.nome} <span className="text-xs text-brand-muted">{item.produto.unidade}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{item.saldoSistema}</td>
                  <td className="px-4 py-3">{item.saldoFisico}</td>
                  <td className="px-4 py-3">
                    <span className={item.diferenca === 0 ? 'text-brand-muted' : 'font-medium text-amber-400'}>
                      {item.diferenca > 0 ? '+' : ''}
                      {item.diferenca}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{item.justificativa ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
