import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AcoesFormulario } from '../components/AcoesFormulario'
import { AppLayout } from '../components/AppLayout'
import { ClienteFormCampos } from '../components/ClienteFormCampos'
import { useSalvarFormulario } from '../hooks/useSalvarFormulario'
import { api, ApiError } from '../lib/api'
import type { ClienteDetalhe, DadosCliente } from '../types'

export function EditarClientePage() {
  const { id } = useParams<{ id: string }>()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const navegar = useNavigate()

  const { erro, salvando, submeter } = useSalvarFormulario(
    (dados: DadosCliente) => api.put(`/clientes/${id}`, dados),
    () => navegar(`/clientes/${id}`),
    'Não foi possível salvar o cliente.',
  )

  useEffect(() => {
    api
      .get<{ cliente: ClienteDetalhe }>(`/clientes/${id}`)
      .then((resposta) => {
        const cliente = resposta.cliente
        setNome(cliente.nome)
        setTelefone(cliente.telefone)
        setEmail(cliente.email ?? '')
        setCpf(cliente.cpf ?? '')
        setObservacoes(cliente.observacoes ?? '')
      })
      .catch((e) => setErroCarregamento(e instanceof ApiError ? e.message : 'Não foi possível carregar o cliente.'))
      .finally(() => setCarregando(false))
  }, [id])

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

  if (carregando) {
    return (
      <AppLayout>
        <p className="text-sm text-brand-muted">Carregando...</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Editar Cliente</h1>
      <p className="text-sm text-brand-muted">Atualize as informações do cliente</p>

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

        {(erro ?? erroCarregamento) && <p className="text-sm text-red-400">{erro ?? erroCarregamento}</p>}

        <AcoesFormulario
          rotuloSalvar="Salvar alterações"
          rotuloSalvando="Salvando..."
          salvando={salvando}
          onCancelar={() => navegar(`/clientes/${id}`)}
        />
      </form>
    </AppLayout>
  )
}
