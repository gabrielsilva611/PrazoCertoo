import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { InventarioStatusBadge } from '../components/InventarioStatusBadge'
import { api, ApiError } from '../lib/api'
import type { InventarioResumo } from '../types'

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function InventariosPage() {
  const [inventarios, setInventarios] = useState<InventarioResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [abrindo, setAbrindo] = useState(false)
  const navegar = useNavigate()

  useEffect(() => {
    api
      .get<{ inventarios: InventarioResumo[] }>('/inventarios')
      .then((resposta) => setInventarios(resposta.inventarios))
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os inventários.'))
      .finally(() => setCarregando(false))
  }, [])

  const inventarioAberto = inventarios.find((i) => i.status === 'ABERTO')

  async function aoIniciar() {
    setAbrindo(true)
    setErro(null)
    try {
      const resposta = await api.post<{ inventario: InventarioResumo }>('/inventarios')
      navegar(`/inventario/${resposta.inventario.id}`)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível iniciar o inventário.')
      setAbrindo(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-brand-text">Inventário Físico</h1>
          <p className="text-sm text-brand-muted">{inventarios.length} inventários registrados</p>
        </div>
        {inventarioAberto ? (
          <Link
            to={`/inventario/${inventarioAberto.id}`}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-hover"
          >
            Continuar contagem em aberto
          </Link>
        ) : (
          <button
            onClick={aoIniciar}
            disabled={abrindo}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-hover disabled:opacity-60"
          >
            {abrindo ? 'Iniciando...' : '+ Iniciar Inventário'}
          </button>
        )}
      </div>

      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-bg text-xs uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Iniciado em</th>
              <th className="px-4 py-3 font-medium">Concluído em</th>
              <th className="px-4 py-3 font-medium">Status</th>
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

            {!carregando && inventarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                  Nenhum inventário registrado ainda.
                </td>
              </tr>
            )}

            {inventarios.map((inventario) => (
              <tr key={inventario.id} className="border-t border-brand-border">
                <td className="px-4 py-3">{formatoDataHora.format(new Date(inventario.iniciadoEm))}</td>
                <td className="px-4 py-3 text-brand-muted">
                  {inventario.concluidoEm ? formatoDataHora.format(new Date(inventario.concluidoEm)) : '—'}
                </td>
                <td className="px-4 py-3">
                  <InventarioStatusBadge status={inventario.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/inventario/${inventario.id}`} className="text-brand-accent hover:underline">
                    Ver
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
