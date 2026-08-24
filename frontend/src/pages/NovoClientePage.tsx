import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { api, ApiError } from '../lib/api'
import type { Cliente } from '../types'

export function NovoClientePage() {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const navegar = useNavigate()

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await api.post<{ cliente: Cliente }>('/clientes', {
        nome,
        telefone,
        email: email || undefined,
        cpf: cpf || undefined,
        observacoes: observacoes || undefined,
      })
      navegar('/clientes')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível cadastrar o cliente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Novo Cliente</h1>
      <p className="text-sm text-brand-muted">Preencha as informações para cadastrar o cliente</p>

      <form onSubmit={aoSubmeter} className="mt-6 max-w-lg">
        <Campo rotulo="Nome completo" obrigatorio>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={estiloInput}
          />
        </Campo>

        <Campo rotulo="Telefone / WhatsApp" obrigatorio>
          <input
            required
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(47) 99999-9999"
            className={estiloInput}
          />
        </Campo>

        <Campo rotulo="E-mail">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={estiloInput}
          />
        </Campo>

        <Campo rotulo="CPF">
          <input value={cpf} onChange={(e) => setCpf(e.target.value)} className={estiloInput} />
        </Campo>

        <Campo rotulo="Observações internas">
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className={estiloInput}
          />
        </Campo>

        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-brand-accent px-4 py-2 font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Cadastrar Cliente'}
          </button>
          <button
            type="button"
            onClick={() => navegar('/clientes')}
            className="rounded-md border border-brand-border px-4 py-2 text-brand-text hover:border-brand-accent"
          >
            Cancelar
          </button>
        </div>
      </form>
    </AppLayout>
  )
}

const estiloInput =
  'mt-1 w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm outline-none focus:border-brand-accent'

function Campo({
  rotulo,
  obrigatorio,
  children,
}: {
  rotulo: string
  obrigatorio?: boolean
  children: ReactNode
}) {
  return (
    <label className="mt-4 block text-xs uppercase tracking-wide text-brand-muted first:mt-0">
      {rotulo} {obrigatorio && <span className="text-brand-accent">*</span>}
      {children}
    </label>
  )
}
