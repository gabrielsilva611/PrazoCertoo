import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { ScoreBadge } from '../components/ScoreBadge'
import { StatusParcelaBadge } from '../components/StatusParcelaBadge'
import { useAuth } from '../AuthContext'
import { api, ApiError } from '../lib/api'
import type { ClienteDetalhe } from '../types'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [cliente, setCliente] = useState<ClienteDetalhe | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [desativando, setDesativando] = useState(false)

  useEffect(() => {
    api
      .get<{ cliente: ClienteDetalhe }>(`/clientes/${id}`)
      .then((resposta) => setCliente(resposta.cliente))
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o cliente.'))
      .finally(() => setCarregando(false))
  }, [id])

  async function aoDesativar() {
    if (!window.confirm('Desativar este cliente? O histórico de vendas e cobranças é mantido.')) return
    setDesativando(true)
    try {
      await api.patch(`/clientes/${id}/desativar`)
      navegar('/clientes')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível desativar o cliente.')
      setDesativando(false)
    }
  }

  if (carregando) {
    return (
      <AppLayout>
        <p className="text-sm text-brand-muted">Carregando...</p>
      </AppLayout>
    )
  }

  if (!cliente) {
    return (
      <AppLayout>
        <p className="text-sm text-red-400">{erro ?? 'Cliente não encontrado.'}</p>
        <Link to="/clientes" className="mt-4 inline-block text-sm text-brand-accent hover:underline">
          ← Voltar para Clientes
        </Link>
      </AppLayout>
    )
  }

  const totalAtrasadas = cliente.vendas.reduce(
    (soma, venda) => soma + venda.parcelas.filter((p) => p.status === 'ATRASADO').length,
    0,
  )

  return (
    <AppLayout>
      <Link to="/clientes" className="text-sm text-brand-muted hover:text-brand-text">
        ← Clientes
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {cliente.nome} {!cliente.ativo && <span className="text-sm font-normal text-brand-muted">(inativo)</span>}
          </h1>
          <p className="text-sm text-brand-muted">
            {cliente.telefone}
            {cliente.email && ` · ${cliente.email}`}
            {cliente.cpf && ` · ${cliente.cpf}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link to={`/clientes/${id}/editar`} className="text-sm text-brand-accent hover:underline">
            Editar
          </Link>
          {usuario?.perfil === 'DONO' && cliente.ativo && (
            <button
              onClick={aoDesativar}
              disabled={desativando}
              className="text-sm text-red-400 hover:underline disabled:opacity-60"
            >
              {desativando ? 'Desativando...' : 'Desativar'}
            </button>
          )}
        </div>
      </div>

      {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

      {cliente.observacoes && (
        <p className="mt-4 rounded-md border border-brand-border bg-brand-surface/40 p-3 text-sm text-brand-muted">
          {cliente.observacoes}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-brand-border bg-brand-surface/40 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-muted">Score</p>
          <div className="mt-1.5">
            <ScoreBadge score={cliente.score} />
          </div>
        </div>
        <StatCard rotulo="Vendas registradas" valor={String(cliente.vendas.length)} />
        <StatCard rotulo="Parcelas em atraso" valor={String(totalAtrasadas)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium">Vendas e parcelas</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Venda</th>
                  <th className="px-4 py-3 font-medium">Parcela</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cliente.vendas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                )}
                {cliente.vendas.flatMap((venda) =>
                  venda.parcelas.map((parcela) => (
                    <tr key={parcela.id} className="border-t border-brand-border">
                      <td className="px-4 py-3 text-brand-muted">{venda.descricao || '—'}</td>
                      <td className="px-4 py-3">{formatoMoeda.format(Number(parcela.valor))}</td>
                      <td className="px-4 py-3 text-brand-muted">
                        {formatoData.format(new Date(parcela.vencimento))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusParcelaBadge status={parcela.status} />
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium">Cobranças enviadas</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Quando</th>
                  <th className="px-4 py-3 font-medium">Canal</th>
                  <th className="px-4 py-3 font-medium">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {cliente.historicoCobrancas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-brand-muted">
                      Nenhuma cobrança enviada ainda.
                    </td>
                  </tr>
                )}
                {cliente.historicoCobrancas.map((cobranca) => (
                  <tr key={cobranca.id} className="border-t border-brand-border">
                    <td className="px-4 py-3 text-brand-muted">
                      {formatoDataHora.format(new Date(cobranca.enviadoEm))}
                    </td>
                    <td className="px-4 py-3">{cobranca.canal}</td>
                    <td className="px-4 py-3 text-brand-muted">{cobranca.mensagem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
