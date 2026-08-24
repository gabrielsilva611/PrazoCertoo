import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { ScoreBadge } from '../components/ScoreBadge'
import { api, ApiError } from '../lib/api'
import type { Cliente } from '../types'

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ clientes: Cliente[] }>('/clientes')
      .then((resposta) => setClientes(resposta.clientes))
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os clientes.'))
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(termo) || c.telefone.includes(termo),
    )
  }, [clientes, busca])

  const totalBonsPagadores = clientes.filter((c) => c.score === 'BOM_PAGADOR').length
  const totalInadimplentes = clientes.filter((c) => c.score === 'INADIMPLENTE').length

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-brand-muted">{clientes.length} clientes cadastrados</p>
        </div>
        <Link
          to="/clientes/novo"
          className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-accent-hover"
        >
          + Novo Cliente
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard rotulo="Total de clientes" valor={clientes.length} />
        <StatCard rotulo="Bons pagadores" valor={totalBonsPagadores} />
        <StatCard rotulo="Inadimplentes" valor={totalInadimplentes} />
      </div>

      <input
        type="text"
        placeholder="Buscar por nome ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mt-6 w-full max-w-sm rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm outline-none focus:border-brand-accent"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-brand-muted">
                  Carregando...
                </td>
              </tr>
            )}

            {!carregando && erro && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-red-400">
                  {erro}
                </td>
              </tr>
            )}

            {!carregando && !erro && filtrados.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-brand-muted">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}

            {filtrados.map((cliente) => (
              <tr key={cliente.id} className="border-t border-brand-border">
                <td className="px-4 py-3">{cliente.nome}</td>
                <td className="px-4 py-3 text-brand-muted">{cliente.telefone}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={cliente.score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}

function StatCard({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface/40 p-4">
      <p className="text-xs uppercase tracking-wide text-brand-muted">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
    </div>
  )
}
