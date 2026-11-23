import { useState, type FormEvent } from 'react'
import { FormField, estiloInput } from './FormField'
import { api, ApiError } from '../lib/api'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface RegistrarPagamentoFormProps {
  vendaId: string
  numero: number
  saldoDevedor: string
  aoSucesso: () => void
  aoCancelar: () => void
}

// RF11: pagamento de parcela pode ser parcial (abate o saldo devedor, a
// parcela continua em aberto) e aceita juros opcionais em %, aplicado sobre
// o saldo antes de abater o valor pago — tudo calculado no backend.
export function RegistrarPagamentoForm({
  vendaId,
  numero,
  saldoDevedor,
  aoSucesso,
  aoCancelar,
}: RegistrarPagamentoFormProps) {
  const [valorPago, setValorPago] = useState(saldoDevedor)
  const [percentualJuros, setPercentualJuros] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await api.patch(`/vendas/${vendaId}/parcelas/${numero}/pagar`, {
        valorPago: Number(valorPago.replace(',', '.')),
        ...(percentualJuros && { percentualJuros: Number(percentualJuros.replace(',', '.')) }),
      })
      aoSucesso()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível registrar o pagamento.')
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={aoSubmeter} className="flex flex-col gap-4">
      <div className="rounded-lg border border-brand-border bg-brand-bg p-3 text-center">
        <p className="text-xs uppercase tracking-wide text-brand-muted">Saldo devedor atual</p>
        <p className="mt-1 text-2xl font-bold text-brand-text">{formatoMoeda.format(Number(saldoDevedor))}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField rotulo="Valor pago agora (R$)" id={`valorPago-${vendaId}-${numero}`} obrigatorio>
          <input
            id={`valorPago-${vendaId}-${numero}`}
            required
            inputMode="decimal"
            value={valorPago}
            onChange={(e) => setValorPago(e.target.value)}
            className={estiloInput}
          />
        </FormField>

        <FormField rotulo="Juros (%, opcional)" id={`juros-${vendaId}-${numero}`}>
          <input
            id={`juros-${vendaId}-${numero}`}
            inputMode="decimal"
            placeholder="0"
            value={percentualJuros}
            onChange={(e) => setPercentualJuros(e.target.value)}
            className={estiloInput}
          />
        </FormField>
      </div>
      <p className="-mt-2 text-xs text-brand-muted">
        O juros é somado ao saldo antes de descontar o valor pago — se faltar menos que o saldo + juros, a parcela
        continua em aberto com o restante.
      </p>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-accent"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-brand-accent-foreground transition hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Confirmar pagamento'}
        </button>
      </div>
    </form>
  )
}
