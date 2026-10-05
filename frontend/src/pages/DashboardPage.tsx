import { useEffect, useMemo, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { ScoreBadge } from '../components/ScoreBadge'
import { StatusParcelaBadge } from '../components/StatusParcelaBadge'
import { useAuth } from '../AuthContext'
import { api, ApiError } from '../lib/api'
import type { Cliente, ClienteBasico, Indicadores, Parcela, Venda } from '../types'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

interface Pendencia {
  cliente: ClienteBasico
  score: Cliente['score'] | undefined
  parcela: Parcela
  vendaId: string
}

export function DashboardPage() {
  const { usuario } = useAuth()
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null)
  const [vendas, setVendas] = useState<Venda[]>([])
  const [scorePorCliente, setScorePorCliente] = useState<Map<string, Cliente['score']>>(new Map())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [cobrando, setCobrando] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<Indicadores>('/dashboard'),
      api.get<{ vendas: Venda[] }>('/vendas'),
      // GET /vendas não traz o score do cliente (só GET /clientes calcula).
      api.get<{ clientes: Cliente[] }>('/clientes'),
    ])
      .then(([dados, respostaVendas, respostaClientes]) => {
        setIndicadores(dados)
        setVendas(respostaVendas.vendas)
        setScorePorCliente(new Map(respostaClientes.clientes.map((c) => [c.id, c.score])))
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o dashboard.'))
      .finally(() => setCarregando(false))
  }, [])

  const pendencias = useMemo(() => {
    const todas: Pendencia[] = []
    for (const venda of vendas) {
      if (!venda.cliente) continue
      for (const parcela of venda.parcelas) {
        if (parcela.status !== 'PAGO') {
          todas.push({
            cliente: venda.cliente,
            score: scorePorCliente.get(venda.cliente.id),
            parcela,
            vendaId: venda.id,
          })
        }
      }
    }
    return todas
      .sort((a, b) => new Date(a.parcela.vencimento).getTime() - new Date(b.parcela.vencimento).getTime())
      .slice(0, 10)
  }, [vendas, scorePorCliente])

  async function cobrar(pendencia: Pendencia) {
    const chave = `${pendencia.vendaId}-${pendencia.parcela.numero}`
    setCobrando(chave)
    // Abre a aba já na hora do clique (gesto síncrono do usuário) e só
    // navega ela depois — se esperasse a API responder pra chamar
    // window.open, o Chrome trata como pop-up e bloqueia.
    const aba = window.open('', '_blank')
    try {
      const resultado = await api.post<{ linkWhatsapp: string }>(
        `/vendas/${pendencia.vendaId}/parcelas/${pendencia.parcela.numero}/cobrar`,
      )
      if (aba) aba.location.href = resultado.linkWhatsapp
    } catch (e) {
      aba?.close()
      setErro(e instanceof ApiError ? e.message : 'Não foi possível gerar a cobrança.')
    } finally {
      setCobrando(null)
    }
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-brand-muted">Bem-vindo, {usuario?.nome}</p>

      {carregando && <p className="mt-8 text-sm text-brand-muted">Carregando...</p>}
      {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

      {!carregando && indicadores && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="Total a Receber" valor={indicadores.totalAReceber.valor} />
          <Kpi rotulo="Vencimentos Hoje" valor={indicadores.vencimentosHoje.valor} destaque="amber" />
          <Kpi rotulo="Em Atraso" valor={indicadores.emAtraso.valor} destaque="red" />
          <Kpi rotulo="Recebido no Mês" valor={indicadores.recebidoNoMes} destaque="verde" />
        </div>
      )}

      {!carregando && pendencias.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-brand-muted">Clientes com pendências</p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Parcela</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendencias.map((p) => {
                  const chave = `${p.vendaId}-${p.parcela.numero}`
                  return (
                    <tr key={chave} className="border-t border-brand-border">
                      <td className="px-4 py-3">{p.cliente.nome}</td>
                      <td className="px-4 py-3">{formatoMoeda.format(Number(p.parcela.valor))}</td>
                      <td className="px-4 py-3 text-brand-muted">
                        {formatoData.format(new Date(p.parcela.vencimento))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusParcelaBadge status={p.parcela.status} />
                      </td>
                      <td className="px-4 py-3">
                        {p.score ? <ScoreBadge score={p.score} /> : <span className="text-brand-muted">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => cobrar(p)}
                          disabled={cobrando === chave}
                          className="text-brand-accent hover:underline disabled:opacity-60"
                        >
                          {cobrando === chave ? 'Gerando...' : 'Cobrar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

const cores = {
  padrao: 'text-brand-text',
  amber: 'text-amber-400',
  red: 'text-red-400',
  verde: 'text-brand-accent',
} as const

function Kpi({
  rotulo,
  valor,
  destaque = 'padrao',
}: {
  rotulo: string
  valor: number
  destaque?: keyof typeof cores
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface/40 p-4">
      <p className="text-xs uppercase tracking-wide text-brand-muted">{rotulo}</p>
      <p className={`mt-1 text-2xl font-semibold ${cores[destaque]}`}>{formatoMoeda.format(valor)}</p>
    </div>
  )
}
