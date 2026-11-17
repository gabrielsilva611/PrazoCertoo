import { useState, type FormEvent } from 'react'
import { Download } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { EstatisticasFaixa } from '../components/EstatisticasFaixa'
import { FormField, estiloInput } from '../components/FormField'
import { useRelatorio } from '../hooks/useRelatorio'
import { exportarCsv } from '../lib/csv'
import type { RelatorioEstoque, RelatorioInadimplencia, RelatorioVendas } from '../types'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

function hoje() {
  return new Date().toISOString().slice(0, 10)
}
function haTrintaDias() {
  return new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
}

export function RelatoriosPage() {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold tracking-tight text-brand-text">Relatórios</h1>
      <p className="text-sm text-brand-muted">Vendas, inadimplência e estoque do negócio</p>

      <div className="mt-8 flex flex-col gap-10">
        <RelatorioVendasSecao />
        <RelatorioInadimplenciaSecao />
        <RelatorioEstoqueSecao />
      </div>
    </AppLayout>
  )
}

function BotaoExportar({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-muted transition hover:border-brand-accent hover:text-brand-text"
    >
      <Download className="h-3.5 w-3.5" />
      Exportar CSV
    </button>
  )
}

function CabecalhoSecao({ titulo, onExportar }: { titulo: string; onExportar?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">{titulo}</h2>
      {onExportar && <BotaoExportar onClick={onExportar} />}
    </div>
  )
}

