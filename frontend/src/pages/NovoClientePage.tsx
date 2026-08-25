import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { FormField, estiloInput } from '../components/FormField'
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

      <form onSubmit={aoSubmeter} className="mt-6 flex max-w-lg flex-col gap-4">
        <FormField rotulo="Nome completo" id="nome" obrigatorio>
          <input
            id="nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={estiloInput}
          />
        </FormField>

        <FormField rotulo="Telefone / WhatsApp" id="telefone" obrigatorio>
          <input
            id="telefone"
            required
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(47) 99999-9999"
            className={estiloInput}
          />
        </FormField>

        <FormField rotulo="E-mail" id="email">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={estiloInput}
          />
        </FormField>

        <FormField rotulo="CPF" id="cpf">
          <input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} className={estiloInput} />
        </FormField>

        <FormField rotulo="Observações internas" id="observacoes">
          <textarea
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className={estiloInput}
          />
        </FormField>

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <div className="flex gap-3">
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
