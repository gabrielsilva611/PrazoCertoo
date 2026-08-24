import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { FormField, estiloInput } from '../components/FormField'
import { ScoreBadge } from '../components/ScoreBadge'
import { api, ApiError } from '../lib/api'
import { calcularParcelasPrevia } from '../lib/parcelaPreview'
import type { Cliente, Venda } from '../types'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

const INTERVALOS = [
  { rotulo: 'Semanal (7 dias)', dias: 7 },
  { rotulo: 'Quinzenal (15 dias)', dias: 15 },
  { rotulo: 'Mensal (30 dias)', dias: 30 },
]

export function NovaVendaPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [buscaCliente, setBuscaCliente] = useState('')

  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [numParcelas, setNumParcelas] = useState('1')
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [intervaloDias, setIntervaloDias] = useState(30)

  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const navegar = useNavigate()

  useEffect(() => {
    api.get<{ clientes: Cliente[] }>('/clientes').then((r) => setClientes(r.clientes))
  }, [])

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter((c) => c.nome.toLowerCase().includes(termo))
  }, [clientes, buscaCliente])

  const parcelasPrevia = useMemo(() => {
    const valor = Number(valorTotal.replace(',', '.'))
    const parcelas = Number(numParcelas)
    const inicio = new Date(`${dataInicio}T00:00:00Z`)
    return calcularParcelasPrevia(valor, parcelas, inicio, intervaloDias)
  }, [valorTotal, numParcelas, dataInicio, intervaloDias])

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)

    if (!clienteSelecionado) {
      setErro('Selecione um cliente.')
      return
    }

    setSalvando(true)
    try {
      await api.post<{ venda: Venda }>('/vendas', {
        clienteId: clienteSelecionado.id,
        descricao: descricao || undefined,
        valorTotal: Number(valorTotal.replace(',', '.')),
        numParcelas: Number(numParcelas),
        dataInicio,
        intervaloDias,
      })
      navegar('/vendas')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível registrar a venda.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Nova Venda a Prazo</h1>
      <p className="text-sm text-brand-muted">Preenche os dados do acordo comercial</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={aoSubmeter}>
          <label className="block text-xs uppercase tracking-wide text-brand-muted">Cliente</label>
          {clienteSelecionado ? (
            <div className="mt-1 flex items-center justify-between rounded-md border border-brand-border bg-brand-surface px-3 py-2">
              <div>
                <p className="text-sm font-medium">{clienteSelecionado.nome}</p>
                <ScoreBadge score={clienteSelecionado.score} />
              </div>
              <button
                type="button"
                onClick={() => setClienteSelecionado(null)}
                className="text-sm text-brand-accent hover:underline"
              >
                Trocar →
              </button>
            </div>
          ) : (
            <div className="mt-1">
              <input
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
                placeholder="Buscar cliente por nome..."
                className={estiloInput}
              />
              {clientesFiltrados.length > 0 && (
                <ul className="mt-1 max-h-40 overflow-y-auto rounded-md border border-brand-border bg-brand-surface">
                  {clientesFiltrados.map((cliente) => (
                    <li key={cliente.id}>
                      <button
                        type="button"
                        onClick={() => setClienteSelecionado(cliente)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-bg"
                      >
                        <span>{cliente.nome}</span>
                        <ScoreBadge score={cliente.score} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <FormField rotulo="Descrição do acordo" id="descricao">
            <input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Perfume 212 VIP Rosa"
              className={estiloInput}
            />
          </FormField>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <FormField rotulo="Valor total (R$)" id="valorTotal">
              <input
                id="valorTotal"
                required
                inputMode="decimal"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                className={estiloInput}
              />
            </FormField>
            <FormField rotulo="Número de parcelas" id="numParcelas">
              <input
                id="numParcelas"
                required
                type="number"
                min={1}
                value={numParcelas}
                onChange={(e) => setNumParcelas(e.target.value)}
                className={estiloInput}
              />
            </FormField>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <FormField rotulo="Data do 1º vencimento" id="dataInicio">
              <input
                id="dataInicio"
                required
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={estiloInput}
              />
            </FormField>
            <FormField rotulo="Intervalo entre parcelas" id="intervaloDias">
              <select
                id="intervaloDias"
                value={intervaloDias}
                onChange={(e) => setIntervaloDias(Number(e.target.value))}
                className={estiloInput}
              >
                {INTERVALOS.map((item) => (
                  <option key={item.dias} value={item.dias}>
                    {item.rotulo}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-md bg-brand-accent px-4 py-2 font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Registrar Venda'}
            </button>
            <button
              type="button"
              onClick={() => navegar('/vendas')}
              className="rounded-md border border-brand-border px-4 py-2 hover:border-brand-accent"
            >
              Cancelar
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-brand-border bg-brand-surface/40 p-4 h-fit">
          <p className="text-xs uppercase tracking-wide text-brand-muted">Prévia das parcelas</p>
          {parcelasPrevia.length === 0 ? (
            <p className="mt-3 text-sm text-brand-muted">
              Preencha valor, parcelas e data para ver a prévia.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {parcelasPrevia.map((p) => (
                <li key={p.numero} className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">
                    {p.numero}ª · {formatoData.format(p.vencimento)}
                  </span>
                  <span className="font-medium">{formatoMoeda.format(p.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </AppLayout>
  )
}
