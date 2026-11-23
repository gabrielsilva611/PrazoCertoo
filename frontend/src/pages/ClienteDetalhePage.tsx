import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { EstatisticasFaixa } from '../components/EstatisticasFaixa'
import { Modal } from '../components/Modal'
import { RegistrarPagamentoForm } from '../components/RegistrarPagamentoForm'
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
  const [excluindo, setExcluindo] = useState(false)
  const [pagamentoAberto, setPagamentoAberto] = useState<{
    vendaId: string
    numero: number
    saldoDevedor: string
    descricaoVenda: string
  } | null>(null)

  function carregar() {
    api
      .get<{ cliente: ClienteDetalhe }>(`/clientes/${id}`)
      .then((resposta) => setCliente(resposta.cliente))
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o cliente.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

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

  async function aoExcluir() {
    if (!window.confirm('Excluir este cliente para sempre? Vendas, parcelas e cobranças dele também serão apagadas — essa ação não pode ser desfeita.')) {
      return
    }
    setExcluindo(true)
    try {
      await api.delete(`/clientes/${id}`)
      navegar('/clientes')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível excluir o cliente.')
      setExcluindo(false)
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
  const dividaQuitada = cliente.vendas.every((venda) => venda.parcelas.every((p) => p.status === 'PAGO'))

  return (
    <AppLayout>
      <Link to="/clientes" className="text-sm text-brand-muted hover:text-brand-text">
        ← Clientes
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">
            {cliente.nome} {!cliente.ativo && <span className="text-lg text-brand-muted">(inativo)</span>}
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
          {usuario?.perfil === 'DONO' && dividaQuitada && (
            <button
              onClick={aoExcluir}
              disabled={excluindo}
              title="Dívida quitada — já pode excluir este cliente de vez"
              className="text-sm text-red-400 hover:underline disabled:opacity-60"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
          {usuario?.perfil === 'DONO' && cliente.ativo && (
            <button
              onClick={aoDesativar}
              disabled={desativando}
              className="text-sm text-brand-muted hover:underline disabled:opacity-60"
            >
              {desativando ? 'Desativando...' : 'Desativar'}
            </button>
          )}
        </div>
      </div>

      {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

      {cliente.observacoes && (
        <p className="mt-4 rounded-lg border border-brand-border bg-brand-surface/40 p-3 text-sm text-brand-muted">
          {cliente.observacoes}
        </p>
      )}

      <EstatisticasFaixa
        itens={[
          {
            rotulo: 'Score',
            valor: (
              <span className="font-sans">
                <ScoreBadge score={cliente.score} />
              </span>
            ),
          },
          { rotulo: 'Vendas registradas', valor: cliente.vendas.length },
          {
            rotulo: 'Parcelas em atraso',
            valor: totalAtrasadas,
            destaque: totalAtrasadas > 0 ? 'red' : 'padrao',
          },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Vendas e parcelas</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-bg text-xs uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Venda</th>
                  <th className="px-4 py-3 font-medium">Parcela</th>
                  <th className="px-4 py-3 font-medium">Saldo devedor</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cliente.vendas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-brand-muted">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                )}
                {cliente.vendas.flatMap((venda) =>
                  venda.parcelas.map((parcela) => (
                    <tr key={parcela.id} className="border-t border-brand-border">
                      <td className="px-4 py-3 text-brand-muted">{venda.descricao || '—'}</td>
                      <td className="px-4 py-3">{formatoMoeda.format(Number(parcela.valor))}</td>
                      <td className="px-4 py-3">
                        {parcela.status === 'PAGO' ? (
                          <span className="text-brand-muted">—</span>
                        ) : (
                          formatoMoeda.format(Number(parcela.saldoDevedor))
                        )}
                      </td>
                      <td className="px-4 py-3 text-brand-muted">
                        {formatoData.format(new Date(parcela.vencimento))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusParcelaBadge status={parcela.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {parcela.status !== 'PAGO' && (
                          <button
                            onClick={() =>
                              setPagamentoAberto({
                                vendaId: venda.id,
                                numero: parcela.numero,
                                saldoDevedor: parcela.saldoDevedor,
                                descricaoVenda: venda.descricao || `parcela ${parcela.numero}`,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-medium text-brand-accent-foreground transition hover:bg-brand-accent-hover"
                          >
                            <Wallet className="h-3.5 w-3.5" />
                            Registrar pagamento
                          </button>
                        )}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Cobranças enviadas</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-bg text-xs uppercase tracking-wide text-brand-muted">
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

      {pagamentoAberto && (
        <Modal
          titulo={`Registrar pagamento — ${pagamentoAberto.descricaoVenda}`}
          onFechar={() => setPagamentoAberto(null)}
        >
          <RegistrarPagamentoForm
            vendaId={pagamentoAberto.vendaId}
            numero={pagamentoAberto.numero}
            saldoDevedor={pagamentoAberto.saldoDevedor}
            aoSucesso={() => {
              setPagamentoAberto(null)
              carregar()
            }}
            aoCancelar={() => setPagamentoAberto(null)}
          />
        </Modal>
      )}
    </AppLayout>
  )
}
