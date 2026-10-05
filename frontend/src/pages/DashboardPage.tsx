import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../AuthContext'
import { api, ApiError } from '../lib/api'
import type { Indicadores } from '../types'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function DashboardPage() {
  const { usuario } = useAuth()
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Indicadores>('/dashboard')
      .then(setIndicadores)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o dashboard.'))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-brand-muted">Bem-vindo, {usuario?.nome}</p>

      {carregando && <p className="mt-8 text-sm text-brand-muted">Carregando...</p>}
      {!carregando && erro && <p className="mt-8 text-sm text-red-400">{erro}</p>}

      {!carregando && indicadores && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="Total a Receber" valor={indicadores.totalAReceber.valor} />
          <Kpi rotulo="Vencimentos Hoje" valor={indicadores.vencimentosHoje.valor} destaque="amber" />
          <Kpi rotulo="Em Atraso" valor={indicadores.emAtraso.valor} destaque="red" />
          <Kpi rotulo="Recebido no Mês" valor={indicadores.recebidoNoMes} destaque="verde" />
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
