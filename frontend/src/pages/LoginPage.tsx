import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { FormField, estiloInput } from '../components/FormField'
import { ApiError } from '../lib/api'

const FUNCIONALIDADES = [
  { titulo: 'Cadastro de clientes', descricao: 'Relacionamento com acordos e comunicações por cliente' },
  { titulo: 'Cobrança via WhatsApp', descricao: 'Mensagens padronizadas geradas automaticamente pelo sistema' },
  { titulo: 'Relatórios', descricao: 'Vendas por período, inadimplência e estoque, com exportação em CSV' },
  { titulo: 'Dashboard gerencial', descricao: 'Score de clientes e indicadores do negócio em tempo real' },
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const { entrar } = useAuth()
  const navegar = useNavigate()

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setCarregando(true)
    try {
      await entrar(email, senha)
      navegar('/')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-brand-bg text-brand-text md:flex-row">
      <div className="flex flex-1 flex-col justify-center gap-8 px-8 py-12 md:px-16">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-brand-accent-foreground">
            ✓
          </span>
          <span className="font-display text-lg tracking-wide text-brand-text">PRAZO CERTO</span>
        </div>
        <p className="text-xs uppercase tracking-wide text-brand-muted">CRM · Vendas a prazo</p>

        <ul className="flex flex-col gap-6">
          {FUNCIONALIDADES.map((item) => (
            <li key={item.titulo} className="border-l-2 border-brand-border pl-4">
              <p className="font-medium text-brand-text">{item.titulo}</p>
              <p className="text-sm text-brand-muted">{item.descricao}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 items-center justify-center border-t border-brand-border px-8 py-12 md:border-t-0 md:border-l">
        <form onSubmit={aoSubmeter} className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-brand-muted">Entre na sua conta para continuar</p>

          <div className="mt-6 flex flex-col gap-4">
            <FormField rotulo="E-mail" id="email">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={estiloInput}
              />
            </FormField>

            <FormField rotulo="Senha" id="senha">
              <input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={estiloInput}
              />
            </FormField>
          </div>

          {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-6 w-full rounded-lg bg-brand-accent py-2 font-medium text-brand-accent-foreground transition hover:bg-brand-accent-hover disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar no sistema'}
          </button>

          <p className="mt-4 text-center text-sm text-brand-muted">
            Não tem conta? Fale com o suporte
          </p>
        </form>
      </div>
    </div>
  )
}