function RelatorioVendasSecao() {
  const [inicio, setInicio] = useState(haTrintaDias())
  const [fim, setFim] = useState(hoje())
  const [caminho, setCaminho] = useState(`/relatorios/vendas?inicio=${haTrintaDias()}&fim=${hoje()}`)
  const { dados, carregando, erro } = useRelatorio<RelatorioVendas>(caminho)

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setCaminho(`/relatorios/vendas?inicio=${inicio}&fim=${fim}`)
  }

  function exportar() {
    if (!dados) return
    exportarCsv(
      `vendas_${inicio}_a_${fim}.csv`,
      ['Cliente', 'Descrição', 'Valor total', 'Parcelas', 'Data de início'],
      dados.vendas.map((v) => [
        v.cliente?.nome ?? '—',
        v.descricao ?? '',
        v.valorTotal,
        v.numParcelas,
        formatoData.format(new Date(v.dataInicio)),
      ]),
    )
  }

  return (
    <section>
      <CabecalhoSecao
        titulo="Vendas por período"
        onExportar={dados && dados.vendas.length > 0 ? exportar : undefined}
      />

      <form onSubmit={aoSubmeter} className="mt-3 flex flex-wrap items-end gap-3">
        <FormField rotulo="Início" id="relInicio">
          <input
            id="relInicio"
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className={estiloInput}
          />
        </FormField>
        <FormField rotulo="Fim" id="relFim">
          <input
            id="relFim"
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className={estiloInput}
          />
        </FormField>
        <button
          type="submit"
          disabled={carregando}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-brand-accent-foreground transition hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {carregando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

      {dados && (
        <>
          <EstatisticasFaixa
            itens={[
              { rotulo: 'Acordos no período', valor: dados.totalAcordos },
              { rotulo: 'Total vendido', valor: formatoMoeda.format(dados.totalVendido), destaque: 'accent' },
            ]}
          />

          <div className="mt-4 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-bg text-xs uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Valor total</th>
                  <th className="px-4 py-3 font-medium">Parcelas</th>
                  <th className="px-4 py-3 font-medium">Início</th>
                </tr>
              </thead>
              <tbody>
                {dados.vendas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-brand-muted">
                      Nenhuma venda nesse período.
                    </td>
                  </tr>
                )}
                {dados.vendas.map((venda) => (
                  <tr key={venda.id} className="border-t border-brand-border">
                    <td className="px-4 py-3">{venda.cliente?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-muted">{venda.descricao || '—'}</td>
                    <td className="px-4 py-3">{formatoMoeda.format(Number(venda.valorTotal))}</td>
                    <td className="px-4 py-3 text-brand-muted">{venda.numParcelas}x</td>
                    <td className="px-4 py-3 text-brand-muted">{formatoData.format(new Date(venda.dataInicio))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function RelatorioInadimplenciaSecao() {
  const { dados, erro } = useRelatorio<RelatorioInadimplencia>('/relatorios/inadimplencia')

  function exportar() {
    if (!dados) return
    exportarCsv(
      'inadimplencia.csv',
      ['Cliente', 'Total em aberto', 'Total atrasado', 'Parcelas pendentes', 'Parcelas atrasadas'],
      dados.clientes.map((c) => [c.nome, c.totalPendente, c.totalAtrasado, c.parcelasPendentes, c.parcelasAtrasadas]),
    )
  }

  return (
    <section>
      <CabecalhoSecao
        titulo="Inadimplência"
        onExportar={dados && dados.clientes.length > 0 ? exportar : undefined}
      />

      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

      {dados && (
        <>
          <EstatisticasFaixa
            itens={[
              { rotulo: 'Total em aberto', valor: formatoMoeda.format(dados.totalEmAberto) },
              { rotulo: 'Total atrasado', valor: formatoMoeda.format(dados.totalAtrasado), destaque: 'red' },
            ]}
          />

          <div className="mt-4 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-bg text-xs uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Em aberto</th>
                  <th className="px-4 py-3 font-medium">Atrasado</th>
                  <th className="px-4 py-3 font-medium">Parcelas atrasadas</th>
                </tr>
              </thead>
              <tbody>
                {dados.clientes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                      Nenhum cliente com parcela em aberto.
                    </td>
                  </tr>
                )}
                {dados.clientes.map((cliente) => (
                  <tr key={cliente.clienteId} className="border-t border-brand-border">
                    <td className="px-4 py-3">{cliente.nome}</td>
                    <td className="px-4 py-3">{formatoMoeda.format(cliente.totalPendente)}</td>
                    <td className="px-4 py-3">
                      {cliente.totalAtrasado > 0 ? (
                        <span className="font-medium text-red-400">{formatoMoeda.format(cliente.totalAtrasado)}</span>
                      ) : (
                        <span className="text-brand-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{cliente.parcelasAtrasadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function RelatorioEstoqueSecao() {
  const { dados, erro } = useRelatorio<RelatorioEstoque>('/relatorios/estoque')

  function exportar() {
    if (!dados) return
    exportarCsv(
      'estoque.csv',
      ['Produto', 'Saldo atual', 'Estoque mínimo', 'Capital imobilizado'],
      dados.produtos.map((p) => [p.nome, p.saldoAtual, p.estoqueMinimo, p.capitalImobilizado]),
    )
  }

  return (
    <section>
      <CabecalhoSecao titulo="Estoque" onExportar={dados && dados.produtos.length > 0 ? exportar : undefined} />

      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

      {dados && (
        <>
          <EstatisticasFaixa
            itens={[
              {
                rotulo: 'Capital imobilizado',
                valor: formatoMoeda.format(dados.totalCapitalImobilizado),
                destaque: 'accent',
              },
              {
                rotulo: 'Abaixo do estoque mínimo',
                valor: dados.totalAbaixoDoMinimo,
                destaque: dados.totalAbaixoDoMinimo > 0 ? 'red' : 'padrao',
              },
            ]}
          />

          <div className="mt-4 overflow-x-auto rounded-lg border border-brand-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-bg text-xs uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Saldo</th>
                  <th className="px-4 py-3 font-medium">Estoque mínimo</th>
                  <th className="px-4 py-3 font-medium">Capital imobilizado</th>
                </tr>
              </thead>
              <tbody>
                {dados.produtos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                )}
                {dados.produtos.map((produto) => {
                  const abaixoDoMinimo = produto.saldoAtual < produto.estoqueMinimo
                  return (
                    <tr key={produto.id} className="border-t border-brand-border">
                      <td className="px-4 py-3">{produto.nome}</td>
                      <td className="px-4 py-3">
                        <span className={abaixoDoMinimo ? 'font-medium text-red-400' : ''}>{produto.saldoAtual}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-muted">{produto.estoqueMinimo}</td>
                      <td className="px-4 py-3 text-brand-muted">{formatoMoeda.format(produto.capitalImobilizado)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
