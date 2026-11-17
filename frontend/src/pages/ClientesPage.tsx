import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { EstatisticasFaixa } from '../components/EstatisticasFaixa'
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
          <h1 className="font-display text-3xl text-brand-text">Clientes</h1>
          <p className="text-sm text-brand-muted">{clientes.length} clientes cadastrados</p>
        </div>
        <Link
          to="/clientes/novo"
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-hover"
        >
          + Novo Cliente
        </Link>
      </div>

      <EstatisticasFaixa
        itens={[
          { rotulo: 'Total de clientes', valor: clientes.length },
          { rotulo: 'Bons pagadores', valor: totalBonsPagadores, destaque: 'accent' },
          { rotulo: 'Inadimplentes', valor: totalInadimplentes, destaque: totalInadimplentes > 0 ? 'red' : 'padrao' },
        ]}
      />

      <input
        type="text"
        placeholder="Buscar por nome ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mt-6 w-full max-w-sm rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm outline-none focus:border-brand-accent"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-bg text-xs uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                  Carregando...
                </td>
              </tr>
            )}

            {!carregando && erro && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-red-600">
                  {erro}
                </td>
              </tr>
            )}

            {!carregando && !erro && filtrados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}

            {filtrados.map((cliente) => (
              <tr key={cliente.id} className="border-t border-brand-border">
                <td className="px-4 py-3">
                  <Link to={`/clientes/${cliente.id}`} className="hover:text-brand-accent hover:underline">
                    {cliente.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-muted">{cliente.telefone}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={cliente.score} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/clientes/${cliente.id}/editar`} className="text-brand-accent hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
