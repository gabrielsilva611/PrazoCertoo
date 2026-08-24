import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { api, ApiError } from '../lib/api'
import type { Venda } from '../types'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

export function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ vendas: Venda[] }>('/vendas')
      .then((resposta) => setVendas(resposta.vendas))
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as vendas.'))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendas a Prazo</h1>
          <p className="text-sm text-brand-muted">{vendas.length} acordos registrados</p>
        </div>
        <Link
          to="/vendas/novo"
          className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-accent-hover"
        >
          + Nova Venda
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Valor total</th>
              <th className="px-4 py-3 font-medium">Parcelas</th>
              <th className="px-4 py-3 font-medium">Em atraso</th>
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
            {!carregando && !erro && vendas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-brand-muted">
                  Nenhuma venda registrada ainda.
                </td>
              </tr>
            )}
            {vendas.map((venda) => {
              const atrasadas = venda.parcelas.filter((p) => p.status === 'ATRASADO').length
              return (
                <tr key={venda.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">{venda.cliente?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-muted">{venda.descricao || '—'}</td>
                  <td className="px-4 py-3">{formatoMoeda.format(Number(venda.valorTotal))}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {venda.numParcelas}x · desde {formatoData.format(new Date(venda.dataInicio))}
                  </td>
                  <td className="px-4 py-3">
                    {atrasadas > 0 ? (
                      <span className="text-red-400">{atrasadas}</span>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )}
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
