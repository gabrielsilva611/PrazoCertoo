import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AcoesFormulario } from '../components/AcoesFormulario'
import { AppLayout } from '../components/AppLayout'
import { ClienteFormCampos } from '../components/ClienteFormCampos'
import { useSalvarFormulario } from '../hooks/useSalvarFormulario'
import { api } from '../lib/api'
import type { DadosCliente } from '../types'

export function NovoClientePage() {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const navegar = useNavigate()

  const { erro, salvando, submeter } = useSalvarFormulario(
    (dados: DadosCliente) => api.post('/clientes', dados),
    () => navegar('/clientes'),
    'Não foi possível cadastrar o cliente.',
  )

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    await submeter({
      nome,
      telefone,
      email: email || undefined,
      cpf: cpf || undefined,
      observacoes: observacoes || undefined,
    })
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Novo Cliente</h1>
      <p className="text-sm text-brand-muted">Preencha as informações para cadastrar o cliente</p>

      <form onSubmit={aoSubmeter} className="mt-6 flex max-w-lg flex-col gap-4">
        <ClienteFormCampos
          nome={nome}
          onNomeChange={setNome}
          telefone={telefone}
          onTelefoneChange={setTelefone}
          email={email}
          onEmailChange={setEmail}
          cpf={cpf}
          onCpfChange={setCpf}
          observacoes={observacoes}
          onObservacoesChange={setObservacoes}
        />

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <AcoesFormulario
          rotuloSalvar="Cadastrar Cliente"
          rotuloSalvando="Salvando..."
          salvando={salvando}
          onCancelar={() => navegar('/clientes')}
        />
      </form>
    </AppLayout>
  )
}
